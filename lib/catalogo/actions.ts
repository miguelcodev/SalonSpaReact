"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSalonId } from "@/lib/supabase/session";
import {
  newServiceSchema,
  newComboSchema,
  type NewServiceInput,
  type NewComboInput,
} from "./schemas";

type Ok = { ok: true };
type Err = { ok: false; error: string };
type ActionResult<T extends object = object> = (Ok & T) | Err;

/**
 * Creates a service and its per-staff prices. Not wrapped in a single
 * Postgres transaction (no RPC exists for this, unlike appointments' combo
 * creation) — if the price insert fails after the service was created, we
 * best-effort delete the orphaned service so retrying doesn't leave a
 * service with zero prices (which would silently make it unbookable).
 */
export async function createService(
  input: NewServiceInput
): Promise<ActionResult<{ serviceId: string }>> {
  const parsed = newServiceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Datos inválidos" };
  }

  const supabase = await createClient();
  const salonId = await getCurrentSalonId();
  const { categoryId, name, description, durationMinutes, bufferMinutes, prices } =
    parsed.data;

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .insert({
      salon_id: salonId,
      category_id: categoryId,
      name,
      description: description || null,
      duration_minutes: durationMinutes,
      buffer_minutes: bufferMinutes,
      status: "activo",
    })
    .select("id")
    .single();

  if (serviceError || !service) {
    console.error("Error creating service:", serviceError);
    return { ok: false, error: "No se pudo crear el servicio" };
  }

  const { error: pricesError } = await supabase.from("service_staff_prices").insert(
    prices.map((p) => ({
      service_id: service.id,
      staff_id: p.staffId,
      price_cents: p.priceCents,
    }))
  );

  if (pricesError) {
    console.error("Error creating service prices:", pricesError);
    await supabase.from("services").delete().eq("id", service.id);
    return { ok: false, error: "No se pudieron guardar los precios" };
  }

  revalidatePath("/catalogo");
  return { ok: true, serviceId: service.id };
}

export async function toggleServiceStatus(
  serviceId: string,
  currentStatus: "activo" | "pausado"
): Promise<ActionResult> {
  const supabase = await createClient();
  const nextStatus = currentStatus === "activo" ? "pausado" : "activo";

  const { error } = await supabase
    .from("services")
    .update({ status: nextStatus })
    .eq("id", serviceId);

  if (error) {
    console.error("Error toggling service status:", error);
    return { ok: false, error: "No se pudo actualizar el estado" };
  }

  revalidatePath("/catalogo");
  return { ok: true };
}

export async function deleteService(serviceId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("services").delete().eq("id", serviceId);

  if (error) {
    // Most likely a FK violation (23503) — the service has appointments or
    // combo_services referencing it, so it can't be hard-deleted.
    const message =
      error.code === "23503"
        ? "No se puede eliminar: el servicio tiene citas o combos asociados. Pausa el servicio en su lugar."
        : "No se pudo eliminar el servicio";
    console.error("Error deleting service:", error);
    return { ok: false, error: message };
  }

  revalidatePath("/catalogo");
  return { ok: true };
}

export async function createCombo(
  input: NewComboInput
): Promise<ActionResult<{ comboId: string }>> {
  const parsed = newComboSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Datos inválidos" };
  }

  const supabase = await createClient();
  const salonId = await getCurrentSalonId();
  const { name, combinedPriceCents, serviceIds } = parsed.data;

  const { data: combo, error: comboError } = await supabase
    .from("combos")
    .insert({
      salon_id: salonId,
      name,
      combined_price_cents: combinedPriceCents,
      active: true,
    })
    .select("id")
    .single();

  if (comboError || !combo) {
    console.error("Error creating combo:", comboError);
    return { ok: false, error: "No se pudo crear el combo" };
  }

  const { error: linkError } = await supabase.from("combo_services").insert(
    serviceIds.map((serviceId) => ({
      combo_id: combo.id,
      service_id: serviceId,
    }))
  );

  if (linkError) {
    console.error("Error linking combo services:", linkError);
    await supabase.from("combos").delete().eq("id", combo.id);
    return { ok: false, error: "No se pudieron vincular los servicios" };
  }

  revalidatePath("/catalogo");
  return { ok: true, comboId: combo.id };
}

export async function toggleComboActive(
  comboId: string,
  currentActive: boolean
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("combos")
    .update({ active: !currentActive })
    .eq("id", comboId);

  if (error) {
    console.error("Error toggling combo:", error);
    return { ok: false, error: "No se pudo actualizar el combo" };
  }

  revalidatePath("/catalogo");
  return { ok: true };
}

export async function deleteCombo(comboId: string): Promise<ActionResult> {
  const supabase = await createClient();

  // combo_services rows cascade on delete (schema: on delete cascade)
  const { error } = await supabase.from("combos").delete().eq("id", comboId);

  if (error) {
    console.error("Error deleting combo:", error);
    return { ok: false, error: "No se pudo eliminar el combo" };
  }

  revalidatePath("/catalogo");
  return { ok: true };
}
