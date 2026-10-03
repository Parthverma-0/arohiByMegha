import { useState } from 'react';

// Ask Cloudinary for a resized, auto-format (WebP/AVIF) copy instead of the
// multi-megabyte original upload. Non-Cloudinary URLs pass through untouched.
function sizedUrl(src, width) {
  if (!width || !src.includes('res.cloudinary.com') || !src.includes('/upload/')) return src;
  return src.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${width}/`);
}

// Centralizes image-loading behavior so every product/hero image gets the
// same fast-loading treatment: eager+high-priority for above-the-fold hero
// images, native lazy-loading + async decode for everything else.
// `text-transparent` hides the alt text browsers (notably iPhone Safari) paint
// inside the box while an image is still downloading; the image is revealed once
// it has loaded. `width` is the largest size it is shown at, in CSS px x2.
export default function LazyImage({ src, alt = '', className = '', eager = false, width = 800, style, ...rest }) {
  const [loaded, setLoaded] = useState(false);

  if (!src) {
    return <div className={`bg-blush ${className}`} aria-label={alt} />;
  }

  return (
    <img
      src={sizedUrl(src, width)}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : 'auto'}
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(true)}
      // Inline opacity only while loading, so a caller's own opacity class
      // (e.g. the dimmed sold-out card) still applies afterwards.
      style={loaded ? style : { ...style, opacity: 0 }}
      className={`text-transparent ${className}`}
      {...rest}
    />
  );
}
