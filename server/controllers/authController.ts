import { Request, Response, NextFunction } from 'express';
import { db, DbSession } from '../services/db';
import { CryptoService } from '../services/cryptoService';
import { AuditService } from '../services/auditService';
import { AppError } from '../middleware/errorHandler';
import { ERROR_CODES, ROLES } from '../config/constants';
import { config } from '../config/env';
import crypto from 'crypto';

export class AuthController {
  /**
   * POST /api/v1/auth/admin/login
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        return next(new AppError('Email and password are required.', 400, ERROR_CODES.VALIDATION_ERROR));
      }

      // Generic error message to prevent account enumeration
      const genericError = new AppError('Invalid email or password.', 401, ERROR_CODES.UNAUTHORIZED);

      // Find admin
      let foundAdmin: any = null;
      for (const admin of db.admins.values()) {
        if (admin.email.toLowerCase() === email.trim().toLowerCase()) {
          foundAdmin = admin;
          break;
        }
      }

      if (!foundAdmin) {
        AuditService.log({
          userId: 'anonymous',
          userEmail: email,
          action: 'AUTH_LOGIN_FAILED_NOT_FOUND',
          resource: 'AUTH',
          ip: ip as string,
          userAgent,
        });
        return next(genericError);
      }

      // Check account lockout
      if (foundAdmin.lockedUntil && foundAdmin.lockedUntil > Date.now()) {
        const remainingMinutes = Math.ceil((foundAdmin.lockedUntil - Date.now()) / 60000);
        return next(
          new AppError(
            `Account temporarily locked due to excessive failed attempts. Please try again in ${remainingMinutes} minute(s).`,
            403,
            ERROR_CODES.FORBIDDEN
          )
        );
      }

      // Check account status
      if (foundAdmin.status === 'DISABLED') {
        return next(new AppError('Your administrator account has been deactivated.', 403, ERROR_CODES.FORBIDDEN));
      }

      // Verify password
      const isPasswordValid = await CryptoService.verifyPassword(password, foundAdmin.passwordHash);
      if (!isPasswordValid) {
        foundAdmin.failedLoginAttempts = (foundAdmin.failedLoginAttempts || 0) + 1;
        if (foundAdmin.failedLoginAttempts >= config.adminMaxLoginAttempts) {
          foundAdmin.lockedUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 mins
          AuditService.log({
            userId: foundAdmin.id,
            userEmail: foundAdmin.email,
            action: 'AUTH_ACCOUNT_LOCKED',
            resource: 'AUTH',
            ip: ip as string,
            userAgent,
            metadata: { attempts: foundAdmin.failedLoginAttempts },
          });
        }

        AuditService.log({
          userId: foundAdmin.id,
          userEmail: foundAdmin.email,
          action: 'AUTH_LOGIN_FAILED_PASSWORD',
          resource: 'AUTH',
          ip: ip as string,
          userAgent,
        });

        return next(genericError);
      }

      // Reset failed attempts on success
      foundAdmin.failedLoginAttempts = 0;
      foundAdmin.lockedUntil = undefined;
      foundAdmin.lastLoginAt = new Date().toISOString();

      // Check 2FA requirement
      const requires2FA = foundAdmin.is2faEnabled || db.settings.require2FAForAdmins;
      if (requires2FA && foundAdmin.is2faEnabled) {
        // Issue temporary 2FA pending token (valid 5 minutes)
        const tempToken = CryptoService.signJwt(
          { sub: foundAdmin.id, email: foundAdmin.email, stage: '2FA_PENDING' },
          300
        );

        AuditService.log({
          userId: foundAdmin.id,
          userEmail: foundAdmin.email,
          action: 'AUTH_2FA_CHALLENGE_ISSUED',
          resource: 'AUTH',
          ip: ip as string,
          userAgent,
        });

        return res.json({
          success: true,
          data: {
            requires2FA: true,
            tempToken,
            message: 'Two-factor authentication required. Please enter your 6-digit TOTP code.',
          },
        });
      }

      // Issue full session and tokens
      const sessionId = `sess-${Date.now()}-${CryptoService.generateRandomToken(8)}`;
      const refreshToken = CryptoService.generateRandomToken(40);
      const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      const session: DbSession = {
        id: sessionId,
        adminId: foundAdmin.id,
        refreshTokenHash,
        ip: ip as string,
        userAgent,
        expiresAt: Date.now() + config.refreshTokenExpiresInDays * 86400 * 1000,
        createdAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
      };
      db.sessions.set(sessionId, session);

      const accessToken = CryptoService.signJwt({
        sub: foundAdmin.id,
        email: foundAdmin.email,
        role: foundAdmin.role,
        displayName: foundAdmin.displayName,
        sessionId,
      });

      AuditService.log({
        userId: foundAdmin.id,
        userEmail: foundAdmin.email,
        action: 'AUTH_LOGIN_SUCCESS',
        resource: 'AUTH',
        ip: ip as string,
        userAgent,
        metadata: { sessionId },
      });

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          admin: {
            id: foundAdmin.id,
            email: foundAdmin.email,
            displayName: foundAdmin.displayName,
            role: foundAdmin.role,
            avatarUrl: foundAdmin.avatarUrl,
            is2faEnabled: foundAdmin.is2faEnabled,
          },
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/admin/2fa/verify
   */
  static async verify2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const { tempToken, code, backupCode } = req.body;
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      if (!tempToken) {
        return next(new AppError('Missing temporary 2FA verification token.', 400, ERROR_CODES.VALIDATION_ERROR));
      }

