"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const paymentMethods = [
  { id: "ovo", label: "OVO" },
  { id: "shopeepay", label: "ShopeePay" },
  { id: "dana", label: "DANA" },
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ovo");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCheckoutId(
      new URLSearchParams(window.location.search).get("checkoutId") || "",
    );
  }, []);

  useEffect(() => {
    if (!checkoutId) {
      return;
    }

    async function fetchCheckout() {
      try {
        const response = await fetch(
          `/api/checkout?checkoutId=${encodeURIComponent(checkoutId)}`,
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
            : "Gagal mengambil checkout",
        );
      }
    }

    fetchCheckout();
  }, [checkoutId]);

  const formatPrice = (price: number) => `Rp ${price.toLocaleString("id-ID")}`;
  const itemCount = checkout?.items.reduce(
    (total, item) => total + item.quantity,
    0,
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
          : "Gagal membuat transaksi",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-sm bg-stone-50 text-stone-900 shadow-xl">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-center border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur">
        <button
          className="absolute left-4 rounded-full bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-200"
          onClick={() => router.push("/checkout")}
        >
          ‹ Back
        </button>
        <h1 className="text-sm font-extrabold tracking-wide">
          🔒 Secure Checkout<span className="text-rose-500">.</span>
        </h1>
      </header>

      <div className="space-y-4 px-4 py-4 text-sm">
        {/* Shipping address */}
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100">
          <h2 className="mb-3 font-bold text-stone-900">Shipping Address</h2>
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
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 outline-none transition placeholder:text-stone-400 focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
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
              className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 outline-none transition placeholder:text-stone-400 focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
            />
          </div>
        </section>

        {/* Payment method */}
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100">
          <h2 className="mb-3 font-bold text-stone-900">Payment Method</h2>
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <label
                key={method.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition ${
                  paymentMethod === method.id
                    ? "border-rose-400 bg-rose-50 ring-2 ring-rose-100"
                    : "border-stone-200 bg-white hover:bg-stone-50"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={method.id}
                  checked={paymentMethod === method.id}
                  onChange={() => setPaymentMethod(method.id)}
                  className="mt-0.5 accent-rose-500"
                />
                <span
                  className={
                    paymentMethod === method.id
                      ? "font-medium text-stone-900"
                      : "text-stone-700"
                  }
                >
                  {method.label}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Order summary */}
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100">
          <h2 className="mb-3 font-bold text-stone-900">Order Summary</h2>
          <div className="space-y-2 text-stone-600">
            <div className="flex justify-between">
              <span>Item(s)</span>
              <span>{itemCount ?? "Loading..."}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>
                {checkout ? formatPrice(checkout.subtotal) : "Loading..."}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{checkout ? formatPrice(checkout.tax) : "Loading..."}</span>
            </div>
            <div className="flex justify-between border-t border-dashed border-stone-200 pt-2 text-base font-bold text-stone-900">
              <span>Total</span>
              <span className="text-rose-600">
                {checkout ? formatPrice(checkout.total) : "Loading..."}
              </span>
            </div>
          </div>
        </section>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-100">
            {error}
          </p>
        )}

        <button
          className="w-full rounded-full bg-rose-500 py-3 font-semibold text-white shadow-md shadow-rose-200 transition hover:bg-rose-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          disabled={submitting || !checkout}
          onClick={confirmPayment}
        >
          {submitting
            ? "Connecting to Xendit..."
            : `Pay with ${paymentMethods.find((method) => method.id === paymentMethod)?.label}`}
        </button>
      </div>
    </div>
  );
}
