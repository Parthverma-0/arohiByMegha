import axios from 'axios';
import { api } from './client.js';

// Gets a signed, time-limited upload authorization from our server, then
// uploads the actual file bytes straight to Cloudinary — our server never
// touches the file, so large images/videos don't tie up API request handling.
export async function uploadToCloudinary(file, folder = 'products') {
  const { data: sig } = await api.get('/admin/uploads/signature', { params: { folder } });

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', sig.timestamp);
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);

  const resourceType = file.type.startsWith('video') ? 'video' : 'image';
  const { data } = await axios.post(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`,
    form
  );

  return { url: data.secure_url, publicId: data.public_id, resourceType };
}

export async function deleteFromCloudinary(publicId, resourceType = 'image') {
  await api.post('/admin/uploads/delete', { publicId, resourceType });
}
