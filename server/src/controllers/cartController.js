import crypto from 'crypto';
import { z } from 'zod';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiError } from '../utils/ApiError.js';

const GUEST_COOKIE = 'guest_cart_id';

export const itemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(20).optional().default(1),
});

export const quantityInputSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(20),
});

function getOwner(req, res) {
  if (req.userId) return { owner: String(req.userId), ownerType: 'user' };

  let guestId = req.cookies?.[GUEST_COOKIE];
  if (!guestId) {
    guestId = crypto.randomUUID();
    res.cookie(GUEST_COOKIE, guestId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 90 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }
  return { owner: guestId, ownerType: 'guest' };
}

async function getOrCreateCart(req, res) {
  const { owner, ownerType } = getOwner(req, res);
  let cart = await Cart.findOne({ owner, ownerType });
  if (!cart) cart = await Cart.create({ owner, ownerType, items: [] });
  return cart;
}

async function hydrate(cart) {
  const productIds = cart.items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: productIds } }).populate('category', 'name slug');
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const items = cart.items
    .map((item) => {
      const product = byId.get(String(item.product));
      if (!product) return null;
      return { product, quantity: item.quantity, lineTotal: product.price * item.quantity };
    })
    .filter(Boolean);
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  return { items, subtotal };
}

export const getCart = catchAsync(async (req, res) => {
  const cart = await getOrCreateCart(req, res);
  res.json({ success: true, ...(await hydrate(cart)) });
});

export const addItem = catchAsync(async (req, res) => {
  const { productId, quantity } = req.body;
  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new ApiError(404, 'Product not found');

  const cart = await getOrCreateCart(req, res);
  const existing = cart.items.find((i) => String(i.product) === productId);
  if (existing) existing.quantity = Math.min(20, existing.quantity + quantity);
  else cart.items.push({ product: productId, quantity });
  await cart.save();
  res.json({ success: true, ...(await hydrate(cart)) });
});

export const updateItem = catchAsync(async (req, res) => {
  const { quantity } = req.body;
  const cart = await getOrCreateCart(req, res);
  const item = cart.items.find((i) => String(i.product) === req.params.productId);
  if (!item) throw new ApiError(404, 'Item not in cart');
  item.quantity = quantity;
  await cart.save();
  res.json({ success: true, ...(await hydrate(cart)) });
});

export const removeItem = catchAsync(async (req, res) => {
  const cart = await getOrCreateCart(req, res);
  cart.items = cart.items.filter((i) => String(i.product) !== req.params.productId);
  await cart.save();
  res.json({ success: true, ...(await hydrate(cart)) });
});

export const clearCart = catchAsync(async (req, res) => {
  const cart = await getOrCreateCart(req, res);
  cart.items = [];
  await cart.save();
  res.json({ success: true, items: [], subtotal: 0 });
});
