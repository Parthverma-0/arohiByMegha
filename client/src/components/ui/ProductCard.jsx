import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import LazyImage from './LazyImage.jsx';
import PriceTag from './PriceTag.jsx';
import StarRating from './StarRating.jsx';
import { useWishlist, useToggleWishlist } from '../../api/user.js';
import { useAuthStore } from '../../store/authStore.js';
import { apiErrorMessage } from '../../api/client.js';

export default function ProductCard({ product }) {
  const image = product.images?.[0];
  const outOfStock = product.stock <= 0;
  const user = useAuthStore((s) => s.user);
  const { data: wishlist = [] } = useWishlist({ enabled: Boolean(user) });
  const toggleWishlist = useToggleWishlist();
  const isWishlisted = Boolean(user) && wishlist.some((p) => p._id === product._id);

  async function handleWishlistClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return toast.error('Please log in to use your wishlist');
    try {
      await toggleWishlist.mutateAsync(product._id);
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Link to={`/product/${product.slug}`} className="group block">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-blush">
          <LazyImage
            src={image?.url}
            alt={image?.alt || product.name}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${outOfStock ? 'opacity-60 grayscale-[30%]' : ''}`}
          />
          {outOfStock && (
            <span className="absolute top-3 left-3 bg-charcoal text-ivory text-xs tracking-wide uppercase px-2.5 py-1 rounded">
              Sold Out
            </span>
          )}
          <button
            type="button"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            onClick={handleWishlistClick}
            disabled={toggleWishlist.isPending}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-ivory/90 flex items-center justify-center shadow-sm hover:bg-ivory transition-colors"
          >
            <HeartIcon filled={isWishlisted} />
          </button>
        </div>
        <div className="mt-3 space-y-1">
          <h3 className="text-sm md:text-base">{product.name}</h3>
          {product.ratingCount > 0 && <StarRating value={product.ratingAvg} count={product.ratingCount} />}
          <PriceTag price={product.price} mrp={product.mrp} />
        </div>
      </Link>
    </motion.div>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#A9812F' : 'none'} stroke={filled ? '#A9812F' : 'currentColor'} strokeWidth="1.5">
      <path d="M12 21s-7.5-4.87-10-9.5C.5 7.5 3 4 6.5 4c2 0 3.5 1 5.5 3.5C14 5 15.5 4 17.5 4 21 4 23.5 7.5 22 11.5 19.5 16.13 12 21 12 21z" strokeLinejoin="round" />
    </svg>
  );
}
