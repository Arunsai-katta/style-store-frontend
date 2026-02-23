'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  DollarSign,
  Package,
  Users,
  RotateCcw,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';
import { dashboardAPI, adminAPI } from '@/services/api';
import { formatPrice, formatDate } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  totalCustomers: number;
  returnRequests: number;
  lowStockCount: number;
}

interface OverviewStats {
  today: { orders: number; revenue: number };
  month: { orders: number; revenue: number };
  total: { orders: number; revenue: number };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('month');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, overviewRes] = await Promise.all([
          dashboardAPI.getStats(),
          adminAPI.getOverview(),
        ]);

        setStats(statsRes.data.stats);
        setOverview(overviewRes.data.overview);
        setDailySales(statsRes.data.dailySales || []);
        setRecentOrders(statsRes.data.recentOrders || []);
        setLowStockProducts(statsRes.data.lowStockProducts || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dateFilter]);

  const statCards = [
    {
      name: 'Total Revenue',
      value: stats?.totalRevenue || 0,
      icon: DollarSign,
      change: '+12%',
      changeType: 'positive',
      format: 'price',
    },
    {
      name: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingBag,
      change: '+8%',
      changeType: 'positive',
      format: 'number',
    },
    {
      name: 'Pending Orders',
      value: stats?.pendingOrders || 0,
      icon: Package,
      change: '-3%',
      changeType: 'negative',
      format: 'number',
    },
    {
      name: 'Total Customers',
      value: stats?.totalCustomers || 0,
      icon: Users,
      change: '+15%',
      changeType: 'positive',
      format: 'number',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-12 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.changeType === 'positive' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {stat.change}
              </div>
            </div>
            <p className="text-gray-600 text-sm">{stat.name}</p>
            <p className="text-2xl font-bold text-black">
              {stat.format === 'price'
                ? formatPrice(stat.value)
                : stat.value.toLocaleString()}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Alerts */}
      {(stats?.returnRequests || 0) > 0 || (stats?.lowStockCount || 0) > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {(stats?.returnRequests || 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <RotateCcw className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-orange-800">
                  {stats?.returnRequests} Return Requests
                </p>
                <p className="text-sm text-orange-600">Pending approval</p>
              </div>
              <Link
                href="/admin/returns"
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Review
              </Link>
            </motion.div>
          )}

          {(stats?.lowStockCount || 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-red-800">
                  {stats?.lowStockCount} Products Low Stock
                </p>
                <p className="text-sm text-red-600">Need restocking</p>
              </div>
              <Link
                href="/admin/products?stockAlert=true"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                View
              </Link>
            </motion.div>
          )}
        </div>
      ) : null}

      {/* Charts & Tables */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-black mb-6">Sales Overview</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatPrice(value)}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#ff6e00"
                  strokeWidth={2}
                  dot={{ fill: '#ff6e00' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-black">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-primary hover:underline text-sm flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentOrders.slice(0, 5).map((order) => (
              <div
                key={order._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{formatPrice(order.pricing?.total)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'delivered'
                      ? 'bg-green-100 text-green-700'
                      : order.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Products */}
      {lowStockProducts.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-black">Low Stock Alert</h2>
            <Link
              href="/admin/products?stockAlert=true"
              className="text-primary hover:underline text-sm flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">SKU</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Stock</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.slice(0, 5).map((product) => (
                  <tr key={product._id} className="border-b">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg" />
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{product.sku}</td>
                    <td className="py-3 px-4">
                      <span className="text-red-600 font-medium">
                        {product.colorVariants?.reduce((total: number, cv: any) => 
                          total + cv.sizes?.reduce((s: number, size: any) => s + size.quantity, 0), 0
                        )} units
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/products/${product._id}`}
                        className="text-primary hover:underline"
                      >
                        Restock
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
