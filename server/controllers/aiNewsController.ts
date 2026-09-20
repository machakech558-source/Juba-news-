import { Request, Response } from 'express';
import { AiNewsGeneratorService } from '../services/aiNewsService';
import { db, DbArticle } from '../services/db';
import { ARTICLE_STATUS } from '../config/constants';

export class AiNewsController {
  /**
   * Generates a new article via Gemini AI and returns the structured payload.
   * Can be called directly by the editorial client to auto-publish or prefill.
   */
  static async generate(req: Request, res: Response): Promise<void> {
    try {
      const { topic, information, contentType, language, style, categorySlug, focus, autoPublish } = req.body || {};

      const article = await AiNewsGeneratorService.generateArticle({
        topic: typeof topic === 'string' ? topic : undefined,
        information: typeof information === 'string' ? information : undefined,
        contentType: typeof contentType === 'string' ? (contentType as any) : undefined,
        language: typeof language === 'string' ? (language as any) : undefined,
        style: typeof style === 'string' ? (style as any) : undefined,
        categorySlug: typeof categorySlug === 'string' ? categorySlug : undefined,
        focus: typeof focus === 'string' ? focus : undefined
      });

      // Check if auto-publish is explicitly requested or enabled globally
      const shouldAutoPublish = autoPublish !== undefined ? Boolean(autoPublish) : db.facebookSettings.autoPublish === true;
      let createdArticle: DbArticle | null = null;

      if (shouldAutoPublish && article) {
        const id = `art-ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const slugBase = (article.titleEn || article.headline || `news-${Date.now()}`)
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const slug = `${slugBase || 'juba-news'}-${Date.now().toString().slice(-4)}`;

        const catId = article.categorySlug === 'politics' ? 'cat-pol' : article.categorySlug === 'economy' ? 'cat-econ' : 'cat-ss';

        createdArticle = {
          id,
          slug,
          titleAr: article.titleAr || article.headline,
          titleEn: article.titleEn || article.headline,
          subtitleAr: article.subtitleAr || article.introduction?.slice(0, 160) || '',
          subtitleEn: article.subtitleEn || 'Exclusive dispatch from Juba News AI Newsroom',
          contentAr: article.contentAr || article.body,
          contentEn: article.contentEn || article.body,
          featuredImage: article.featuredImage,
          imageCaptionAr: article.imageCaptionAr || 'تغطية إخبارية حصرية - جوبا نيوز',
          imageCaptionEn: article.imageCaptionEn || 'Exclusive news coverage - Juba News',
          authorId: 'admin-super-01',
          authorName: 'Juba News AI Desk (محرر الذكاء الاصطناعي)',
          authorRole: 'AI Editorial Newsroom',
          categoryId: catId,
          tags: Array.isArray(article.keywords) && article.keywords.length > 0 ? article.keywords : (article.tags || ['جنوب السودان', 'جوبا نيوز']),
          status: ARTICLE_STATUS.PUBLISHED,
          editorialStatus: 'published',
          isBreaking: Boolean(article.isBreaking),
          isTopHeadline: Boolean(article.isTopHeadline),
          isEditorsPick: Boolean(article.isEditorsPick),
          readingTimeMinutes: article.readingTimeMinutes || 3,
          views: 1,
          source: 'Juba News AI Desk',
          seoTitle: article.seoDescription || article.titleAr,
          seoDescription: article.seoDescription || article.subtitleAr || '',
          location: 'جوبا، جنوب السودان',
          publishedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        db.articles.set(createdArticle.id, createdArticle);
      }

      res.status(200).json({
        success: true,
        data: article,
        publishedArticle: createdArticle,
        autoPublished: Boolean(shouldAutoPublish),
        generatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('AI News Generation Error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate news with AI'
      });
    }
  }
}
