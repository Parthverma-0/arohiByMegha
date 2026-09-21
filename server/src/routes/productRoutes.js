import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { listProducts, getProductBySlug, searchSuggestions, listQuerySchema } from '../controllers/productController.js';

const router = Router();

router.get('/', validate(listQuerySchema, 'query'), listProducts);
router.get('/search-suggestions', searchSuggestions);
router.get('/:slug', getProductBySlug);

export default router;
