import { Request, Response } from 'express';
import { db } from '../services/db';
import { MetaFacebookService, RawFacebookPost } from '../services/metaFacebookService';
import { AuthenticatedRequest } from '../types';
import crypto from 'crypto';

export class N8nController {
  /**
   * Helper to verify n8n webhook authentication key/secret
   */
  private static isAuthorized(req: Request): boolean {
    const configuredSecret = db.facebookSettings.n8nWebhookSecret || process.env.N8N_WEBHOOK_SECRET || 'juba_n8n_sec_2025';
    
    // Check multiple header variants used by n8n
    const headerKey = 
      req.headers['x-n8n-api-key'] ||
      req.headers['x-n8n-secret'] ||
      req.headers['x-webhook-secret'] ||
      req.headers['x-api-key'];
    
    const queryKey = (req.query['secret'] || req.query['api_key'] || req.query['key']) as string | undefined;

    // Check Authorization: Bearer <key>
    const authHeader = req.headers['authorization'];
    let bearerKey: string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      bearerKey = authHeader.substring(7).trim();
    }

    const provided = (headerKey || queryKey || bearerKey) as string | undefined;

    if (!provided) {
      // If no key provided at all, reject
      return false;
    }

    return provided.trim() === configuredSecret.trim();
  }

  /**
   * POST /api/integrations/n8n/facebook-post
   * Ingests Facebook post sent from n8n workflow, processes via AI, and auto-publishes immediately.
   */
  public static async receiveFacebookPost(req: Request, res: Response) {
    try {
      // 1. Authenticate n8n request
      if (!N8nController.isAuthorized(req)) {
        console.warn('⚠️ [n8n Integration] Unauthorized request: Missing or invalid API key/secret.');
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Invalid or missing X-N8N-API-KEY header or secret parameter.',
          hint: 'Include header: { "X-N8N-API-KEY": "your_secret_key" } or ?secret=your_secret_key',
        });
      }

      const body = req.body;
      if (!body) {
        return res.status(400).json({ success: false, error: 'Empty payload received from n8n.' });
      }

      // 2. Normalize payload (handles multiple n8n node formats)
      let rawPosts: any[] = [];

      if (Array.isArray(body)) {
        rawPosts = body;
      } else if (Array.isArray(body.posts)) {
        rawPosts = body.posts;
      } else if (Array.isArray(body.data)) {
        rawPosts = body.data;
      } else if (body.entry && Array.isArray(body.entry)) {
        // Meta Webhook format forwarded by n8n
        for (const entry of body.entry) {
          const changes = entry.changes || [];
          for (const ch of changes) {
            if (ch.field === 'feed' && ch.value) {
              const val = ch.value;
              rawPosts.push({
                id: val.post_id || `meta-${Date.now()}`,
                message: val.message || val.name || '',
                created_time: new Date(val.created_time ? val.created_time * 1000 : Date.now()).toISOString(),
                permalink_url: val.link || (val.post_id ? `https://www.facebook.com/${val.post_id}` : undefined),
                full_picture: val.photo || val.picture,
              });
            }
          }
        }
      } else {
        rawPosts = [body];
      }

      if (rawPosts.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid post data found in request body.',
        });
      }

      const results: any[] = [];
      const autoPublishFlag = body.autoPublish !== undefined 
        ? Boolean(body.autoPublish) 
        : (db.facebookSettings.n8nAutoPublish ?? db.facebookSettings.autoPublish ?? true);

      // 3. Process each post
      for (const item of rawPosts) {
        const postId = String(
          item.id || item.postId || item.post_id || item.entry_id || `n8n-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
        ).trim();

        const message = String(item.message || item.text || item.content || item.description || item.caption || '').trim();

        if (!message && !item.full_picture && !item.image) {
          results.push({
            postId,
            status: 'skipped',
            reason: 'Post has neither text message nor media content.',
          });
          continue;
        }

        // Strict duplicate check
        const existing = db.getFacebookPostByExternalId(postId);
        if (existing) {
          console.info(`[n8n Integration] Duplicate post ${postId} already exists in database.`);
          results.push({
            postId,
            status: 'skipped',
            reason: 'Duplicate: Post already imported previously.',
            articleId: existing.articleId,
          });
          continue;
        }

        const permalinkUrl = item.permalink_url || item.permalink || item.url || item.link || `https://www.facebook.com/${postId}`;
        const fullPicture = item.full_picture || item.picture || item.image || item.mediaUrl || item.photo || null;
        const createdTime = item.created_time || item.createdTime || item.publishedAt || item.date || new Date().toISOString();

        const postToImport: RawFacebookPost = {
          id: postId,
          message,
          created_time: createdTime,
          permalink_url: permalinkUrl,
          full_picture: fullPicture,
        };

        console.log(`🚀 [n8n Integration] Processing incoming Facebook post via AI: ${postId}`);

        const importRes = await MetaFacebookService.importSinglePost(postToImport, {
          source: 'N8N',
          forcePublish: autoPublishFlag,
        });

        if (importRes.status === 'imported' && importRes.article) {
          results.push({
            postId,
            status: importRes.article.status,
            articleId: importRes.article.id,
            titleAr: importRes.article.titleAr,
            titleEn: importRes.article.titleEn,
            slug: importRes.article.slug,
            url: `/news/${importRes.article.slug}`,
            publishedAt: importRes.article.publishedAt,
          });
        } else {
          results.push({
            postId,
            status: importRes.status,
            error: importRes.error || 'Failed to import post.',
          });
        }
      }

      // If single post was processed, return intuitive single object for n8n
      if (rawPosts.length === 1) {
        const singleResult = results[0];
        const statusUpper = String(singleResult.status || '').toUpperCase();
        const isSuccess = statusUpper === 'PUBLISHED' || statusUpper === 'DRAFT' || statusUpper === 'SKIPPED' || statusUpper === 'IMPORTED';
        
        return res.status(isSuccess ? 200 : 422).json({
          success: isSuccess,
          status: singleResult.status,
          message: statusUpper === 'PUBLISHED'
            ? 'تم استلام منشور فيسبوك بنجاح ومعالجته بالذكاء الاصطناعي ونشره فورياً على موقع جوبا نيوز.'
            : statusUpper === 'SKIPPED'
              ? 'المنشور مكرر وموجود مسبقاً، تم تخطيه لمنع التكرار.'
              : statusUpper === 'DRAFT'
                ? 'تم استلام المنشور وحفظه كمسودة للمراجعة التحريرية.'
                : 'تعذر استيراد المنشور.',
          article: singleResult.articleId ? {
            id: singleResult.articleId,
            titleAr: singleResult.titleAr,
            titleEn: singleResult.titleEn,
            slug: singleResult.slug,
            url: singleResult.url,
            status: singleResult.status,
          } : undefined,
          postId: singleResult.postId,
          details: singleResult,
        });
      }

      // Multiple posts processed
      return res.status(200).json({
        success: true,
        count: results.length,
        imported: results.filter((r) => r.status === 'published' || r.status === 'draft').length,
        skipped: results.filter((r) => r.status === 'skipped').length,
        results,
      });
    } catch (err: any) {
      console.error('❌ [n8n Integration] Error receiving Facebook post:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Internal server error processing n8n webhook',
      });
    }
  }

  /**
   * GET /api/integrations/n8n/workflow
   * Generates a fully configured, production-ready n8n Workflow JSON template
   * ready to copy or import directly into n8n.
   */
  public static getWorkflow(req: Request, res: Response) {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    const webhookUrl = `${baseUrl}/api/integrations/n8n/facebook-post`;
    const apiKey = db.facebookSettings.n8nWebhookSecret || 'juba_n8n_sec_2025';
    const pageId = db.facebookSettings.metaPageId || '108429588219424';
    const pageName = db.facebookSettings.metaPageName || 'Juba News - جوبا نيوز';

    const n8nWorkflow = {
      name: `Juba News Facebook Auto-Publisher (${pageName})`,
      nodes: [
        {
          parameters: {
            rule: {
              interval: [
                {
                  field: 'minutes',
                  minutesInterval: 2,
                },
              ],
            },
          },
          id: 'b1f8021c-a111-4475-b4bc-2efb8ff97d51',
          name: 'Schedule Trigger (Every 2 Minutes)',
          type: 'n8n-nodes-base.scheduleTrigger',
          typeVersion: 1.2,
          position: [240, 300],
        },
        {
          parameters: {
            values: {
              string: [
                {
                  name: 'metaPageId',
                  value: pageId,
                },
                {
                  name: 'metaPageAccessToken',
                  value: 'REPLACE_WITH_YOUR_FACEBOOK_PAGE_ACCESS_TOKEN',
                },
                {
                  name: 'jubaNewsWebhookUrl',
                  value: webhookUrl,
                },
                {
                  name: 'n8nApiKey',
                  value: apiKey,
                },
              ],
              boolean: [
                {
                  name: 'autoPublishImmediately',
                  value: true,
                },
              ],
            },
            options: {},
          },
          id: 'c2a9134d-b222-4586-a5cd-3fbc9ff88e62',
          name: 'Newsroom Configuration',
          type: 'n8n-nodes-base.set',
          typeVersion: 2,
          position: [460, 300],
        },
        {
          parameters: {
            url: `https://graph.facebook.com/v21.0/${pageId}/feed`,
            sendQuery: true,
            queryParameters: {
              parameters: [
                {
                  name: 'fields',
                  value: 'id,message,created_time,full_picture,permalink_url,attachments{media,type,url,subattachments,title,description}',
                },
                {
                  name: 'limit',
                  value: '5',
                },
                {
                  name: 'access_token',
                  value: '={{ $node["Newsroom Configuration"].json["metaPageAccessToken"] }}',
                },
              ],
            },
            options: {
              timeout: 15000,
            },
          },
          id: 'd3b8245e-c333-4697-b6de-4acd0aa99f73',
          name: 'Fetch Recent Facebook Posts',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 4.2,
          position: [680, 300],
        },
        {
          parameters: {
            jsCode: `// Extract and split posts into individual items for processing
const rawData = $input.first().json;
const posts = rawData.data || [];

if (!posts || posts.length === 0) {
  return [];
}

const config = $node["Newsroom Configuration"].json;

return posts
  .filter(post => (post.message && post.message.trim().length > 0) || post.full_picture)
  .map(post => {
    let pictureUrl = post.full_picture || null;
    if (!pictureUrl && post.attachments?.data?.[0]?.media?.image?.src) {
      pictureUrl = post.attachments.data[0].media.image.src;
    }

    return {
      json: {
        id: post.id,
        message: post.message || '',
        created_time: post.created_time,
        permalink_url: post.permalink_url,
        full_picture: pictureUrl,
        autoPublish: config.autoPublishImmediately !== false,
      }
    };
  });`,
          },
          id: 'e4c9356f-d444-4708-c7ef-5bde1bb00a84',
          name: 'Format & Filter Posts',
          type: 'n8n-nodes-base.code',
          typeVersion: 2,
          position: [900, 300],
        },
        {
          parameters: {
            method: 'POST',
            url: '={{ $node["Newsroom Configuration"].json["jubaNewsWebhookUrl"] }}',
            sendHeaders: true,
            headerParameters: {
              parameters: [
                {
                  name: 'X-N8N-API-KEY',
                  value: '={{ $node["Newsroom Configuration"].json["n8nApiKey"] }}',
                },
                {
                  name: 'Content-Type',
                  value: 'application/json',
                },
              ],
            },
            sendBody: true,
            specifyBody: 'json',
            jsonBody: '={{ JSON.stringify($json) }}',
            options: {
              timeout: 30000,
            },
          },
          id: 'f5da4670-e555-4819-d8f0-6cef2cc11b95',
          name: 'Publish to Juba News Website',
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 4.2,
          position: [1120, 300],
        },
      ],
      connections: {
        'Schedule Trigger (Every 2 Minutes)': {
          main: [
            [
              {
                node: 'Newsroom Configuration',
                type: 'main',
                index: 0,
              },
            ],
          ],
        },
        'Newsroom Configuration': {
          main: [
            [
              {
                node: 'Fetch Recent Facebook Posts',
                type: 'main',
                index: 0,
              },
            ],
          ],
        },
        'Fetch Recent Facebook Posts': {
          main: [
            [
              {
                node: 'Format & Filter Posts',
                type: 'main',
                index: 0,
              },
            ],
          ],
        },
        'Format & Filter Posts': {
          main: [
            [
              {
                node: 'Publish to Juba News Website',
                type: 'main',
                index: 0,
              },
            ],
          ],
        },
      },
      active: false,
      settings: {
        executionOrder: 'v1',
      },
      tags: ['Facebook', 'Juba News', 'AI Newsroom', 'Automation'],
    };

    if (req.query.download === 'true') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="juba-news-n8n-workflow.json"');
      return res.send(JSON.stringify(n8nWorkflow, null, 2));
    }

    return res.json({
      success: true,
      webhookUrl,
      apiKey,
      pageId,
      pageName,
      workflow: n8nWorkflow,
    });
  }

  /**
   * POST /api/admin/integrations/n8n/test
   * Simulates a post arriving via n8n to test the entire pipeline with one click
   */
  public static async testN8nPost(req: AuthenticatedRequest, res: Response) {
    try {
      const { customMessage, customImage, customUrl } = req.body || {};

      const testPostId = `n8n-test-${Date.now()}`;
      const defaultMessage =
        '🔴 عاجل | الخارجية تؤكد وصول وفد رفيع المستوى إلى جوبا وتوقيع مذكرات تفاهم جديدة لتعزيز الاستقرار ودعم مشاريع البنية التحتية والتعاون الثنائي في مختلف المجالات التنموية.';

      const postToImport: RawFacebookPost = {
        id: testPostId,
        message: customMessage || defaultMessage,
        created_time: new Date().toISOString(),
        permalink_url: customUrl || `https://www.facebook.com/${db.facebookSettings.metaPageId}/posts/${testPostId}`,
        full_picture:
          customImage ||
          'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
      };

      console.log('🧪 [n8n Test Ingestion] Running one-click simulation test...');

      const result = await MetaFacebookService.importSinglePost(postToImport, {
        source: 'N8N',
        forcePublish: true,
      });

      return res.json({
        success: true,
        message: 'تمت محاكاة النقل عبر سير عمل n8n بنجاح وتم نشر الخبر على الموقع فورياً.',
        postId: testPostId,
        article: result.article ? {
          id: result.article.id,
          titleAr: result.article.titleAr,
          titleEn: result.article.titleEn,
          slug: result.article.slug,
          status: result.article.status,
          url: `/news/${result.article.slug}`,
          featuredImage: result.article.featuredImage,
        } : undefined,
      });
    } catch (err: any) {
      console.error('Error running n8n test:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/admin/integrations/n8n/regenerate-key
   * Generates a new cryptographically secure API key for n8n
   */
  public static regenerateApiKey(req: AuthenticatedRequest, res: Response) {
    const newKey = `juba_n8n_${crypto.randomBytes(12).toString('hex')}`;
    db.facebookSettings.n8nWebhookSecret = newKey;
    db.facebookSettings.updatedAt = new Date().toISOString();

    return res.json({
      success: true,
      apiKey: newKey,
      message: 'تم تجديد مفتاح أتمتة n8n بنجاح.',
    });
  }
}
