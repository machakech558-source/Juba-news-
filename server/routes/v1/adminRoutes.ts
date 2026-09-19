import { Router } from 'express';
import { authenticateAdmin, requirePermission, requireRole } from '../../middleware/auth';
import { PERMISSIONS, ROLES } from '../../config/constants';
import { ArticleController } from '../../controllers/articleController';
import { CategoryController } from '../../controllers/categoryController';
import { CommentController } from '../../controllers/commentController';
import { MediaController } from '../../controllers/mediaController';
import { AdminController } from '../../controllers/adminController';
import { AuditController } from '../../controllers/auditController';
import { SettingsController } from '../../controllers/settingsController';
import { StatsController } from '../../controllers/statsController';
import { AiNewsController } from '../../controllers/aiNewsController';

const router = Router();

// Enforce authentication on all administrative API endpoints
router.use(authenticateAdmin);

// --- DASHBOARD STATS ---
router.get('/stats', requirePermission(PERMISSIONS.ARTICLES_READ), StatsController.getDashboardStats);

// --- ARTICLE MANAGEMENT ---
router.get('/articles', requirePermission(PERMISSIONS.ARTICLES_READ), ArticleController.list);
router.get('/articles/:id', requirePermission(PERMISSIONS.ARTICLES_READ), ArticleController.getById);
router.post('/articles', requirePermission(PERMISSIONS.ARTICLES_CREATE), ArticleController.create);
router.put('/articles/:id', requirePermission(PERMISSIONS.ARTICLES_UPDATE), ArticleController.update);
router.delete('/articles/:id', requirePermission(PERMISSIONS.ARTICLES_DELETE), ArticleController.delete);
router.post('/articles/:id/publish', requirePermission(PERMISSIONS.ARTICLES_PUBLISH), ArticleController.publish);
router.post('/articles/:id/unpublish', requirePermission(PERMISSIONS.ARTICLES_UNPUBLISH), ArticleController.unpublish);

// --- CATEGORY MANAGEMENT ---
router.get('/categories', requirePermission(PERMISSIONS.ARTICLES_READ), CategoryController.list);
router.post('/categories', requirePermission(PERMISSIONS.CATEGORIES_MANAGE), CategoryController.create);
router.put('/categories/:id', requirePermission(PERMISSIONS.CATEGORIES_MANAGE), CategoryController.update);
router.delete('/categories/:id', requirePermission(PERMISSIONS.CATEGORIES_MANAGE), CategoryController.delete);

// --- COMMENT MODERATION ---
router.get('/comments', requirePermission(PERMISSIONS.COMMENTS_READ), CommentController.list);
router.put('/comments/:id/status', requirePermission(PERMISSIONS.COMMENTS_MODERATE), CommentController.setStatus);
router.delete('/comments/:id', requirePermission(PERMISSIONS.COMMENTS_DELETE), CommentController.delete);

// --- MEDIA LIBRARY ---
router.get('/media', requirePermission(PERMISSIONS.MEDIA_UPLOAD), MediaController.list);
router.post('/media/upload', requirePermission(PERMISSIONS.MEDIA_UPLOAD), MediaController.upload);
router.delete('/media/:id', requirePermission(PERMISSIONS.MEDIA_DELETE), MediaController.delete);

// --- ADMINISTRATOR MANAGEMENT (SUPER_ADMIN) ---
router.get('/admins', requirePermission(PERMISSIONS.ADMINS_READ), AdminController.list);
router.post('/admins', requirePermission(PERMISSIONS.ADMINS_CREATE), AdminController.create);
router.put('/admins/:id', requirePermission(PERMISSIONS.ADMINS_UPDATE), AdminController.update);
router.delete('/admins/:id', requirePermission(PERMISSIONS.ADMINS_DELETE), AdminController.delete);

// --- SESSION MANAGEMENT ---
router.get('/sessions', requireRole(ROLES.SUPER_ADMIN), AdminController.getSessions);
router.delete('/sessions/:id', requireRole(ROLES.SUPER_ADMIN), AdminController.revokeSession);

// --- AUDIT LOGS ---
router.get('/audit-logs', requirePermission(PERMISSIONS.AUDIT_LOGS_READ), AuditController.list);

// --- SITE SETTINGS ---
router.get('/settings', requirePermission(PERMISSIONS.SETTINGS_READ), SettingsController.get);
router.put('/settings', requirePermission(PERMISSIONS.SETTINGS_UPDATE), SettingsController.update);

// --- AI AUTOMATION & NEWS DISPATCH ---
router.post('/ai/generate-news', requirePermission(PERMISSIONS.ARTICLES_CREATE), AiNewsController.generate);

export default router;
