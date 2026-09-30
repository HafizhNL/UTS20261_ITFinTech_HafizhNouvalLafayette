"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(3);

  useEffect(() => {
    localStorage.removeItem("cart");

    const redirectTimer = window.setTimeout(() => {
      router.push("/selected_item");
    }, 3000);
    const countdownTimer = window.setInterval(() => {
      setSecondsLeft((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => {
      window.clearTimeout(redirectTimer);
      window.clearInterval(countdownTimer);
    };
  }, [router]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm items-center justify-center bg-stone-50 px-6 text-center text-stone-900 shadow-xl">
      <div className="w-full rounded-3xl bg-white p-8 shadow-sm ring-1 ring-stone-100">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-3xl text-white shadow-md shadow-rose-200">
            ✓
          </div>
        </div>

        <h1 className="mt-6 text-xl font-extrabold">
          Payment received<span className="text-rose-500">.</span>
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Yourpayment is being confirmed. Redirecting in {secondsLeft}s...
        </p>

        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-rose-500" />
        </div>
      </div>
    </main>
  );
}
