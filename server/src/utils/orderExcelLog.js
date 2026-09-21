import ExcelJS from 'exceljs';
import Order from '../models/Order.js';

const COLUMNS = [
  { header: 'Order Number', key: 'orderNumber', width: 20 },
  { header: 'Date', key: 'date', width: 20 },
  { header: 'Customer Name', key: 'customerName', width: 24 },
  { header: 'Phone', key: 'phone', width: 16 },
  { header: 'Email', key: 'email', width: 26 },
  { header: 'Items', key: 'items', width: 50 },
  { header: 'Subtotal', key: 'subtotal', width: 12 },
  { header: 'Discount', key: 'discount', width: 12 },
  { header: 'Shipping', key: 'shippingFee', width: 12 },
  { header: 'Total', key: 'total', width: 12 },
  { header: 'Payment Method', key: 'paymentMethod', width: 16 },
  { header: 'Payment Status', key: 'paymentStatus', width: 16 },
  { header: 'Order Status', key: 'currentStatus', width: 16 },
  { header: 'Shipping Address', key: 'address', width: 50 },
];

function orderToRow(order) {
  return {
    orderNumber: order.orderNumber,
    date: order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : '',
    customerName: order.shippingAddress?.fullName || '',
    phone: order.shippingAddress?.phone || '',
    email: order.shippingAddress?.email || '',
    items: order.items.map((i) => `${i.name} x${i.quantity}`).join(', '),
    subtotal: order.subtotal,
    discount: order.discount,
    shippingFee: order.shippingFee,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    currentStatus: order.currentStatus,
    address: [order.shippingAddress?.line1, order.shippingAddress?.line2, order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.pincode]
      .filter(Boolean)
      .join(', '),
  };
}

// Builds the orders workbook fresh from MongoDB (the source of truth) on every
// call — no local file involved, so this behaves identically on a persistent
// host (Render/Railway) and a serverless one (Vercel), where the filesystem
// is read-only outside /tmp and not guaranteed to survive between invocations
// anyway. Mongo already has every order; this is just a live export of it.
export async function buildOrdersWorkbook() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Orders');
  sheet.columns = COLUMNS;
  sheet.getRow(1).font = { bold: true };

  const orders = await Order.find({}).sort({ createdAt: 1 });
  for (const order of orders) sheet.addRow(orderToRow(order));

  return workbook;
}
