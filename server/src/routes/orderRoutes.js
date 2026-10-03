import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { attachCustomerIfPresent, requireCustomerAuth } from '../middleware/auth.js';
import {
  createCodOrder,
  initiateRazorpayPayment,
  verifyRazorpayPayment,
  razorpayWebhook,
  myOrders,
  getMyOrder,
  downloadMyInvoice,
  checkoutSchema,
  verifyRazorpaySchema,
} from '../controllers/orderController.js';

const router = Router();

router.post('/cod', attachCustomerIfPresent, validate(checkoutSchema), createCodOrder);
router.post('/razorpay/initiate', attachCustomerIfPresent, validate(checkoutSchema), initiateRazorpayPayment);
router.post('/razorpay/verify', validate(verifyRazorpaySchema), verifyRazorpayPayment);
// Called by Razorpay's servers, not by our frontend; authenticated by signature.
router.post('/razorpay/webhook', razorpayWebhook);

router.get('/mine', requireCustomerAuth, myOrders);
router.get('/mine/:id', requireCustomerAuth, getMyOrder);
router.get('/mine/:id/invoice', requireCustomerAuth, downloadMyInvoice);

export default router;
