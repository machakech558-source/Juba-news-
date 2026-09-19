import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db } from './server/services/db';
import { securityHeaders } from './server/middleware/security';
import { errorHandler, notFoundHandler } from './server/middleware/errorHandler';
import apiRouter from './server/routes/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Initialize persistent database models and seed data
  await db.initialize();

  // 2. Global Security Headers
  app.use(securityHeaders);

  // 3. Body parsers with safe request size limit
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. API Routes (FIRST, before any Vite or static assets)
  app.use('/api', apiRouter);

  // Direct health check route alias
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 5. Frontend serving
  if (!isProduction) {
    // Development: Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('⚡ Vite dev server integrated as Express middleware.');
  } else {
    // Production: serve built static assets from dist/
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 6. Centralized Error Handler (for API errors)
  app.use('/api/*', notFoundHandler);
  app.use(errorHandler);

  // 7. Bind to required port 3000 and 0.0.0.0
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Juba News Production Backend & App running on http://0.0.0.0:${PORT}`);
    console.log(`📚 OpenAPI Documentation available at http://0.0.0.0:${PORT}/api/v1/docs`);
    console.log(`🩺 Health Check endpoint at http://0.0.0.0:${PORT}/api/v1/health`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('Stopping server gracefully...');
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
