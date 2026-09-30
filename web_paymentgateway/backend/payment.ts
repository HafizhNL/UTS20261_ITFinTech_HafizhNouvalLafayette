import mongoose from "mongoose";
import Checkout from "@/models/Checkout";
import Payment from "@/models/Payment";
import { connectDB } from "@/lib/mongodb";
import { xenditConfig } from "@/lib/xendit";

type XenditInvoiceResponse = {
	id: string;
	external_id: string;
	invoice_url: string;
};

export type ShippingAddress = {
	name: string;
	address: string;
};

export type PaymentMethod = "ewallet" | "bank_transfer";

export async function createXenditInvoice(
	checkoutId: string,
	shippingAddress: ShippingAddress,
	paymentMethod: PaymentMethod
) {
	if (!mongoose.isValidObjectId(checkoutId)) {
		throw new Error("Invalid checkout id");
	}

	if (!["ewallet", "bank_transfer"].includes(paymentMethod)) {
		throw new Error("Invalid payment method");
	}

	await connectDB();

	const checkout = await Checkout.findById(checkoutId).lean();

	if (!checkout) {
		throw new Error("Checkout not found");
	}

	const checkoutObjectId = new mongoose.Types.ObjectId(checkoutId);
	const paymentShippingAddress = {
		name: shippingAddress.name,
		address: shippingAddress.address,
	};

	await Checkout.collection.updateOne(
		{ _id: checkoutObjectId },
		{ $set: { shippingAddress } }
	);

	await Payment.collection.updateOne(
		{ checkoutId: checkoutObjectId },
		{ $set: { shippingAddress: paymentShippingAddress, paymentMethod } }
	);

	const existingPayment = await Payment.findOne({ checkoutId }).lean();

	if (existingPayment) {
		return existingPayment;
	}

	const externalId = `checkout-${checkoutId}-${Date.now()}`;
	const response = await fetch("https://api.xendit.co/v2/invoices", {
		method: "POST",
		headers: {
			Authorization: `Basic ${Buffer.from(`${xenditConfig.secretKey}:`).toString("base64")}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			external_id: externalId,
			amount: checkout.total,
			description: `Payment for checkout ${checkoutId}`,
			invoice_duration: 86400,
			success_redirect_url: `${xenditConfig.appUrl}/payment/success?checkoutId=${checkoutId}`,
			failure_redirect_url: `${xenditConfig.appUrl}/payment?checkoutId=${checkoutId}`,
		}),
	});

	const invoice = (await response.json()) as XenditInvoiceResponse & {
		message?: string;
	};

	if (!response.ok || !invoice.id || !invoice.invoice_url) {
		throw new Error(invoice.message || "Failed to create Xendit invoice");
	}

	return Payment.create({
		checkoutId,
		externalId,
		xenditInvoiceId: invoice.id,
		invoiceUrl: invoice.invoice_url,
		amount: checkout.total,
		paymentMethod,
		shippingAddress: paymentShippingAddress,
		status: "PENDING",
	});
}

export async function updatePaymentFromWebhook(payload: {
	id?: string;
	external_id?: string;
	status?: string;
}) {
	await connectDB();

	if (!payload.id && !payload.external_id) {
		throw new Error("Invalid Xendit webhook payload");
	}

	const payment = await Payment.findOne({
		$or: [
			...(payload.id ? [{ xenditInvoiceId: payload.id }] : []),
			...(payload.external_id ? [{ externalId: payload.external_id }] : []),
		],
	});

	if (!payment) {
		throw new Error("Payment not found");
	}

	const status = (payload.status || "").toUpperCase();
	const checkoutStatus =
		status === "PAID" || status === "SETTLED"
			? "paid"
			: status === "EXPIRED" || status === "FAILED"
				? "cancelled"
				: "pending";

	payment.status = ["PAID", "SETTLED", "EXPIRED", "FAILED"].includes(status)
		? status
		: "PENDING";
	await payment.save();

	await Checkout.findByIdAndUpdate(payment.checkoutId, {
		status: checkoutStatus,
	});

	return payment;
}
