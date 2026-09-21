import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCategories, useProducts } from '../api/products.js';
import ProductCard from '../components/ui/ProductCard.jsx';

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popularity', label: 'Popularity' },
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data: categories = [] } = useCategories();

  const queryParams = useMemo(
    () => ({
      category: params.get('category') || undefined,
      search: params.get('search') || undefined,
      minPrice: params.get('minPrice') || undefined,
      maxPrice: params.get('maxPrice') || undefined,
      sort: params.get('sort') || 'newest',
      bestsellers: params.get('bestsellers') || undefined,
      newArrivals: params.get('newArrivals') || undefined,
      page: params.get('page') || 1,
      limit: 24,
    }),
    [params]
  );

  const { data, isLoading } = useProducts(queryParams);

  function updateParam(key, value) {
    const next = new URLSearchParams(params);
    if (value === undefined || value === '') next.delete(key);
    else next.set(key, value);
    next.delete('page');
    setParams(next);
  }

  const activeCategory = categories.find((c) => c.slug === queryParams.category);
  const title = queryParams.search
    ? `Results for "${queryParams.search}"`
    : activeCategory?.name || (queryParams.newArrivals ? 'New Arrivals' : queryParams.bestsellers ? 'Bestsellers' : 'Shop All Jewellery');

  return (
    <div className="max-w-8xl mx-auto px-4 md:px-8 py-10 md:py-14">
      <Helmet><title>{title} | Arohi by Megha</title></Helmet>

      <div className="flex items-center justify-between mb-8">
        <h1 className="section-heading">{title}</h1>
        <button className="md:hidden btn-outline !px-4 !py-2 text-sm" onClick={() => setFiltersOpen((v) => !v)}>
          Filters
        </button>
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-10">
        <aside className={`${filtersOpen ? 'block' : 'hidden'} md:block space-y-8`}>
          <div>
            <h3 className="font-medium mb-3 text-sm uppercase tracking-wide">Category</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  className={!queryParams.category ? 'font-medium' : 'text-charcoal/70'}
                  onClick={() => updateParam('category', undefined)}
                >
                  All
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat._id}>
                  <button
                    className={queryParams.category === cat.slug ? 'font-medium' : 'text-charcoal/70'}
                    onClick={() => updateParam('category', cat.slug)}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-3 text-sm uppercase tracking-wide">Price</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                defaultValue={queryParams.minPrice}
                onBlur={(e) => updateParam('minPrice', e.target.value)}
                className="input-field !py-2 text-sm"
              />
              <span>–</span>
              <input
                type="number"
                placeholder="Max"
                defaultValue={queryParams.maxPrice}
                onBlur={(e) => updateParam('maxPrice', e.target.value)}
                className="input-field !py-2 text-sm"
              />
            </div>
          </div>
        </aside>

        <div>
          <div className="flex justify-end mb-6">
            <select
              value={queryParams.sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="input-field !w-auto !py-2 text-sm"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <p className="text-charcoal/60">Loading...</p>
          ) : data?.products?.length ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {data.products.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          ) : (
            <p className="text-charcoal/60">No products found. Try adjusting your filters.</p>
          )}

          {data?.pages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => updateParam('page', String(p))}
                  className={`w-9 h-9 rounded-full text-sm ${Number(queryParams.page) === p ? 'bg-charcoal text-ivory' : 'hover:bg-blush'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
