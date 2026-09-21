import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { useProduct, useProductReviews } from '../api/products.js';
import { useAddToCart } from '../api/cart.js';
import { useToggleWishlist } from '../api/user.js';
import { useAuthStore } from '../store/authStore.js';
import { apiErrorMessage } from '../api/client.js';
import LazyImage from '../components/ui/LazyImage.jsx';
import PriceTag from '../components/ui/PriceTag.jsx';
import StarRating from '../components/ui/StarRating.jsx';
import QuantitySelector from '../components/ui/QuantitySelector.jsx';
import ProductCard from '../components/ui/ProductCard.jsx';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useProduct(slug);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const addToCart = useAddToCart();
  const toggleWishlist = useToggleWishlist();
  const user = useAuthStore((s) => s.user);

  const { data: reviews = [] } = useProductReviews(data?.product?._id);

  if (isLoading) return <div className="max-w-8xl mx-auto px-4 py-20">Loading...</div>;
  if (!data?.product) return <div className="max-w-8xl mx-auto px-4 py-20">Product not found.</div>;

  const { product, related } = data;
  const images = product.images?.length ? product.images : [{ url: null, alt: product.name }];
  const outOfStock = product.stock <= 0;

  async function handleAddToCart() {
    try {
      await addToCart.mutateAsync({ productId: product._id, quantity });
      toast.success('Added to bag');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleBuyNow() {
    try {
      await addToCart.mutateAsync({ productId: product._id, quantity });
      navigate('/cart');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleWishlist() {
    if (!user) return toast.error('Please log in to use your wishlist');
    try {
      await toggleWishlist.mutateAsync(product._id);
      toast.success('Wishlist updated');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title: product.name, url });
    else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied');
    }
  }

  return (
    <div className="max-w-8xl mx-auto px-4 md:px-8 py-10 md:py-14">
      <Helmet><title>{product.name} | Arohi by Megha</title></Helmet>

      <div className="grid md:grid-cols-2 gap-8 md:gap-14">
        <div>
          <div className="aspect-square rounded-lg overflow-hidden bg-blush">
            <LazyImage src={images[activeImage]?.url} alt={images[activeImage]?.alt || product.name} eager className="w-full h-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded overflow-hidden border ${i === activeImage ? 'border-charcoal' : 'border-transparent'}`}
                >
                  <LazyImage src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {product.video?.url && (
            <video src={product.video.url} controls preload="metadata" className="mt-4 w-full rounded-lg" />
          )}
        </div>

        <div>
          <p className="text-sm text-charcoal/60">{product.category?.name}</p>
          <h1 className="font-display text-3xl md:text-4xl mt-1">{product.name}</h1>
          {product.ratingCount > 0 && <div className="mt-2"><StarRating value={product.ratingAvg} count={product.ratingCount} size="lg" /></div>}
          <div className="mt-4"><PriceTag price={product.price} mrp={product.mrp} size="lg" /></div>

          <p className="mt-6 text-charcoal/70 leading-relaxed">{product.description}</p>

          <dl className="mt-6 space-y-1 text-sm text-charcoal/70">
            {product.material && <div className="flex gap-2"><dt className="font-medium text-charcoal">Material:</dt><dd>{product.material}</dd></div>}
            {product.specs?.weight && <div className="flex gap-2"><dt className="font-medium text-charcoal">Weight:</dt><dd>{product.specs.weight}</dd></div>}
            {product.specs?.dimensions && <div className="flex gap-2"><dt className="font-medium text-charcoal">Dimensions:</dt><dd>{product.specs.dimensions}</dd></div>}
            {product.specs?.size && <div className="flex gap-2"><dt className="font-medium text-charcoal">Size:</dt><dd>{product.specs.size}</dd></div>}
          </dl>

          <p className={`mt-4 text-sm ${outOfStock ? 'text-red-600' : 'text-green-700'}`}>
            {outOfStock ? 'Out of stock' : `In stock (${product.stock} available)`}
          </p>

          <div className="mt-6 flex items-center gap-4">
            <QuantitySelector value={quantity} onChange={setQuantity} max={Math.min(20, product.stock)} />
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button className="btn-primary flex-1" disabled={outOfStock || addToCart.isPending} onClick={handleAddToCart}>
              {outOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button className="btn-outline flex-1 text-center" disabled={outOfStock || addToCart.isPending} onClick={handleBuyNow}>
              Buy Now
            </button>
          </div>

          <div className="mt-4 flex gap-5 text-sm">
            <button onClick={handleWishlist} className="underline underline-offset-4">Add to Wishlist</button>
            <button onClick={handleShare} className="underline underline-offset-4">Share</button>
          </div>

          {product.careInstructions && (
            <div className="mt-8 border-t border-charcoal/10 pt-6">
              <h3 className="font-medium mb-2">Care Instructions</h3>
              <p className="text-sm text-charcoal/70">{product.careInstructions}</p>
            </div>
          )}
        </div>
      </div>

      <section className="mt-16 max-w-2xl">
        <h2 className="section-heading text-2xl mb-6">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-charcoal/60 text-sm">No reviews yet.</p>
        ) : (
          <ul className="space-y-6">
            {reviews.map((r) => (
              <li key={r._id} className="border-b border-charcoal/10 pb-4">
                <StarRating value={r.rating} />
                <p className="font-medium mt-1">{r.title}</p>
                <p className="text-sm text-charcoal/70 mt-1">{r.text}</p>
                <p className="text-xs text-charcoal/50 mt-2">{r.user?.name}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {related?.length > 0 && (
        <section className="mt-16">
          <h2 className="section-heading text-2xl mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {related.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
