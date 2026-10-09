import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { attachCustomerIfPresent, requireCustomerAuth } from '../middleware/auth.js';
import {
  createWhatsappOrder,
  getDeliveryQuote,
  deliveryQuoteSchema,
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

router.post('/delivery-quote', attachCustomerIfPresent, validate(deliveryQuoteSchema), getDeliveryQuote);
router.post('/whatsapp', attachCustomerIfPresent, validate(checkoutSchema), createWhatsappOrder);
router.post('/razorpay/initiate', attachCustomerIfPresent, validate(checkoutSchema), initiateRazorpayPayment);
router.post('/razorpay/verify', validate(verifyRazorpaySchema), verifyRazorpayPayment);
// Called by Razorpay's servers, not by our frontend; authenticated by signature.
router.post('/razorpay/webhook', razorpayWebhook);

router.get('/mine', requireCustomerAuth, myOrders);
router.get('/mine/:id', requireCustomerAuth, getMyOrder);
router.get('/mine/:id/invoice', requireCustomerAuth, downloadMyInvoice);

export default router;
