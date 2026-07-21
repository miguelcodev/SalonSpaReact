"use server";

import { createClient } from "@/lib/supabase/server";
import type { ProductCategory, ProductWithCategory, StockMovementEntry, ProductSearchResult } from "./types";

export async function getProductCategories(): Promise<ProductCategory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_categories")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching product categories:", error);
    return [];
  }

  return data;
}

export async function getProductsWithCategory(): Promise<ProductWithCategory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(`*, category:product_categories (*)`)
    .order("name");

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return data as unknown as ProductWithCategory[];
}

export async function getStockMovements(productId: string): Promise<StockMovementEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stock_movements")
    .select("id, type, quantity, reason, reference_sale_id, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("Error fetching stock movements:", error);
    return [];
  }

  return data;
}

/**
 * Search for the product picker in Ventas. Only active products with stock
 * left are worth showing — an out-of-stock product can't be added to a
 * cart anyway (fn_register_sale would reject it).
 */
export async function getProductsForSearch(query: string): Promise<ProductSearchResult[]> {
  const supabase = await createClient();

  let request = supabase
    .from("products")
    .select("id, name, price_cents, stock_quantity")
    .eq("status", "activo")
    .gt("stock_quantity", 0)
    .order("name")
    .limit(8);

  if (query.trim()) {
    request = request.ilike("name", `%${query.trim()}%`);
  }

  const { data, error } = await request;

  if (error) {
    console.error("Error searching products:", error);
    return [];
  }

  return data;
}
