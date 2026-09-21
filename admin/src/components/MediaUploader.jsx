import { useState } from 'react';
import toast from 'react-hot-toast';
import { uploadToCloudinary, deleteFromCloudinary } from '../api/upload.js';
import { apiErrorMessage } from '../api/client.js';

// Shared image/video uploader used by the Product, Category and Homepage
// Content forms — uploads straight to Cloudinary via a signed request and
// hands the parent the resulting {url, publicId} to store on the record.
export default function MediaUploader({ value, onChange, accept = 'image/*', folder = 'products', label = 'Image' }) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadToCloudinary(file, folder);
      onChange(result);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Upload failed — check Cloudinary keys are set in server/.env'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleRemove() {
    if (value?.publicId) {
      try {
        await deleteFromCloudinary(value.publicId, accept.startsWith('video') ? 'video' : 'image');
      } catch {
        // best-effort cleanup — still clear it from the form either way
      }
    }
    onChange(null);
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      {value?.url ? (
        <div className="relative w-40">
          {accept.startsWith('video') ? (
            <video src={value.url} className="w-40 h-40 object-cover rounded-md" muted />
          ) : (
            <img src={value.url} alt="" className="w-40 h-40 object-cover rounded-md" />
          )}
          <button type="button" onClick={handleRemove} className="absolute -top-2 -right-2 bg-charcoal text-ivory rounded-full w-6 h-6 text-xs">
            ✕
          </button>
        </div>
      ) : (
        <label className="flex items-center justify-center w-40 h-40 border-2 border-dashed border-charcoal/20 rounded-md cursor-pointer text-sm text-charcoal/50 hover:border-gold">
          {uploading ? 'Uploading...' : `+ Upload ${label}`}
          <input type="file" accept={accept} className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      )}
    </div>
  );
}
