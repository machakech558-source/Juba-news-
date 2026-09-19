import { Router } from 'express';
import { PublicController } from '../../controllers/publicController';
import { AiNewsController } from '../../controllers/aiNewsController';
import { rateLimiter } from '../../middleware/security';

const router = Router();

// Health check
router.get('/health', PublicController.healthCheck);

// Articles
router.get('/articles', rateLimiter({ maxRequests: 300, windowMs: 60000 }), PublicController.listArticles);
router.get('/articles/:slug', rateLimiter({ maxRequests: 300, windowMs: 60000 }), PublicController.getArticleBySlug);

// Categories
router.get('/categories', PublicController.listCategories);

// Comments submission (rate-limited)
router.post('/articles/:id/comments', rateLimiter({ maxRequests: 10, windowMs: 60000 }), PublicController.postComment);

// Autonomous / On-demand AI News Dispatch Generation
router.post('/ai/generate-news', rateLimiter({ maxRequests: 30, windowMs: 60000 }), AiNewsController.generate);

export default router;