      const decoded = CryptoService.verifyJwt(tempToken);
      if (!decoded.valid || decoded.payload?.stage !== '2FA_PENDING') {
        return next(new AppError('Invalid or expired 2FA session token.', 401, ERROR_CODES.INVALID_TOKEN));
      }

      const admin = db.admins.get(decoded.payload.sub);
      if (!admin || !admin.totpSecret) {
        return next(new AppError('Administrator account or 2FA configuration not found.', 401, ERROR_CODES.UNAUTHORIZED));
      }

      let verified = false;

      // TOTP code check
      if (code) {
        verified = CryptoService.verifyTotpCode(admin.totpSecret, code.toString().trim());
      } else if (backupCode && admin.backupCodes) {
        // Backup recovery code check
        const backupCheck = CryptoService.verifyBackupCode(backupCode, admin.backupCodes);
        if (backupCheck.valid && backupCheck.matchingHash) {
          verified = true;
          // Consume backup code (single-use)
          admin.backupCodes = admin.backupCodes.filter((h) => h !== backupCheck.matchingHash);
          AuditService.log({
            userId: admin.id,
            userEmail: admin.email,
            action: 'AUTH_2FA_BACKUP_CODE_CONSUMED',
            resource: 'AUTH',
            ip: ip as string,
            userAgent,
          });
        }
      }

      if (!verified) {
        AuditService.log({
          userId: admin.id,
          userEmail: admin.email,
          action: 'AUTH_2FA_VERIFICATION_FAILED',
          resource: 'AUTH',
          ip: ip as string,
          userAgent,
        });
        return next(new AppError('Invalid two-factor authentication code.', 401, ERROR_CODES.UNAUTHORIZED));
      }

      // Create session & issue token
      const sessionId = `sess-${Date.now()}-${CryptoService.generateRandomToken(8)}`;
      const refreshToken = CryptoService.generateRandomToken(40);
      const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      const session: DbSession = {
        id: sessionId,
        adminId: admin.id,
        refreshTokenHash,
        ip: ip as string,
        userAgent,
        expiresAt: Date.now() + config.refreshTokenExpiresInDays * 86400 * 1000,
        createdAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
      };
      db.sessions.set(sessionId, session);

      const accessToken = CryptoService.signJwt({
        sub: admin.id,
        email: admin.email,
        role: admin.role,
        displayName: admin.displayName,
        sessionId,
      });

