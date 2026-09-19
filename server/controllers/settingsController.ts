import { Request, Response, NextFunction } from 'express';
import { db } from '../services/db';
import { AuditService } from '../services/auditService';

export class SettingsController {
  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        data: { settings: db.settings },
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updates = req.body;
      Object.assign(db.settings, updates, { updatedAt: new Date().toISOString() });

      AuditService.log({
        userId: req.admin!.id,
        userEmail: req.admin!.email,
        action: 'SITE_SETTINGS_UPDATED',
        resource: 'SETTINGS',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { updatedFields: Object.keys(updates) },
      });

      res.json({
        success: true,
        data: { settings: db.settings },
      });
    } catch (error: any) {
      next(error);
    }
  }
}
