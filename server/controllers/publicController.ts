import { Request, Response, NextFunction } from 'express';
import { db, DbComment } from '../services/db';
import { ARTICLE_STATUS } from '../config/constants';
import { AppError } from '../middleware/errorHandler';

export class PublicController {
  /**
   * GET /api/v1/health
   */
  static async healthCheck(req: Request, res: Response) {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      version: '1.0.0',
    });
  }

  /**
   * GET /api/v1/articles
   */
  static async listArticles(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));
      const categorySlug = req.query.category as string;
      const search = (req.query.search as string)?.toLowerCase();

      // Only published articles are exposed publicly
      let articles = Array.from(db.articles.values()).filter(
        (a) => a.status === ARTICLE_STATUS.PUBLISHED
      );

      if (categorySlug) {
        const cat = Array.from(db.categories.values()).find((c) => c.slug === categorySlug);
        if (cat) {
          articles = articles.filter((a) => a.categoryId === cat.id);
        }
      }

      if (search) {
        articles = articles.filter(
          (a) =>
            a.titleEn.toLowerCase().includes(search) ||
            a.titleAr.toLowerCase().includes(search) ||
            a.contentEn.toLowerCase().includes(search) ||
            a.contentAr.toLowerCase().includes(search)
        );
      }

      // Sort by newest publication
      articles.sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());

      const total = articles.length;
      const startIndex = (page - 1) * limit;
      const items = articles.slice(startIndex, startIndex + limit).map((a) => ({
        id: a.id,
        slug: a.slug,
        titleEn: a.titleEn,
        titleAr: a.titleAr,
        subtitleEn: a.subtitleEn,
        subtitleAr: a.subtitleAr,
        featuredImage: a.featuredImage,
        imageCaptionEn: a.imageCaptionEn,
        imageCaptionAr: a.imageCaptionAr,
        authorName: a.authorName,
        authorRole: a.authorRole,
        categoryId: a.categoryId,
        tags: a.tags,
        readingTimeMinutes: a.readingTimeMinutes,
        views: a.views,
        publishedAt: a.publishedAt,
      }));

      res.json({
        success: true,
        data: {
          items,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/v1/articles/:slug
   */
  static async getArticleBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const article = Array.from(db.articles.values()).find(
        (a) => (a.slug === slug || a.id === slug) && a.status === ARTICLE_STATUS.PUBLISHED
      );

      if (!article) {
        return next(new AppError('Article not found or not currently published.', 404));
      }

      // Increment view count
      article.views = (article.views || 0) + 1;

      // Fetch approved comments for this article
      const comments = Array.from(db.comments.values())
        .filter((c) => c.articleId === article.id && c.status === 'APPROVED')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json({
        success: true,
        data: {
          article,
          comments,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/v1/categories
   */
  static async listCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = Array.from(db.categories.values())
        .filter((c) => c.enabled)
        .sort((a, b) => a.order - b.order)
        .map((c) => ({
          id: c.id,
          slug: c.slug,
          nameEn: c.nameEn,
          nameAr: c.nameAr,
        }));

      res.json({
        success: true,
        data: { categories },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/v1/articles/:id/comments
   */
  static async postComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: articleId } = req.params;
      const { userName, content } = req.body;

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return next(new AppError('Comment content cannot be empty.', 400));
      }

      // XSS prevention: strip HTML tags
      const sanitizedContent = content.replace(/<[^>]*>?/gm, '').trim();
      const sanitizedName = (userName || 'Community Reader').replace(/<[^>]*>?/gm, '').trim();

      const article = db.articles.get(articleId);
      if (!article) {
        return next(new AppError('Article not found', 404));
      }

      const commentId = `cmt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const commentStatus = db.settings.commentModerationRequired ? 'PENDING' : 'APPROVED';

      const comment: DbComment = {
        id: commentId,
        articleId,
        articleTitle: article.titleEn,
        userId: 'reader-anon',
        userName: sanitizedName,
        content: sanitizedContent,
        status: commentStatus,
        likes: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.comments.set(commentId, comment);

      res.status(201).json({
        success: true,
        data: {
          comment,
          message:
            commentStatus === 'PENDING'
              ? 'Thank you! Your comment has been submitted and is awaiting editorial moderation.'
              : 'Comment published successfully.',
        },
      });
    } catch (error: any) {
      next(error);
    }
  }
}
