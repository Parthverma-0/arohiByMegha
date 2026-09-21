import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireCustomerAuth } from '../middleware/auth.js';
import { listProductReviews, createReview, reviewInputSchema } from '../controllers/reviewController.js';

const router = Router();

router.get('/product/:productId', listProductReviews);
router.post('/product/:productId', requireCustomerAuth, validate(reviewInputSchema), createReview);

export default router;
