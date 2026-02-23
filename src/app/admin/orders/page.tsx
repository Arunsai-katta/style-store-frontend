'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Package, Truck, X, ChevronLeft, ChevronRight,
  Download, Send, ExternalLink, CheckCircle2, Clock,
} from 'lucide-react';
import { adminAPI, orderAPI } from '@/services/api';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ShippingInfo {
  awbCode?: string;
  courierName?: string;
  trackingUrl?: string;
}

interface OrderItem {
  _id: string;
  name: string;
  quantity: number;
  sellingPrice: number;
  totalPrice: number;
  size: string;
  colorVariant: { colorName: string };
}

interface AdminOrder {
  _id: string;
  orderNumber: string;
  user: { name: string; email: string };
  items: OrderItem[];
  pricing: { subtotal: number; shippingCost: number; total: number; discount?: number };
  status: string;
  payment: { method: string; status: string };
  shippingAddress: { name: string; addressLine1: string; city: string; state: string; pincode: string; phone: string };
  shipping: ShippingInfo;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-700' },
  shipped: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Paid', color: 'bg-green-100 text-green-700' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700' },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-600' },
};

const DEFAULT_DIMS = { weight: '0.5', length: '30', breadth: '25', height: '10' };

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detail modal
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Pack & Ship modal
  const [shipOrder, setShipOrder] = useState<AdminOrder | null>(null);
  const [dims, setDims] = useState(DEFAULT_DIMS);
  const [isShipping, setIsShipping] = useState(false);

  useEffect(() => { fetchOrders(); }, [currentPage, statusFilter]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const params: any = { page: currentPage, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const res = await adminAPI.getOrders(params);
      setOrders(res.data.orders || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await adminAPI.updateOrderStatus(orderId, { status: newStatus });
      toast.success('Status updated');
      fetchOrders();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const openShipModal = (order: AdminOrder) => {
    setShipOrder(order);
    setDims(DEFAULT_DIMS);
  };

  const handleDispatch = async () => {
    if (!shipOrder) return;
    setIsShipping(true);
    try {
      const res = await orderAPI.createShipment(shipOrder._id, {
        weight: parseFloat(dims.weight),
        length: parseFloat(dims.length),
        breadth: parseFloat(dims.breadth),
        height: parseFloat(dims.height),
      });
      toast.success(`Shipped! AWB: ${res.data.shipment.awbCode}`);
      setShipOrder(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create shipment');
    } finally {
      setIsShipping(false);
    }
  };

  const filtered = orders.filter(o =>
    o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Orders</h1>
          <p className="text-gray-500 text-sm">Manage, pack and dispatch customer orders</p>
        </div>
        <button className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order #, name, email…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No orders found</h3>
            <p className="text-gray-400 text-sm">Orders will appear here when customers make purchases</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Order #', 'Customer', 'Date', 'Items', 'Total', 'Payment', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order, index) => {
                    const s = statusConfig[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-600' };
                    const p = paymentStatusConfig[order.payment?.status] ?? { label: order.payment?.status, color: 'bg-gray-100 text-gray-600' };
                    const canShip = ['confirmed', 'processing'].includes(order.status);
                    return (
                      <motion.tr
                        key={order._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="border-b hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-semibold text-primary text-sm">{order.orderNumber}</span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900 text-sm">{order.user?.name || 'Guest'}</p>
                          <p className="text-xs text-gray-400">{order.user?.email}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{order.items?.length || 0} items</td>
                        <td className="py-3 px-4 text-sm font-semibold">{formatPrice(order.pricing?.total)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.color}`}>{p.label}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setSelectedOrder(order); setIsDetailOpen(true); }}
                              className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
                              title="View details"
                            >
                              <Package className="w-4 h-4" />
                            </button>
                            {canShip && (
                              <button
                                onClick={() => openShipModal(order)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-600 transition-colors"
                              >
                                <Truck className="w-3 h-3" />
                                Pack & Ship
                              </button>
                            )}
                            {order.shipping?.awbCode && (
                              <a
                                href={order.shipping.trackingUrl || `https://shiprocket.co/tracking/${order.shipping.awbCode}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Track
                              </a>
                            )}
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
              <p className="text-sm text-gray-500">Showing {filtered.length} orders</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Order Detail Modal ─── */}
      <AnimatePresence>
        {isDetailOpen && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            >
              <div className="p-5 border-b flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold">Order {selectedOrder.orderNumber}</h2>
                  <p className="text-gray-400 text-sm">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <button onClick={() => setIsDetailOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-5">
                {/* Customer & Shipping */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Customer</p>
                    <p className="font-medium text-gray-900 text-sm">{selectedOrder.user?.name}</p>
                    <p className="text-gray-500 text-xs">{selectedOrder.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Shipping Address</p>
                    <p className="text-sm text-gray-700">{selectedOrder.shippingAddress?.name}</p>
                    <p className="text-xs text-gray-500">{selectedOrder.shippingAddress?.addressLine1}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}</p>
                    <p className="text-xs text-gray-400">📞 {selectedOrder.shippingAddress?.phone}</p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Items ({selectedOrder.items?.length})</p>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b last:border-0 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-400">{item.colorVariant?.colorName} · Size {item.size} · Qty {item.quantity}</p>
                        </div>
                        <p className="font-semibold">{formatPrice(item.totalPrice)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 p-4 rounded-xl text-sm space-y-1.5">
                  <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPrice(selectedOrder.pricing?.subtotal)}</span></div>
                  <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{formatPrice(selectedOrder.pricing?.shippingCost)}</span></div>
                  <div className="flex justify-between font-bold text-base border-t pt-2 mt-1"><span>Total</span><span>{formatPrice(selectedOrder.pricing?.total)}</span></div>
                </div>

                {/* Shiprocket info if shipped */}
                {selectedOrder.shipping?.awbCode && (
                  <div className="bg-indigo-50 p-4 rounded-xl text-sm space-y-1">
                    <p className="font-semibold text-indigo-700 flex items-center gap-2"><Truck className="w-4 h-4" /> Shiprocket Details</p>
                    <p className="text-indigo-600">Courier: {selectedOrder.shipping.courierName}</p>
                    <p className="text-indigo-600">AWB: <span className="font-mono">{selectedOrder.shipping.awbCode}</span></p>
                    <a href={selectedOrder.shipping.trackingUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-700 font-medium hover:underline mt-1">
                      <ExternalLink className="w-3 h-3" /> Track Shipment
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Pack & Ship Modal ─── */}
      <AnimatePresence>
        {shipOrder && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-2xl max-w-md w-full"
            >
              <div className="p-5 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2"><Truck className="w-5 h-5 text-primary" /> Pack & Ship</h2>
                  <p className="text-gray-400 text-sm">{shipOrder.orderNumber} · {shipOrder.items?.length} item(s)</p>
                </div>
                <button onClick={() => setShipOrder(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
              </div>

              <div className="p-5 space-y-4">
                {/* Items summary */}
                <div className="bg-gray-50 p-3 rounded-xl text-sm space-y-1">
                  <p className="font-semibold text-gray-700 mb-2">Items in this package</p>
                  {shipOrder.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-gray-600">
                      <span>{item.name} ({item.colorVariant?.colorName}, {item.size})</span>
                      <span>×{item.quantity}</span>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-gray-500">
                  All items above will ship in <strong>one package</strong>. Measure your packed box and enter the dimensions below.
                </p>

                {/* Dimension inputs */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'weight', label: 'Weight (kg)', placeholder: '0.5' },
                    { key: 'length', label: 'Length (cm)', placeholder: '30' },
                    { key: 'breadth', label: 'Breadth (cm)', placeholder: '25' },
                    { key: 'height', label: 'Height (cm)', placeholder: '10' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={dims[key as keyof typeof dims]}
                        onChange={e => setDims(d => ({ ...d, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShipOrder(null)}
                    className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDispatch}
                    disabled={isShipping}
                    className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isShipping ? (
                      <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Shipping…</>
                    ) : (
                      <><Send className="w-4 h-4" /> Ship via Shiprocket</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
