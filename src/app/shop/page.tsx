'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Filter, X, SlidersHorizontal, Search } from 'lucide-react';
import { productAPI } from '@/services/api';
import { Product } from '@/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Filters {
  category: string;
  minPrice: string;
  maxPrice: string;
  color: string;
  size: string;
  sort: string;
}

export default function ShopPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [availableFilters, setAvailableFilters] = useState<any>(null);

  const [filters, setFilters] = useState<Filters>({
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    color: searchParams.get('color') || '',
    size: searchParams.get('size') || '',
    sort: searchParams.get('sort') || '-createdAt',
  });

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [inputValue, setInputValue] = useState(searchParams.get('q') || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update filters when URL search params change
  useEffect(() => {
    setFilters({
      category: searchParams.get('category') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      color: searchParams.get('color') || '',
      size: searchParams.get('size') || '',
      sort: searchParams.get('sort') || '-createdAt',
    });
    const q = searchParams.get('q') || '';
    setSearchQuery(q);
    setInputValue(q);
    setCurrentPage(1);
  }, [searchParams]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        limit: 12,
        sort: filters.sort,
      };

      if (filters.category) params.category = filters.category;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.color) params.color = filters.color;
      if (filters.size) params.size = filters.size;
      if (searchQuery) params.search = searchQuery;

      // Handle special filters
      const filterParam = searchParams.get('filter');
      if (filterParam === 'new') params.isNew = 'true';
      if (filterParam === 'featured') params.isFeatured = 'true';

      const response = await productAPI.getProducts(params);
      setProducts(response.data.products);
      setTotalProducts(response.data.total);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage, searchParams, searchQuery]);

  const fetchFilters = useCallback(async () => {
    try {
      const category = filters.category || 'all';
      const response = await productAPI.getProductFilters(category);
      setAvailableFilters(response.data.filters);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  }, [filters.category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setCurrentPage(1);

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/shop?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      color: '',
      size: '',
      sort: '-createdAt',
    });
    setSearchQuery('');
    setInputValue('');
    setCurrentPage(1);
    router.push('/shop');
  };

  const handleSearchInput = (val: string) => {
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      const params = new URLSearchParams(searchParams.toString());
      if (val) { params.set('q', val); } else { params.delete('q'); }
      router.push(`/shop?${params.toString()}`, { scroll: false });
    }, 400);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== '-createdAt') || !!searchQuery;

  const sortOptions = [
    { value: '-createdAt', label: 'Newest First' },
    { value: 'createdAt', label: 'Oldest First' },
    { value: 'sellingPrice', label: 'Price: Low to High' },
    { value: '-sellingPrice', label: 'Price: High to Low' },
    { value: 'name', label: 'Name: A to Z' },
  ];

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 't-shirts', label: 'T-Shirts' },
    { value: 'hoodies', label: 'Hoodies' },
    { value: 'sweatshirts', label: 'Sweatshirts' },
  ];

  const totalPages = Math.ceil(totalProducts / 12);

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Header */}
      <div className="bg-light py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-black mb-1 sm:mb-2">Shop</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Discover our collection of premium streetwear
          </p>
        </div>
      </div>

      {/* Search + Toolbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm bg-white shadow-sm"
          />
          {inputValue && (
            <button
              onClick={() => handleSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-primary rounded-full" />
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 sm:gap-2 text-red-500 hover:text-red-600 text-sm sm:text-base"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
            <span className="text-gray-600 text-xs sm:text-sm">
              <span className="hidden sm:inline">Showing </span>
              {products.length}<span className="hidden sm:inline"> of {totalProducts} products</span>
            </span>

            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base bg-white"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-4 sm:gap-8 relative">
          {/* Mobile Filter Overlay */}
          {isFilterOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsFilterOpen(false)}
            />
          )}

          {/* Sidebar Filters */}
          <aside
            className={`${isFilterOpen
                ? 'fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto w-[85%] sm:w-[320px] lg:w-[280px]'
                : 'hidden lg:block lg:w-[280px]'
              } overflow-hidden flex-shrink-0 transition-transform duration-300 lg:transition-none`}
          >
            <div className={`w-full h-full lg:h-auto bg-white lg:bg-transparent p-4 lg:p-0 space-y-8 overflow-y-auto lg:overflow-visible shadow-lg lg:shadow-none`}>
              <div className="flex items-center justify-between mb-6 lg:hidden pb-4 border-b">
                <h2 className="text-lg font-bold text-black">Filters</h2>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Category Filter */}
              <div>
                <h3 className="font-semibold text-black mb-4">Category</h3>
                <div className="space-y-3">
                  {categories.map((cat) => (
                    <label key={cat.value} className="flex items-center gap-3 cursor-pointer py-1">
                      <input
                        type="radio"
                        name="category"
                        checked={filters.category === cat.value}
                        onChange={() => handleFilterChange('category', cat.value)}
                        className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                      />
                      <span className={`text-sm ${filters.category === cat.value ? 'text-black font-medium' : 'text-gray-700'
                        }`}>
                        {cat.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <h3 className="font-semibold text-black mb-4">Price Range</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                  />
                </div>
              </div>

              {/* Color Filter */}
              {availableFilters?.colors && availableFilters.colors.length > 0 && (
                <div>
                  <h3 className="font-semibold text-black mb-4">Colors</h3>
                  <div className="flex flex-wrap gap-3">
                    {availableFilters.colors.map((color: any) => (
                      <button
                        key={color.name}
                        onClick={() => handleFilterChange('color', filters.color === color.name ? '' : color.name)}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${filters.color === color.name
                            ? 'border-primary scale-110'
                            : 'border-gray-300'
                          }`}
                        style={{ backgroundColor: color.code }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Size Filter */}
              {availableFilters?.sizes && availableFilters.sizes.length > 0 && (
                <div>
                  <h3 className="font-semibold text-black mb-4">Sizes</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableFilters.sizes.map((size: string) => (
                      <button
                        key={size}
                        onClick={() => handleFilterChange('size', filters.size === size ? '' : size)}
                        className={`px-4 py-2 border-2 rounded-lg text-sm font-medium transition-all ${filters.size === size
                            ? 'border-primary bg-primary text-white'
                            : 'border-gray-300 text-gray-700'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 rounded-xl aspect-[3/4]" />
                    <div className="mt-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-black mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-1 sm:gap-2 mt-8 sm:mt-12 overflow-x-auto pb-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm sm:text-base whitespace-nowrap"
                    >
                      Previous
                    </button>

                    <div className="flex gap-1 sm:gap-2">
                      {[...Array(totalPages)].slice(0, 7).map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-sm sm:text-base ${currentPage === i + 1
                              ? 'bg-primary text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      {totalPages > 7 && (
                        <>
                          <span className="px-2 flex items-center">...</span>
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-sm sm:text-base ${currentPage === totalPages
                                ? 'bg-primary text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                              }`}
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm sm:text-base whitespace-nowrap"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
