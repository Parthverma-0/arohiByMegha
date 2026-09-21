import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireCustomerAuth, loadUser } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import { signup, login, refresh, logout, me, signupSchema, loginSchema } from '../controllers/authController.js';

const router = Router();

router.post('/signup', authLimiter, validate(signupSchema), signup);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireCustomerAuth, loadUser, me);

export default router;
