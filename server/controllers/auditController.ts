import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/auditService';

export class AuditController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const action = req.query.action as string;
      const resource = req.query.resource as string;
      const search = req.query.search as string;

      const result = AuditService.getLogs({ page, limit, action, resource, search });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }
}
