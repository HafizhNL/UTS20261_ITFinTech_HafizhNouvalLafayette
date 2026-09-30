import mongoose, { Schema } from "mongoose";

const CheckoutSchema = new Schema(
	{
		items: [
			{
				_id: false,
				productId: { type: String, required: true },
				name: { type: String, required: true },
				price: { type: Number, required: true },
				quantity: { type: Number, required: true, min: 1 },
			},
		],
		shippingAddress: {
			fullName: { type: String },
			address: { type: String },
		},
		subtotal: { type: Number, required: true },
		tax: { type: Number, required: true },
		total: { type: Number, required: true },
		status: {
			type: String,
			enum: ["pending", "paid", "cancelled"],
			default: "pending",
		},
	},
	{
		collection: "checkouts",
		timestamps: true,
	}
);

const Checkout =
	mongoose.models.Checkout || mongoose.model("Checkout", CheckoutSchema);

export default Checkout;
