import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireCustomerAuth } from '../middleware/auth.js';
import { previewCoupon } from '../controllers/couponController.js';

const router = Router();

router.post('/preview', requireCustomerAuth, validate(z.object({ code: z.string().min(1) })), previewCoupon);

export default router;
