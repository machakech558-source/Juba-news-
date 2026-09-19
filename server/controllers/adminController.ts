import { Request, Response, NextFunction } from 'express';
import { db, DbAdmin } from '../services/db';
import { CryptoService } from '../services/cryptoService';
import { AuditService } from '../services/auditService';
import { AppError } from '../middleware/errorHandler';
import { ERROR_CODES, ROLES, RoleType } from '../config/constants';

export class AdminController {
  /**
   * GET /api/v1/admin/admins
   */
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const admins = Array.from(db.admins.values()).map((a) => ({
        id: a.id,
        email: a.email,
        displayName: a.displayName,
        role: a.role,
        status: a.status,
        is2faEnabled: a.is2faEnabled,
        avatarUrl: a.avatarUrl,
        lastLoginAt: a.lastLoginAt,
        createdAt: a.createdAt,
      }));

      res.json({
        success: true,
        data: { admins },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/admins
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, displayName, role, password, avatarUrl } = req.body;

      if (!email || !displayName || !role || !password) {
        return next(new AppError('Missing required admin parameters: email, displayName, role, password', 400));
      }

      if (!Object.values(ROLES).includes(role as RoleType)) {
        return next(new AppError('Invalid administrator role specified.', 400));
      }

      if (password.length < 8) {
        return next(new AppError('Password must be at least 8 characters long.', 400));
      }

      // Check duplicate email
      for (const existing of db.admins.values()) {
        if (existing.email.toLowerCase() === email.trim().toLowerCase()) {
          return next(new AppError('An administrator with this email already exists.', 409, ERROR_CODES.CONFLICT));
        }
      }

      const passwordHash = await CryptoService.hashPassword(password);
      const id = `admin-${role.toLowerCase()}-${Date.now()}`;
      const now = new Date().toISOString();

      const newAdmin: DbAdmin = {
        id,
        email: email.trim().toLowerCase(),
        displayName: displayName.trim(),
        role: role as RoleType,
        passwordHash,
        is2faEnabled: false,
        status: 'ACTIVE',
        failedLoginAttempts: 0,
        avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        createdAt: now,
        updatedAt: now,
      };

      db.admins.set(id, newAdmin);

      AuditService.log({
        userId: req.admin!.id,
        userEmail: req.admin!.email,
        action: 'ADMIN_CREATED',
        resource: 'ADMIN',
        resourceId: id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { email: newAdmin.email, role: newAdmin.role },
      });

      res.status(201).json({
        success: true,
        data: {
          admin: {
            id: newAdmin.id,
            email: newAdmin.email,
            displayName: newAdmin.displayName,
            role: newAdmin.role,
            status: newAdmin.status,
            createdAt: newAdmin.createdAt,
          },
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/admin/admins/:id
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const targetAdmin = db.admins.get(id);
      if (!targetAdmin) return next(new AppError('Admin not found', 404, ERROR_CODES.NOT_FOUND));

      const { role, status, displayName, avatarUrl } = req.body;

      // Protection: Do not allow the last active Super Admin to accidentally delete or disable themselves
      if (
        targetAdmin.role === ROLES.SUPER_ADMIN &&
        (status === 'DISABLED' || (role && role !== ROLES.SUPER_ADMIN))
      ) {
        const activeSuperAdmins = Array.from(db.admins.values()).filter(
          (a) => a.role === ROLES.SUPER_ADMIN && a.status === 'ACTIVE' && a.id !== id
        );
        if (activeSuperAdmins.length === 0) {
          return next(
            new AppError(
              'Cannot demote or disable the last active Super Administrator on the platform.',
              400,
              ERROR_CODES.BAD_REQUEST
            )
          );
        }
      }

      if (role && Object.values(ROLES).includes(role)) {
        targetAdmin.role = role;
      }
      if (status && ['ACTIVE', 'DISABLED'].includes(status)) {
        targetAdmin.status = status;
        // If disabled, invalidate all active sessions for this admin
        if (status === 'DISABLED') {
          for (const [sessId, sess] of db.sessions.entries()) {
            if (sess.adminId === id) {
              db.sessions.delete(sessId);
            }
          }
        }
      }
      if (displayName) targetAdmin.displayName = displayName;
      if (avatarUrl) targetAdmin.avatarUrl = avatarUrl;
      targetAdmin.updatedAt = new Date().toISOString();

      AuditService.log({
        userId: req.admin!.id,
        userEmail: req.admin!.email,
        action: 'ADMIN_UPDATED',
        resource: 'ADMIN',
        resourceId: id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { role, status },
      });

      res.json({
        success: true,
        data: {
          admin: {
            id: targetAdmin.id,
            email: targetAdmin.email,
            displayName: targetAdmin.displayName,
            role: targetAdmin.role,
            status: targetAdmin.status,
          },
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/admins/:id
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const targetAdmin = db.admins.get(id);
      if (!targetAdmin) return next(new AppError('Admin not found', 404, ERROR_CODES.NOT_FOUND));

      // Cannot delete last super admin
      if (targetAdmin.role === ROLES.SUPER_ADMIN) {
        const remainingSuper = Array.from(db.admins.values()).filter(
          (a) => a.role === ROLES.SUPER_ADMIN && a.id !== id
        );
        if (remainingSuper.length === 0) {
          return next(
            new AppError('Cannot delete the last remaining Super Administrator.', 400, ERROR_CODES.BAD_REQUEST)
          );
        }
      }

      // Invalidate sessions
      for (const [sessId, sess] of db.sessions.entries()) {
        if (sess.adminId === id) db.sessions.delete(sessId);
      }

      db.admins.delete(id);

      AuditService.log({
        userId: req.admin!.id,
        userEmail: req.admin!.email,
        action: 'ADMIN_DELETED',
        resource: 'ADMIN',
        resourceId: id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { email: targetAdmin.email },
      });

      res.json({
        success: true,
        data: { message: 'Administrator permanently removed.' },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/sessions
   */
  static async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const sessions = Array.from(db.sessions.values()).map((s) => ({
        id: s.id,
        adminId: s.adminId,
        ip: s.ip,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
        lastActivityAt: s.lastActivityAt,
        isCurrent: s.id === req.admin?.sessionId,
      }));

      res.json({
        success: true,
        data: { sessions },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/sessions/:id
   */
  static async revokeSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const session = db.sessions.get(id);
      if (!session) return next(new AppError('Session not found', 404));

      db.sessions.delete(id);

      AuditService.log({
        userId: req.admin!.id,
        userEmail: req.admin!.email,
        action: 'SESSION_REVOKED',
        resource: 'SESSION',
        resourceId: id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        data: { message: 'Session revoked successfully.' },
      });
    } catch (error: any) {
      next(error);
    }
  }
}
