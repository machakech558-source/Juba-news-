import { db, DbAuditLog } from './db';
import crypto from 'crypto';

export class AuditService {
  /**
   * Appends an immutable audit log entry
   */
  static log(entry: {
    userId: string;
    userEmail: string;
    action: string;
    resource: string;
    resourceId?: string;
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }): DbAuditLog {
    const logItem: DbAuditLog = {
      id: `audit-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      userId: entry.userId,
      userEmail: entry.userEmail,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      ip: entry.ip || '0.0.0.0',
      userAgent: entry.userAgent || 'unknown',
      timestamp: new Date().toISOString(),
      metadata: entry.metadata,
    };

    // Store in memory & prepend for chronological viewing
    db.auditLogs.unshift(logItem);

    // Keep safe cap on audit logs in memory (e.g. last 10,000)
    if (db.auditLogs.length > 10000) {
      db.auditLogs.pop();
    }

    console.log(`[AUDIT] [${logItem.timestamp}] [${logItem.action}] user=${logItem.userEmail} res=${logItem.resource}/${logItem.resourceId || ''}`);
    return logItem;
  }

  /**
   * Retrieves paginated audit logs with search/filter
   */
  static getLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    resource?: string;
    search?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));

    let filtered = db.auditLogs;

    if (params.action) {
      filtered = filtered.filter((l) => l.action.toLowerCase() === params.action?.toLowerCase());
    }

    if (params.resource) {
      filtered = filtered.filter((l) => l.resource.toLowerCase() === params.resource?.toLowerCase());
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.userEmail.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.resource.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const items = filtered.slice(startIndex, startIndex + limit);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
