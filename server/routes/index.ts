import { Router } from 'express';
import authRoutes from './v1/authRoutes';
import adminRoutes from './v1/adminRoutes';
import publicRoutes from './v1/publicRoutes';
import docsRoutes from './v1/docsRoutes';
import { FacebookController } from '../controllers/facebookController';
import { PublicController } from '../controllers/publicController';
import { ArticleController } from '../controllers/articleController';
import { authenticateAdmin, requirePermission } from '../middleware/auth';
import { PERMISSIONS } from '../config/constants';
import { rateLimiter } from '../middleware/security';

const apiRouter = Router();

// ==============================================================================
// 1. Meta Facebook Webhook Endpoints
// ==============================================================================
// GET /api/webhooks/facebook - Meta Webhook Verification
apiRouter.get('/webhooks/facebook', FacebookController.verifyWebhook);
// POST /api/webhooks/facebook - Meta Webhook Event Delivery
apiRouter.post('/webhooks/facebook', FacebookController.handleWebhook);

// ==============================================================================
// 2. Direct Website Public News Endpoints
// ==============================================================================
// GET /api/news - List published news articles (with category, search, pagination)
apiRouter.get('/news', rateLimiter({ maxRequests: 300, windowMs: 60000 }), PublicController.listArticles);
// GET /api/news/:slug - Get single news article by slug
apiRouter.get('/news/:slug', rateLimiter({ maxRequests: 300, windowMs: 60000 }), PublicController.getArticleBySlug);

// ==============================================================================
// 3. Direct AI Admin Newsroom & Editorial Endpoints
// ==============================================================================
// Editorial news management
apiRouter.post('/admin/news', authenticateAdmin, requirePermission(PERMISSIONS.ARTICLES_CREATE), ArticleController.create);
apiRouter.put('/admin/news/:id', authenticateAdmin, requirePermission(PERMISSIONS.ARTICLES_UPDATE), ArticleController.update);
apiRouter.delete('/admin/news/:id', authenticateAdmin, requirePermission(PERMISSIONS.ARTICLES_DELETE), ArticleController.delete);
apiRouter.post('/admin/news/:id/publish', authenticateAdmin, requirePermission(PERMISSIONS.ARTICLES_PUBLISH), ArticleController.publish);
apiRouter.post('/admin/news/:id/unpublish', authenticateAdmin, requirePermission(PERMISSIONS.ARTICLES_UNPUBLISH), ArticleController.unpublish);
apiRouter.post('/admin/news/:id/reprocess', authenticateAdmin, requirePermission(PERMISSIONS.ARTICLES_UPDATE), FacebookController.reprocessPost);

// Facebook Sync & Newsroom Management
apiRouter.get('/admin/facebook/status', authenticateAdmin, FacebookController.getStatus);
apiRouter.get('/admin/facebook/posts', authenticateAdmin, FacebookController.getPosts);
apiRouter.post('/admin/facebook/sync', authenticateAdmin, requirePermission(PERMISSIONS.ARTICLES_CREATE), FacebookController.syncNow);
apiRouter.post('/admin/facebook/test-import', authenticateAdmin, requirePermission(PERMISSIONS.ARTICLES_CREATE), FacebookController.testImport);
apiRouter.post('/admin/facebook/posts/:id/reprocess', authenticateAdmin, requirePermission(PERMISSIONS.ARTICLES_UPDATE), FacebookController.reprocessPost);
apiRouter.get('/admin/facebook/settings', authenticateAdmin, FacebookController.getSettings);
apiRouter.put('/admin/facebook/settings', authenticateAdmin, requirePermission(PERMISSIONS.SETTINGS_UPDATE), FacebookController.updateSettings);
apiRouter.get('/admin/sync/logs', authenticateAdmin, FacebookController.getSyncLogs);

// ==============================================================================
// 4. Mount Existing V1 APIs for Backward Compatibility
// ==============================================================================
apiRouter.use('/v1/auth/admin', authRoutes);
apiRouter.use('/v1/auth', authRoutes);
apiRouter.use('/v1/admin', adminRoutes);
apiRouter.use('/v1', publicRoutes);
apiRouter.use('/v1', docsRoutes);

export default apiRouter;
