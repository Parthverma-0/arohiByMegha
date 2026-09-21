import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSearchSuggestions } from '../../api/products.js';
import LazyImage from './LazyImage.jsx';
import { formatINR } from './PriceTag.jsx';

export default function SearchBar({ onClose }) {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const { data: suggestions = [] } = useSearchSuggestions(q);

  function submit(e) {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/shop?search=${encodeURIComponent(q.trim())}`);
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute inset-x-0 top-full bg-white border-b border-charcoal/10 shadow-lg z-50"
    >
      <div className="max-w-8xl mx-auto px-4 md:px-8 py-4">
        <form onSubmit={submit} className="flex items-center gap-3">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search for earrings, necklaces, rings..."
            className="input-field"
          />
          <button type="button" className="btn-outline !px-4 !py-2" onClick={onClose}>
            Close
          </button>
        </form>

        {suggestions.length > 0 && (
          <ul className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {suggestions.map((p) => (
              <li key={p._id}>
                <button
                  className="flex items-center gap-3 text-left w-full"
                  onClick={() => {
                    navigate(`/product/${p.slug}`);
                    onClose();
                  }}
                >
                  <div className="w-12 h-12 bg-blush rounded overflow-hidden shrink-0">
                    <LazyImage src={p.images?.[0]?.url} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm">{p.name}</p>
                    <p className="text-xs text-charcoal/60">{formatINR(p.price)}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
