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
              item.cartQuantity ?? item.quantity ?? item.qty
            ),
          }))
          .filter(
            (item) =>
              item.id.length > 0 &&
              Number.isInteger(item.cartQuantity) &&
              item.cartQuantity > 0
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
          : item
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
          : "Failed to save checkout"
      );
    } finally {
      setSubmitting(false);
    }
  }

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.cartQuantity,
    0
  );
  const tax = subtotal * 0.11;
  const total = subtotal + tax;
  const formatPrice = (price: number) => `Rp ${price.toLocaleString("id-ID")}`;

  return (
    <div className="mx-auto min-h-screen w-full max-w-sm border border-gray-300 bg-white text-gray-800">
      {/* Header */}
      <header className="relative flex items-center justify-center border-b border-gray-200 px-4 py-3">
        <button
          className="absolute left-4 text-sm text-gray-600"
          onClick={() => router.push("/selected_item")}
        >
          ‹ Back
        </button>
        <h1 className="font-semibold">Checkout</h1>
      </header>

      {/* Cart items */}
      {cartItems.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-gray-500">
          Your cart is empty.
        </p>
      ) : (
        <ul>
          {cartItems.map((item) => (
          <li key={item.id} className="flex items-center gap-3 border-b border-gray-200 px-4 py-4">
            <img
              src={item.image}
              alt={item.name}
              className="h-14 w-14 shrink-0 rounded-lg border border-gray-300 object-cover"
            />
            <div className="flex-1">
              <p className="font-semibold">{item.name}</p>
              <div className="mt-2 inline-flex items-center rounded-md border border-gray-400 text-sm">
                <button
                  className="px-2 py-0.5"
                  aria-label="Decrease quantity"
                  onClick={() => updateQuantity(item.id, -1)}
                >
                  −
                </button>
                <span className="border-x border-gray-400 px-3 py-0.5">{item.cartQuantity}</span>
                <button
                  className="px-2 py-0.5"
                  aria-label="Increase quantity"
                  onClick={() => updateQuantity(item.id, 1)}
                >
                  +
                </button>
              </div>
            </div>
            <span className="text-sm font-semibold">
              {formatPrice(item.price * item.cartQuantity)}
            </span>
          </li>
          ))}
        </ul>
      )}

      {/* Totals */}
      <div className="space-y-1 px-4 py-4 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>{formatPrice(tax)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4">
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        <button
          className="w-full rounded-lg border border-gray-400 bg-gray-100 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          disabled={cartItems.length === 0 || submitting}
          onClick={saveCheckout}
        >
          {submitting ? "Saving..." : "Continue to Payment →"}
        </button>
      </div>
    </div>
  );
}