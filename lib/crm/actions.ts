"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getCurrentSalonId } from "@/lib/supabase/session";
import { newClientSchema, type NewClientInput } from "./schemas";

export async function addClient(
  input: NewClientInput
): Promise<{ ok: true; clientId: string } | { ok: false; error: string }> {
  const parsed = newClientSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Datos inválidos" };
  }

  const supabase = await createSupabaseClient();
  const salonId = await getCurrentSalonId();

  const { data, error } = await supabase
    .from("clients")
    .insert({
      salon_id: salonId,
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      birth_date: parsed.data.birthDate || null,
      preferences: parsed.data.preferences || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating client:", error);
    return { ok: false, error: "No se pudo crear la clienta" };
  }

  revalidatePath("/crm");
  return { ok: true, clientId: data.id };
}
