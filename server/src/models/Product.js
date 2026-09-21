import mongoose from 'mongoose';
import slugify from 'slugify';

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    alt: { type: String, default: '' },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    images: { type: [mediaSchema], default: [] },
    video: { type: mediaSchema, default: null },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0 },
    material: { type: String, default: '' },
    specs: {
      weight: String,
      dimensions: String,
      size: String,
      other: String,
    },
    careInstructions: { type: String, default: '' },
    stock: { type: Number, required: true, default: 0, min: 0 },
    isBestseller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

productSchema.pre('validate', function preValidate(next) {
  if (this.name && !this.slug) {
    this.slug = `${slugify(this.name, { lower: true, strict: true })}-${Math.random().toString(36).slice(2, 7)}`;
  }
  next();
});

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });

export default mongoose.model('Product', productSchema);
