"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const paymentMethods = [
  { id: "ewallet", label: "E-Wallet" },
  { id: "bank_transfer", label: "Bank Transfer" },
];

type CheckoutSummary = {
  items: Array<{ quantity: number }>;
  subtotal: number;
  tax: number;
  total: number;
};

type ShippingAddress = {
  name: string;
  address: string;
};

type PaymentMethod = (typeof paymentMethods)[number]["id"];

export default function PaymentPage() {
  const router = useRouter();
  const [checkoutId, setCheckoutId] = useState("");
  const [checkout, setCheckout] = useState<CheckoutSummary | null>(null);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: "",
    address: "",
  });
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("ewallet");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCheckoutId(new URLSearchParams(window.location.search).get("checkoutId") || "");
  }, []);

  useEffect(() => {
    if (!checkoutId) {
      return;
    }

    async function fetchCheckout() {
      try {
        const response = await fetch(
          `/api/checkout?checkoutId=${encodeURIComponent(checkoutId)}`
        );
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Checkout tidak ditemukan");
        }

        setCheckout(result.data);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Gagal mengambil checkout"
        );
      }
    }

    fetchCheckout();
  }, [checkoutId]);

  const formatPrice = (price: number) => `Rp ${price.toLocaleString("id-ID")}`;
  const itemCount = checkout?.items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  async function confirmPayment() {
    if (!checkoutId) {
      setError("Checkout tidak ditemukan");
      return;
    }
    // Validate name
    if (!shippingAddress.name.trim()) {
      setError("Nama penerima harus diisi");
      return;
    }
    // Validate shipping address
    if (Object.values(shippingAddress).some((value) => !value.trim())) {
      setError("Alamat pengiriman harus diisi");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutId, shippingAddress, paymentMethod }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal membuat transaksi");
      }

      window.location.assign(result.data.invoiceUrl);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Gagal membuat transaksi"
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-sm border border-gray-300 bg-white text-gray-800">
      {/* Header */}
      <header className="relative flex items-center justify-center border-b border-gray-200 px-4 py-3">
        <button
          className="absolute left-4 text-sm text-gray-600"
          onClick={() => router.push("/checkout")}
        >
          ‹ Back
        </button>
        <h1 className="text-sm font-semibold">Secure Checkout</h1>
      </header>

      <div className="space-y-6 px-4 py-4 text-sm">
        {/* Shipping address */}
        <section>
          <h2 className="mb-2 font-medium">Shipping Address</h2>
          <div className="space-y-2">
            <input
              value={shippingAddress.name}
              onChange={(event) =>
                setShippingAddress({
                  ...shippingAddress,
                  name: event.target.value,
                })
              }
              placeholder="Nama penerima"
              className="w-full rounded border border-gray-300 px-3 py-2 outline-none"
            />
            <textarea
              value={shippingAddress.address}
              onChange={(event) =>
                setShippingAddress({
                  ...shippingAddress,
                  address: event.target.value,
                })
              }
              placeholder="Alamat lengkap"
              rows={3}
              className="w-full rounded border border-gray-300 px-3 py-2 outline-none"
            />
          </div>
        </section>

        {/* Payment method */}
        <section>
          <h2 className="mb-2 font-medium">Payment Method</h2>
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <label key={method.id} className="flex items-start gap-2">
                <input
                  type="radio"
                  name="payment"
                  value={method.id}
                  checked={paymentMethod === method.id}
                  onChange={() => setPaymentMethod(method.id)}
                  className="mt-0.5"
                />
                <span>{method.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Order summary */}
        <section>
          <h2 className="mb-2 font-medium">Order Summary</h2>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Item(s)</span>
              <span>{itemCount ?? "Loading..."}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{checkout ? formatPrice(checkout.subtotal) : "Loading..."}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{checkout ? formatPrice(checkout.tax) : "Loading..."}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>
                {checkout ? formatPrice(checkout.total) : "Loading..."}
              </span>
            </div>
          </div>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          className="w-full rounded-lg bg-gray-600 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={submitting || !checkout}
          onClick={confirmPayment}
        >
          {submitting ? "Connecting to Xendit..." : "Confirm & Pay"}
        </button>
      </div>
    </div>
  );
}