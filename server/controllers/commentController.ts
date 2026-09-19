import { Request, Response, NextFunction } from 'express';
import { db } from '../services/db';
import { AuditService } from '../services/auditService';
import { AppError } from '../middleware/errorHandler';
import { ERROR_CODES, COMMENT_STATUS } from '../config/constants';

export class CommentController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const status = req.query.status as string;

      let comments = Array.from(db.comments.values());

      if (status) {
        comments = comments.filter((c) => c.status === status);
      }

      comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const total = comments.length;
      const startIndex = (page - 1) * limit;
      const items = comments.slice(startIndex, startIndex + limit);

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

  static async setStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !Object.values(COMMENT_STATUS).includes(status)) {
        return next(new AppError('Invalid comment moderation status.', 400));
      }

      const comment = db.comments.get(id);
      if (!comment) return next(new AppError('Comment not found', 404, ERROR_CODES.NOT_FOUND));

      comment.status = status;
      comment.updatedAt = new Date().toISOString();

      AuditService.log({
        userId: req.admin!.id,
        userEmail: req.admin!.email,
        action: `COMMENT_STATUS_${status}`,
        resource: 'COMMENT',
        resourceId: id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        data: { comment },
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const comment = db.comments.get(id);
      if (!comment) return next(new AppError('Comment not found', 404, ERROR_CODES.NOT_FOUND));

      db.comments.delete(id);

      AuditService.log({
        userId: req.admin!.id,
        userEmail: req.admin!.email,
        action: 'COMMENT_DELETED',
        resource: 'COMMENT',
        resourceId: id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        data: { message: 'Comment deleted.' },
      });
    } catch (error: any) {
      next(error);
    }
  }
}
