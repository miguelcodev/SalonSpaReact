"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSalonId } from "@/lib/supabase/session";
import { newSaleSchema, type NewSaleInput } from "./schemas";

type Ok = { ok: true };
type Err = { ok: false; error: string };
type ActionResult<T extends object = object> = (Ok & T) | Err;

export async function createSale(
  input: NewSaleInput
): Promise<ActionResult<{ saleId: string }>> {
  const parsed = newSaleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Datos inválidos" };
  }

  const supabase = await createClient();
  const salonId = await getCurrentSalonId();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { clientId, appointmentId, channel, items, discountCents, paymentMethod, notes } =
    parsed.data;

  const { data: saleId, error: rpcError } = await supabase.rpc("fn_register_sale", {
    p_salon_id: salonId,
    p_client_id: clientId || null,
    p_appointment_id: appointmentId || null,
    p_channel: channel,
    p_items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
    p_discount_cents: discountCents,
    p_created_by: user?.id || null,
  });

  if (rpcError) {
    let message = "No se pudo registrar la venta";
    if (rpcError.message.includes("Stock insuficiente")) {
      message = rpcError.message.replace(/^.*Stock insuficiente/, "Stock insuficiente");
    } else if (rpcError.message.includes("La cantidad debe ser mayor")) {
      message = "La cantidad debe ser mayor a 0";
    }
    console.error("Error registering sale:", rpcError);
    return { ok: false, error: message };
  }

  if (notes) {
    await supabase.from("sales").update({ notes }).eq("id", saleId);
  }

  // Registrar el pago y marcar la venta como pagada — esta primera versión
  // asume pago inmediato de contado (sin flujo de "pendiente" ni reembolsos).
  const { data: sale } = await supabase
    .from("sales")
    .select("total_cents")
    .eq("id", saleId)
    .single();

  const { error: paymentError } = await supabase.from("payments").insert({
    sale_id: saleId,
    amount_cents: sale?.total_cents || 0,
    method: paymentMethod,
    status: "pagado",
    paid_at: new Date().toISOString(),
  });

  if (paymentError) {
    console.error("Error registering payment:", paymentError);
    return { ok: false, error: "La venta se creó pero no se pudo registrar el pago" };
  }

  await supabase.from("sales").update({ status: "pagado" }).eq("id", saleId);

  revalidatePath("/ventas");
  revalidatePath("/productos");
  revalidatePath("/reportes");
  if (appointmentId) revalidatePath("/agenda");

  return { ok: true, saleId };
}
