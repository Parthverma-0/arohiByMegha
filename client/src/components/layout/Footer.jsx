import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-ivory border-t border-charcoal/10">
      <div className="max-w-8xl mx-auto px-4 md:px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div className="col-span-2 md:col-span-1">
          <h3 className="font-display text-xl mb-3">AROHI BY MEGHA</h3>
          <p className="text-charcoal/60">Jewellery for your every story — fashion-forward pieces for everyday wear and every celebration.</p>
        </div>
        <div>
          <h4 className="font-medium mb-3">Shop</h4>
          <ul className="space-y-2 text-charcoal/70">
            <li><Link to="/shop">All Jewellery</Link></li>
            <li><Link to="/shop?newArrivals=true">New Arrivals</Link></li>
            <li><Link to="/shop?bestsellers=true">Bestsellers</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium mb-3">Customer Care</h4>
          <ul className="space-y-2 text-charcoal/70">
            <li><Link to="/policies/shipping">Shipping & Delivery</Link></li>
            <li><Link to="/policies/returns">Returns & Exchange</Link></li>
            <li><Link to="/policies/faq">FAQs</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium mb-3">Legal</h4>
          <ul className="space-y-2 text-charcoal/70">
            <li><Link to="/policies/privacy">Privacy Policy</Link></li>
            <li><Link to="/policies/terms">Terms & Conditions</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-charcoal/10 py-5 text-center text-xs text-charcoal/50">
        © {new Date().getFullYear()} Arohi by Megha. All rights reserved.
      </div>
    </footer>
  );
}
