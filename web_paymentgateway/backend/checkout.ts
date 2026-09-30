import mongoose from "mongoose";
import Checkout from "@/models/Checkout";
import Product from "@/models/Product";
import { connectDB } from "@/lib/mongodb";

type CheckoutInput = {
	items: Array<{
		productId: string;
		quantity: number;
	}>;
};

export async function createCheckout(input: CheckoutInput) {
	if (!Array.isArray(input.items) || input.items.length === 0) {
		throw new Error("Checkout must contain at least one item");
	}

	await connectDB();

	const requestedItems = input.items.map((item) => ({
		productId: String(item.productId).trim(),
		quantity: Number(item.quantity),
	}));

	if (
		requestedItems.some(
			(item) =>
				!item.productId ||
				!Number.isInteger(item.quantity) ||
				item.quantity < 1
		)
	) {
		throw new Error("Invalid checkout items");
	}

	const productQueries = requestedItems.map((item) => {
		const numericId = Number(item.productId);

		if (Number.isInteger(numericId)) {
			return { id: numericId };
		}

		if (mongoose.isValidObjectId(item.productId)) {
			return { _id: item.productId };
		}

		return null;
	}).filter((query): query is { id: number } | { _id: string } => query !== null);

	if (productQueries.length !== requestedItems.length) {
		throw new Error("Invalid product id");
	}

	const products = await Product.find({ $or: productQueries }).lean();
	const productsById = new Map(
		products.map((product) => [String(product.id ?? product._id), product])
	);

	const items = requestedItems.map((requestedItem) => {
		const product = productsById.get(requestedItem.productId);

		if (!product) {
			throw new Error(`Product ${requestedItem.productId} not found`);
		}

		return {
			productId: String(product.id ?? product._id),
			name: product.name,
			price: product.price,
			quantity: requestedItem.quantity,
		};
	});

	const subtotal = items.reduce(
		(total, item) => total + item.price * item.quantity,
		0
	);
	const tax = subtotal * 0.11;

	return Checkout.create({
		items,
		subtotal,
		tax,
		total: subtotal + tax,
	});
}

export async function getCheckout(checkoutId: string) {
	if (!mongoose.isValidObjectId(checkoutId)) {
		throw new Error("Invalid checkout id");
	}

	await connectDB();

	const checkout = await Checkout.findById(checkoutId).lean();

	if (!checkout) {
		throw new Error("Checkout not found");
	}

	return checkout;
}
