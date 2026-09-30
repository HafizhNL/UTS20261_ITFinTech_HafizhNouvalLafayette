"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  cartQuantity: number;
};

const CART_STORAGE_KEY = "cart";

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);

    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart) as Array<
          Partial<CartItem> & { quantity?: number; qty?: number }
        >;
        const validCart = parsedCart
          .map((item) => ({
            ...item,
            id: String(item.id ?? ""),
            cartQuantity: Number(
              item.cartQuantity ?? item.quantity ?? item.qty,
            ),
          }))
          .filter(
            (item) =>
              item.id.length > 0 &&
              Number.isInteger(item.cartQuantity) &&
              item.cartQuantity > 0,
          ) as CartItem[];

        setCartItems(validCart);
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(validCart));
      } catch {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  }, []);

  function updateQuantity(id: string, change: number) {
    const updatedCart = cartItems
      .map((item) =>
        item.id === id
          ? { ...item, cartQuantity: item.cartQuantity + change }
          : item,
      )
      .filter((item) => item.cartQuantity > 0);

    setCartItems(updatedCart);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
  }

  async function saveCheckout() {
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.id,
            quantity: item.cartQuantity,
          })),
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to save checkout");
      }

      router.push(`/payment?checkoutId=${result.data._id}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to save checkout",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.cartQuantity,
    0,
  );
  const tax = subtotal * 0.11;
  const total = subtotal + tax;
  const formatPrice = (price: number) => `Rp ${price.toLocaleString("id-ID")}`;

  return (
    <div className="mx-auto min-h-screen w-full max-w-sm bg-stone-50 text-stone-900 shadow-xl">
      {/* Header */}
      <header className="sticky top-0 z-20 relative flex items-center justify-center border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur">
        <button
          className="absolute left-4 rounded-full bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-200"
          onClick={() => router.push("/selected_item")}
        >
          ‹ Back
        </button>
        <h1 className="font-extrabold tracking-wide">
          Checkout<span className="text-rose-500">.</span>
        </h1>
      </header>

      {/* Cart items */}
      {cartItems.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-stone-500">
          Your cart is empty.
        </p>
      ) : (
        <ul className="mt-2 bg-white">
          {cartItems.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 border-b border-rose-100 px-4 py-4 odd:bg-white even:bg-rose-50/40"
            >
              <img
                src={item.image}
                alt={item.name}
                className="h-14 w-14 shrink-0 rounded-lg border border-rose-200 bg-stone-100 object-cover"
              />
              <div className="flex-1">
                <p className="font-semibold text-stone-900">{item.name}</p>
                <div className="mt-2 inline-flex items-center overflow-hidden rounded-full border border-rose-300 bg-white text-sm">
                  <button
                    className="px-3 py-0.5 text-rose-600 transition hover:bg-rose-50 active:scale-95"
                    aria-label="Decrease quantity"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    −
                  </button>
                  <span className="border-x border-rose-300 px-3 py-0.5 font-medium">
                    {item.cartQuantity}
                  </span>
                  <button
                    className="px-3 py-0.5 text-rose-600 transition hover:bg-rose-50 active:scale-95"
                    aria-label="Increase quantity"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              <span className="text-sm font-bold text-rose-600">
                {formatPrice(item.price * item.cartQuantity)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Totals */}
      <div className="mx-4 mt-4 space-y-2 rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-stone-100">
        <div className="flex justify-between text-stone-600">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-stone-600">
          <span>Tax</span>
          <span>{formatPrice(tax)}</span>
        </div>
        <div className="flex justify-between border-t border-dashed border-stone-200 pt-2 text-base font-bold text-stone-900">
          <span>Total</span>
          <span className="text-rose-600">{formatPrice(total)}</span>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 py-4">
        {error && (
          <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-100">
            {error}
          </p>
        )}
        <button
          className="w-full rounded-full bg-rose-500 py-3 text-sm font-semibold text-white shadow-md shadow-rose-200 transition hover:bg-rose-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          disabled={cartItems.length === 0 || submitting}
          onClick={saveCheckout}
        >
          {submitting ? "Saving..." : "Continue to Payment →"}
        </button>
      </div>
    </div>
  );
}
