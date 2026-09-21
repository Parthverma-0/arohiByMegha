import { useWishlist } from '../../api/user.js';
import ProductCard from '../../components/ui/ProductCard.jsx';

export default function Wishlist() {
  const { data: wishlist = [], isLoading } = useWishlist();

  if (isLoading) return <p>Loading...</p>;
  if (wishlist.length === 0) return <p className="text-charcoal/60">Your wishlist is empty.</p>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
      {wishlist.map((product) => <ProductCard key={product._id} product={product} />)}
    </div>
  );
}
