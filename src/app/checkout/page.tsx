"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { formatPrice } from "@/lib/utils";
import { orderAPI, userAPI, paymentAPI } from "@/services/api";
import toast from "react-hot-toast";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, setCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [codConfig, setCodConfig] = useState<{
    enabled: boolean;
    maxOrderAmount: number;
    minPrepaidAmount: number;
  } | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });
  const [adding, setAdding] = useState(false);

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    const fetchData = async () => {
      try {
        const [profileRes, paymentConfigRes] = await Promise.all([
          userAPI.getProfile(),
          paymentAPI.getConfig(),
        ]);

        setAddresses(profileRes.data.user.addresses || []);

        const cod = paymentConfigRes.data?.config?.cod;
        if (cod) {
          setCodConfig({
            enabled: Boolean(cod.enabled),
            maxOrderAmount: Number(cod.maxOrderAmount) || 0,
            minPrepaidAmount: Number(cod.minPrepaidAmount) || 0,
          });
        }
      } catch (error) {
        // Profile / payment config failures are handled by interceptors where relevant
      }
    };

    fetchData();
  }, [isAuthenticated, router]);

  // Load Razorpay script dynamically if not already loaded
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        resolve(false);
        return;
      }

      if (document.getElementById("razorpay-js")) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.id = "razorpay-js";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  if (!cart || cart.items.length === 0) {
    return (
      <main className="min-h-screen bg-light">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <p className="mb-8">Add some products to your cart before checking out.</p>
          <button
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-600"
            onClick={() => router.push("/shop")}
          >
            Go to Shop
          </button>
        </div>
        <Footer />
      </main>
    );
  }
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic client-side validation
    const trimmedPhone = form.phone.trim();
    const trimmedPincode = form.pincode.trim();

    if (!/^[0-9]{10}$/.test(trimmedPhone)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    if (!/^[0-9]{6}$/.test(trimmedPincode)) {
      toast.error("Please enter a valid 6-digit pincode");
      return;
    }

    if (!form.name.trim() || form.name.trim().length < 2) {
      toast.error("Please enter a valid name");
      return;
    }

    if (!form.addressLine1.trim() || form.addressLine1.trim().length < 5) {
      toast.error("Please enter a more detailed address line 1");
      return;
    }

    setAdding(true);
    try {
      await userAPI.addAddress(form);
      toast.success("Address added");
      setForm({
        name: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
      });
      userAPI.getProfile().then((res) => {
        setAddresses(res.data.user.addresses || []);
      });
    } catch (error) {
      toast.error("Failed to add address");
    } finally {
      setAdding(false);
    }
  };

  // Place order with COD after collecting minimum prepaid via Razorpay
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    const address = addresses.find((a) => a._id === selectedAddress);
    if (!address) {
      toast.error("Selected address not found");
      return;
    }

    const orderTotal = cart.totals.total;
    if (codConfig) {
      if (!codConfig.enabled) {
        toast.error("Cash on Delivery is currently unavailable");
        return;
      }

      if (codConfig.maxOrderAmount && orderTotal > codConfig.maxOrderAmount) {
        toast.error(
          `COD is available only for orders up to ${formatPrice(codConfig.maxOrderAmount)}. Please pay online.`,
        );
        return;
      }
    }

    if (!codConfig || !codConfig.minPrepaidAmount) {
      toast.error("COD configuration not available. Please choose online payment.");
      return;
    }

    setIsLoading(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || typeof window === "undefined" || !(window as any).Razorpay) {
        toast.error("Unable to load payment gateway. Please try again.");
        setIsLoading(false);
        return;
      }

      const {
        data: { key },
      } = await paymentAPI.getRazorpayKey();

      const prepaidAmount = codConfig.minPrepaidAmount;
      const prepaidRes = await paymentAPI.createOrder({
        amount: prepaidAmount,
        receipt: `COD_PREPAID_${Date.now()}`,
        notes: {
          type: "COD_PREPAID",
          orderTotal,
        },
      });

      const prepaidOrder = prepaidRes.data.order;
      if (!prepaidOrder || !prepaidOrder.orderId) {
        toast.error("Failed to initiate advance payment for COD");
        setIsLoading(false);
        return;
      }

      const options = {
        key,
        amount: prepaidOrder.amount,
        currency: prepaidOrder.currency,
        name: "StayRaw",
        description: "COD Advance Payment",
        order_id: prepaidOrder.orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await paymentAPI.verifyPayment({
              razorpayOrderId: prepaidOrder.orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (!verifyRes.data.success) {
              toast.error("Advance payment verification failed. COD not created.");
              return;
            }

            const orderData = {
              shippingAddress: {
                name: address.name,
                phone: address.phone,
                addressLine1: address.addressLine1,
                addressLine2: address.addressLine2,
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                country: address.country,
              },
              paymentMethod: "cod",
              // Store the advance payment details so the backend can issue a
              // refund to this Razorpay payment ID if the order is ever returned.
              codAdvancePaymentId: response.razorpay_payment_id,
              codAdvanceAmount: prepaidOrder.amount / 100, // Razorpay amount is in paise
            };

            const res = await orderAPI.createOrder(orderData);
            setOrderId(res.data.order._id);
            toast.success("Order placed with COD after advance payment.");
            setCart(null);
            setIsSuccess(true);
          } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to place COD order after payment");
          }
        },
        prefill: {
          name: address.name,
          email: "",
          contact: address.phone,
        },
        theme: { color: "#000" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to initiate COD advance payment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRazorpay = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    const address = addresses.find((a) => a._id === selectedAddress);
    if (!address) {
      toast.error("Selected address not found");
      return;
    }

    setIsLoading(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || typeof window === "undefined" || !(window as any).Razorpay) {
        toast.error("Unable to load payment gateway. Please try again.");
        setIsLoading(false);
        return;
      }

      const orderData = {
        shippingAddress: {
          name: address.name,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          country: address.country,
        },
        paymentMethod: "razorpay",
      };

      const res = await orderAPI.createOrder(orderData);
      const { order, paymentData, cartId } = res.data;

      if (!paymentData || !paymentData.orderId) {
        toast.error("Failed to initiate payment");
        setIsLoading(false);
        return;
      }

      const {
        data: { key },
      } = await paymentAPI.getRazorpayKey();

      const options = {
        key,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: "StayRaw",
        description: "Order Payment",
        order_id: paymentData.orderId,
        handler: async function (response: any) {
          await orderAPI.verifyPayment({
            orderId: order._id,
            razorpayOrderId: paymentData.orderId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            cartId,
          });
          toast.success("Payment successful!");
          setCart(null);
          setOrderId(order._id);
          setIsSuccess(true);
        },
        prefill: {
          name: address.name,
          email: "",
          contact: address.phone,
        },
        theme: { color: "#000" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function () {
        toast.error("Payment failed. You can retry from your Orders page.");
      });
      rzp.open();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Payment failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Success step
  if (isSuccess) {
    return (
      <main className="min-h-screen bg-light">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Thank you for your order!</h2>
          <p className="mb-8">
            Your order has been placed successfully. You can view your order details in your
            account.
          </p>
          <button
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-600"
            onClick={() => router.push("/orders")}
          >
            View Orders
          </button>
        </div>
        <Footer />
      </main>
    );
  }

  const selected = addresses.find((a) => a._id === selectedAddress);

  return (
    <main className="min-h-screen bg-light">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 grid gap-8 grid-cols-1 lg:grid-cols-[2fr,1.5fr]">
        <section>
          <h1 className="text-2xl font-bold mb-4">Checkout</h1>
          <p className="text-gray-600 mb-6">Select delivery address and review your order.</p>

          <div className="space-y-4 mb-6">
            {addresses.length === 0 && <p>No saved addresses. Please add one below.</p>}
            {addresses.map((address) => (
              <div
                key={address._id}
                className={`border rounded-lg p-4 cursor-pointer ${selectedAddress === address._id ? "border-primary bg-primary/5" : "border-gray-200"
                  }`}
                onClick={() => setSelectedAddress(address._id)}
              >
                <div className="font-semibold">{address.name}</div>
                <div className="text-sm text-gray-600">
                  {address.addressLine1}, {address.city}, {address.state}, {address.pincode}
                </div>
                <div className="text-xs text-gray-500">{address.phone}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddAddress} className="space-y-4 mb-4">
            <h2 className="text-lg font-semibold">Add New Address</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                name="name"
                value={form.name}
                onChange={handleInputChange}
                placeholder="Name"
                className="px-4 py-2 border rounded-lg"
                required
              />
              <input
                name="phone"
                value={form.phone}
                onChange={handleInputChange}
                placeholder="Phone"
                className="px-4 py-2 border rounded-lg"
                type="tel"
                maxLength={10}
                pattern="[0-9]{10}"
                inputMode="numeric"
                required
              />
              <input
                name="addressLine1"
                value={form.addressLine1}
                onChange={handleInputChange}
                placeholder="Address Line 1"
                className="px-4 py-2 border rounded-lg col-span-2"
                required
              />
              <input
                name="addressLine2"
                value={form.addressLine2}
                onChange={handleInputChange}
                placeholder="Address Line 2"
                className="px-4 py-2 border rounded-lg col-span-2"
              />
              <input
                name="city"
                value={form.city}
                onChange={handleInputChange}
                placeholder="City"
                className="px-4 py-2 border rounded-lg"
                required
              />
              <input
                name="state"
                value={form.state}
                onChange={handleInputChange}
                placeholder="State"
                className="px-4 py-2 border rounded-lg"
                required
              />
              <input
                name="pincode"
                value={form.pincode}
                onChange={handleInputChange}
                placeholder="Pincode"
                className="px-4 py-2 border rounded-lg"
                inputMode="numeric"
                maxLength={6}
                pattern="[0-9]{6}"
                required
              />
              <input
                name="country"
                value={form.country}
                onChange={handleInputChange}
                placeholder="Country"
                className="px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div className="flex items-center gap-4">
              <button
                type="submit"
                className="px-6 py-3 bg-primary text-white rounded-lg font-semibold disabled:opacity-50"
                disabled={adding}
              >
                Add Address
              </button>
              <button
                type="button"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold"
                onClick={() => router.push("/profile/address")}
              >
                Manage Addresses
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-6">
          <div className="border rounded-lg p-4 bg-white">
            <h2 className="font-semibold mb-4">Order Summary</h2>
            <div className="mb-4 space-y-2 max-h-56 overflow-y-auto">
              {cart.items.map((item) => (
                <div key={item._id} className="flex justify-between text-sm">
                  <span>
                    {item.product.name} x {item.quantity}
                  </span>
                  <span>{formatPrice(item.sellingPrice * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(cart.totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span>-{formatPrice(cart.totals.discount)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base mt-2">
                <span>Total</span>
                <span>{formatPrice(cart.totals.total)}</span>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-white">
            <h2 className="font-semibold mb-2">Payment</h2>
            {!selected && (
              <p className="text-sm text-red-500 mb-2">Please select a delivery address to continue.</p>
            )}
            {codConfig && (
              <p className="text-xs text-gray-500 mb-3">
                Cash on Delivery is available up to {formatPrice(codConfig.maxOrderAmount)}. A minimum
                prepaid amount of {formatPrice(codConfig.minPrepaidAmount)} is required for COD orders as per
                store policy.
              </p>
            )}
            <div className="flex flex-col gap-3">
              <button
                className="px-6 py-3 bg-primary text-white rounded-lg font-semibold disabled:opacity-50"
                disabled={isLoading || !selected}
                onClick={handleRazorpay}
              >
                Pay Online (Razorpay)
              </button>
              <button
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold disabled:opacity-50"
                disabled={isLoading || !selected}
                onClick={handlePlaceOrder}
              >
                Cash on Delivery
              </button>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
