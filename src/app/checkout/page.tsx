"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { formatPrice } from "@/lib/utils";
import { orderAPI, userAPI, paymentAPI } from "@/services/api";
import { Plus, CheckCircle2, ChevronDown, MapPin } from "lucide-react";
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
  const [showAddressForm, setShowAddressForm] = useState(false);

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

    if (!form.addressLine1.trim() || form.addressLine1.trim().length < 3) {
      toast.error("Please enter a valid address line 1");
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
      setShowAddressForm(false);
      userAPI.getProfile().then((res) => {
        const sortedAddresses = res.data.user.addresses || [];
        setAddresses(sortedAddresses);
        if (sortedAddresses.length > 0) {
          setSelectedAddress(sortedAddresses[sortedAddresses.length - 1]._id); // Select newly added
        }
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Checkout</h1>
              <p className="text-gray-600">Select delivery address and review your order.</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {addresses.length === 0 && !showAddressForm && (
              <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No saved addresses</h3>
                <p className="text-gray-500 mb-4">Please add a delivery address to continue.</p>
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add New Address
                </button>
              </div>
            )}

            {addresses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((address) => (
                  <div
                    key={address._id}
                    className={`relative border-2 rounded-xl p-5 cursor-pointer transition-all ${selectedAddress === address._id
                      ? "border-primary bg-primary/5 shadow-sm scale-[1.02]"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    onClick={() => setSelectedAddress(address._id)}
                  >
                    {selectedAddress === address._id && (
                      <div className="absolute top-4 right-4">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <h3 className="font-bold text-lg mb-1 pr-8">{address.name}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                      {address.addressLine1}
                      {address.addressLine2 && <>, {address.addressLine2}</>}
                      <br />
                      {address.city}, {address.state} {address.pincode}
                    </p>
                    <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-800">
                      {address.phone}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {addresses.length > 0 && !showAddressForm && (
              <div className="pt-4">
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="flex items-center gap-2 text-primary font-medium hover:text-primary-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add another address
                </button>
              </div>
            )}
          </div>

          {showAddressForm && (
            <div className="bg-white border rounded-xl p-6 shadow-sm mb-8 animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Add New Address</h2>
                <button
                  onClick={() => setShowAddressForm(false)}
                  className="text-sm font-medium text-gray-500 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleAddAddress} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleInputChange}
                      placeholder="e.g. John Doe"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. 9876543210"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      type="tel"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      inputMode="numeric"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                    <input
                      name="addressLine1"
                      value={form.addressLine1}
                      onChange={handleInputChange}
                      placeholder="House No., Building Name, Street"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
                    <input
                      name="addressLine2"
                      value={form.addressLine2}
                      onChange={handleInputChange}
                      placeholder="Sector, Area, or Landmark"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <input
                      name="pincode"
                      value={form.pincode}
                      onChange={handleInputChange}
                      placeholder="e.g. 110001"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      inputMode="numeric"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleInputChange}
                      placeholder="e.g. New Delhi"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      name="state"
                      value={form.state}
                      onChange={handleInputChange}
                      placeholder="e.g. Delhi"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      name="country"
                      value={form.country}
                      onChange={handleInputChange}
                      placeholder="e.g. India"
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t mt-6">
                  <button
                    type="button"
                    className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => setShowAddressForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                    disabled={adding}
                  >
                    {adding ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Address"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
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
