import { Router } from 'express';
import { AuthController } from '../../controllers/authController';
import { authenticateAdmin } from '../../middleware/auth';
import { loginRateLimiter } from '../../middleware/security';

const router = Router();

// Public auth routes (rate-limited)
router.post('/login', loginRateLimiter, AuthController.login);
router.post('/2fa/verify', loginRateLimiter, AuthController.verify2FA);

// Authenticated admin routes
router.get('/me', authenticateAdmin, AuthController.getMe);
router.post('/logout', authenticateAdmin, AuthController.logout);
router.post('/2fa/enable', authenticateAdmin, AuthController.setup2FA);
router.post('/2fa/confirm', authenticateAdmin, AuthController.confirm2FA);
router.post('/2fa/disable', authenticateAdmin, AuthController.disable2FA);

export default router;
