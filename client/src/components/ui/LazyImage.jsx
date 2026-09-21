// Centralizes image-loading behavior so every product/hero image gets the
// same fast-loading treatment: eager+high-priority for above-the-fold hero
// images, native lazy-loading + async decode for everything else.
export default function LazyImage({ src, alt = '', className = '', eager = false, ...rest }) {
  if (!src) {
    return <div className={`bg-blush ${className}`} aria-label={alt} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : 'auto'}
      className={className}
      {...rest}
    />
  );
}
