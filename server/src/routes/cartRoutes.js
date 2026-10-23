import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { attachCustomerIfPresent, requireCustomerAuth } from '../middleware/auth.js';
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  itemInputSchema,
  quantityInputSchema,
} from '../controllers/cartController.js';

const router = Router();

router.get('/', attachCustomerIfPresent, getCart);
router.post('/items', requireCustomerAuth, validate(itemInputSchema), addItem);
router.patch('/items/:productId', requireCustomerAuth, validate(quantityInputSchema), updateItem);
router.delete('/items/:productId', requireCustomerAuth, removeItem);
router.delete('/', requireCustomerAuth, clearCart);

export default router;
