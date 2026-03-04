'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Package,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronDown,
} from 'lucide-react';
import { adminAPI } from '@/services/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  sku: string;
  originalPrice: number;
  sellingPrice: number;
  category: string;
  isActive: boolean;
  isFeatured: boolean;
  colorVariants: {
    color: string;
    images: string[];
    sizes: {
      size: string;
      quantity: number;
    }[];
  }[];
}

export default function AdminProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, stockFilter, debouncedSearchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, categoryFilter, stockFilter, debouncedSearchQuery]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page: currentPage,
        limit: 10,
      };
      if (categoryFilter) params.category = categoryFilter;
      if (stockFilter === 'low') params.lowStock = 'true';
      if (debouncedSearchQuery) params.search = debouncedSearchQuery;

      const response = await adminAPI.getProducts(params);
      setProducts(response.data.products);
      setTotalPages(response.data.pagination?.totalPages || response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await adminAPI.deleteProduct(productId);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const getTotalStock = (product: Product) => {
    return product.colorVariants?.reduce((total, cv) =>
      total + cv.sizes?.reduce((s, size) => s + (size.quantity || 0), 0), 0
    ) || 0;
  };

  const categories = ['t-shirts', 'hoodies', 'sweatshirts'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                title="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="flex gap-4">
            <div className="relative min-w-[160px]">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white bg-none cursor-pointer"
              >
                <option value="" disabled hidden>Filter by Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
              {categoryFilter ? (
                <button
                  onClick={() => { setCategoryFilter(''); setCurrentPage(1); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                  title="Clear filter"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="relative min-w-[140px]">
              <select
                value={stockFilter}
                onChange={(e) => {
                  setStockFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white bg-none cursor-pointer"
              >
                <option value="" disabled hidden>Filter by Stock</option>
                <option value="low">Low Stock</option>
              </select>
              {stockFilter ? (
                <button
                  onClick={() => { setStockFilter(''); setCurrentPage(1); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                  title="Clear filter"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or add a new product</p>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <Plus className="w-4 h-4" />
              Add your first product
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-4 px-4 font-medium text-gray-600">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </th>
                    <th className="text-left py-4 px-4 font-medium text-gray-600">Product</th>
                    <th className="text-left py-4 px-4 font-medium text-gray-600">SKU</th>
                    <th className="text-left py-4 px-4 font-medium text-gray-600">Category</th>
                    <th className="text-left py-4 px-4 font-medium text-gray-600">Price</th>
                    <th className="text-left py-4 px-4 font-medium text-gray-600">Stock</th>
                    <th className="text-left py-4 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-4 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => {
                    const stock = getTotalStock(product);
                    const isLowStock = stock < 10;

                    return (
                      <motion.tr
                        key={product._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-4 px-4">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                              {product.colorVariants?.[0]?.images?.[0] ? (
                                <img
                                  src={product.colorVariants[0].images[0]}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-6 h-6 text-gray-400 m-3" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              {product.isFeatured && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{product.sku}</td>
                        <td className="py-4 px-4">
                          <span className="capitalize text-gray-600">{product.category}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            {product.sellingPrice < product.originalPrice ? (
                              <>
                                <span className="font-medium">{formatPrice(product.sellingPrice)}</span>
                                <span className="text-sm text-gray-400 line-through ml-2">
                                  {formatPrice(product.originalPrice)}
                                </span>
                              </>
                            ) : (
                              <span className="font-medium">{formatPrice(product.sellingPrice)}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className={isLowStock ? 'text-red-600 font-medium' : 'text-gray-600'}>
                              {stock} units
                            </span>
                            {isLowStock && (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${product.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                            }`}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/product/${product._id}`}
                              target="_blank"
                              className="p-2 text-gray-400 hover:text-primary transition-colors"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/admin/products/${product._id}/edit`}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(product._id)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <p className="text-sm text-gray-600">
                Showing {products.length} products
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
