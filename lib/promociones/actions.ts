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
