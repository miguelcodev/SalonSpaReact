"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSalonId } from "@/lib/supabase/session";
import {
  newPromotionSchema,
  loyaltyProgramSchema,
  type NewPromotionInput,
  type LoyaltyProgramInput,
} from "./schemas";
import { renderTemplate } from "@/lib/whatsapp/template";

type Ok = { ok: true };
type Err = { ok: false; error: string };
type ActionResult<T extends object = object> = (Ok & T) | Err;

export async function createPromotion(
  input: NewPromotionInput
): Promise<ActionResult<{ promotionId: string }>> {
  const parsed = newPromotionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Datos inválidos" };
  }

  const supabase = await createClient();
  const salonId = await getCurrentSalonId();
  const {
    name,
    categoryId,
    discountType,
    discountValue,
    validFrom,
    validTo,
    usageLimit,
    sendWhatsapp,
  } = parsed.data;

  // fixed discounts are stored in cents, same unit as the rest of the schema
  const discountValueStored =
    discountType === "fixed" ? Math.round(discountValue * 100) : discountValue;

  const { data, error } = await supabase
    .from("promotions")
    .insert({
      salon_id: salonId,
      name,
      category_id: categoryId || null,
      discount_type: discountType,
      discount_value: discountValueStored,
      valid_from: validFrom || null,
      valid_to: validTo || null,
      usage_limit: usageLimit ?? null,
      usage_count: 0,
      send_whatsapp: sendWhatsapp,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Error creating promotion:", error);
    return { ok: false, error: "No se pudo crear la promoción" };
  }

  revalidatePath("/promociones");
  return { ok: true, promotionId: data.id };
}

export async function deletePromotion(promotionId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("promotions").delete().eq("id", promotionId);

  if (error) {
    console.error("Error deleting promotion:", error);
    const message =
      error.code === "23503"
        ? "No se puede eliminar: tiene canjes registrados."
        : "No se pudo eliminar la promoción";
    return { ok: false, error: message };
  }

  revalidatePath("/promociones");
  return { ok: true };
}

/**
 * Creates the salon's loyalty program if none exists, or updates the
 * existing one — the product model assumes a single program per salon.
 */
export async function upsertLoyaltyProgram(
  input: LoyaltyProgramInput,
  existingId: string | null
): Promise<ActionResult> {
  const parsed = loyaltyProgramSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Datos inválidos" };
  }

  const supabase = await createClient();
  const { visitsRequired, rewardDescription } = parsed.data;

  if (existingId) {
    const { error } = await supabase
      .from("loyalty_programs")
      .update({
        visits_required: visitsRequired,
        reward_description: rewardDescription,
      })
      .eq("id", existingId);

    if (error) {
      console.error("Error updating loyalty program:", error);
      return { ok: false, error: "No se pudo actualizar el programa" };
    }
  } else {
    const salonId = await getCurrentSalonId();
    const { error } = await supabase.from("loyalty_programs").insert({
      salon_id: salonId,
      visits_required: visitsRequired,
      reward_description: rewardDescription,
      active: true,
    });

    if (error) {
      console.error("Error creating loyalty program:", error);
      return { ok: false, error: "No se pudo crear el programa" };
    }
  }

  revalidatePath("/promociones");
  return { ok: true };
}

function formatPromoDiscount(discountType: string, discountValue: number): string {
  if (discountType === "percent") return `${discountValue}%`;
  return `S/ ${(discountValue / 100).toFixed(0)}`;
}

/**
 * Enqueues one message_queue row per target client — sending happens on the
 * next cron tick (app/api/cron/whatsapp/route.ts), never synchronously from
 * this request. Targeting: clients who've had a non-cancelled appointment
 * for a service in the promo's category (or all clients, if the promo
 * applies to every category) — a defensible reading of "clientas
 * segmentadas" given the schema has no separate audience/segment model.
 */
export async function sendPromotionBlast(
  promotionId: string
): Promise<ActionResult<{ recipientCount: number }>> {
  const supabase = await createClient();
  const salonId = await getCurrentSalonId();

  const { data: promo, error: promoError } = await supabase
    .from("promotions")
    .select("id, name, category_id, discount_type, discount_value, valid_to")
    .eq("id", promotionId)
    .single();

  if (promoError || !promo) {
    return { ok: false, error: "Promoción no encontrada" };
  }

  let clientIds: string[];

  if (promo.category_id) {
    const { data: rows } = await supabase
      .from("appointments")
      .select("client_id, service:services!inner(category_id)")
      .eq("service.category_id", promo.category_id)
      .neq("status", "cancelada");
    clientIds = Array.from(new Set((rows || []).map((r) => r.client_id)));
  } else {
    const { data: rows } = await supabase.from("clients").select("id");
    clientIds = (rows || []).map((r) => r.id);
  }

  if (clientIds.length === 0) {
    return { ok: false, error: "No hay clientas para segmentar esta promoción" };
  }

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, phone")
    .in("id", clientIds)
    .not("phone", "is", null);

  if (!clients || clients.length === 0) {
    return { ok: false, error: "Ninguna clienta segmentada tiene teléfono registrado" };
  }

  const discountLabel = formatPromoDiscount(promo.discount_type, promo.discount_value);
  const validityLabel = promo.valid_to
    ? ` Válida hasta ${new Date(`${promo.valid_to}T00:00:00`).toLocaleDateString("es-PE", { day: "numeric", month: "long" })}.`
    : "";
  const template = `¡Hola {nombre}! 🌸 Tenemos una promo para ti: ${promo.name} — ${discountLabel} de descuento.${validityLabel} Escríbenos para agendar en Bellamora.`;

  const rows = clients.map((c) => ({
    salon_id: salonId,
    client_id: c.id,
    appointment_id: null,
    rule_type: "promocion",
    body: renderTemplate(template, { nombre: c.name }),
    scheduled_for: new Date().toISOString(),
    status: "pendiente" as const,
  }));

  const { error: insertError } = await supabase.from("message_queue").insert(rows);
  if (insertError) {
    console.error("Error enqueueing promotion blast:", insertError);
    return { ok: false, error: "No se pudo encolar el envío" };
  }

  revalidatePath("/whatsapp");
  return { ok: true, recipientCount: rows.length };
}
