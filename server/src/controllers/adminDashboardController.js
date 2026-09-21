import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { catchAsync } from '../utils/catchAsync.js';

export const getStats = catchAsync(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalOrders, recentOrders, totalCustomers, totalProducts, lowStock, revenueAgg] = await Promise.all([
    Order.countDocuments({}),
    Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    User.countDocuments({}),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, stock: { $lte: 5 } }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
  ]);

  const revenue = revenueAgg[0]?.revenue || 0;
  const paidOrderCount = revenueAgg[0]?.count || 0;
  const avgOrderValue = paidOrderCount ? Math.round(revenue / paidOrderCount) : 0;

  const topProducts = await Order.aggregate([
    { $unwind: '$items' },
    { $group: { _id: '$items.product', name: { $first: '$items.name' }, unitsSold: { $sum: '$items.quantity' } } },
    { $sort: { unitsSold: -1 } },
    { $limit: 5 },
  ]);

  res.json({
    success: true,
    stats: { totalOrders, recentOrders, totalCustomers, totalProducts, lowStock, revenue, avgOrderValue, topProducts },
  });
});

export const listAuditLogs = catchAsync(async (req, res) => {
  const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, logs });
});
