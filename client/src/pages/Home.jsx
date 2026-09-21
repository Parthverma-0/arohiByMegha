import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useCategories, useProducts, useHomepageContent } from '../api/products.js';
import ProductCard from '../components/ui/ProductCard.jsx';
import LazyImage from '../components/ui/LazyImage.jsx';
import Newsletter from '../components/layout/Newsletter.jsx';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function Home() {
  const { data: content } = useHomepageContent();
  const { data: categories = [] } = useCategories();
  const { data: newArrivals } = useProducts({ newArrivals: true, limit: 8 });
  const { data: bestsellers } = useProducts({ bestsellers: true, limit: 8 });

  return (
    <>
      <Helmet>
        <title>Arohi by Megha | Jewellery for your every story</title>
      </Helmet>

      <section className="relative h-[85vh] min-h-[520px] flex items-end md:items-center">
        <div className="absolute inset-0 bg-blush">
          {content?.hero?.type === 'video' && content.hero.url ? (
            <video
              className="w-full h-full object-cover"
              src={content.hero.url}
              poster={content.hero.poster}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : (
            <LazyImage src={content?.hero?.url} alt="" eager className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-charcoal/10 to-transparent" />
        </div>
        <div className="relative max-w-8xl mx-auto px-6 md:px-12 pb-16 md:pb-0 text-ivory">
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="font-display text-4xl md:text-6xl max-w-xl leading-tight">
            {content?.hero?.heading || 'Jewellery for your every story'}
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.15 }} className="mt-4 text-lg text-ivory/90">
            {content?.hero?.subheading || 'Discover the new collection'}
          </motion.p>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.3 }}>
            <Link to={content?.hero?.ctaLink || '/shop'} className="btn-primary mt-8 !bg-ivory !text-charcoal hover:!bg-gold-light">
              {content?.hero?.ctaLabel || 'Shop Now'}
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="max-w-8xl mx-auto px-4 md:px-8 py-16 md:py-24">
        <h2 className="section-heading text-center">Shop by Category</h2>
        <div className="mt-10 grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
          {categories.map((cat) => (
            <Link key={cat._id} to={`/shop?category=${cat.slug}`} className="group text-center">
              <div className="aspect-square rounded-full overflow-hidden bg-blush">
                <LazyImage
                  src={cat.image?.url}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <p className="mt-3 text-sm md:text-base">{cat.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {newArrivals?.products?.length > 0 && (
        <section className="max-w-8xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <div className="flex items-end justify-between mb-8">
            <h2 className="section-heading">New Arrivals</h2>
            <Link to="/shop?newArrivals=true" className="text-sm underline underline-offset-4">View all</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {newArrivals.products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}

      {bestsellers?.products?.length > 0 && (
        <section className="max-w-8xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <div className="flex items-end justify-between mb-8">
            <h2 className="section-heading">Bestsellers</h2>
            <Link to="/shop?bestsellers=true" className="text-sm underline underline-offset-4">View all</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {bestsellers.products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}

      <section className="bg-blush py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-10 items-center">
          <div className="aspect-[4/3] rounded-lg overflow-hidden">
            <LazyImage src={content?.brandStory?.image?.url} alt="" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="section-heading">{content?.brandStory?.heading || 'Our Story'}</h2>
            <p className="mt-4 text-charcoal/70 leading-relaxed">
              {content?.brandStory?.body ||
                'Arohi by Megha creates fashion-forward jewellery for the modern woman — quiet luxury, made for everyday wear and every celebration.'}
            </p>
          </div>
        </div>
      </section>

      <Newsletter />
    </>
  );
}