      AuditService.log({
        userId: admin.id,
        userEmail: admin.email,
        action: 'AUTH_2FA_VERIFIED_SUCCESS',
        resource: 'AUTH',
        ip: ip as string,
        userAgent,
      });

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          admin: {
            id: admin.id,
            email: admin.email,
            displayName: admin.displayName,
            role: admin.role,
            avatarUrl: admin.avatarUrl,
            is2faEnabled: admin.is2faEnabled,
          },
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/admin/2fa/enable (Requires admin authentication)
   */
  static async setup2FA(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.admin) return next(new AppError('Unauthorized', 401));
      const admin = db.admins.get(req.admin.id);
      if (!admin) return next(new AppError('Admin not found', 404));

      const { secret, uri } = CryptoService.generateTotpSecret();
      const { rawCodes, hashedCodes } = CryptoService.generateBackupCodes();

      // Temporarily stash secret pending confirmation
      admin.totpSecret = secret;
      admin.backupCodes = hashedCodes;

      res.json({
        success: true,
        data: {
          secret,
          otpauthUri: uri,
          backupRecoveryCodes: rawCodes,
          instructions: 'Scan this URI or secret in your Authenticator app, then confirm with a 6-digit code.',
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/admin/2fa/confirm
   */
  static async confirm2FA(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.admin) return next(new AppError('Unauthorized', 401));
      const { code } = req.body;
      const admin = db.admins.get(req.admin.id);
      if (!admin || !admin.totpSecret) {
        return next(new AppError('2FA setup has not been initiated.', 400));
      }

      const isValid = CryptoService.verifyTotpCode(admin.totpSecret, code?.toString()?.trim());
      if (!isValid) {
        return next(new AppError('Invalid confirmation code. Please verify your authenticator app time.', 400));
      }

      admin.is2faEnabled = true;
      admin.updatedAt = new Date().toISOString();

      AuditService.log({
        userId: admin.id,
        userEmail: admin.email,
        action: 'AUTH_2FA_ENABLED',
        resource: 'AUTH',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        data: {
          message: 'Two-factor authentication successfully enabled for your administrator account.',
          is2faEnabled: true,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/admin/2fa/disable
   */
  static async disable2FA(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.admin) return next(new AppError('Unauthorized', 401));
      const { password } = req.body;
      const admin = db.admins.get(req.admin.id);
      if (!admin) return next(new AppError('Admin not found', 404));

      if (!password) {
        return next(new AppError('Password confirmation is required to disable 2FA.', 400));
      }

      const validPass = await CryptoService.verifyPassword(password, admin.passwordHash);
      if (!validPass) {
        return next(new AppError('Incorrect password.', 401));
      }

      admin.is2faEnabled = false;
      admin.totpSecret = undefined;
      admin.backupCodes = undefined;
      admin.updatedAt = new Date().toISOString();

      AuditService.log({
        userId: admin.id,
        userEmail: admin.email,
        action: 'AUTH_2FA_DISABLED',
        resource: 'AUTH',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        data: {
          message: 'Two-factor authentication has been disabled.',
          is2faEnabled: false,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.admin?.sessionId) {
        db.sessions.delete(req.admin.sessionId);
        AuditService.log({
          userId: req.admin.id,
          userEmail: req.admin.email,
          action: 'AUTH_LOGOUT',
          resource: 'AUTH',
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }

      res.json({
        success: true,
        data: { message: 'Successfully signed out of administrative session.' },
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.admin) return next(new AppError('Unauthorized', 401));
      const admin = db.admins.get(req.admin.id);
      if (!admin) return next(new AppError('Admin not found', 404));

      res.json({
        success: true,
        data: {
          admin: {
            id: admin.id,
            email: admin.email,
            displayName: admin.displayName,
            role: admin.role,
            avatarUrl: admin.avatarUrl,
            is2faEnabled: admin.is2faEnabled,
            status: admin.status,
            createdAt: admin.createdAt,
            lastLoginAt: admin.lastLoginAt,
          },
          permissions: req.admin.permissions,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }
}
