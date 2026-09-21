import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';
import Order from '../models/Order.js';

// Free hosting tiers (Render/Railway free plans) can lose local disk on redeploy/restart,
// so this file is a convenience export, not the source of truth — Mongo is. Use
// rebuildOrdersWorkbook() (wired to an admin endpoint) to regenerate it from the DB
// at any time if it goes missing.
const DATA_DIR = path.join(process.cwd(), 'data');
const WORKBOOK_PATH = path.join(DATA_DIR, 'orders.xlsx');

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

async function loadOrCreateWorkbook() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const workbook = new ExcelJS.Workbook();
  if (fs.existsSync(WORKBOOK_PATH)) {
    await workbook.xlsx.readFile(WORKBOOK_PATH);
  }
  let sheet = workbook.getWorksheet('Orders');
  if (!sheet) {
    sheet = workbook.addWorksheet('Orders');
    sheet.columns = COLUMNS;
    sheet.getRow(1).font = { bold: true };
  }
  return { workbook, sheet };
}

// Appends one row for a freshly placed order. Called from the checkout flow —
// wrapped in try/catch there so a disk/write problem never fails an order.
export async function logOrderToExcel(order) {
  const { workbook, sheet } = await loadOrCreateWorkbook();
  sheet.addRow(orderToRow(order));
  await workbook.xlsx.writeFile(WORKBOOK_PATH);
}

// Rebuilds the whole workbook from MongoDB (the source of truth) — used to recover
// the export after the file is missing (e.g. a fresh deploy) or to reconcile status changes.
export async function rebuildOrdersWorkbook() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Orders');
  sheet.columns = COLUMNS;
  sheet.getRow(1).font = { bold: true };

  const orders = await Order.find({}).sort({ createdAt: 1 });
  for (const order of orders) sheet.addRow(orderToRow(order));

  await workbook.xlsx.writeFile(WORKBOOK_PATH);
  return WORKBOOK_PATH;
}

export function ordersWorkbookExists() {
  return fs.existsSync(WORKBOOK_PATH);
}

export { WORKBOOK_PATH };
