"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const categories = ["All", "Top", "Bottom", "Accessories"];

type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  quantity: number;
};

type CartItem = Product & { cartQuantity: number };

const CART_STORAGE_KEY = "cart";

export default function SelectedItemPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  function addToCart(product: Product) {
    const existingItem = cartItems.find((item) => item.id === product.id);
    const updatedCart = existingItem
      ? cartItems.map((item) =>
          item.id === product.id
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        )
      : [...cartItems, { ...product, cartQuantity: 1 }];

    setCartItems(updatedCart);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
  }

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("/api/product");
        const result = await response.json();

        if (result.success) {
          setProducts(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return (
    <div className="mx-auto min-h-screen w-full max-w-sm border border-gray-300 bg-white text-gray-800">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            className="rounded-md bg-gray-200 px-3 py-2 text-lg leading-none"
            aria-label="Menu"
          >
            ☰
          </button>
          <span className="text-lg font-semibold">NOOC.</span>
        </div>

        <button
          className="relative text-2xl"
          aria-label="Cart"
          onClick={() => router.push("/checkout")}
        >
          🛒
          {cartItems.length > 0 && (
            <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-500 text-[10px] text-white">
              {cartItems.reduce((total, item) => total + item.cartQuantity, 0)}
            </span>
          )}
        </button>
      </header>

      {/* Search */}
      <div className="px-4 pt-3">
        <div className="flex items-center rounded-lg border border-gray-400 px-3 py-2">
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
          <span aria-hidden>🔍</span>
        </div>
      </div>

      {/* Category tabs */}
      <nav className="mt-3 flex gap-5 overflow-x-auto border-b border-gray-200 px-4">
        {categories.map((cat, i) => (
          <button
            key={cat}
            className={`whitespace-nowrap pb-2 text-sm ${
              i === 0
                ? "border-b-2 border-gray-800 font-semibold"
                : "text-gray-600"
            }`}
          >
            {cat}
          </button>
        ))}
      </nav>

      {/* Product list */}
      {loading ? (
        <p className="p-4 text-center text-sm text-gray-500">
          Loading products...
        </p>
      ) : (
        <ul>
          {products.map((p) => (
            <li
              key={p.id}
              className="flex gap-4 border-b border-gray-200 px-4 py-4"
            >
              <img
                src={p.image}
                alt={p.name}
                className="h-24 w-24 shrink-0 rounded-lg border border-gray-300 object-cover"
              />

              <div className="flex flex-1 flex-col">
                <h3 className="font-semibold">{p.name}</h3>

                <p className="mt-2 font-semibold">
                  Rp {p.price.toLocaleString("id-ID")}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {p.description}
                </p>

                <button
                  className="mt-auto self-end rounded-md border border-gray-400 px-4 py-1 text-sm"
                  onClick={() => addToCart(p)}
                >
                  Add +
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}