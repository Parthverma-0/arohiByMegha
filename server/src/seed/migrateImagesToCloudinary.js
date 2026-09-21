// One-off/rerunnable migration: uploads every locally-hosted seed image
// (client/public/products/*) to Cloudinary, then updates the matching
// Product/Category/SiteContent documents to point at the Cloudinary URL
// instead of the local static path. Safe to rerun — re-uploads with the
// same public_id just overwrite the existing Cloudinary asset.
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../config/db.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import SiteContent from '../models/SiteContent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productsImageDir = path.join(__dirname, '../../../client/public/products');

async function uploadLocalFile(localRelativeUrl, publicId) {
  const filePath = path.join(productsImageDir, path.basename(localRelativeUrl));
  const result = await cloudinary.uploader.upload(filePath, {
    public_id: publicId,
    folder: 'arohi',
    overwrite: true,
  });
  return { url: result.secure_url, publicId: result.public_id };
}

async function run() {
  if (!isCloudinaryConfigured) {
    console.error('[migrate] Cloudinary is not configured — add CLOUDINARY_* to server/.env first.');
    process.exit(1);
  }
  await connectDB();

  console.log('[migrate] Products...');
  const products = await Product.find({ 'images.0': { $exists: true } });
  for (const product of products) {
    const localImages = product.images.filter((img) => img.url?.startsWith('/products/'));
    if (localImages.length === 0) continue;
    const newImages = [];
    for (const [i, img] of product.images.entries()) {
      if (!img.url?.startsWith('/products/')) {
        newImages.push(img);
        continue;
      }
      const uploaded = await uploadLocalFile(img.url, `product-${product.slug}-${i}`);
      newImages.push({ url: uploaded.url, publicId: uploaded.publicId, alt: img.alt });
      console.log(`  ${product.name} -> ${uploaded.url}`);
    }
    product.images = newImages;
    await product.save();
  }

  console.log('[migrate] Categories...');
  const categories = await Category.find({ 'image.url': { $regex: '^/products/' } });
  for (const cat of categories) {
    const uploaded = await uploadLocalFile(cat.image.url, `category-${cat.slug}`);
    cat.image = { url: uploaded.url, publicId: uploaded.publicId };
    await cat.save();
    console.log(`  ${cat.name} -> ${uploaded.url}`);
  }

  console.log('[migrate] Homepage content (hero + brand story)...');
  const content = await SiteContent.findOne({ key: 'homepage' });
  if (content) {
    if (content.hero?.url?.startsWith('/products/')) {
      const uploaded = await uploadLocalFile(content.hero.url, 'hero-banner');
      content.hero.url = uploaded.url;
    }
    if (content.brandStory?.image?.url?.startsWith('/products/')) {
      const uploaded = await uploadLocalFile(content.brandStory.image.url, 'brand-story');
      content.brandStory.image.url = uploaded.url;
    }
    await content.save();
    console.log('  Done.');
  }

  console.log('[migrate] All done.');
  process.exit(0);
}

run().catch((err) => {
  console.error('[migrate] Failed:', err);
  process.exit(1);
});
