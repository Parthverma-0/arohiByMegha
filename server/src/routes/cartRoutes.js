import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { attachCustomerIfPresent } from '../middleware/auth.js';
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

router.use(attachCustomerIfPresent);

router.get('/', getCart);
router.post('/items', validate(itemInputSchema), addItem);
router.patch('/items/:productId', validate(quantityInputSchema), updateItem);
router.delete('/items/:productId', removeItem);
router.delete('/', clearCart);

export default router;
