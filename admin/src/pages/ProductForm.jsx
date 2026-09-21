import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAdminCategories, useAdminProducts, useCreateProduct, useUpdateProduct } from '../api/products.js';
import { apiErrorMessage } from '../api/client.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../api/upload.js';

const emptyForm = {
  name: '', description: '', category: '', price: '', mrp: '', material: '',
  careInstructions: '', stock: 0, isBestseller: false, isNewArrival: true, isActive: true,
  images: [], video: null,
};

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { data: categories = [] } = useAdminCategories();
  const { data: existing } = useAdminProducts({ limit: 100 });
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  useEffect(() => {
    if (isEdit && existing?.products) {
      const product = existing.products.find((p) => p._id === id);
      if (product) {
        setForm({
          name: product.name,
          description: product.description,
          category: product.category?._id || '',
          price: product.price,
          mrp: product.mrp || '',
          material: product.material,
          careInstructions: product.careInstructions,
          stock: product.stock,
          isBestseller: product.isBestseller,
          isNewArrival: product.isNewArrival,
          isActive: product.isActive,
          images: product.images || [],
          video: product.video || null,
        });
      }
    }
  }, [isEdit, existing, id]);

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map((f) => uploadToCloudinary(f, 'products')));
      setForm((prev) => ({ ...prev, images: [...prev.images, ...uploaded.map((u) => ({ url: u.url, publicId: u.publicId, alt: prev.name }))] }));
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Image upload failed — check Cloudinary keys are set'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleVideoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadToCloudinary(file, 'products');
      setForm((prev) => ({ ...prev, video: { url: uploaded.url, publicId: uploaded.publicId } }));
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Video upload failed — check Cloudinary keys are set'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function removeImage(publicId) {
    setForm((prev) => ({ ...prev, images: prev.images.filter((img) => img.publicId !== publicId) }));
    deleteFromCloudinary(publicId).catch(() => {});
  }

  async function submit(e) {
    e.preventDefault();
    const payload = { ...form, price: Number(form.price), mrp: form.mrp ? Number(form.mrp) : undefined, stock: Number(form.stock) };
    try {
      if (isEdit) await updateProduct.mutateAsync({ id, payload });
      else await createProduct.mutateAsync(payload);
      toast.success('Saved');
      navigate('/products');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl mb-6">{isEdit ? 'Edit Product' : 'New Product'}</h1>
      <form onSubmit={submit} className="space-y-4">
        <input required placeholder="Product Name" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <textarea placeholder="Description" className="input-field" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

        <select required className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option value="">Select Category</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>

        <div className="grid grid-cols-2 gap-4">
          <input required type="number" placeholder="Price (₹)" className="input-field" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input type="number" placeholder="MRP (₹, optional)" className="input-field" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} />
        </div>

        <input placeholder="Material" className="input-field" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} />
        <textarea placeholder="Care Instructions" className="input-field" value={form.careInstructions} onChange={(e) => setForm({ ...form, careInstructions: e.target.value })} />
        <input required type="number" placeholder="Stock quantity" className="input-field" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />

        <div>
          <label className="block text-sm font-medium mb-2">Images</label>
          <div className="flex flex-wrap gap-3 mb-2">
            {form.images.map((img) => (
              <div key={img.publicId} className="relative w-20 h-20">
                <img src={img.url} alt="" className="w-20 h-20 object-cover rounded" />
                <button type="button" onClick={() => removeImage(img.publicId)} className="absolute -top-2 -right-2 bg-charcoal text-ivory rounded-full w-5 h-5 text-xs">✕</button>
              </div>
            ))}
          </div>
          <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Product Video (optional)</label>
          {form.video?.url && <video src={form.video.url} className="w-40 h-40 object-cover rounded mb-2" controls />}
          <input type="file" accept="video/*" onChange={handleVideoUpload} disabled={uploading} />
        </div>

        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.isBestseller} onChange={(e) => setForm({ ...form, isBestseller: e.target.checked })} /> Bestseller</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.isNewArrival} onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })} /> New Arrival</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary" disabled={uploading || createProduct.isPending || updateProduct.isPending}>
            {uploading ? 'Uploading media...' : 'Save Product'}
          </button>
          <button type="button" className="btn-outline" onClick={() => navigate('/products')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
