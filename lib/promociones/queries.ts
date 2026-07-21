"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  PromotionWithStatus,
  LoyaltyProgramData,
  LoyaltyProgressEntry,
} from "./types";
import type { ServiceCategory } from "@/types/database";

/**
 * Promotions with their derived status (view_promotions_with_status) and
 * category joined in app code — the view has no FK for PostgREST to embed
 * service_categories automatically.
 */
export async function getPromotionsWithStatus(): Promise<PromotionWithStatus[]> {
  const supabase = await createClient();

  const [promosRes, categoriesRes] = await Promise.all([
    supabase.from("view_promotions_with_status").select("*").order("name"),
    supabase.from("service_categories").select("*"),
  ]);

  if (promosRes.error) {
    console.error("Error fetching promotions:", promosRes.error);
    return [];
  }

  const categoryMap = new Map<string, ServiceCategory>(
    (categoriesRes.data || []).map((c) => [c.id, c])
  );

  return promosRes.data.map((p) => ({
    ...p,
    category: p.category_id ? categoryMap.get(p.category_id) || null : null,
  }));
}

export async function getServiceCategories(): Promise<ServiceCategory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_categories")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return data;
}

/**
 * The salon's single loyalty program, if configured. Schema allows more
 * than one row per salon, but the product model (and prototype) assumes
 * exactly one active program — the first one found.
 */
export async function getLoyaltyProgram(): Promise<LoyaltyProgramData | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("loyalty_programs")
    .select("id, visits_required, reward_description, active")
    .order("id")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching loyalty program:", error);
    return null;
  }

  return data;
}

export async function getLoyaltyProgress(
  programId: string
): Promise<LoyaltyProgressEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("loyalty_progress")
    .select(`client_id, stamps, last_stamp_at, client:clients (name)`)
    .eq("program_id", programId)
    .order("stamps", { ascending: false });

  if (error) {
    console.error("Error fetching loyalty progress:", error);
    return [];
  }

  type ProgressRow = {
    client_id: string;
    stamps: number;
    last_stamp_at: string | null;
    client: { name: string } | null;
  };

  return (data as unknown as ProgressRow[]).map((row) => ({
    client_id: row.client_id,
    client_name: row.client?.name ?? "—",
    stamps: row.stamps,
    last_stamp_at: row.last_stamp_at,
  }));
}
