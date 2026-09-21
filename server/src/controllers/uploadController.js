import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiError } from '../utils/ApiError.js';

// Admin's browser asks the server for a signature, then uploads the file
// straight to Cloudinary — the file never passes through our server, and the
// signature (generated with our secret) proves the upload was authorized.
export const getUploadSignature = catchAsync(async (req, res) => {
  if (!isCloudinaryConfigured) throw new ApiError(503, 'Media upload is not configured yet — add Cloudinary keys to server/.env');

  const timestamp = Math.round(Date.now() / 1000);
  const folder = req.query.folder === 'homepage' ? 'arohi/homepage' : 'arohi/products';
  const paramsToSign = { timestamp, folder };
  const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);

  res.json({
    success: true,
    timestamp,
    folder,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  });
});

export const deleteUpload = catchAsync(async (req, res) => {
  if (!isCloudinaryConfigured) throw new ApiError(503, 'Media upload is not configured yet');
  const { publicId, resourceType } = req.body;
  if (!publicId) throw new ApiError(400, 'publicId is required');
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType || 'image' });
  res.json({ success: true });
});
