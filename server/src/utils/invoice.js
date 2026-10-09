import crypto from 'crypto';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import Order from '../models/Order.js';
import Counter from '../models/Counter.js';
import { sendMail, isMailConfigured } from './mailer.js';

// Seller details printed on every invoice. Only the name has a default; the
// rest are left off the PDF until they are set in the environment.
const seller = {
  name: process.env.INVOICE_BUSINESS_NAME || 'Arohi by Megha',
  address: process.env.INVOICE_BUSINESS_ADDRESS || '',
  phone: process.env.INVOICE_BUSINESS_PHONE || '',
  email: process.env.INVOICE_BUSINESS_EMAIL || process.env.GMAIL_USER || '',
  gstin: process.env.INVOICE_GSTIN || '',
};

// No 0/O/1/I so a number read out over the phone can't be misheard.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function randomPart(length = 5) {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

// Gives the order its invoice number if it doesn't have one yet:
// ABM-<random>-<running count>, e.g. ABM-K7Q2M-0001, ABM-X3PDA-0002, ...
// Safe to call repeatedly — an order keeps the first number it was given.
// The counter bump and the order update share one transaction, so if a
// concurrent request numbered the order first, the bump is rolled back and
// the running count never skips a value.
export async function ensureInvoiceNumber(order) {
  if (order.invoice?.number) return order;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const doc = await Counter.findOneAndUpdate({ _id: 'invoice' }, { $inc: { seq: 1 } }, { new: true, upsert: true, session });
      const number = `ABM-${randomPart()}-${String(doc.seq).padStart(4, '0')}`;
      const res = await Order.updateOne(
        { _id: order._id, 'invoice.number': { $exists: false } },
        { $set: { 'invoice.number': number, 'invoice.issuedAt': new Date() } },
        { session }
      );
      if (res.modifiedCount === 0) await session.abortTransaction(); // already numbered elsewhere
    });
  } finally {
    await session.endSession();
  }
  return Order.findById(order._id);
}

const money = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

export function invoiceFilename(order) {
  return `Invoice-${order.invoice?.number || order.orderNumber}.pdf`;
}

// Renders the invoice as a PDF and resolves with its bytes.
export function buildInvoicePdf(order) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = 50;
    const right = 545;
    const width = right - left;
    const ink = '#231F20';
    const muted = '#6B6466';
    const rule = (y) => doc.moveTo(left, y).lineTo(right, y).lineWidth(0.5).strokeColor('#D9D2CC').stroke();

    // Seller block
    doc.fillColor(ink).font('Times-Roman').fontSize(22).text(seller.name, left, 50);
    doc.font('Helvetica').fontSize(9).fillColor(muted);
    const sellerLines = [seller.address, seller.phone && `Phone: ${seller.phone}`, seller.email, seller.gstin && `GSTIN: ${seller.gstin}`].filter(Boolean);
    sellerLines.forEach((line) => doc.text(line, left, doc.y + 2, { width: 260 }));

    // Invoice meta (top right)
    const meta = [
      ['Invoice No.', order.invoice?.number || '—'],
      ['Invoice Date', date(order.invoice?.issuedAt || Date.now())],
      ['Order No.', order.orderNumber],
      ['Order Date', date(order.createdAt)],
    ];
    doc.font('Helvetica-Bold').fontSize(14).fillColor(ink).text('INVOICE', 345, 52, { width: 200, align: 'right' });
    let metaY = 74;
    meta.forEach(([label, value]) => {
      doc.font('Helvetica').fontSize(9).fillColor(muted).text(label, 345, metaY, { width: 85 });
      doc.font('Helvetica-Bold').fillColor(ink).text(value, 430, metaY, { width: 115, align: 'right' });
      metaY += 14;
    });

    let y = Math.max(doc.y, metaY) + 18;
    rule(y);
    y += 14;

    // Bill to / payment
    const a = order.shippingAddress || {};
    doc.font('Helvetica-Bold').fontSize(9).fillColor(muted).text('BILL TO / SHIP TO', left, y);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(ink).text(a.fullName || '', left, y + 14, { width: 280 });
    doc.font('Helvetica').fontSize(9.5).fillColor(ink);
    const addressLines = [
      a.line1,
      a.line2,
      [a.city, a.state].filter(Boolean).join(', ') + (a.pincode ? ` - ${a.pincode}` : ''),
      a.country && a.country !== 'India' ? a.country : null,
      a.phone && `Phone: ${a.phone}`,
      a.email && `Email: ${a.email}`,
    ].filter(Boolean);
    addressLines.forEach((line) => doc.text(line, left, doc.y + 2, { width: 280 }));
    const billBottom = doc.y;

    const paidLabel =
      order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus === 'refunded' ? 'Refunded' : order.paymentMethod === 'cod' ? 'Payment due on delivery' : 'Payment pending';
    doc.font('Helvetica-Bold').fontSize(9).fillColor(muted).text('PAYMENT', 345, y, { width: 200, align: 'right' });
    doc.font('Helvetica').fontSize(9.5).fillColor(ink);
    const modeNames = { upi: 'UPI', card: 'Card', netbanking: 'Net Banking', wallet: 'Wallet', emi: 'EMI', paylater: 'Pay Later' };
    const mode = order.razorpay?.method;
    const method =
      order.paymentMethod === 'razorpay' ? `Online${mode ? ` (${modeNames[mode] || mode})` : ''}` : order.paymentMethod === 'manual_upi' ? 'UPI (QR code)' : 'Cash on Delivery';
    doc.text(method, 345, y + 14, { width: 200, align: 'right' });
    doc.text(paidLabel, 345, doc.y + 2, { width: 200, align: 'right' });
    if (order.manualPayment?.reference) doc.fillColor(muted).text(`UPI Ref: ${order.manualPayment.reference}`, 345, doc.y + 2, { width: 200, align: 'right' });
    if (order.razorpay?.paymentId) doc.fillColor(muted).text(`Payment ID: ${order.razorpay.paymentId}`, 345, doc.y + 2, { width: 200, align: 'right' });

    y = Math.max(billBottom, doc.y) + 22;

    // Items table
    const cols = { no: left, desc: left + 28, qty: 340, rate: 385, amount: 465 };
    doc.rect(left, y, width, 22).fill('#F3ECE5');
    doc.fillColor(ink).font('Helvetica-Bold').fontSize(9);
    doc.text('#', cols.no + 6, y + 7);
    doc.text('Description', cols.desc, y + 7);
    doc.text('Qty', cols.qty, y + 7, { width: 35, align: 'right' });
    doc.text('Unit Price', cols.rate, y + 7, { width: 75, align: 'right' });
    doc.text('Amount', cols.amount, y + 7, { width: 80, align: 'right' });
    y += 30;

    doc.font('Helvetica').fontSize(9.5);
    order.items.forEach((item, i) => {
      const descHeight = doc.heightOfString(item.name || '', { width: cols.qty - cols.desc - 10 });
      if (y + descHeight > 720) {
        doc.addPage();
        y = 50;
      }
      doc.fillColor(ink);
      doc.text(String(i + 1), cols.no + 6, y);
      doc.text(item.name || '', cols.desc, y, { width: cols.qty - cols.desc - 10 });
      doc.text(String(item.quantity), cols.qty, y, { width: 35, align: 'right' });
      doc.text(money(item.price), cols.rate, y, { width: 75, align: 'right' });
      doc.text(money(item.price * item.quantity), cols.amount, y, { width: 80, align: 'right' });
      y += Math.max(descHeight, 12) + 10;
      rule(y - 5);
    });

    // Totals
    y += 6;
    const totalRow = (label, value, bold = false) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 11 : 9.5).fillColor(ink);
      doc.text(label, 330, y, { width: 130, align: 'right' });
      doc.text(value, cols.amount, y, { width: 80, align: 'right' });
      y += bold ? 20 : 16;
    };
    totalRow('Subtotal', money(order.subtotal));
    if (order.discount > 0) {
      totalRow(order.coupon?.code ? `Coupon (${order.coupon.code})` : 'Discount', `- ${money(order.discount)}`);
    }
    totalRow('Shipping', order.shippingFee > 0 ? money(order.shippingFee) : 'Free');
    doc.moveTo(330, y - 2).lineTo(right, y - 2).lineWidth(0.8).strokeColor(ink).stroke();
    y += 6;
    totalRow('Total', money(order.total), true);

    // Footer
    doc.font('Helvetica').fontSize(8.5).fillColor(muted);
    doc.text('Prices are inclusive of all applicable taxes.', left, Math.max(y + 30, 700), { width });
    doc.text('This is a computer-generated invoice and does not require a signature.', left, doc.y + 2, { width });
    doc.font('Times-Italic').fontSize(11).fillColor(ink).text(`Thank you for shopping with ${seller.name}.`, left, doc.y + 12, { width });

    doc.end();
  });
}

