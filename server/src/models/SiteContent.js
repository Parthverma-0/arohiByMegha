import mongoose from 'mongoose';

// Singleton document (key: "homepage") holding admin-editable homepage
// content — hero media, promo banner, brand story text — so the storefront
// never needs a redeploy for content changes.
const siteContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'homepage' },
    hero: {
      type: { type: String, enum: ['image', 'video'], default: 'image' },
      url: String,
      publicId: String,
      poster: String,
      heading: { type: String, default: 'Jewellery for your every story' },
      subheading: { type: String, default: 'Discover the new collection' },
      ctaLabel: { type: String, default: 'Shop Now' },
      ctaLink: { type: String, default: '/shop' },
    },
    brandStory: {
      heading: { type: String, default: 'Our Story' },
      body: { type: String, default: '' },
      image: { url: String, publicId: String },
    },
    promoBanner: {
      isActive: { type: Boolean, default: false },
      text: String,
      link: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model('SiteContent', siteContentSchema);
