import mongoose, { Schema } from "mongoose";

const PaymentSchema = new Schema(
	{
		checkoutId: {
			type: Schema.Types.ObjectId,
			ref: "Checkout",
			required: true,
		},
		externalId: { type: String, required: true, unique: true },
		xenditInvoiceId: { type: String, required: true, unique: true },
		invoiceUrl: { type: String, required: true },
		amount: { type: Number, required: true },
		paymentMethod: {
			type: String,
			enum: ["ovo", "shopeepay", "dana"],
			required: true,
		},
		shippingAddress: {
			name: { type: String },
			address: { type: String },
		},
		status: {
			type: String,
			enum: ["PENDING", "PAID", "SETTLED", "EXPIRED", "FAILED"],
			default: "PENDING",
		},
	},
	{
		collection: "payments",
		timestamps: true,
	}
);

const Payment = mongoose.models.Payment ?? mongoose.model("Payment", PaymentSchema);

export default Payment;
