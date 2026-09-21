import { z } from 'zod';
import Category from '../models/Category.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiError } from '../utils/ApiError.js';

export const categoryInputSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional().default(''),
  image: z.object({ url: z.string(), publicId: z.string() }).optional(),
  sortOrder: z.coerce.number().optional().default(0),
  isActive: z.coerce.boolean().optional().default(true),
});

export const listCategories = catchAsync(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
  res.json({ success: true, categories });
});

export const adminListCategories = catchAsync(async (req, res) => {
  const categories = await Category.find({}).sort({ sortOrder: 1, name: 1 });
  res.json({ success: true, categories });
});

export const createCategory = catchAsync(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, category });
});

export const updateCategory = catchAsync(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, category });
});

export const deleteCategory = catchAsync(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true });
});
