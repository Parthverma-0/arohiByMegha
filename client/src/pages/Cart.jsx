import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart, useUpdateCartItem, useRemoveCartItem } from '../api/cart.js';
import LazyImage from '../components/ui/LazyImage.jsx';
import { formatINR } from '../components/ui/PriceTag.jsx';
import QuantitySelector from '../components/ui/QuantitySelector.jsx';

export default function Cart() {
  const { data, isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const navigate = useNavigate();

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-20">Loading...</div>;

  const items = data?.items || [];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-14">
      <Helmet><title>Your Bag | Arohi by Megha</title></Helmet>
      <h1 className="section-heading mb-8">Your Bag</h1>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-charcoal/60 mb-6">Your bag is empty.</p>
          <Link to="/shop" className="btn-primary">Continue Shopping</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-[1fr_320px] gap-10">
          <ul className="divide-y divide-charcoal/10">
            {items.map(({ product, quantity, lineTotal }) => (
              <li key={product._id} className="py-5 flex gap-4">
                <Link to={`/product/${product.slug}`} className="w-20 h-20 shrink-0 rounded overflow-hidden bg-blush">
                  <LazyImage src={product.images?.[0]?.url} alt={product.name} className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <Link to={`/product/${product.slug}`} className="font-medium">{product.name}</Link>
                    <button onClick={() => removeItem.mutate(product._id)} className="text-sm text-charcoal/50 hover:text-charcoal">Remove</button>
                  </div>
                  <p className="text-sm text-charcoal/60 mt-1">{formatINR(product.price)} each</p>
                  <div className="mt-3 flex items-center justify-between">
                    <QuantitySelector
                      value={quantity}
                      max={Math.min(20, product.stock)}
                      onChange={(q) => updateItem.mutate({ productId: product._id, quantity: q })}
                    />
                    <p className="font-medium">{formatINR(lineTotal)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="bg-blush rounded-lg p-6 h-fit">
            <div className="flex justify-between text-sm mb-2">
              <span>Subtotal</span>
              <span>{formatINR(data.subtotal)}</span>
            </div>
            <p className="text-xs text-charcoal/60 mb-4">Shipping and taxes calculated at checkout.</p>
            <button className="btn-primary w-full" onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
          </div>
        </div>
      )}
    </div>
  );
}
