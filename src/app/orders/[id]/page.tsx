"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { orderAPI, returnAPI, paymentAPI, reviewAPI } from "@/services/api";
import { formatDate, formatPrice } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { Package, ArrowLeft, MapPin, CreditCard, ExternalLink, Truck, CheckCircle2, Clock, Box, RotateCcw, Banknote, Smartphone, AlertCircle, Star, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import type { Order } from "@/types";

// ── Status stepper config ─────────────────────────────────────────────────────
const STATUS_STEPS = [
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "processing", label: "Processing", icon: Box },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

const ORDER_STATUS_INDEX: Record<string, number> = {
  pending: -1, confirmed: 0, processing: 1, shipped: 2, delivered: 3, cancelled: -2,
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700" },
  processing: { label: "Processing", color: "bg-purple-100 text-purple-700" },
  shipped: { label: "Shipped", color: "bg-indigo-100 text-indigo-700" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  partially_paid: { label: "Partially Paid", color: "bg-orange-100 text-orange-700" },
  completed: { label: "Paid", color: "bg-green-100 text-green-700" },
  failed: { label: "Failed", color: "bg-red-100 text-red-700" },
  refunded: { label: "Refunded", color: "bg-gray-100 text-gray-600" },
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Return form state
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnUpiId, setReturnUpiId] = useState("");
  const [returnUseBank, setReturnUseBank] = useState(false);
  const [returnBank, setReturnBank] = useState({ accountNumber: "", ifscCode: "", accountHolderName: "", bankName: "" });
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [existingReturn, setExistingReturn] = useState<any>(null);
  const [refundStatus, setRefundStatus] = useState<any>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Review state
  const [reviewingItemId, setReviewingItemId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewTitle, setReviewTitle] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [submittedReviews, setSubmittedReviews] = useState<Record<string, boolean>>({});

  const orderId =
    typeof params?.id === "string" ? params.id
      : Array.isArray(params?.id) ? params.id[0] : "";

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login?redirect=/orders"); return; }
    if (!orderId) return;
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, orderId]);

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const res = await orderAPI.getOrder(orderId);
      setOrder(res.data.order);
      // Check if there's an existing return for this order
      try {
        const retRes = await returnAPI.getMyReturns();
        const myReturn = retRes.data.returns?.find((r: any) => r.order?._id === orderId || r.order === orderId);
        if (myReturn) {
          setExistingReturn(myReturn);
          // Also fetch live refund status if refunded
          if (myReturn.status === 'refunded' || myReturn.status === 'refund_initiated') {
            const statusRes = await returnAPI.getRefundStatus(myReturn._id);
            setRefundStatus(statusRes.data);
          }
        }
      } catch { }
      // Check which items already have reviews
      try {
        const myReviewsRes = await reviewAPI.getMyReviews();
        const myReviews = myReviewsRes.data.reviews || [];
        const reviewed: Record<string, boolean> = {};
        for (const r of myReviews) {
          if ((r.order === orderId || r.order?._id === orderId)) {
            reviewed[r.product?._id || r.product] = true;
          }
        }
        setSubmittedReviews(reviewed);
      } catch { }
    } catch {
      toast.error("Failed to load order details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReturn = async () => {
    if (!order) return;
    const isCod = (order.payment as any).method === 'cod';
    if (isCod && !returnUseBank && !returnUpiId.trim()) {
      toast.error('Please enter your UPI ID to receive the refund');
      return;
    }
    if (isCod && returnUseBank && !returnBank.accountNumber.trim()) {
      toast.error('Please enter your bank account details');
      return;
    }
    setIsSubmittingReturn(true);
    try {
      const items = order.items.map((item: any) => ({
        orderItemId: item._id,
        quantity: item.quantity,
        reason: 'changed_mind',
      }));
      await returnAPI.createReturn({
        orderId: order._id,
        items,
        upiId: isCod && !returnUseBank ? returnUpiId : undefined,
        bankDetails: isCod && returnUseBank ? returnBank : undefined,
      });
      toast.success('Return request submitted!');
      setShowReturnForm(false);
      fetchOrder();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to submit return');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  if (!isAuthenticated) return null;

  const handleSubmitReview = async (productId: string) => {
    if (!order) return;
    if (!reviewComment.trim()) {
      toast.error("Please write a review comment");
      return;
    }
    setIsSubmittingReview(true);
    try {
      await reviewAPI.createReview({
        productId,
        orderId: order._id,
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        comment: reviewComment.trim(),
      });
      toast.success("Review submitted successfully!");
      setSubmittedReviews(prev => ({ ...prev, [productId]: true }));
      setReviewingItemId(null);
      setReviewRating(5);
      setReviewHover(0);
      setReviewComment("");
      setReviewTitle("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Load Razorpay script dynamically
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") { resolve(false); return; }
      if (document.getElementById("razorpay-js")) { resolve(true); return; }
      const script = document.createElement("script");
      script.id = "razorpay-js";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRetryPayment = async () => {
    if (!order) return;
    setIsRetrying(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || typeof window === "undefined" || !(window as any).Razorpay) {
        toast.error("Unable to load payment gateway. Please try again.");
        setIsRetrying(false);
        return;
      }

      const res = await orderAPI.retryPayment(order._id);
      const { paymentData } = res.data;

      if (!paymentData || !paymentData.orderId) {
        toast.error("Failed to initiate payment");
        setIsRetrying(false);
        return;
      }

      const { data: { key } } = await paymentAPI.getRazorpayKey();

      const options = {
        key,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: "StayRaw",
        description: "Order Payment",
        order_id: paymentData.orderId,
        handler: async function (response: any) {
          try {
            await orderAPI.verifyPayment({
              orderId: order._id,
              razorpayOrderId: paymentData.orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success("Payment successful!");
            fetchOrder(); // Refresh order state
          } catch {
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: order.shippingAddress.name,
          contact: order.shippingAddress.phone,
        },
        theme: { color: "#000" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to initiate payment");
    } finally {
      setIsRetrying(false);
    }
  };

  const status = order ? (statusConfig[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-700" }) : null;
  const payStatus = order ? (paymentStatusConfig[order.payment?.status] ?? { label: order.payment?.status, color: "bg-gray-100 text-gray-600" }) : null;
  const stepIndex = order ? (ORDER_STATUS_INDEX[order.status] ?? -1) : -1;
  const isCancelled = order?.status === "cancelled";

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push("/orders")}
          className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to orders
        </button>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-24 bg-white rounded-2xl shadow-sm animate-pulse" />
            <div className="h-40 bg-white rounded-2xl shadow-sm animate-pulse" />
            <div className="h-64 bg-white rounded-2xl shadow-sm animate-pulse" />
          </div>
        ) : !order ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <Package className="w-16 h-16 mx-auto text-gray-200 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Order not found</h2>
            <p className="text-gray-500">We couldn&apos;t find this order. Please try again.</p>
          </div>
        ) : (
          <div className="space-y-5">

            {/* ── Order Header ──────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-black">Order #{order.orderNumber}</h1>
                <p className="text-gray-500 text-sm mt-0.5">Placed on {formatDate(order.createdAt)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {status && <span className={`text-sm font-medium px-3 py-1 rounded-full ${status.color}`}>{status.label}</span>}
                {payStatus && <span className={`text-sm font-medium px-3 py-1 rounded-full ${payStatus.color}`}>{payStatus.label}</span>}
                <span className="text-lg font-bold text-primary ml-1">{formatPrice(order.pricing.total)}</span>
              </div>
            </div>

            {/* ── Status Stepper ────────────────────────────────────── */}
            {!isCancelled && (
              <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
                <h2 className="font-semibold text-gray-900 mb-5">Order Progress</h2>
                <div className="flex items-center">
                  {STATUS_STEPS.map((step, i) => {
                    const done = stepIndex >= i;
                    const current = stepIndex === i;
                    const Icon = step.icon;
                    return (
                      <div key={step.key} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${done ? "bg-primary text-white shadow-md" : "bg-gray-100 text-gray-400"
                            } ${current ? "ring-4 ring-primary/20" : ""}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`text-xs font-medium whitespace-nowrap ${done ? "text-primary" : "text-gray-400"}`}>
                            {step.label}
                          </span>
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-1 mb-5 rounded-full transition-all ${stepIndex > i ? "bg-primary" : "bg-gray-200"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Shiprocket Tracking ───────────────────────────────── */}
            {(order as any).shipping?.awbCode && (
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl shadow-sm p-5 border border-indigo-100">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-indigo-900">Shipment Tracking</h2>
                      <p className="text-sm text-indigo-600">
                        {(order as any).shipping.courierName} · AWB:{" "}
                        <span className="font-mono font-bold">{(order as any).shipping.awbCode}</span>
                      </p>
                    </div>
                  </div>
                  <a
                    href={(order as any).shipping.trackingUrl || `https://shiprocket.co/tracking/${(order as any).shipping.awbCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Track Live
                  </a>
                </div>
              </div>
            )}

            {/* ── Items ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Items Ordered</h2>
              <div className="divide-y divide-gray-100">
                {order.items.map((item: any) => {
                  const productId = typeof item.product === "object" ? item.product?._id : item.product;
                  return (
                    <div key={item._id} className="py-4 flex gap-4">
                      <Link
                        href={productId ? `/product/${productId}` : "#"}
                        className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-100 relative block hover:opacity-90 transition-opacity"
                        onClick={e => !productId && e.preventDefault()}
                      >
                        {item.colorVariant?.image ? (
                          <Image src={item.colorVariant.image} alt={item.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            {productId ? (
                              <Link href={`/product/${productId}`}
                                className="font-semibold text-gray-900 hover:text-primary transition-colors line-clamp-1 inline-flex items-center gap-1 group">
                                {item.name}
                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                              </Link>
                            ) : (
                              <span className="font-semibold text-gray-900 line-clamp-1">{item.name}</span>
                            )}
                            <p className="text-xs text-gray-500 mt-0.5">{item.colorVariant?.colorName} · Size {item.size}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-gray-400">{formatPrice(item.sellingPrice)} each</p>
                            <p className="font-semibold text-gray-900 mt-0.5">{formatPrice(item.totalPrice)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-gray-100 mt-2 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPrice(order.pricing.subtotal)}</span></div>
                {(order.pricing as any).discount > 0 && (
                  <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPrice((order.pricing as any).discount)}</span></div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{order.pricing.shippingCost === 0 ? "Free" : formatPrice(order.pricing.shippingCost)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(order.pricing.total)}</span>
                </div>
              </div>
            </div>

            {/* ── Info Grid ─────────────────────────────────────────── */}
            <div className="grid gap-5 md:grid-cols-2">
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-gray-900">Shipping Address</h2>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="font-medium text-gray-900">{order.shippingAddress.name}</p>
                  <p>{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}</p>
                  <p>{order.shippingAddress.country}</p>
                  <p className="text-gray-400 pt-1">📞 {order.shippingAddress.phone}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-gray-900">Payment</h2>
                </div>
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex justify-between">
                    <span>Method</span>
                    <span className="font-medium text-gray-900">{order.payment.method.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status</span>
                    {payStatus && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${payStatus.color}`}>{payStatus.label}</span>
                    )}
                  </div>
                  {/* Show COD advance info */}
                  {order.payment.method === 'cod' && (order.payment as any).codAdvanceAmount > 0 && (
                    <div className="flex justify-between text-xs text-gray-500 pt-1">
                      <span>Advance Paid</span>
                      <span className="font-medium text-gray-700">{formatPrice((order.payment as any).codAdvanceAmount)}</span>
                    </div>
                  )}
                  {order.payment.method === 'cod' && (order.payment as any).codAdvanceAmount > 0 && (
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Remaining (Pay on Delivery)</span>
                      <span className="font-medium text-gray-700">{formatPrice(order.pricing.total - ((order.payment as any).codAdvanceAmount || 0))}</span>
                    </div>
                  )}
                  {/* Retry Payment for pending Razorpay orders */}
                  {order.status === 'pending' && order.payment.method === 'razorpay' && order.payment.status === 'pending' && (
                    <div className="pt-2 space-y-2">
                      <p className="text-xs text-amber-600">
                        Payment was not completed. Complete your payment to confirm this order, or it will be automatically cancelled.
                      </p>
                      <button
                        onClick={handleRetryPayment}
                        disabled={isRetrying}
                        className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {isRetrying ? "Processing…" : "Pay Now"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Return / Refund Section ───────────────────────────── */}
            {order.status === 'delivered' && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <RotateCcw className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-gray-900">Return & Refund</h2>
                </div>

                {existingReturn ? (
                  // Show existing return status
                  <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-sm text-gray-600">Return #{existingReturn.returnNumber}</span>
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${existingReturn.status === 'refunded' ? 'bg-green-100 text-green-700' :
                          existingReturn.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            existingReturn.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                        }`}>
                        {existingReturn.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Refund amount: <span className="font-semibold text-gray-900">{formatPrice(existingReturn.refundDetails?.totalAmount)}</span>
                    </div>

                    {/* Refund destination */}
                    <div className="bg-gray-50 rounded-xl p-4 text-sm">
                      {existingReturn.refundDetails?.method === 'original_payment' ? (
                        <div className="flex items-center gap-2 text-gray-600">
                          <CreditCard className="w-4 h-4" />
                          <span>Refund will be credited to your original payment card</span>
                        </div>
                      ) : existingReturn.refundDetails?.upiId ? (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Smartphone className="w-4 h-4" />
                          <span>Refund to UPI: <strong>{existingReturn.refundDetails.upiId}</strong></span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Banknote className="w-4 h-4" />
                          <span>Refund to bank account: <strong>****{existingReturn.refundDetails?.bankDetails?.accountNumber?.slice(-4)}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Live refund status */}
                    {refundStatus && (
                      <div className="border rounded-xl p-4 text-sm space-y-2">
                        <p className="font-medium text-gray-900">Refund Status</p>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Payment refund</span>
                          <span className={`font-medium ${refundStatus.refund?.payoutStatus === 'processed' || refundStatus.refund?.transactionId ? 'text-green-600' :
                              refundStatus.refund?.payoutStatus === 'failed' ? 'text-red-500' : 'text-yellow-600'
                            }`}>
                            {refundStatus.refund?.payoutStatus === 'processed' || refundStatus.refund?.transactionId
                              ? '✓ Completed'
                              : refundStatus.refund?.payoutStatus === 'failed'
                                ? '✗ Failed'
                                : '⏳ Processing'}
                          </span>
                        </div>
                        {refundStatus.refund?.processedAt && (
                          <p className="text-xs text-gray-400">Processed: {formatDate(refundStatus.refund.processedAt)}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : showReturnForm ? (
                  // Return request form
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">All {order.items.length} item(s) will be returned. Total refund: <strong>{formatPrice(order.pricing.total)}</strong></p>

                    {(order.payment as any).method === 'cod' ? (
                      // COD: require UPI or bank
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <button
                            onClick={() => setReturnUseBank(false)}
                            className={`flex-1 flex items-center gap-2 justify-center py-2 rounded-lg border text-sm font-medium transition-colors ${!returnUseBank ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500'
                              }`}
                          >
                            <Smartphone className="w-4 h-4" /> UPI
                          </button>
                          <button
                            onClick={() => setReturnUseBank(true)}
                            className={`flex-1 flex items-center gap-2 justify-center py-2 rounded-lg border text-sm font-medium transition-colors ${returnUseBank ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500'
                              }`}
                          >
                            <Banknote className="w-4 h-4" /> Bank Account
                          </button>
                        </div>

                        {!returnUseBank ? (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">UPI ID <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              value={returnUpiId}
                              onChange={e => setReturnUpiId(e.target.value)}
                              placeholder="yourname@upi"
                              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <p className="text-xs text-gray-400 mt-1">Full ₹{order.pricing.total} will be sent here</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <input type="text" placeholder="Account Holder Name *" value={returnBank.accountHolderName} onChange={e => setReturnBank(b => ({ ...b, accountHolderName: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                            <input type="text" placeholder="Account Number *" value={returnBank.accountNumber} onChange={e => setReturnBank(b => ({ ...b, accountNumber: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                            <input type="text" placeholder="IFSC Code *" value={returnBank.ifscCode} onChange={e => setReturnBank(b => ({ ...b, ifscCode: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                            <input type="text" placeholder="Bank Name" value={returnBank.bankName} onChange={e => setReturnBank(b => ({ ...b, bankName: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                          </div>
                        )}
                      </div>
                    ) : (
                      // Razorpay: show info
                      <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4">
                        <CreditCard className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">Refund to original payment</p>
                          <p className="text-xs text-blue-600 mt-0.5">{formatPrice(order.pricing.total)} will be refunded to your original card within 5–7 business days.</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowReturnForm(false)}
                        className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitReturn}
                        disabled={isSubmittingReturn}
                        className="flex-1 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
                      >
                        {isSubmittingReturn ? 'Submitting…' : 'Submit Return'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Return CTA
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Not satisfied? You can return this order within 7 days of delivery.</p>
                      <button
                        onClick={() => setShowReturnForm(true)}
                        className="mt-2 text-sm font-medium text-primary hover:underline"
                      >
                        Request a return →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Write a Review Section ────────────────────────────── */}
            {order.status === 'delivered' && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-gray-900">Write a Review</h2>
                </div>
                <div className="space-y-4">
                  {order.items.map((item: any) => {
                    const productId = typeof item.product === "object" ? item.product?._id : item.product;
                    const alreadyReviewed = submittedReviews[productId];
                    const isReviewing = reviewingItemId === item._id;

                    return (
                      <div key={item._id} className="border rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 relative flex-shrink-0">
                            {item.colorVariant?.image ? (
                              <Image src={item.colorVariant.image} alt={item.name} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-4 h-4 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 line-clamp-1">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.colorVariant?.colorName} · Size {item.size}</p>
                          </div>
                          {alreadyReviewed ? (
                            <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1 flex-shrink-0">
                              <CheckCircle2 className="w-3 h-3" /> Reviewed
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                if (isReviewing) {
                                  setReviewingItemId(null);
                                } else {
                                  setReviewingItemId(item._id);
                                  setReviewRating(5);
                                  setReviewHover(0);
                                  setReviewComment("");
                                  setReviewTitle("");
                                }
                              }}
                              className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex-shrink-0"
                            >
                              {isReviewing ? "Cancel" : "Write Review"}
                            </button>
                          )}
                        </div>

                        {isReviewing && (
                          <div className="mt-4 space-y-3 border-t pt-4">
                            {/* Star Rating */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1.5">Rating</label>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setReviewRating(star)}
                                    onMouseEnter={() => setReviewHover(star)}
                                    onMouseLeave={() => setReviewHover(0)}
                                    className="p-0.5"
                                  >
                                    <Star
                                      className={`w-6 h-6 transition-colors ${
                                        star <= (reviewHover || reviewRating)
                                          ? "text-yellow-400 fill-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  </button>
                                ))}
                                <span className="text-sm text-gray-500 ml-2 self-center">
                                  {reviewRating}/5
                                </span>
                              </div>
                            </div>

                            {/* Title */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Title (optional)</label>
                              <input
                                type="text"
                                value={reviewTitle}
                                onChange={(e) => setReviewTitle(e.target.value)}
                                placeholder="Summarize your experience"
                                maxLength={100}
                                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>

                            {/* Comment */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Review <span className="text-red-500">*</span></label>
                              <textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="Share your thoughts about this product..."
                                maxLength={1000}
                                rows={3}
                                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                              />
                              <p className="text-xs text-gray-400 mt-0.5">{reviewComment.length}/1000</p>
                            </div>

                            <button
                              onClick={() => handleSubmitReview(productId)}
                              disabled={isSubmittingReview || !reviewComment.trim()}
                              className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                              {isSubmittingReview ? "Submitting…" : "Submit Review"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
