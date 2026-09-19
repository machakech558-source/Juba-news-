import { Request, Response, NextFunction } from 'express';
import { ERROR_CODES } from '../config/constants';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number = 400, code: string = ERROR_CODES.BAD_REQUEST, details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  res.status(404).json({
    success: false,
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: `Resource not found: ${req.method} ${req.originalUrl}`,
    },
  });
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const statusCode = err.statusCode || 500;
  const code = err.code || ERROR_CODES.INTERNAL_ERROR;
  const message = err.message || 'An unexpected internal server error occurred.';

  // Structured logging
  console.error(`[ERROR] [${req.method} ${req.url}] status=${statusCode} code=${code} message="${message}"`);
  if (statusCode === 500 && err.stack) {
    console.error(err.stack);
  }

  // Never leak internal stack traces to the client in production
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(err.details ? { details: err.details } : {}),
    },
  });
}
