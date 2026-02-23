'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Trash2, Eye, X, Loader2 } from 'lucide-react';
import { userAPI } from '@/services/api';
import { Product } from '@/types';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quick-add picker state
  const [pickerProduct, setPickerProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/wishlist');
      return;
    }
    fetchWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.getWishlist();
      setWishlist(response.data.wishlist || []);
    } catch {
      toast.error('Failed to load wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      await userAPI.removeFromWishlist(productId);
      setWishlist(prev => prev.filter(p => p._id !== productId));
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Failed to remove from wishlist');
    }
  };

  /* ── Picker ── */
  const openPicker = (product: Product) => {
    const first = product.colorVariants?.[0];
    setPickerProduct(product);
    setSelectedVariantId(first?._id ?? '');
    setSelectedSize(first?.sizes?.find(s => s.quantity > 0)?.size ?? '');
  };

  const handleColorChange = (variantId: string) => {
    setSelectedVariantId(variantId);
    const variant = pickerProduct?.colorVariants?.find(v => v._id === variantId);
    setSelectedSize(variant?.sizes?.find(s => s.quantity > 0)?.size ?? '');
  };

  const handleAddToCart = async () => {
    if (!pickerProduct) return;
    if (!selectedVariantId) { toast.error('Please select a colour'); return; }
    if (!selectedSize) { toast.error('Please select a size'); return; }

    setIsAdding(true);
    try {
      await addItem({
        productId: pickerProduct._id,
        colorVariantId: selectedVariantId,
        size: selectedSize,
        quantity: 1,
      });
      setPickerProduct(null);
    } catch {
      // error toast handled by store/interceptor
    } finally {
      setIsAdding(false);
    }
  };

  const selectedVariant = pickerProduct?.colorVariants?.find(v => v._id === selectedVariantId);

  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-black mb-1">My Wishlist</h1>
          <p className="text-gray-500 text-sm">
            {isLoading ? 'Loading…' : `${wishlist.length} ${wishlist.length === 1 ? 'item' : 'items'}`}
          </p>
        </div>

        {/* Loading skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 rounded-xl mb-3" />
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-full mb-1" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : wishlist.length === 0 ? (
          /* Empty state */
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <Heart className="w-16 h-16 mx-auto text-gray-200 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-6 text-sm">Save items you love and find them here</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Start Shopping
            </Link>
          </div>
        ) : (
          /* Product grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {wishlist.map((product, index) => {
              const firstVariant = product.colorVariants?.[0];
              const firstImage = firstVariant?.images?.[0] || '/images/placeholder.jpg';
              const discount = calculateDiscount(product.originalPrice, product.sellingPrice);

              return (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col"
                >
                  {/* Image */}
                  <Link href={`/product/${product._id}`} className="relative aspect-[3/4] block overflow-hidden flex-shrink-0">
                    <Image
                      src={firstImage}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    {discount > 0 && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                        -{discount}%
                      </span>
                    )}
                    {/* Remove — always visible on mobile, hover on desktop */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemove(product._id);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow hover:bg-red-50 transition-colors md:opacity-0 md:group-hover:opacity-100 md:transition-opacity"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </Link>

                  {/* Info */}
                  <div className="p-3 flex flex-col flex-1">
                    <Link href={`/product/${product._id}`} className="flex-1">
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{product.category}</p>
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight mb-2 hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className="font-bold text-primary text-sm">{formatPrice(product.sellingPrice)}</span>
                        {discount > 0 && (
                          <span className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                        )}
                      </div>
                    </Link>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-auto">
                      <button
                        onClick={() => openPicker(product)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-black text-white py-2 rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Add to Cart</span>
                      </button>
                      <Link
                        href={`/product/${product._id}`}
                        className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
                        title="View product"
                      >
                        <Eye className="w-3.5 h-3.5 text-gray-500" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />

      {/* ── Quick-Add Picker Modal ── */}
      <AnimatePresence>
        {pickerProduct && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setPickerProduct(null)}
            />
            <motion.div
              key="picker"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 pointer-events-none"
            >
              <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-6 shadow-2xl pointer-events-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0 pr-2">
                    <h3 className="font-bold text-black line-clamp-1">{pickerProduct.name}</h3>
                    <p className="text-primary font-semibold text-sm mt-0.5">{formatPrice(pickerProduct.sellingPrice)}</p>
                  </div>
                  <button
                    onClick={() => setPickerProduct(null)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Colour */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Colour — <span className="text-black normal-case font-medium">{selectedVariant?.colorName}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {pickerProduct.colorVariants?.map((variant) => (
                      <button
                        key={variant._id}
                        onClick={() => handleColorChange(variant._id)}
                        title={variant.colorName}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${selectedVariantId === variant._id
                            ? 'border-black scale-110 shadow-md'
                            : 'border-gray-200 hover:border-gray-400'
                          }`}
                        style={{ backgroundColor: variant.colorCode }}
                      />
                    ))}
                  </div>
                </div>

                {/* Size */}
                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedVariant?.sizes?.map(({ size, quantity }) => {
                      const oos = quantity === 0;
                      return (
                        <button
                          key={size}
                          disabled={oos}
                          onClick={() => !oos && setSelectedSize(size)}
                          className={`min-w-[42px] px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${oos
                              ? 'border-gray-200 text-gray-300 line-through cursor-not-allowed'
                              : selectedSize === size
                                ? 'border-black bg-black text-white'
                                : 'border-gray-300 text-gray-700 hover:border-black'
                            }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || !selectedSize}
                  className="w-full flex items-center justify-center gap-2 bg-black text-white py-3.5 rounded-xl font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50"
                >
                  {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingBag className="w-5 h-5" />}
                  {isAdding ? 'Adding…' : 'Add to Cart'}
                </button>

                <Link
                  href={`/product/${pickerProduct._id}`}
                  className="block text-center text-sm text-gray-500 hover:text-primary mt-3 transition-colors"
                  onClick={() => setPickerProduct(null)}
                >
                  View full details
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
