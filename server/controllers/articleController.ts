import { Request, Response, NextFunction } from 'express';
import { db, DbArticle } from '../services/db';
import { AuditService } from '../services/auditService';
import { AppError } from '../middleware/errorHandler';
import { ARTICLE_STATUS, ArticleStatusType, ERROR_CODES, ROLES } from '../config/constants';

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class ArticleController {
  /**
   * GET /api/v1/admin/articles
   */
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const status = req.query.status as string;
      const categoryId = req.query.categoryId as string;
      const search = (req.query.search as string)?.toLowerCase();

      let articles = Array.from(db.articles.values());

      // If user is AUTHOR, they only manage their own articles unless they have higher role
      if (req.admin?.role === ROLES.AUTHOR) {
        articles = articles.filter((a) => a.authorId === req.admin?.id);
      }

      if (status) {
        articles = articles.filter((a) => a.status === status);
      }

      if (categoryId) {
        articles = articles.filter((a) => a.categoryId === categoryId);
      }

      if (search) {
        articles = articles.filter(
          (a) =>
            a.titleEn.toLowerCase().includes(search) ||
            a.titleAr.toLowerCase().includes(search) ||
            a.slug.toLowerCase().includes(search)
        );
      }

      // Sort by newest
      articles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const total = articles.length;
      const startIndex = (page - 1) * limit;
      const items = articles.slice(startIndex, startIndex + limit);

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
   * GET /api/v1/admin/articles/:id
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const article = db.articles.get(id);

      if (!article) {
        return next(new AppError('Article not found.', 404, ERROR_CODES.NOT_FOUND));
      }

      if (req.admin?.role === ROLES.AUTHOR && article.authorId !== req.admin.id) {
        return next(new AppError('You only have permission to view your own articles.', 403, ERROR_CODES.FORBIDDEN));
      }

      res.json({
        success: true,
        data: { article },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/articles
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        titleEn,
        titleAr,
        subtitleEn,
        subtitleAr,
        contentEn,
        contentAr,
        featuredImage,
        imageCaptionEn,
        imageCaptionAr,
        categoryId,
        tags,
        status = ARTICLE_STATUS.DRAFT,
        isBreaking = false,
        isTopHeadline = false,
        isEditorsPick = false,
        slug: requestedSlug,
      } = req.body;

      if (!titleEn || !titleAr || !contentEn || !contentAr || !categoryId) {
        return next(
          new AppError('Missing required article fields: titleEn, titleAr, contentEn, contentAr, categoryId', 400)
        );
      }

      // Slug generation and uniqueness check
      let slug = requestedSlug ? generateSlug(requestedSlug) : generateSlug(titleEn);
      if (!slug) slug = `story-${Date.now()}`;

      // Ensure slug uniqueness
      let uniqueSlug = slug;
      let counter = 1;
      while (Array.from(db.articles.values()).some((a) => a.slug === uniqueSlug)) {
        uniqueSlug = `${slug}-${counter++}`;
      }

      const id = `art-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const now = new Date().toISOString();

      const article: DbArticle = {
        id,
        slug: uniqueSlug,
        titleEn,
        titleAr,
        subtitleEn,
        subtitleAr,
        contentEn,
        contentAr,
        featuredImage: featuredImage || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&auto=format&fit=crop&q=80',
        imageCaptionEn,
        imageCaptionAr,
        authorId: req.admin?.id || 'admin-01',
        authorName: req.admin?.displayName || 'Editorial Desk',
        authorRole: req.admin?.role || 'Staff',
        categoryId,
        tags: Array.isArray(tags) ? tags : [],
        status: status as ArticleStatusType,
        isBreaking: Boolean(isBreaking),
        isTopHeadline: Boolean(isTopHeadline),
        isEditorsPick: Boolean(isEditorsPick),
        readingTimeMinutes: Math.max(1, Math.ceil(contentEn.split(/\s+/).length / 200)),
        views: 0,
        publishedAt: status === ARTICLE_STATUS.PUBLISHED ? now : undefined,
        createdAt: now,
        updatedAt: now,
      };

      db.articles.set(id, article);

      AuditService.log({
        userId: req.admin!.id,
        userEmail: req.admin!.email,
        action: 'ARTICLE_CREATED',
        resource: 'ARTICLE',
        resourceId: id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { titleEn, slug: uniqueSlug, status },
      });

      res.status(201).json({
        success: true,
        data: { article },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/admin/articles/:id
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const article = db.articles.get(id);

      if (!article) {
        return next(new AppError('Article not found', 404, ERROR_CODES.NOT_FOUND));
      }

      // Authors can only edit their own articles
      if (req.admin?.role === ROLES.AUTHOR && article.authorId !== req.admin.id) {
        return next(new AppError('You only have permission to edit your own articles.', 403, ERROR_CODES.FORBIDDEN));
      }

      const updates = req.body;
      const now = new Date().toISOString();

      if (updates.titleEn && updates.titleEn !== article.titleEn && !updates.slug) {
        updates.slug = generateSlug(updates.titleEn);
      }

      // If status transitioning to PUBLISHED and previously wasn't
      if (updates.status === ARTICLE_STATUS.PUBLISHED && article.status !== ARTICLE_STATUS.PUBLISHED) {
        article.publishedAt = now;
      }

      Object.assign(article, updates, { updatedAt: now });
      db.articles.set(id, article);

      AuditService.log({
        userId: req.admin!.id,
        userEmail: req.admin!.email,
        action: 'ARTICLE_UPDATED',
        resource: 'ARTICLE',
        resourceId: id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { updates: Object.keys(updates) },
      });

      res.json({
        success: true,
        data: { article },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/articles/:id
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const article = db.articles.get(id);

      if (!article) {
        return next(new AppError('Article not found', 404, ERROR_CODES.NOT_FOUND));
      }

      db.articles.delete(id);

      AuditService.log({
        userId: req.admin!.id,
        userEmail: req.admin!.email,
        action: 'ARTICLE_DELETED',
        resource: 'ARTICLE',
        resourceId: id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { titleEn: article.titleEn },
      });

      res.json({
        success: true,
        data: { message: 'Article permanently removed.' },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/articles/:id/publish
   */
  static async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const article = db.articles.get(id);

      if (!article) {
        return next(new AppError('Article not found', 404, ERROR_CODES.NOT_FOUND));
      }

      article.status = ARTICLE_STATUS.PUBLISHED;
      article.publishedAt = new Date().toISOString();
      article.updatedAt = new Date().toISOString();

      AuditService.log({
        userId: req.admin!.id,
        userEmail: req.admin!.email,
        action: 'ARTICLE_PUBLISHED',
        resource: 'ARTICLE',
        resourceId: id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        data: { article },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/articles/:id/unpublish
   */
  static async unpublish(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const article = db.articles.get(id);

      if (!article) {
        return next(new AppError('Article not found', 404, ERROR_CODES.NOT_FOUND));
      }

      article.status = ARTICLE_STATUS.DRAFT;
      article.updatedAt = new Date().toISOString();

      AuditService.log({
        userId: req.admin!.id,
        userEmail: req.admin!.email,
        action: 'ARTICLE_UNPUBLISHED',
        resource: 'ARTICLE',
        resourceId: id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        data: { article },
      });
    } catch (error: any) {
      next(error);
    }
  }
}
