"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Resolve the current authenticated user's salon_id — the app-side
 * equivalent of Postgres' fn_current_salon_id() used in RLS policies.
 *
 * Every insert into a table with a NOT NULL salon_id column must supply
 * it explicitly: Postgres has no default/trigger populating it, and RLS
 * only *filters* rows, it doesn't fill in missing columns on write.
 */
export async function getCurrentSalonId(): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No hay sesión activa");
  }

  const { data, error } = await supabase
    .from("users")
    .select("salon_id")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    throw new Error("El usuario no está vinculado a ningún salón");
  }

  return data.salon_id;
}
