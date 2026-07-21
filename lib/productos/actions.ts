"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSalonId } from "@/lib/supabase/session";
import { newProductSchema, stockMovementSchema, type NewProductInput, type StockMovementInput } from "./schemas";

type Ok = { ok: true };
type Err = { ok: false; error: string };
type ActionResult<T extends object = object> = (Ok & T) | Err;

export async function createProduct(
  input: NewProductInput
): Promise<ActionResult<{ productId: string }>> {
  const parsed = newProductSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Datos inválidos" };
  }

  const supabase = await createClient();
  const salonId = await getCurrentSalonId();
  const { categoryId, name, description, sku, priceCents, initialStock, lowStockThreshold } =
    parsed.data;

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      salon_id: salonId,
      category_id: categoryId,
      name,
      description: description || null,
      sku: sku || null,
      price_cents: priceCents,
      low_stock_threshold: lowStockThreshold,
      status: "activo",
    })
    .select("id")
    .single();

  if (productError || !product) {
    console.error("Error creating product:", productError);
    return { ok: false, error: "No se pudo crear el producto" };
  }

  if (initialStock > 0) {
    const { error: stockError } = await supabase.from("stock_movements").insert({
      product_id: product.id,
      salon_id: salonId,
      type: "entrada",
      quantity: initialStock,
      reason: "Stock inicial",
    });

    if (stockError) {
      console.error("Error registering initial stock:", stockError);
      await supabase.from("products").delete().eq("id", product.id);
      return { ok: false, error: "No se pudo registrar el stock inicial" };
    }
  }

  revalidatePath("/productos");
  return { ok: true, productId: product.id };
}

export async function toggleProductStatus(
  productId: string,
  currentStatus: "activo" | "pausado"
): Promise<ActionResult> {
  const supabase = await createClient();
  const nextStatus = currentStatus === "activo" ? "pausado" : "activo";

  const { error } = await supabase
    .from("products")
    .update({ status: nextStatus })
    .eq("id", productId);

  if (error) {
    console.error("Error toggling product status:", error);
    return { ok: false, error: "No se pudo actualizar el estado" };
  }

  revalidatePath("/productos");
  return { ok: true };
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) {
    const message =
      error.code === "23503"
        ? "No se puede eliminar: el producto tiene ventas asociadas. Pausa el producto en su lugar."
        : "No se pudo eliminar el producto";
    console.error("Error deleting product:", error);
    return { ok: false, error: message };
  }

  revalidatePath("/productos");
  return { ok: true };
}

export async function registerStockMovement(
  input: StockMovementInput
): Promise<ActionResult> {
  const parsed = stockMovementSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Datos inválidos" };
  }

  const supabase = await createClient();
  const salonId = await getCurrentSalonId();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { productId, type, quantity, reason } = parsed.data;

  if (type === "salida") {
    const { data: product } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", productId)
      .single();
    if (product && product.stock_quantity < quantity) {
      return {
        ok: false,
        error: `Stock insuficiente: quedan ${product.stock_quantity} unidades`,
      };
    }
  }

  const { error } = await supabase.from("stock_movements").insert({
    product_id: productId,
    salon_id: salonId,
    type,
    quantity,
    reason,
    created_by: user?.id || null,
  });

  if (error) {
    console.error("Error registering stock movement:", error);
    return { ok: false, error: "No se pudo registrar el movimiento" };
  }

  revalidatePath("/productos");
  return { ok: true };
}
