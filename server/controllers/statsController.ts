import { Request, Response, NextFunction } from 'express';
import { db } from '../services/db';
import { ARTICLE_STATUS } from '../config/constants';

export class StatsController {
  static async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const articles = Array.from(db.articles.values());
      const comments = Array.from(db.comments.values());
      const admins = Array.from(db.admins.values());

      const totalArticles = articles.length;
      const publishedArticles = articles.filter((a) => a.status === ARTICLE_STATUS.PUBLISHED).length;
      const draftArticles = articles.filter((a) => a.status === ARTICLE_STATUS.DRAFT).length;
      const scheduledArticles = articles.filter((a) => a.status === ARTICLE_STATUS.SCHEDULED).length;
      const reviewArticles = articles.filter((a) => a.status === ARTICLE_STATUS.REVIEW).length;

      const totalComments = comments.length;
      const pendingComments = comments.filter((c) => c.status === 'PENDING').length;
      const approvedComments = comments.filter((c) => c.status === 'APPROVED').length;

      const activeAdmins = admins.filter((a) => a.status === 'ACTIVE').length;

      const recentArticles = articles
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((a) => ({
          id: a.id,
          titleEn: a.titleEn,
          titleAr: a.titleAr,
          slug: a.slug,
          status: a.status,
          authorName: a.authorName,
          publishedAt: a.publishedAt,
          createdAt: a.createdAt,
        }));

      const recentAudit = db.auditLogs.slice(0, 8);

      res.json({
        success: true,
        data: {
          metrics: {
            totalArticles,
            publishedArticles,
            draftArticles,
            scheduledArticles,
            reviewArticles,
            totalComments,
            pendingComments,
            approvedComments,
            activeAdmins,
          },
          recentArticles,
          recentAudit,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }
}
