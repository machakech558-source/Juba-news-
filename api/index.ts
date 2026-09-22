import express, { Request, Response, NextFunction } from 'express';
import { db } from '../server/services/db';
import { securityHeaders } from '../server/middleware/security';
import { errorHandler } from '../server/middleware/errorHandler';
import apiRouter from '../server/routes/index';

const app = express();

let dbInitialized = false;
async function ensureDbInit() {
  if (!dbInitialized) {
    try {
      await db.initialize();
      dbInitialized = true;
    } catch (err) {
      console.error('Error initializing db in serverless function:', err);
    }
  }
}

// Global Security Headers
app.use(securityHeaders);

// Body parsers with safe limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure DB initialization
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  await ensureDbInit();
  next();
});

// Health check endpoints
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount API routes at both /api and root to handle any Vercel rewrite prefix variations
app.use('/api', apiRouter);
app.use(apiRouter);

// Centralized error handling
app.use(errorHandler);

export default app;
