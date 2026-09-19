import { Request, Response, NextFunction } from 'express';
import { db, DbMedia } from '../services/db';
import { AuditService } from '../services/auditService';
import { AppError } from '../middleware/errorHandler';
import { ERROR_CODES } from '../config/constants';
import crypto from 'crypto';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export class MediaController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const media = Array.from(db.media.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      res.json({
        success: true,
        data: { media },
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const { filename, mimeType, sizeBytes, url } = req.body;

      if (!filename || !mimeType || !url) {
        return next(new AppError('Missing required media parameters: filename, mimeType, url', 400));
      }

      // Security: Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return next(
          new AppError(
            `File type ${mimeType} is not permitted. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
            400,
            ERROR_CODES.VALIDATION_ERROR
          )
        );
      }

      // Security: Validate size
      if (sizeBytes && sizeBytes > MAX_FILE_SIZE_BYTES) {
        return next(
          new AppError(
            `File size exceeds maximum allowed threshold of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
            400,
            ERROR_CODES.VALIDATION_ERROR
          )
        );
      }

      // Security: Sanitize filename and prevent path traversal
      const sanitizedName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const safeId = `med-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

      const mediaItem: DbMedia = {
        id: safeId,
        filename: sanitizedName,
        originalName: sanitizedName,
        mimeType,
        sizeBytes: sizeBytes || 150000,
        url,
        uploadedBy: req.admin?.id || 'admin',
        createdAt: new Date().toISOString(),
      };

      db.media.set(safeId, mediaItem);

      AuditService.log({
        userId: req.admin!.id,
        userEmail: req.admin!.email,
        action: 'MEDIA_UPLOADED',
        resource: 'MEDIA',
        resourceId: safeId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { filename: sanitizedName, mimeType, sizeBytes },
      });

      res.status(201).json({
        success: true,
        data: { media: mediaItem },
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const media = db.media.get(id);
      if (!media) return next(new AppError('Media item not found', 404, ERROR_CODES.NOT_FOUND));

      db.media.delete(id);

      AuditService.log({
        userId: req.admin!.id,
        userEmail: req.admin!.email,
        action: 'MEDIA_DELETED',
        resource: 'MEDIA',
        resourceId: id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { filename: media.filename },
      });

      res.json({
        success: true,
        data: { message: 'Media removed.' },
      });
    } catch (error: any) {
      next(error);
    }
  }
}
