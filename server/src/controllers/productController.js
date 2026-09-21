import { z } from 'zod';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiError } from '../utils/ApiError.js';

export const listQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  material: z.string().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'popularity']).optional().default('newest'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(60).optional().default(24),
  bestsellers: z.coerce.boolean().optional(),
  newArrivals: z.coerce.boolean().optional(),
});

const sortMap = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  popularity: { ratingCount: -1, ratingAvg: -1 },
};

// GET /api/products — public storefront listing with filter/sort/search/pagination.
export const listProducts = catchAsync(async (req, res) => {
  const { category, search, minPrice, maxPrice, material, sort, page, limit, bestsellers, newArrivals } = req.query;
  const filter = { isActive: true };

  if (category) {
    const cat = await Category.findOne({ slug: category });
    if (!cat) return res.json({ success: true, products: [], total: 0, page, pages: 0 });
    filter.category = cat._id;
  }
  if (material) filter.material = new RegExp(material, 'i');
  if (bestsellers) filter.isBestseller = true;
  if (newArrivals) filter.isNewArrival = true;
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }
  if (search) filter.$text = { $search: search };

  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortMap[sort]).skip(skip).limit(limit).populate('category', 'name slug'),
    Product.countDocuments(filter),
  ]);

  res.json({ success: true, products, total, page, pages: Math.ceil(total / limit) });
});

// GET /api/products/search-suggestions?q= — lightweight autocomplete.
export const searchSuggestions = catchAsync(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ success: true, suggestions: [] });
  const products = await Product.find({ isActive: true, name: new RegExp(q, 'i') })
    .select('name slug images price')
    .limit(8);
  res.json({ success: true, suggestions: products });
});

export const getProductBySlug = catchAsync(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate('category', 'name slug');
  if (!product) throw new ApiError(404, 'Product not found');

  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isActive: true,
  }).limit(4);

  res.json({ success: true, product, related });
});

// ----- Admin -----

export const productInputSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().optional().default(''),
  category: z.string().refine((v) => mongoose.isValidObjectId(v), 'Invalid category id'),
  price: z.coerce.number().min(0),
  mrp: z.coerce.number().min(0).optional(),
  material: z.string().optional().default(''),
  specs: z
    .object({ weight: z.string().optional(), dimensions: z.string().optional(), size: z.string().optional(), other: z.string().optional() })
    .optional(),
  careInstructions: z.string().optional().default(''),
  stock: z.coerce.number().int().min(0),
  isBestseller: z.coerce.boolean().optional().default(false),
  isNewArrival: z.coerce.boolean().optional().default(true),
  isActive: z.coerce.boolean().optional().default(true),
  tags: z.array(z.string()).optional().default([]),
  images: z.array(z.object({ url: z.string(), publicId: z.string(), alt: z.string().optional() })).optional().default([]),
  video: z.object({ url: z.string(), publicId: z.string(), alt: z.string().optional() }).nullable().optional(),
});

export const adminListProducts = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);
  const [products, total] = await Promise.all([
    Product.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category', 'name slug'),
    Product.countDocuments({}),
  ]);
  res.json({ success: true, products, total, page, pages: Math.ceil(total / limit) });
});

export const createProduct = catchAsync(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, product });
});

export const updateProduct = catchAsync(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, product });
});

export const deleteProduct = catchAsync(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true });
});
