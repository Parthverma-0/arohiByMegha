import SiteContent from '../models/SiteContent.js';
import { catchAsync } from '../utils/catchAsync.js';

async function getOrCreateHomepage() {
  let content = await SiteContent.findOne({ key: 'homepage' });
  if (!content) content = await SiteContent.create({ key: 'homepage' });
  return content;
}

export const getHomepageContent = catchAsync(async (req, res) => {
  const content = await getOrCreateHomepage();
  res.json({ success: true, content });
});

export const updateHomepageContent = catchAsync(async (req, res) => {
  const content = await getOrCreateHomepage();
  Object.assign(content, req.body);
  await content.save();
  res.json({ success: true, content });
});
