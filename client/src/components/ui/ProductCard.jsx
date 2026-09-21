import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import LazyImage from './LazyImage.jsx';
import PriceTag from './PriceTag.jsx';
import StarRating from './StarRating.jsx';

export default function ProductCard({ product }) {
  const image = product.images?.[0];
  const outOfStock = product.stock <= 0;

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
