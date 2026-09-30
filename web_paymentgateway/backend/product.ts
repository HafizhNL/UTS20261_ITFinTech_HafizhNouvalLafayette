import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

export async function getProducts() {
  await connectDB();

  const products = await Product.find().lean();

  return products.map((product) => ({
    ...product,
    id: String(product.id ?? product._id),
  }));
}