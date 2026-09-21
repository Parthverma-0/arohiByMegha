import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '../../api/cart.js';
import { useAuthStore } from '../../store/authStore.js';
import SearchBar from '../ui/SearchBar.jsx';

const navLinks = [
  { to: '/shop', label: 'Shop' },
  { to: '/shop?newArrivals=true', label: 'New Arrivals' },
  { to: '/shop?bestsellers=true', label: 'Bestsellers' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: cart } = useCart();
  const user = useAuthStore((s) => s.user);
  const itemCount = cart?.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

  return (
    <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur border-b border-charcoal/10">
      <div className="max-w-8xl mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
        <button className="md:hidden p-2 -ml-2" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
          <MenuIcon />
        </button>

        <Link to="/" className="font-display text-xl md:text-2xl tracking-wide">
          AROHI <span className="text-gold-dark">BY MEGHA</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm">
          {navLinks.map((link) => (
            <NavLink key={link.label} to={link.to} className="hover:text-gold-dark transition-colors">
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 md:gap-5">
          <button aria-label="Search" className="p-2" onClick={() => setSearchOpen(true)}>
            <SearchIcon />
          </button>
          <Link to={user ? '/account/wishlist' : '/login'} aria-label="Wishlist" className="p-2 hidden sm:block">
            <HeartIcon />
          </Link>
          <Link to={user ? '/account' : '/login'} aria-label="Account" className="p-2 hidden sm:block">
            <UserIcon />
          </Link>
          <Link to="/cart" aria-label="Cart" className="p-2 relative">
            <BagIcon />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-gold-dark text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {searchOpen && <SearchBar onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-charcoal/40 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 w-72 bg-ivory z-50 p-6 flex flex-col gap-6"
            >
              <button className="self-end p-2" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
                <CloseIcon />
              </button>
              <nav className="flex flex-col gap-5 text-lg font-display">
                <NavLink to="/" onClick={() => setMenuOpen(false)}>Home</NavLink>
                {navLinks.map((link) => (
                  <NavLink key={link.label} to={link.to} onClick={() => setMenuOpen(false)}>
                    {link.label}
                  </NavLink>
                ))}
                {user && (
                  <NavLink to="/account/wishlist" onClick={() => setMenuOpen(false)}>
                    Wishlist
                  </NavLink>
                )}
                <NavLink to={user ? '/account' : '/login'} onClick={() => setMenuOpen(false)}>
                  {user ? 'My Account' : 'Login / Signup'}
                </NavLink>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 21s-7.5-4.87-10-9.5C.5 7.5 3 4 6.5 4c2 0 3.5 1 5.5 3.5C14 5 15.5 4 17.5 4 21 4 23.5 7.5 22 11.5 19.5 16.13 12 21 12 21z" strokeLinejoin="round" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  );
}
function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 8h12l-1 12H7L6 8z" strokeLinejoin="round" />
      <path d="M9 8V6a3 3 0 016 0v2" strokeLinecap="round" />
    </svg>
  );
}
