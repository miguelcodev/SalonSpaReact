"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import type {
  ClientWithSegments,
  ClientHistoryItem,
  ClientSearchResult,
} from "./types";

/**
 * Get all clients for the salon with their derived segment tags
 * (is_vip, is_inactive, is_birthday_month from view_client_segments).
 *
 * view_client_segments is a plain view (no FK constraints), so it can't be
 * embedded via PostgREST's automatic relationship detection — fetched as a
 * separate query and merged in application code instead. Both queries are
 * scoped to the caller's salon by RLS.
 */
export async function getClientsWithSegments(): Promise<ClientWithSegments[]> {
  const supabase = await createSupabaseClient();

  const [clientsRes, segmentsRes] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase
      .from("view_client_segments")
      .select("client_id, is_vip, is_inactive, is_birthday_month"),
  ]);

  if (clientsRes.error) {
    console.error("Error fetching clients:", {
      message: clientsRes.error.message,
      code: clientsRes.error.code,
      details: clientsRes.error.details,
      hint: clientsRes.error.hint,
    });
    return [];
  }

  const segmentMap = new Map(
    (segmentsRes.data || []).map((s) => [s.client_id, s])
  );

  return clientsRes.data.map((c) => {
    const seg = segmentMap.get(c.id);
    return {
      ...c,
      is_vip: seg?.is_vip ?? false,
      is_inactive: seg?.is_inactive ?? false,
      is_birthday_month: seg?.is_birthday_month ?? false,
    };
  });
}

/**
 * Get a single client's completed appointment history, most recent first.
 */
export async function getClientHistory(
  clientId: string
): Promise<ClientHistoryItem[]> {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `id,
      start_time,
      price_cents,
      service:services (name, category:service_categories (name)),
      staff:staff (name)
    `
    )
    .eq("client_id", clientId)
    .eq("status", "completada")
    .order("start_time", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching client history:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return [];
  }

  type HistoryRow = {
    id: string;
    start_time: string;
    price_cents: number;
    service: { name: string; category: { name: string } | null } | null;
    staff: { name: string } | null;
  };

  return (data as unknown as HistoryRow[]).map((row) => ({
    id: row.id,
    service_name: row.service?.name ?? "Servicio eliminado",
    category_name: row.service?.category?.name ?? "",
    staff_name: row.staff?.name ?? "—",
    start_time: row.start_time,
    price_cents: row.price_cents,
  }));
}

/**
 * Search clients by name for the appointment picker (Agenda module).
 * Returns a small result set — not meant for full CRM browsing.
 */
export async function getClientsForSearch(
  query: string
): Promise<ClientSearchResult[]> {
  const supabase = await createSupabaseClient();

  let request = supabase
    .from("clients")
    .select("id, name, phone")
    .order("name")
    .limit(8);

  if (query.trim()) {
    request = request.ilike("name", `%${query.trim()}%`);
  }

  const { data, error } = await request;

  if (error) {
    console.error("Error searching clients:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return [];
  }

  return data;
}
