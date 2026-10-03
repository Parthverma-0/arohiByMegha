import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { apiErrorMessage } from '../api/client.js';
import { useCart, useUpdateCartItem, useRemoveCartItem } from '../api/cart.js';
import LazyImage from '../components/ui/LazyImage.jsx';
import { formatINR } from '../components/ui/PriceTag.jsx';
import QuantitySelector from '../components/ui/QuantitySelector.jsx';

export default function Cart() {
  const { data, isPending: isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const navigate = useNavigate();
  const busy = updateItem.isPending || removeItem.isPending;

  function remove(productId) {
    removeItem.mutate(productId, { onError: (err) => toast.error(apiErrorMessage(err, 'Could not remove item')) });
  }
  function update(productId, quantity) {
    updateItem.mutate({ productId, quantity }, { onError: (err) => toast.error(apiErrorMessage(err, 'Could not update quantity')) });
  }

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
                  <LazyImage width={200} src={product.images?.[0]?.url} alt={product.name} className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-3">
                    <Link to={`/product/${product.slug}`} className="font-medium">{product.name}</Link>
                    <button
                      onClick={() => remove(product._id)}
                      disabled={busy}
                      className="shrink-0 text-sm underline underline-offset-4 text-charcoal/70 hover:text-charcoal py-1 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="text-sm text-charcoal/60 mt-1">{formatINR(product.price)} each</p>
                  <div className="mt-3 flex items-center justify-between">
                    <QuantitySelector
                      value={quantity}
                      max={Math.min(20, product.stock)}
                      disabled={busy}
                      onChange={(q) => update(product._id, q)}
                      onRemove={() => remove(product._id)}
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
