import { Request, Response } from 'express';
import { db } from '../services/db';
import { MetaFacebookService, RawFacebookPost } from '../services/metaFacebookService';
import { AuthenticatedRequest } from '../types';
import { ARTICLE_STATUS } from '../config/constants';

export class FacebookController {
  /**
   * GET /api/webhooks/facebook
   * Meta Webhook Verification Handler
   */
  public static verifyWebhook(req: Request, res: Response) {
    const mode = req.query['hub.mode'] as string | undefined;
    const token = req.query['hub.verify_token'] as string | undefined;
    const challenge = req.query['hub.challenge'] as string | undefined;

    const result = MetaFacebookService.verifyWebhook(mode, token, challenge);
    if (result) {
      return res.status(200).send(result);
    }
    return res.status(403).json({ error: 'Webhook verification failed: Invalid verify_token or mode.' });
  }

  /**
   * POST /api/webhooks/facebook
   * Meta Webhook Event Receiver
   */
  public static async handleWebhook(req: Request, res: Response) {
    // 1. Signature Verification
    const signature = (req.headers['x-hub-signature-256'] || req.headers['x-hub-signature']) as string | undefined;
    const rawPayload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    const isValid = MetaFacebookService.validateSignature(signature, rawPayload);
    if (!isValid) {
      console.warn('⚠️ Rejected unauthorized Facebook webhook payload: Signature mismatch');
      return res.status(401).json({ error: 'Invalid HMAC signature' });
    }

    // 2. Respond immediately to Meta to acknowledge receipt within 2000ms
    res.status(200).json({ status: 'EVENT_RECEIVED' });

    // 3. Process events asynchronously in background
    try {
      const body = req.body;
      if (body.object !== 'page') return;

      const entries = body.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          if (change.field === 'feed') {
            const val = change.value;
            const verb = val?.verb; // 'add', 'edit', etc.
            const postId = val?.post_id;

            if (verb === 'add' && postId) {
              console.log(`📡 [Webhook] Detected new Facebook feed post: ${postId}`);

              // Check for duplicate before fetching
              if (db.getFacebookPostByExternalId(postId)) {
                console.log(`[Webhook] Duplicate post ${postId} ignored.`);
                continue;
              }

              // Fetch full post details from Graph API
              const fullPost = await MetaFacebookService.fetchPostFromGraphApi(postId);
              const postToImport: RawFacebookPost = fullPost || {
                id: postId,
                message: val.message || val.name || '',
                created_time: new Date(val.created_time ? val.created_time * 1000 : Date.now()).toISOString(),
                permalink_url: val.link || `https://www.facebook.com/${postId}`,
                full_picture: val.photo || val.picture,
              };

              await MetaFacebookService.importSinglePost(postToImport, { source: 'WEBHOOK' });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error processing asynchronous Facebook webhook payload:', err);
    }
  }

  /**
   * GET /api/admin/facebook/status
   * Real-time Newsroom Status & Connection Overview
   */
  public static getStatus(req: AuthenticatedRequest, res: Response) {
    const config = MetaFacebookService.getConfig();
    const allFbPosts = Array.from(db.facebookPosts.values());
    const allArticles = Array.from(db.articles.values());

    const importedPostsCount = allFbPosts.length;
    const draftsCount = allArticles.filter(
      (a) => a.source === 'Facebook' && (a.status === ARTICLE_STATUS.DRAFT || a.status === ARTICLE_STATUS.NEEDS_REVIEW)
    ).length;
    const publishedCount = allArticles.filter(
      (a) => a.source === 'Facebook' && a.status === ARTICLE_STATUS.PUBLISHED
    ).length;
    const failedImportsCount = allFbPosts.filter((p) => p.processingStatus === 'failed').length;
    const pendingCount = allFbPosts.filter((p) => p.processingStatus === 'pending' || p.processingStatus === 'ai_processing').length;

    const recentPosts = allFbPosts
      .sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime())
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        facebookPostId: p.facebookPostId,
        message: p.message,
        publishedAt: p.publishedAt,
        importedAt: p.importedAt,
        mediaUrl: p.mediaUrl,
        processingStatus: p.processingStatus,
        generatedTitle: p.generatedTitle,
        articleId: p.articleId,
      }));

    return res.status(200).json({
      success: true,
      data: {
        connectionStatus: db.facebookSettings.facebookIntegration,
        pageId: config.pageId,
        pageName: db.facebookSettings.metaPageName,
        pageUrl: config.pageUrl,
        webhookUrl: '/api/webhooks/facebook',
        verifyToken: config.verifyToken,
        lastSyncAt: db.facebookSettings.lastSyncAt,
        autoPublish: db.facebookSettings.autoPublish,
        aiProcessing: db.facebookSettings.aiProcessing,
        syncMode: db.facebookSettings.syncMode,
        counts: {
          importedPosts: importedPostsCount,
          drafts: draftsCount,
          publishedArticles: publishedCount,
          failedImports: failedImportsCount,
          pendingAi: pendingCount,
        },
        recentPosts,
      },
    });
  }

  /**
   * GET /api/admin/facebook/posts
   * Full list of imported Facebook posts with article metadata
   */
  public static getPosts(req: AuthenticatedRequest, res: Response) {
    const statusFilter = req.query.status as string | undefined;
    let posts = Array.from(db.facebookPosts.values());

    if (statusFilter) {
      posts = posts.filter((p) => p.processingStatus === statusFilter);
    }

    posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const enriched = posts.map((p) => {
      const article = p.articleId ? db.articles.get(p.articleId) : undefined;
      return {
        ...p,
        article: article
          ? {
              id: article.id,
              titleAr: article.titleAr,
              titleEn: article.titleEn,
              slug: article.slug,
              status: article.status,
              editorialStatus: article.editorialStatus || article.status,
              categoryId: article.categoryId,
              publishedAt: article.publishedAt,
            }
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      data: enriched,
    });
  }

  /**
   * POST /api/admin/facebook/sync
   * Trigger manual synchronization from Facebook Page
   */
  public static async syncNow(req: AuthenticatedRequest, res: Response) {
    try {
      console.log(`🔄 Manual Facebook Sync triggered by admin: ${req.admin?.email || 'Admin'}`);
      const result = await MetaFacebookService.syncPagePosts({
        manual: true,
        adminEmail: req.admin?.email,
      });

      return res.status(200).json({
        success: true,
        message: 'Facebook sync completed successfully.',
        data: result,
      });
    } catch (err: any) {
      console.error('Manual Facebook sync error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to sync with Facebook Page',
      });
    }
  }

  /**
   * POST /api/admin/facebook/test-import
   * Smoothly import a custom Facebook post or simulate a post payload
   */
  public static async testImport(req: AuthenticatedRequest, res: Response) {
    try {
      const { message, permalink, imageUrl, customPostId } = req.body;
      if (!message || message.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Post message/content is required' });
      }

      const fbPostId = customPostId || `test_${Date.now()}`;
      const mockPost: RawFacebookPost = {
        id: fbPostId,
        message,
        created_time: new Date().toISOString(),
        permalink_url: permalink || 'https://www.facebook.com/share/1UpeZiXU5k/',
        full_picture: imageUrl || 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1200&auto=format&fit=crop&q=80',
      };

      const result = await MetaFacebookService.importSinglePost(mockPost, { manual: true });
      if (result.status === 'skipped') {
        return res.status(409).json({ success: false, error: 'Duplicate Facebook post ID: This post was already imported.' });
      }
      if (result.status === 'failed') {
        return res.status(500).json({ success: false, error: result.error || 'Failed to process post' });
      }

      return res.status(201).json({
        success: true,
        message: 'Post imported and converted to draft news article successfully.',
        data: result.article,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/admin/facebook/posts/:id/reprocess
   * Reprocess an imported Facebook post through AI
   */
  public static async reprocessPost(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    try {
      const article = await MetaFacebookService.reprocessFacebookPost(id);
      return res.status(200).json({
        success: true,
        message: 'Article reprocessed and regenerated by AI successfully.',
        data: article,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/admin/facebook/settings
   */
  public static getSettings(req: AuthenticatedRequest, res: Response) {
    return res.status(200).json({
      success: true,
      data: db.facebookSettings,
    });
  }

  /**
   * PUT /api/admin/facebook/settings
   */
  public static updateSettings(req: AuthenticatedRequest, res: Response) {
    const {
      facebookIntegration,
      syncMode,
      aiProcessing,
      autoPublish,
      defaultCategory,
      aiLanguage,
      articleStyle,
      minimumConfidence,
      metaPageName,
      metaPageId,
      pagePermalink,
    } = req.body;

    if (facebookIntegration !== undefined) db.facebookSettings.facebookIntegration = facebookIntegration;
    if (syncMode !== undefined) db.facebookSettings.syncMode = syncMode;
    if (aiProcessing !== undefined) db.facebookSettings.aiProcessing = aiProcessing;
    if (autoPublish !== undefined) {
      db.facebookSettings.autoPublish = Boolean(autoPublish);
      if (Boolean(autoPublish)) {
        // Automatically publish all pending Facebook draft articles live to the website
        for (const article of db.articles.values()) {
          if (article.source === 'Facebook' && article.status !== ARTICLE_STATUS.PUBLISHED) {
            article.status = ARTICLE_STATUS.PUBLISHED;
            article.editorialStatus = 'published';
            if (!article.publishedAt) article.publishedAt = new Date().toISOString();
            article.updatedAt = new Date().toISOString();
          }
        }
      }
    }
    if (defaultCategory !== undefined) db.facebookSettings.defaultCategory = defaultCategory;
    if (aiLanguage !== undefined) db.facebookSettings.aiLanguage = aiLanguage;
    if (articleStyle !== undefined) db.facebookSettings.articleStyle = articleStyle;
    if (minimumConfidence !== undefined) db.facebookSettings.minimumConfidence = Number(minimumConfidence);
    if (metaPageName !== undefined) db.facebookSettings.metaPageName = String(metaPageName).trim();
    if (metaPageId !== undefined) db.facebookSettings.metaPageId = String(metaPageId).trim();
    if (pagePermalink !== undefined) db.facebookSettings.pagePermalink = String(pagePermalink).trim();

    db.facebookSettings.updatedAt = new Date().toISOString();

    return res.status(200).json({
      success: true,
      message: 'Facebook newsroom settings updated successfully.',
      data: db.facebookSettings,
    });
  }

  /**
   * GET /api/admin/sync/logs
   */
  public static getSyncLogs(req: AuthenticatedRequest, res: Response) {
    return res.status(200).json({
      success: true,
      data: db.syncLogs,
    });
  }
}
