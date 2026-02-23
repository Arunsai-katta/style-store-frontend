'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, Shield, RotateCcw, Headphones, ChevronRight } from 'lucide-react';
import { productAPI } from '@/services/api';
import { Product } from '@/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';

const features = [
  { icon: Truck, title: 'Free Delivery', description: 'Orders above ₹5000', color: 'bg-blue-50 text-blue-600' },
  { icon: Shield, title: 'Secure Pay', description: '100% safe checkout', color: 'bg-green-50 text-green-600' },
  { icon: RotateCcw, title: 'Easy Returns', description: '30-day policy', color: 'bg-orange-50 text-orange-500' },
  { icon: Headphones, title: '24/7 Support', description: 'Always here for you', color: 'bg-purple-50 text-purple-600' },
];

const categories = [
  { name: 'T-Shirts', emoji: '👕', tag: 'Most loved', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=400&fit=crop', href: '/shop?category=t-shirts' },
  { name: 'Sweatshirts', emoji: '🧥', tag: 'New arrivals', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=400&fit=crop', href: '/shop?category=sweatshirts' },
  { name: 'Hoodies', emoji: '🏃', tag: 'Trending', image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&h=400&fit=crop', href: '/shop?category=hoodies' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    productAPI.getFeaturedProducts(8)
      .then(r => setFeaturedProducts(r.data.products))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* ═══ HERO ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white">
        {/* Floating blobs — decorative */}
        <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-0 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-8 items-end lg:items-center">

            {/* Text content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative z-10 pb-8 lg:pb-0"
            >
              {/* Pill badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium text-blue-200 mb-4 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                New Collection Dropped
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-4">
                Discover<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
                  Your Style
                </span>
              </h1>
              <p className="text-base sm:text-lg text-blue-200/80 max-w-md mb-8 leading-relaxed">
                Premium sweatshirts, tees & hoodies. Crafted for comfort, designed to turn heads.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg shadow-black/20 active:scale-95"
                >
                  Shop Now <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

            {/* Hero image — visible on all sizes now */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative flex justify-center lg:justify-end"
            >
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-blue-500/30 to-purple-500/30 blur-2xl scale-90" />
              <Image
                src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=700&h=600&fit=crop"
                alt="Fashion Collection"
                width={480}
                height={420}
                className="relative rounded-3xl object-cover w-full max-w-sm lg:max-w-none shadow-2xl"
                priority
              />
              {/* Floating price badge */}
              <div className="absolute top-4 right-4 sm:right-8 bg-white/90 backdrop-blur-md text-black rounded-2xl px-3 py-2 shadow-xl text-xs font-semibold">
                From <span className="text-blue-600 font-bold">₹999</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES STRIP ════════════════════════════════════════════ */}
      <section className="py-6 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          {/* Mobile: horizontal scroll */}
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="flex items-center gap-3 flex-shrink-0 sm:flex-shrink bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm min-w-[160px] sm:min-w-0"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{f.title}</p>
                  <p className="text-xs text-gray-500">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CATEGORIES ════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Shop by Category</h2>
              <p className="text-gray-500 text-sm mt-1">Explore our premium apparel</p>
            </div>
            <Link href="/shop" className="text-sm text-blue-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
            {categories.map((cat, i) => (
              <Link
                key={cat.name}
                href={cat.href}
                className={`group relative overflow-hidden rounded-2xl shadow-sm ${i === 0 ? 'col-span-2 sm:col-span-1' : 'col-span-1'}`}
              >
                <div className={`relative overflow-hidden ${i === 0 ? 'aspect-[16/9] sm:aspect-[3/2]' : 'aspect-[3/2]'}`}>
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                  {/* Tag pill */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-medium rounded-full">
                    {cat.tag}
                  </span>

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-lg sm:text-xl font-bold text-white leading-tight">
                      {cat.emoji} {cat.name}
                    </p>
                    <span className="inline-flex items-center gap-1 mt-2 text-white/90 text-xs font-medium">
                      Shop now <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURED PRODUCTS ═════════════════════════════════════════ */}
      {(isLoading || featuredProducts.length > 0) && (
        <section className="py-10 sm:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Featured</h2>
                <p className="text-gray-500 text-sm mt-1">Handpicked favourites</p>
              </div>
              <Link href="/shop" className="text-sm text-blue-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                See all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] bg-gray-100 rounded-2xl mb-3" />
                    <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
                    <div className="h-4 bg-gray-100 rounded w-full mb-1" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {featuredProducts.map((product, i) => (
                  <motion.div
                    key={product._id}
                    custom={i % 4}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}



      <Footer />
    </main>
  );
}
