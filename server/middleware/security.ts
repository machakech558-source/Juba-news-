import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { ERROR_CODES } from '../config/constants';
import { config } from '../config/env';

// In-memory rate-limiter store
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (record.resetAt < now) {
      rateLimitMap.delete(key);
    }
  }
}, 60000);

/**
 * Production-ready security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (config.isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
}

/**
 * Configurable rate limiter
 */
export function rateLimiter(options: { windowMs?: number; maxRequests?: number; keyPrefix?: string } = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 mins default
  const maxRequests = options.maxRequests || 100;
  const keyPrefix = options.keyPrefix || 'global';

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    const record = rateLimitMap.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + windowMs;
    }

    record.count++;
    rateLimitMap.set(key, record);

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000).toString());

    if (record.count > maxRequests) {
      return next(
        new AppError(
          'Too many requests from this IP. Please try again later.',
          429,
          ERROR_CODES.TOO_MANY_REQUESTS
        )
      );
    }

    next();
  };
}

/**
 * Strict login rate limiter to protect against credential stuffing & brute-force
 */
export const loginRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  keyPrefix: 'auth-login',
});
