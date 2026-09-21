import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { adminLoginLimiter } from '../middleware/rateLimiters.js';
import {
  login,
  setupTwoFactor,
  enableTwoFactor,
  verifyTwoFactor,
  refresh,
  logout,
  me,
  loginSchema,
  codeSchema,
} from '../controllers/adminAuthController.js';
import { z } from 'zod';

const router = Router();

const tempTokenSchema = z.object({ tempToken: z.string().min(1) });

router.post('/login', adminLoginLimiter, validate(loginSchema), login);
router.post('/2fa/setup', adminLoginLimiter, validate(tempTokenSchema), setupTwoFactor);
router.post('/2fa/enable', adminLoginLimiter, validate(codeSchema), enableTwoFactor);
router.post('/2fa/verify', adminLoginLimiter, validate(codeSchema), verifyTwoFactor);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireAdminAuth(), me);

export default router;
