'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  User,
  Search,
  Menu,
  X,
  Heart,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { getItemCount } = useCartStore();
  const { fetchWishlist, isInitialized } = useWishlistStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (pathname === '/shop') {
        const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
        const params = new URLSearchParams(currentSearch);
        params.set('q', searchQuery.trim());
        router.push(`/shop?${params.toString()}`);
      } else {
        router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      }
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const cartItemCount = getItemCount();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isInitialized) {
      fetchWishlist();
    }
  }, [isAuthenticated, isInitialized, fetchWishlist]);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'T-Shirts', href: '/shop?category=t-shirts' },
    { name: 'Sweatshirts', href: '/shop?category=sweatshirts' },
    { name: 'Hoodies', href: '/shop?category=hoodies' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href.includes('?')) {
      // For links with query params, check if pathname matches and params match
      const [path, query] = href.split('?');
      if (pathname === path) {
        const urlParams = new URLSearchParams(query);
        // Check if the category param matches using window.location
        if (urlParams.has('category') && typeof window !== 'undefined') {
          const currentParams = new URLSearchParams(window.location.search);
          return currentParams.get('category') === urlParams.get('category');
        }
        return true;
      }
      return false;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Main Navbar */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled
          ? 'bg-[#0f3460]/95 backdrop-blur-md shadow-md text-white'
          : 'bg-white text-gray-800'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold">
                Style<span className="text-[#533483]">Store</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`font-medium transition-colors ${isActive(link.href)
                    ? 'text-[#533483]'
                    : 'text-gray-700 hover:text-[#0f3460]'
                    }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 text-gray-700 hover:text-primary transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="hidden sm:block p-2 text-gray-700 hover:text-primary transition-colors"
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative p-2 text-gray-700 hover:text-[#0f3460] transition-colors"
              >
                <ShoppingBag className="w-5 h-5" />
                {isMounted && cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#0f3460] text-white text-xs rounded-full flex items-center justify-center">
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </Link>

              {/* Account */}
              {isAuthenticated ? (
                <div className="hidden sm:block relative group">
                  <button className="flex items-center gap-2 p-2 text-gray-700 hover:text-primary transition-colors">
                    <User className="w-5 h-5" />
                  </button>
                  <div className="absolute top-full right-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                    <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[180px]">
                      <Link
                        href="/account"
                        className="block px-4 py-2 text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        My Account
                      </Link>
                      <Link
                        href="/orders"
                        className="block px-4 py-2 text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        My Orders
                      </Link>
                      <Link
                        href="/wishlist"
                        className="block px-4 py-2 text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        Wishlist
                      </Link>
                      <hr className="my-2" />
                      <button
                        onClick={logout}
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#0f3460] text-white rounded-lg hover:bg-[#16213e] transition-colors"
                >
                  <User className="w-4 h-4" />
                  Login
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-gray-700"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gray-100 overflow-hidden"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for products..."
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    autoFocus
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden border-t border-gray-100 overflow-hidden bg-white"
            >
              <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block py-2 font-medium ${isActive(link.href)
                      ? 'text-primary'
                      : 'text-gray-700 hover:text-primary'
                      }`}
                  >
                    {link.name}
                  </Link>
                ))}

                {isAuthenticated ? (
                  <div className="pt-4 border-t border-gray-100 space-y-1">
                    <Link
                      href="/account"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-2.5 px-2 text-gray-700 hover:text-primary font-medium"
                    >
                      <User className="w-4 h-4" />
                      My Account
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-2.5 px-2 text-gray-700 hover:text-primary font-medium"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      My Orders
                    </Link>
                    <Link
                      href="/wishlist"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-2.5 px-2 text-gray-700 hover:text-primary font-medium"
                    >
                      <Heart className="w-4 h-4" />
                      Wishlist
                    </Link>
                    <button
                      onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                      className="flex items-center gap-3 py-2.5 px-2 text-red-600 font-medium w-full text-left"
                    >
                      <X className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-gray-100 space-y-2">
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full text-center py-3 bg-black text-white rounded-lg"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full text-center py-3 border border-black text-black rounded-lg"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
