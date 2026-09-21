import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireCustomerAuth, loadUser } from '../middleware/auth.js';
import {
  addAddress,
  updateAddress,
  deleteAddress,
  toggleWishlist,
  getWishlist,
  addressInputSchema,
} from '../controllers/userController.js';

const router = Router();

router.use(requireCustomerAuth, loadUser);

router.post('/addresses', validate(addressInputSchema), addAddress);
router.patch('/addresses/:addressId', validate(addressInputSchema.partial()), updateAddress);
router.delete('/addresses/:addressId', deleteAddress);

router.get('/wishlist', getWishlist);
router.post('/wishlist/:productId', toggleWishlist);

export default router;
