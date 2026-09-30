import { createCheckout, getCheckout } from "@/backend/checkout";

export async function GET(request: Request) {
  try {
    const checkoutId = new URL(request.url).searchParams.get("checkoutId");

    if (!checkoutId) {
      return Response.json(
        { success: false, message: "checkoutId is required" },
        { status: 400 }
      );
    }

    const checkout = await getCheckout(checkoutId);

    return Response.json({ success: true, data: checkout });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get checkout";
    const status = /invalid|required|not found/i.test(message) ? 400 : 500;

    return Response.json({ success: false, message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      items?: Array<{ productId?: string | number; quantity?: number }>;
    };

    if (!body.items) {
      return Response.json(
        { success: false, message: "Checkout items are required" },
        { status: 400 }
      );
    }

    const checkout = await createCheckout({
      items: body.items.map((item) => ({
        productId: String(item.productId ?? ""),
        quantity: Number(item.quantity),
      })),
    });

    return Response.json({ success: true, data: checkout }, { status: 201 });
  } catch (error) {
    console.error(error);

    const message = error instanceof Error ? error.message : "Failed to create checkout";
    const status = /required|invalid|not found/i.test(message) ? 400 : 500;

    return Response.json(
      { success: false, message },
      { status }
    );
  }
}