// Numbers the order (if needed), renders the PDF and emails it to the
// customer. Records the outcome on the order and never throws, so a mail
// problem can't fail a checkout — check the returned `{ ok, error }` instead.
export async function emailInvoice(orderOrId) {
  let order = typeof orderOrId === 'object' ? orderOrId : await Order.findById(orderOrId);
  if (!order) return { ok: false, error: 'Order not found' };
  order = await ensureInvoiceNumber(order);

  const to = order.shippingAddress?.email;
  try {
    if (!to) throw new Error('Order has no customer email address');
    if (!isMailConfigured) throw new Error('Email is not configured (GMAIL_USER / GMAIL_APP_PASSWORD missing)');
    const pdf = await buildInvoicePdf(order);
    const name = order.shippingAddress?.fullName?.split(' ')[0] || 'there';
    await sendMail({
      to,
      subject: `Your ${seller.name} invoice ${order.invoice.number}`,
      text:
        `Hi ${name},\n\nThank you for your order ${order.orderNumber}. Your invoice ${order.invoice.number} ` +
        `for ${money(order.total)} is attached.\n\nWarm regards,\n${seller.name}`,
      html:
        `<p>Hi ${escapeHtml(name)},</p><p>Thank you for your order <strong>${escapeHtml(order.orderNumber)}</strong>. ` +
        `Your invoice <strong>${escapeHtml(order.invoice.number)}</strong> for <strong>${money(order.total)}</strong> is attached.</p>` +
        `<p>Warm regards,<br>${escapeHtml(seller.name)}</p>`,
      attachments: [{ filename: invoiceFilename(order), content: pdf, contentType: 'application/pdf' }],
    });
    await Order.updateOne({ _id: order._id }, { $set: { 'invoice.emailedAt': new Date(), 'invoice.emailedTo': to }, $unset: { 'invoice.emailError': 1 } });
    return { ok: true, to };
  } catch (err) {
    console.error(`[invoice] email for order ${order.orderNumber} failed:`, err.message);
    await Order.updateOne({ _id: order._id }, { $set: { 'invoice.emailError': err.message } }).catch(() => {});
    return { ok: false, error: err.message };
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
