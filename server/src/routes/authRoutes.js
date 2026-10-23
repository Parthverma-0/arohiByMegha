import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireCustomerAuth, loadUser } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import { googleConfig, googleLogin, refresh, logout, me, googleSchema } from '../controllers/authController.js';

const router = Router();

router.get('/google/config', googleConfig);
router.post('/google', authLimiter, validate(googleSchema), googleLogin);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireCustomerAuth, loadUser, me);

export default router;
