import {
  createXenditInvoice,
  PaymentMethod,
  ShippingAddress,
} from "@/backend/payment";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      checkoutId?: string;
      shippingAddress?: ShippingAddress;
      paymentMethod?: PaymentMethod;
    };

    if (!body.checkoutId || !body.shippingAddress || !body.paymentMethod) {
      return Response.json(
        {
          success: false,
          message: "checkoutId, shippingAddress, and paymentMethod are required",
        },
        { status: 400 }
      );
    }

    const payment = await createXenditInvoice(
      body.checkoutId,
      body.shippingAddress,
      body.paymentMethod
    );

    return Response.json({ success: true, data: payment }, { status: 201 });
  } catch (error) {
    console.error(error);

    const message = error instanceof Error ? error.message : "Payment failed";
    const status = /required|invalid|not found/i.test(message) ? 400 : 500;

    return Response.json({ success: false, message }, { status });
  }
}