'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, ShoppingBag, Heart, Share2, Truck, Shield, RotateCcw, Check, ChevronRight, Minus, Plus } from 'lucide-react';
import { productAPI, reviewAPI, cartAPI } from '@/services/api';
import { Product, Review } from '@/types';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'shipping'>('description');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const [productRes, reviewsRes, relatedRes] = await Promise.all([
          productAPI.getProduct(id as string),
          reviewAPI.getProductReviews(id as string),
          productAPI.getRelatedProducts(id as string),
        ]);
        
        const productData = productRes.data.product;
        setProduct(productData);
        setReviews(reviewsRes.data.reviews || []);
        setRelatedProducts(relatedRes.data.products || []);
        
        // Set default variant and size
        if (productData.colorVariants?.length > 0) {
          const defaultVariant = productData.colorVariants[0];
          setSelectedVariant(defaultVariant);
          const availableSize = defaultVariant.sizes?.find((s: any) => s.quantity > 0);
          if (availableSize) {
            setSelectedSize(availableSize.size);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/product/${id}`)}`);
      return;
    }

    if (!selectedVariant || !selectedSize) {
      toast.error('Please select color and size');
      return;
    }

    const sizeData = selectedVariant.sizes?.find((s: any) => s.size === selectedSize);
    if (!sizeData || sizeData.quantity < quantity) {
      toast.error('Insufficient stock');
      return;
    }

    setIsAddingToCart(true);
    try {
      await addItem({
        productId: product!._id,
        colorVariantId: selectedVariant._id,
        size: selectedSize,
        quantity,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    // Redirect to checkout
    window.location.href = '/checkout';
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-12 bg-gray-200 rounded w-1/3 animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl font-bold text-black mb-4">Product not found</h2>
          <Link href="/shop" className="text-primary hover:underline">
            Continue Shopping
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const discount = calculateDiscount(product.originalPrice, product.sellingPrice);
  const averageRating = product.averageRating || 0;
  const totalReviews = reviews.length;

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      {/* Breadcrumb */}
      <div className="bg-light py-3 sm:py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 overflow-x-auto">
            <Link href="/" className="hover:text-primary whitespace-nowrap">Home</Link>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <Link href="/shop" className="hover:text-primary whitespace-nowrap">Shop</Link>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <Link href={`/shop?category=${product.category}`} className="hover:text-primary capitalize whitespace-nowrap">
              {product.category}
            </Link>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-gray-900 truncate max-w-[120px] sm:max-w-xs">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square relative bg-gray-100 rounded-2xl overflow-hidden">
              <Image
                src={selectedVariant?.images?.[selectedImage] || '/images/placeholder.jpg'}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              {discount > 0 && (
                <span className="absolute top-4 left-4 px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full">
                  -{discount}%
                </span>
              )}
            </div>
            
            {/* Thumbnail Gallery */}
            {selectedVariant?.images && selectedVariant.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {selectedVariant.images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 relative flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} - ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <p className="text-xs sm:text-sm text-primary font-medium uppercase tracking-wide mb-1 sm:mb-2">
                {product.category}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">{product.name}</h1>
              
              {/* Rating */}
              {totalReviews > 0 && (
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${
                          i < Math.round(averageRating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm sm:text-base text-gray-600">
                    {averageRating} ({totalReviews} reviews)
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <span className="text-2xl sm:text-3xl font-bold text-primary">
                {formatPrice(product.sellingPrice)}
              </span>
              {discount > 0 && (
                <>
                  <span className="text-lg sm:text-xl text-gray-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs sm:text-sm font-medium rounded">
                    Save {formatPrice(product.originalPrice - product.sellingPrice)}
                  </span>
                </>
              )}
            </div>

            {/* Short Description */}
            <p className="text-sm sm:text-base text-gray-600">{product.shortDescription || product.description}</p>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color: <span className="text-black">{selectedVariant?.colorName}</span>
              </label>
              <div className="flex gap-2">
                {product.colorVariants?.map((variant) => (
                  <button
                    key={variant._id}
                    onClick={() => {
                      setSelectedVariant(variant);
                      setSelectedImage(0);
                      const availableSize = variant.sizes?.find((s: any) => s.quantity > 0);
                      setSelectedSize(availableSize?.size || '');
                    }}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      selectedVariant?._id === variant._id
                        ? 'border-primary scale-110'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: variant.colorCode }}
                    title={variant.colorName}
                  />
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size: <span className="text-black">{selectedSize}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedVariant?.sizes?.map((sizeData: any) => (
                  <button
                    key={sizeData.size}
                    onClick={() => setSelectedSize(sizeData.size)}
                    disabled={sizeData.quantity === 0}
                    className={`w-12 h-12 rounded-lg border-2 font-medium transition-all ${
                      selectedSize === sizeData.size
                        ? 'border-primary bg-primary text-white'
                        : sizeData.quantity === 0
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {sizeData.size}
                  </button>
                ))}
              </div>
              <Link href="/size-guide" className="text-sm text-primary hover:underline mt-2 inline-block">
                Size Guide
              </Link>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <div className="flex items-center border border-gray-300 rounded-lg w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-gray-100 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 hover:bg-gray-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 sm:gap-4">
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || !selectedSize}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 sm:py-4 rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {isAddingToCart ? (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Add to Cart</span>
                    <span className="sm:hidden">Add</span>
                  </>
                )}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!selectedSize}
                className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-3 sm:py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm sm:text-base"
              >
                Buy Now
              </button>
              <button className="p-3 sm:p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 py-4 sm:py-6 border-t border-b border-gray-200">
              <div className="text-center">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-primary" />
                <p className="text-xs sm:text-sm text-gray-600">Free Shipping</p>
                <p className="text-[10px] sm:text-xs text-gray-500 leading-tight">On orders above ₹5000</p>
              </div>
              <div className="text-center">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-primary" />
                <p className="text-xs sm:text-sm text-gray-600">Secure Payment</p>
                <p className="text-[10px] sm:text-xs text-gray-500 leading-tight">100% secure checkout</p>
              </div>
              <div className="text-center">
                <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 text-primary" />
                <p className="text-xs sm:text-sm text-gray-600">Easy Returns</p>
                <p className="text-[10px] sm:text-xs text-gray-500 leading-tight">7-day return policy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 sm:mt-16">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {[
              { key: 'description', label: 'Description' },
              ...(totalReviews > 0 ? [{ key: 'reviews', label: `Reviews (${totalReviews})` }] : []),
              { key: 'shipping', label: 'Shipping Info' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 sm:px-6 py-3 sm:py-4 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                  activeTab === tab.key
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="py-4 sm:py-8">
            {activeTab === 'description' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="prose max-w-none"
              >
                <p className="text-gray-600 whitespace-pre-line">{product.description}</p>
                
                {product.specifications && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Specifications</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {product.specifications.material && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Material</span>
                          <span className="font-medium">{product.specifications.material}</span>
                        </div>
                      )}
                      {product.specifications.fit && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Fit</span>
                          <span className="font-medium">{product.specifications.fit}</span>
                        </div>
                      )}
                      {product.specifications.weight && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Weight</span>
                          <span className="font-medium">{product.specifications.weight}g</span>
                        </div>
                      )}
                    </div>
                    
                    {product.specifications.careInstructions && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Care Instructions</h4>
                        <ul className="list-disc list-inside text-gray-600">
                          {product.specifications.careInstructions.map((instruction, i) => (
                            <li key={i}>{instruction}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-2">No reviews yet. Be the first to review!</p>
                    <p className="text-sm text-gray-400">Purchased this product? <Link href="/orders" className="text-primary hover:underline">Go to your orders</Link> to write a review.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review._id} className="border-b pb-6">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="font-medium text-primary">
                              {review.user.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{review.user.name}</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        {review.title && <p className="font-medium text-gray-900 mb-1">{review.title}</p>}
                        <p className="text-gray-600">{review.comment}</p>
                        {review.isVerifiedPurchase && (
                          <span className="inline-block mt-2 text-xs text-green-600 font-medium">✓ Verified Purchase</span>
                        )}
                      </div>
                    ))}
                    <p className="text-sm text-gray-400 pt-2">Purchased this product? <Link href="/orders" className="text-primary hover:underline">Go to your orders</Link> to write a review.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'shipping' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-4">
                  <Truck className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <h4 className="font-medium">Free Shipping</h4>
                    <p className="text-gray-600">Free shipping on all orders above ₹5000</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Check className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <h4 className="font-medium">Delivery Time</h4>
                    <p className="text-gray-600">3-5 business days across India</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <RotateCcw className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <h4 className="font-medium">Easy Returns</h4>
                    <p className="text-gray-600">7-day hassle-free return policy</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-8 sm:mt-16">
            <h2 className="text-xl sm:text-2xl font-bold text-black mb-4 sm:mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
