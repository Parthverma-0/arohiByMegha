import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../config/db.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import AdminUser from '../models/AdminUser.js';
import SiteContent from '../models/SiteContent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productsImageDir = path.join(__dirname, '../../../client/public/products');

// Seed images are shipped as static files in client/public/products (self-hosted,
// so they load instantly with no external dependency and pass the API's CSP
// without needing image-host allowlisting). Resolves whichever extension was
// actually downloaded for a given slug.
function imagePathFor(slug) {
  if (!fs.existsSync(productsImageDir)) return null;
  const match = fs.readdirSync(productsImageDir).find((f) => f.startsWith(slug + '.'));
  return match ? `/products/${match}` : null;
}

const categoriesData = [
  { name: 'Earrings', slug: 'earrings', sortOrder: 1 },
  { name: 'Necklaces', slug: 'necklaces', sortOrder: 2 },
  { name: 'Rings', slug: 'rings', sortOrder: 3 },
  { name: 'Bracelets', slug: 'bracelets', sortOrder: 4 },
  { name: 'Sets', slug: 'sets', sortOrder: 5 },
];

const productsData = [
  { name: 'Aria Gold Drop Earrings', slug: 'aria-gold-drop-earrings', category: 'earrings', price: 2499, mrp: 2999, material: '18k Gold Plated Brass', isBestseller: true },
  { name: 'Vera Emerald Stud Earrings', slug: 'vera-emerald-stud-earrings', category: 'earrings', price: 1899, mrp: 2299, material: 'Gold Plated with Emerald CZ' },
  { name: 'Priya Gold Emerald Studs', slug: 'priya-gold-emerald-studs', category: 'earrings', price: 1699, mrp: 1999, material: 'Gold Plated Brass' },

  { name: 'Meera Layered Necklace', slug: 'meera-layered-necklace', category: 'necklaces', price: 3499, mrp: 4199, material: '18k Gold Plated Brass', isBestseller: true },
  { name: 'Ira Pearl Strand Necklace', slug: 'ira-pearl-strand-necklace', category: 'necklaces', price: 2999, mrp: 3599, material: 'Freshwater Pearl & Gold Plated Chain' },
  { name: 'Diya Sapphire Clasp Necklace', slug: 'diya-sapphire-clasp-necklace', category: 'necklaces', price: 4299, mrp: 4999, material: 'Gold Plated with Sapphire CZ' },

  { name: 'Ivy Stackable Ring', slug: 'ivy-stackable-ring', category: 'rings', price: 1399, mrp: 1699, material: 'Gold Plated Brass' },
  { name: 'Sana Amethyst Solitaire Ring', slug: 'sana-amethyst-solitaire-ring', category: 'rings', price: 1999, mrp: 2399, material: 'Gold Plated with Amethyst CZ', isBestseller: true },
  { name: 'Mira Garnet Band Ring', slug: 'mira-garnet-band-ring', category: 'rings', price: 1599, mrp: 1899, material: 'Gold Plated with Garnet CZ' },

  { name: 'Noor Chain Bracelet', slug: 'noor-chain-bracelet', category: 'bracelets', price: 1799, mrp: 2199, material: '18k Gold Plated Brass' },
  { name: 'Leela Twisted Bangle', slug: 'leela-twisted-bangle', category: 'bracelets', price: 2199, mrp: 2599, material: 'Gold Plated Brass' },
  { name: 'Riya Filigree Cuff Bracelet', slug: 'riya-filigree-cuff-bracelet', category: 'bracelets', price: 2499, mrp: 2999, material: 'Gold Plated Brass', isBestseller: true },

  { name: 'Aanya Bridal Set', slug: 'aanya-bridal-set', category: 'sets', price: 6299, mrp: 7499, material: '18k Gold Plated Brass with CZ', isBestseller: true },
  { name: 'Tara Garnet Jewellery Set', slug: 'tara-garnet-jewellery-set', category: 'sets', price: 4999, mrp: 5999, material: 'Gold Plated with Garnet CZ' },
  { name: 'Naina Beaded Jewellery Set', slug: 'naina-beaded-jewellery-set', category: 'sets', price: 3999, mrp: 4799, material: 'Gold Plated Brass & Glass Beads' },
];

async function seed() {
  await connectDB();

  console.log('[seed] Upserting categories...');
  const categoryBySlug = {};
  for (const c of categoriesData) {
    const doc = await Category.findOneAndUpdate({ slug: c.slug }, c, { upsert: true, new: true, setDefaultsOnInsert: true });
    categoryBySlug[c.slug] = doc;
  }

  console.log('[seed] Upserting products...');
  for (const p of productsData) {
    const category = categoryBySlug[p.category];
    const imageUrl = imagePathFor(p.slug);
    const images = imageUrl ? [{ url: imageUrl, publicId: `local:${p.slug}`, alt: p.name }] : [];
    if (!imageUrl) {
      console.warn(`[seed] No local image found for "${p.slug}" — add client/public/products/${p.slug}.jpg to fix this later`);
    }

    await Product.findOneAndUpdate(
      { slug: p.slug },
      {
        name: p.name,
        slug: p.slug,
        description: `${p.name} — a piece designed for your everyday story. Crafted in ${p.material}.`,
        category: category._id,
        price: p.price,
        mrp: p.mrp,
        material: p.material,
        stock: 25,
        isBestseller: Boolean(p.isBestseller),
        isNewArrival: true,
        isActive: true,
        images,
        tags: [p.category],
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const existing = await AdminUser.findOne({ email: adminEmail });
    if (!existing) {
      console.log(`[seed] Creating first admin user: ${adminEmail}`);
      const admin = new AdminUser({ name: 'Arohi Admin', email: adminEmail, role: 'owner' });
      await admin.setPassword(adminPassword);
      await admin.save();
    } else {
      console.log(`[seed] Admin user ${adminEmail} already exists, skipping`);
    }
  } else {
    console.warn('[seed] SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set in .env — no admin account created');
  }

  const heroImage = imagePathFor('hero-banner');
  const brandImage = imagePathFor('brand-story');
  await SiteContent.findOneAndUpdate(
    { key: 'homepage' },
    {
      key: 'homepage',
      hero: {
        type: 'image',
        url: heroImage || '',
        heading: 'Jewellery for your every story',
        subheading: 'Discover the new collection',
        ctaLabel: 'Shop Now',
        ctaLink: '/shop',
      },
      brandStory: {
        heading: 'Our Story',
        body: 'Arohi by Megha creates fashion-forward jewellery for the modern woman — quiet luxury, made for everyday wear and every celebration.',
        image: { url: brandImage || '' },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log('[seed] Done.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
