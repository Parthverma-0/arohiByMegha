import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { audit } from '../middleware/audit.js';

import {
  adminListProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  productInputSchema,
} from '../controllers/productController.js';
import {
  adminListCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  categoryInputSchema,
} from '../controllers/categoryController.js';
import {
  adminListOrders,
  adminGetOrder,
  adminUpdateOrderStatus,
  updateStatusSchema,
  adminExportOrdersExcel,
  adminRebuildOrdersExcel,
} from '../controllers/orderController.js';
import {
  adminListCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  couponInputSchema,
} from '../controllers/couponController.js';
import { adminListReviews, adminModerateReview } from '../controllers/reviewController.js';
import { adminListCustomers } from '../controllers/userController.js';
import { getUploadSignature, deleteUpload } from '../controllers/uploadController.js';
import { updateHomepageContent } from '../controllers/siteContentController.js';
import { getStats, listAuditLogs } from '../controllers/adminDashboardController.js';
import { z } from 'zod';

const router = Router();

// Every route below requires a valid admin access token (password + TOTP already verified at login).
router.use(requireAdminAuth());

router.get('/dashboard/stats', getStats);
router.get('/audit-logs', listAuditLogs);

router.get('/products', adminListProducts);
router.post('/products', validate(productInputSchema), audit('product.create', 'Product'), createProduct);
router.put('/products/:id', validate(productInputSchema.partial()), audit('product.update', 'Product'), updateProduct);
router.delete('/products/:id', audit('product.delete', 'Product'), deleteProduct);

router.get('/categories', adminListCategories);
router.post('/categories', validate(categoryInputSchema), audit('category.create', 'Category'), createCategory);
router.put('/categories/:id', validate(categoryInputSchema.partial()), audit('category.update', 'Category'), updateCategory);
router.delete('/categories/:id', audit('category.delete', 'Category'), deleteCategory);

router.get('/orders', adminListOrders);
router.get('/orders/export/excel', adminExportOrdersExcel);
router.post('/orders/export/excel/rebuild', requireAdminAuth('owner', 'manager'), adminRebuildOrdersExcel);
router.get('/orders/:id', adminGetOrder);
router.put(
  '/orders/:id/status',
  requireAdminAuth('owner', 'manager'),
  validate(updateStatusSchema),
  audit('order.status_update', 'Order'),
  adminUpdateOrderStatus
);

router.get('/coupons', adminListCoupons);
router.post('/coupons', requireAdminAuth('owner', 'manager'), validate(couponInputSchema), audit('coupon.create', 'Coupon'), createCoupon);
router.put(
  '/coupons/:id',
  requireAdminAuth('owner', 'manager'),
  validate(couponInputSchema.partial()),
  audit('coupon.update', 'Coupon'),
  updateCoupon
);
router.delete('/coupons/:id', requireAdminAuth('owner', 'manager'), audit('coupon.delete', 'Coupon'), deleteCoupon);

router.get('/reviews', adminListReviews);
router.put(
  '/reviews/:id/moderate',
  validate(z.object({ status: z.enum(['approved', 'rejected']) })),
  audit('review.moderate', 'Review'),
  adminModerateReview
);

router.get('/customers', adminListCustomers);

router.get('/uploads/signature', getUploadSignature);
router.post('/uploads/delete', audit('upload.delete', 'Media'), deleteUpload);

router.put(
  '/homepage-content',
  requireAdminAuth('owner', 'manager'),
  audit('homepage_content.update', 'SiteContent'),
  updateHomepageContent
);

export default router;
