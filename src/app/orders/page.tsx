"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { orderAPI } from "@/services/api";
import { formatPrice, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { Package, ShoppingBag, ChevronRight, CreditCard, Clock, CheckCircle2, AlertCircle, Banknote, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

interface OrderItem {
  _id: string;
  name: string;
  quantity: number;
  sellingPrice: number;
  totalPrice: number;
  colorVariant: {
    colorName: string;
    colorCode: string;
    image: string;
  };
  size: string;
  product: string;
}

interface OrderSummary {
  _id: string;
  orderNumber: string;
  status: string;
  payment: {
    method: string;
    status: string;
  };
  pricing: {
    subtotal: number;
    shippingCost?: number;
    discount?: number;
    total: number;
  };
  items: OrderItem[];
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700" },
  processing: { label: "Processing", color: "bg-purple-100 text-purple-700" },
  shipped: { label: "Shipped", color: "bg-indigo-100 text-indigo-700" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Payment Pending", color: "bg-yellow-50 text-yellow-600" },
  partially_paid: { label: "Partially Paid", color: "bg-orange-50 text-orange-600" },
  completed: { label: "Paid", color: "bg-green-50 text-green-600" },
  failed: { label: "Payment Failed", color: "bg-red-50 text-red-600" },
  refunded: { label: "Refunded", color: "bg-gray-100 text-gray-600" },
};

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/orders");
      return;
    }
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await orderAPI.getOrders();
      setOrders(res.data.orders || []);
    } catch (error) {
      console.error("Error fetching orders", error);
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-black">My Orders</h1>
          <p className="text-gray-500 mt-1 text-sm">Track and manage your purchases</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 bg-white rounded-2xl shadow-sm animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-200 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">When you place an order, it will appear here.</p>
            <button
              onClick={() => router.push("/shop")}
              className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusConfig[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-700" };
              const payStatus = paymentStatusConfig[order.payment?.status] ?? { label: order.payment?.status, color: "bg-gray-100 text-gray-600" };
              const previewImages = order.items?.slice(0, 4) ?? [];
              const extraCount = (order.items?.length ?? 0) - 4;

              return (
                <div
                  key={order._id}
                  onClick={() => router.push(`/orders/${order._id}`)}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900">#{order.orderNumber}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}>
                        <Package className="w-3.5 h-3.5" />
                        {status.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${payStatus.color}`}>
                        {order.payment?.status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                          order.payment?.status === 'partially_paid' ? <Banknote className="w-3.5 h-3.5" /> :
                            order.payment?.status === 'failed' ? <AlertCircle className="w-3.5 h-3.5" /> :
                              order.payment?.status === 'refunded' ? <RotateCcw className="w-3.5 h-3.5" /> :
                                <Clock className="w-3.5 h-3.5" />}
                        {payStatus.label}
                      </span>
                    </div>
                  </div>

                  {/* Product Image Strip */}
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="flex -space-x-2">
                      {previewImages.map((item, i) => (
                        <div
                          key={item._id}
                          className="relative w-14 h-14 rounded-xl border-2 border-white overflow-hidden bg-gray-100 flex-shrink-0"
                          style={{ zIndex: previewImages.length - i }}
                        >
                          {item.colorVariant?.image ? (
                            <Image
                              src={item.colorVariant.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                        </div>
                      ))}
                      {extraCount > 0 && (
                        <div className="relative w-14 h-14 rounded-xl border-2 border-white bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-gray-500">
                          +{extraCount}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 font-medium line-clamp-1">
                        {order.items?.map((i) => i.name).join(", ")}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {order.items?.length ?? 0} {(order.items?.length ?? 0) === 1 ? "item" : "items"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xs text-gray-400">Total</div>
                        <div className="text-base font-bold text-primary">{formatPrice(order.pricing?.total)}</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
