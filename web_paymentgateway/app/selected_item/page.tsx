"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const categories = ["All", "Top", "Bottom", "Accessories"];

type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  category?: string;
  image: string;
  quantity: number;
};

type CartItem = Product & { cartQuantity: number };

const CART_STORAGE_KEY = "cart";

export default function SelectedItemPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
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

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !normalizedSearchTerm ||
      product.name.toLowerCase().includes(normalizedSearchTerm) ||
      product.description.toLowerCase().includes(normalizedSearchTerm);
    const matchesCategory =
      activeCategory === "All" || product.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  function addToCart(product: Product) {
    const existingItem = cartItems.find((item) => item.id === product.id);
    const updatedCart = existingItem
      ? cartItems.map((item) =>
          item.id === product.id
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item,
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
    <div className="mx-auto min-h-screen w-full max-w-sm bg-stone-50 text-stone-900 shadow-xl">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-lg leading-none transition hover:bg-stone-200"
            aria-label="Menu"
          >
            ☰
          </button>
          <span className="text-xl font-extrabold tracking-[0.25em]">
            NOOC<span className="text-rose-500">.</span>
          </span>
        </div>

        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-xl transition hover:bg-stone-200"
          aria-label="Cart"
          onClick={() => router.push("/checkout")}
        >
          🛍️
          {cartItems.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {cartItems.reduce((total, item) => total + item.cartQuantity, 0)}
            </span>
          )}
        </button>
      </header>

      {/* Hero banner */}
      <section className="px-4 pt-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-400 via-rose-500 to-orange-400 p-5 text-white">
          <p className="text-xs font-medium uppercase tracking-widest opacity-90">
            New Collection
          </p>
          <h2 className="mt-1 text-2xl font-extrabold leading-tight">
            Tampil Stylish
            <br />
            Setiap Hari
          </h2>
          <p className="mt-1 text-xs opacity-90">
            Diskon hingga 30% item pilihan
          </p>
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/20" />
          <div className="absolute -bottom-8 right-6 h-20 w-20 rounded-full bg-white/10" />
        </div>
      </section>

      {/* Search */}
      <div className="px-4 pt-4">
        <div className="flex items-center rounded-full border border-stone-200 bg-white px-4 py-2.5 shadow-sm transition focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-100">
          <span aria-hidden className="mr-2 text-stone-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Cari kaos, jaket, celana..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-stone-400"
          />
        </div>
      </div>

      {/* Category tabs */}
      <nav className="mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activeCategory === cat
                ? "bg-stone-900 text-white shadow"
                : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </nav>

      {/* Product list */}
      {loading ? (
        <p className="p-4 text-center text-sm text-stone-500">
          Loading products...
        </p>
      ) : (
        <ul className="mt-2 bg-white">
          {filteredProducts.length === 0 ? (
            <li className="p-8 text-center text-sm text-stone-500">
              No products found.
            </li>
          ) : (
            filteredProducts.map((p) => (
              <li
                key={p.id}
                className="flex gap-4 border-b border-rose-100 px-4 py-4 transition odd:bg-white even:bg-rose-50/40 hover:bg-rose-50"
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-24 w-24 shrink-0 rounded-lg border border-rose-200 bg-stone-100 object-cover"
                />

                <div className="flex flex-1 flex-col">
                  <h3 className="font-semibold text-stone-900">{p.name}</h3>

                  <p className="mt-2 font-semibold text-rose-600">
                    Rp {p.price.toLocaleString("id-ID")}
                  </p>

                  <p className="mt-1 text-xs text-stone-500">{p.description}</p>

                  <button
                    className="mt-auto self-end rounded-md border border-rose-500 bg-rose-500 px-4 py-1 text-sm font-medium text-white transition hover:bg-rose-600 active:scale-95"
                    onClick={() => addToCart(p)}
                  >
                    Add +
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
