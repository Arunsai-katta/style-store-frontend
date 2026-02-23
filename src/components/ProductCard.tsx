'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag, Eye, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@/types';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { userAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export default function ProductCard({ product, compact = false }: ProductCardProps) {
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);

  // Quick-add picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);

  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const checkWishlist = async () => {
      if (isAuthenticated) {
        try {
          const response = await userAPI.getWishlist();
          const wishlistIds = response.data.wishlist.map((p: Product) => p._id);
          setIsWishlisted(wishlistIds.includes(product._id));
        } catch {
          // Silently fail
        }
      }
    };
    checkWishlist();
  }, [isAuthenticated, product._id]);

  // Set defaults when picker opens
  const openPicker = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/product/${product._id}`)}`);
      return;
    }

    if (!product.colorVariants?.length) {
      toast.error('Product variant not available');
      return;
    }

    // Default to first variant and its first available size
    const firstVariant = product.colorVariants[0];
    setSelectedVariantId(firstVariant._id);
    const firstAvailableSize = firstVariant.sizes?.find(s => s.quantity > 0)?.size ?? '';
    setSelectedSize(firstAvailableSize);
    setPickerOpen(true);
  };

  const selectedVariant = product.colorVariants?.find(v => v._id === selectedVariantId);

  // When color changes, reset size to first available for that color
  const handleColorChange = (variantId: string) => {
    setSelectedVariantId(variantId);
    const variant = product.colorVariants?.find(v => v._id === variantId);
    const firstAvailable = variant?.sizes?.find(s => s.quantity > 0)?.size ?? '';
    setSelectedSize(firstAvailable);
  };

  const handleAddToCart = async () => {
    if (!selectedVariantId) {
      toast.error('Please select a colour');
      return;
    }
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }

    setIsAdding(true);
    try {
      await addItem({
        productId: product._id,
        colorVariantId: selectedVariantId,
        size: selectedSize,
        quantity: 1,
      });
      setPickerOpen(false);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/product/${product._id}`)}`);
      return;
    }

    if (isLoadingWishlist) return;

    setIsLoadingWishlist(true);
    try {
      if (isWishlisted) {
        await userAPI.removeFromWishlist(product._id);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await userAPI.addToWishlist(product._id);
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
    } catch (error: any) {
      console.error('Error updating wishlist:', error);
      toast.error(error.response?.data?.message || 'Failed to update wishlist');
    } finally {
      setIsLoadingWishlist(false);
    }
  };

  const firstVariant = product.colorVariants?.[0];
  const firstImage = firstVariant?.images?.[0] || '/images/placeholder.jpg';
  const discount = calculateDiscount(product.originalPrice, product.sellingPrice);

  return (
    <>
      <Link href={`/product/${product._id}`}>
        <motion.div
          className="group relative bg-white rounded-xl overflow-hidden"
          whileHover={{ y: -8 }}
          transition={{ duration: 0.3 }}
        >
          {/* Image Container */}
          <div className={`relative overflow-hidden bg-gray-100 ${compact ? 'aspect-[3/4]' : 'aspect-[3/4]'}`}>
            <Image
              src={firstImage}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {product.isNewArrival && (
                <span className="px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">New</span>
              )}
              {discount > 0 && (
                <span className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">-{discount}%</span>
              )}
              {product.isFeatured && !product.isNewArrival && (
                <span className="px-3 py-1 bg-black text-white text-xs font-semibold rounded-full">Featured</span>
              )}
            </div>

            {/* Quick Actions — always visible on mobile, animate in on desktop hover */}
            <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-100 md:opacity-0 md:translate-y-3 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-300">
              <button
                onClick={openPicker}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white text-black py-2 rounded-lg font-medium hover:bg-primary hover:text-white transition-colors shadow-lg text-xs sm:text-sm"
              >
                <ShoppingBag className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Add to Cart</span>
                <span className="sm:hidden">Add</span>
              </button>
              <button
                onClick={handleWishlist}
                className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg shadow-lg transition-colors flex-shrink-0 ${isWishlisted ? 'bg-red-500 text-white' : 'bg-white text-black hover:bg-red-50'
                  }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
              <Link
                href={`/product/${product._id}`}
                onClick={(e) => e.stopPropagation()}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white text-black rounded-lg shadow-lg hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <Eye className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Content */}
          <div className={`p-4 ${compact ? 'p-3' : 'p-4'}`}>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{product.category}</p>
            <h3 className={`font-semibold text-black mb-2 line-clamp-1 ${compact ? 'text-sm' : 'text-base'}`}>
              {product.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`font-bold text-primary ${compact ? 'text-sm' : 'text-lg'}`}>
                {formatPrice(product.sellingPrice)}
              </span>
              {discount > 0 && (
                <span className="text-sm text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
              )}
            </div>
            {!compact && firstVariant && (
              <div className="flex items-center gap-1 mt-3">
                {product.colorVariants.slice(0, 4).map((variant) => (
                  <div
                    key={variant._id}
                    className="w-4 h-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: variant.colorCode }}
                    title={variant.colorName}
                  />
                ))}
                {product.colorVariants.length > 4 && (
                  <span className="text-xs text-gray-500 ml-1">+{product.colorVariants.length - 4}</span>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </Link>

      {/* ── Quick-Add Picker Modal ── */}
      <AnimatePresence>
        {pickerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setPickerOpen(false)}
            />

            {/* Sheet — slides up from bottom on mobile, centred modal on desktop */}
            <motion.div
              key="picker"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 pointer-events-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-6 shadow-2xl pointer-events-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-black line-clamp-1 pr-2">{product.name}</h3>
                    <p className="text-primary font-semibold text-sm mt-0.5">{formatPrice(product.sellingPrice)}</p>
                  </div>
                  <button
                    onClick={() => setPickerOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Colour */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Colour — <span className="text-black normal-case">{selectedVariant?.colorName}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.colorVariants.map((variant) => (
                      <button
                        key={variant._id}
                        onClick={() => handleColorChange(variant._id)}
                        title={variant.colorName}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${selectedVariantId === variant._id
                            ? 'border-primary scale-110 shadow-md'
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
                      const outOfStock = quantity === 0;
                      return (
                        <button
                          key={size}
                          onClick={() => !outOfStock && setSelectedSize(size)}
                          disabled={outOfStock}
                          className={`min-w-[42px] px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${outOfStock
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

                {/* Add Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || !selectedSize}
                  className="w-full flex items-center justify-center gap-2 bg-black text-white py-3.5 rounded-xl font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50"
                >
                  {isAdding ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ShoppingBag className="w-5 h-5" />
                  )}
                  {isAdding ? 'Adding…' : 'Add to Cart'}
                </button>

                {/* View full page link */}
                <Link
                  href={`/product/${product._id}`}
                  className="block text-center text-sm text-gray-500 hover:text-primary mt-3 transition-colors"
                  onClick={() => setPickerOpen(false)}
                >
                  View full details
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
