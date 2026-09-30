import { getProducts } from "@/backend/product";

export async function GET() {
  try {
    const products = await getProducts();

    return Response.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        message: "Failed to get products",
      },
      { status: 500 }
    );
  }
}