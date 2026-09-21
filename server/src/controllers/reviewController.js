import { z } from 'zod';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiError } from '../utils/ApiError.js';

export const reviewInputSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(150).optional().default(''),
  text: z.string().min(5).max(2000),
  images: z.array(z.object({ url: z.string(), publicId: z.string() })).optional().default([]),
});

async function recomputeRating(productId) {
  const stats = await Review.aggregate([
    { $match: { product: productId, status: 'approved' } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = stats[0] || {};
  await Product.updateOne({ _id: productId }, { ratingAvg: Math.round(avg * 10) / 10, ratingCount: count });
}

export const listProductReviews = catchAsync(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId, status: 'approved' })
    .sort({ createdAt: -1 })
    .populate('user', 'name');
  res.json({ success: true, reviews });
});

// Only customers who actually bought the product (delivered order) can review it —
// keeps reviews trustworthy without needing manual moderation of every submission.
export const createReview = catchAsync(async (req, res) => {
  const productId = req.params.productId;
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  const purchased = await Order.exists({
    user: req.userId,
    'items.product': productId,
    currentStatus: 'delivered',
  });
  if (!purchased) throw new ApiError(403, 'You can review a product only after it has been delivered to you');

  const existing = await Review.findOne({ product: productId, user: req.userId });
  if (existing) throw new ApiError(409, 'You already reviewed this product');

  const review = await Review.create({ ...req.body, product: productId, user: req.userId, status: 'pending' });
  res.status(201).json({ success: true, review });
});

// ----- Admin moderation -----

export const adminListReviews = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const reviews = await Review.find(filter).sort({ createdAt: -1 }).populate('user', 'name email').populate('product', 'name slug');
  res.json({ success: true, reviews });
});

export const adminModerateReview = catchAsync(async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) throw new ApiError(400, 'Invalid status');
  const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!review) throw new ApiError(404, 'Review not found');
  await recomputeRating(review.product);
  res.json({ success: true, review });
});
