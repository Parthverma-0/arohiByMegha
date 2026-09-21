import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useHomepageContent, useUpdateHomepageContent } from '../api/misc.js';
import { apiErrorMessage } from '../api/client.js';
import MediaUploader from '../components/MediaUploader.jsx';

export default function HomepageContent() {
  const { data: content } = useHomepageContent();
  const updateContent = useUpdateHomepageContent();
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (content) setForm(content);
  }, [content]);

  if (!form) return <p>Loading...</p>;

  async function submit(e) {
    e.preventDefault();
    try {
      await updateContent.mutateAsync(form);
      toast.success('Homepage updated');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-8">
      <h1 className="font-display text-3xl">Homepage Content</h1>

      <section className="card space-y-4">
        <h2 className="font-medium">Hero Banner</h2>
        <select className="input-field" value={form.hero.type} onChange={(e) => setForm({ ...form, hero: { ...form.hero, type: e.target.value } })}>
          <option value="image">Image</option>
          <option value="video">Video</option>
        </select>
        {form.hero.type === 'image' ? (
          <MediaUploader
            value={{ url: form.hero.url, publicId: form.hero.publicId }}
            onChange={(media) => setForm({ ...form, hero: { ...form.hero, url: media?.url || '', publicId: media?.publicId || '' } })}
            folder="homepage"
            label="Hero Image"
          />
        ) : (
          <MediaUploader
            value={{ url: form.hero.url, publicId: form.hero.publicId }}
            onChange={(media) => setForm({ ...form, hero: { ...form.hero, url: media?.url || '', publicId: media?.publicId || '' } })}
            folder="homepage"
            accept="video/*"
            label="Hero Video"
          />
        )}
        <input className="input-field" placeholder="Heading" value={form.hero.heading} onChange={(e) => setForm({ ...form, hero: { ...form.hero, heading: e.target.value } })} />
        <input className="input-field" placeholder="Subheading" value={form.hero.subheading} onChange={(e) => setForm({ ...form, hero: { ...form.hero, subheading: e.target.value } })} />
        <div className="grid grid-cols-2 gap-4">
          <input className="input-field" placeholder="CTA label" value={form.hero.ctaLabel} onChange={(e) => setForm({ ...form, hero: { ...form.hero, ctaLabel: e.target.value } })} />
          <input className="input-field" placeholder="CTA link" value={form.hero.ctaLink} onChange={(e) => setForm({ ...form, hero: { ...form.hero, ctaLink: e.target.value } })} />
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="font-medium">Brand Story</h2>
        <MediaUploader
          value={form.brandStory.image}
          onChange={(image) => setForm({ ...form, brandStory: { ...form.brandStory, image } })}
          folder="homepage"
          label="Brand Story Image"
        />
        <input className="input-field" placeholder="Heading" value={form.brandStory.heading} onChange={(e) => setForm({ ...form, brandStory: { ...form.brandStory, heading: e.target.value } })} />
        <textarea className="input-field" rows={4} placeholder="Body" value={form.brandStory.body} onChange={(e) => setForm({ ...form, brandStory: { ...form.brandStory, body: e.target.value } })} />
      </section>

      <section className="card space-y-4">
        <h2 className="font-medium">Promo Banner</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.promoBanner?.isActive || false} onChange={(e) => setForm({ ...form, promoBanner: { ...form.promoBanner, isActive: e.target.checked } })} /> Show promo banner
        </label>
        <input className="input-field" placeholder="Text" value={form.promoBanner?.text || ''} onChange={(e) => setForm({ ...form, promoBanner: { ...form.promoBanner, text: e.target.value } })} />
        <input className="input-field" placeholder="Link" value={form.promoBanner?.link || ''} onChange={(e) => setForm({ ...form, promoBanner: { ...form.promoBanner, link: e.target.value } })} />
      </section>

      <button type="submit" className="btn-primary" disabled={updateContent.isPending}>Save Changes</button>
    </form>
  );
}
