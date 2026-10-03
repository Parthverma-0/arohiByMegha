import nodemailer from 'nodemailer';

// Gmail SMTP using an App Password (Google Account → Security → 2-Step
// Verification → App passwords). A normal Gmail password will not work.
export const isMailConfigured = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);

if (!isMailConfigured) {
  console.warn('[mail] GMAIL_USER / GMAIL_APP_PASSWORD not set — invoice emails will not be sent until they are added');
}

let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, text, html, attachments }) {
  if (!isMailConfigured) throw new Error('Email is not configured (GMAIL_USER / GMAIL_APP_PASSWORD missing)');
  return getTransporter().sendMail({
    from: `"${process.env.INVOICE_BUSINESS_NAME || 'Arohi by Megha'}" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    text,
    html,
    attachments,
  });
}
