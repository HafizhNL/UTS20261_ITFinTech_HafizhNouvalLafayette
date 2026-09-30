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
		<main className="mx-auto flex min-h-screen w-full max-w-sm items-center justify-center border border-gray-300 bg-white px-6 text-center text-gray-800">
			<div>
				<h1 className="text-xl font-semibold">Payment received</h1>
				<p className="mt-2 text-sm text-gray-500">
					Yourpayment is being confirmed. Redirecting in {secondsLeft}s...
				</p>
			</div>
		</main>
	);
}
