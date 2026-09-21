import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { attachCustomerIfPresent, requireCustomerAuth } from '../middleware/auth.js';
import {
  createCodOrder,
  createRazorpayOrder,
  verifyRazorpayOrder,
  myOrders,
  getMyOrder,
  checkoutSchema,
  verifyRazorpaySchema,
} from '../controllers/orderController.js';
import { z } from 'zod';

const router = Router();

router.post('/cod', attachCustomerIfPresent, validate(checkoutSchema), createCodOrder);
router.post(
  '/razorpay/create',
  attachCustomerIfPresent,
  validate(z.object({ couponCode: z.string().optional() })),
  createRazorpayOrder
);
router.post('/razorpay/verify', attachCustomerIfPresent, validate(verifyRazorpaySchema), verifyRazorpayOrder);

router.get('/mine', requireCustomerAuth, myOrders);
router.get('/mine/:id', requireCustomerAuth, getMyOrder);

export default router;
