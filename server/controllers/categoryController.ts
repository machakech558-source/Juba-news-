import { Request, Response, NextFunction } from 'express';
import { db, DbCategory } from '../services/db';
import { AuditService } from '../services/auditService';
import { AppError } from '../middleware/errorHandler';
import { ERROR_CODES } from '../config/constants';

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class CategoryController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = Array.from(db.categories.values()).sort((a, b) => a.order - b.order);
      res.json({
        success: true,
        data: { categories },
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { nameEn, nameAr, slug: reqSlug, order = 1, enabled = true } = req.body;
      if (!nameEn || !nameAr) {
        return next(new AppError('Both English and Arabic category names are required.', 400));
      }

      const slug = reqSlug ? generateSlug(reqSlug) : generateSlug(nameEn);
      const id = `cat-${slug}-${Date.now()}`;
      const now = new Date().toISOString();

      const category: DbCategory = {
        id,
        slug,
        nameEn,
        nameAr,
        order: Number(order) || 1,
        enabled: Boolean(enabled),
        createdAt: now,
        updatedAt: now,
      };

      db.categories.set(id, category);

      AuditService.log({
        userId: req.admin!.id,
        userEmail: req.admin!.email,
        action: 'CATEGORY_CREATED',
        resource: 'CATEGORY',
        resourceId: id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { nameEn, slug },
      });

      res.status(201).json({
        success: true,
        data: { category },
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = db.categories.get(id);
      if (!category) return next(new AppError('Category not found', 404, ERROR_CODES.NOT_FOUND));

      const updates = req.body;
      Object.assign(category, updates, { updatedAt: new Date().toISOString() });
      db.categories.set(id, category);

      AuditService.log({
        userId: req.admin!.id,
        userEmail: req.admin!.email,
        action: 'CATEGORY_UPDATED',
        resource: 'CATEGORY',
        resourceId: id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        data: { category },
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = db.categories.get(id);
      if (!category) return next(new AppError('Category not found', 404, ERROR_CODES.NOT_FOUND));

      // Verify no articles use this category
      const articlesUsingCategory = Array.from(db.articles.values()).filter((a) => a.categoryId === id);
      if (articlesUsingCategory.length > 0) {
        return next(
          new AppError(
            `Cannot delete category. ${articlesUsingCategory.length} article(s) are currently assigned to it.`,
            400,
            ERROR_CODES.CONFLICT
          )
        );
      }

      db.categories.delete(id);

      AuditService.log({
        userId: req.admin!.id,
        userEmail: req.admin!.email,
        action: 'CATEGORY_DELETED',
        resource: 'CATEGORY',
        resourceId: id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        data: { message: 'Category removed.' },
      });
    } catch (error: any) {
      next(error);
    }
  }
}
