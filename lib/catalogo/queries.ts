"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  ServiceWithPricing,
  ComboWithServices,
  StaffOption,
} from "./types";
import type { ServiceCategory } from "@/types/database";

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

export async function getStaffOptions(): Promise<StaffOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("staff")
    .select("id, name, level, color_hex")
    .eq("active", true)
    .order("name");

  if (error) {
    console.error("Error fetching staff:", error);
    return [];
  }

  return data;
}

/**
 * All services with their category and per-staff pricing.
 * Two round trips (services + service_staff_prices) merged in app code —
 * same reasoning as CRM's getClientsWithSegments: no FK for PostgREST to
 * auto-embed a many-to-many bridge cleanly with staff names attached.
 */
export async function getServicesWithPricing(): Promise<ServiceWithPricing[]> {
  const supabase = await createClient();

  const [servicesRes, pricesRes] = await Promise.all([
    supabase
      .from("services")
      .select(`*, category:service_categories (*)`)
      .order("name"),
    supabase
      .from("service_staff_prices")
      .select(`service_id, staff_id, price_cents, staff:staff (name)`),
  ]);

  if (servicesRes.error) {
    console.error("Error fetching services:", servicesRes.error);
    return [];
  }

  type PriceRow = {
    service_id: string;
    staff_id: string;
    price_cents: number;
    staff: { name: string } | null;
  };

  const pricesByService = new Map<string, ServiceWithPricing["prices"]>();
  ((pricesRes.data as unknown as PriceRow[]) || []).forEach((row) => {
    const list = pricesByService.get(row.service_id) || [];
    list.push({
      staff_id: row.staff_id,
      staff_name: row.staff?.name ?? "—",
      price_cents: row.price_cents,
    });
    pricesByService.set(row.service_id, list);
  });

  return servicesRes.data.map((s) => ({
    ...s,
    prices: pricesByService.get(s.id) || [],
  }));
}

/**
 * Combos with their included services (name, duration, min/max price
 * across staff) — used to render an honest price comparison instead of a
 * fabricated fixed "savings" number, since a combo doesn't pin a specific
 * staff member per service (that's chosen at booking time in Agenda).
 */
export async function getCombosWithServices(): Promise<ComboWithServices[]> {
  const supabase = await createClient();

  const [combosRes, comboServicesRes, pricesRes] = await Promise.all([
    supabase.from("combos").select("*").order("name"),
    supabase
      .from("combo_services")
      .select(`combo_id, service:services (id, name, duration_minutes)`),
    supabase.from("service_staff_prices").select("service_id, price_cents"),
  ]);

  if (combosRes.error) {
    console.error("Error fetching combos:", combosRes.error);
    return [];
  }

  const priceRangeByService = new Map<string, { min: number; max: number }>();
  (pricesRes.data || []).forEach((row) => {
    const existing = priceRangeByService.get(row.service_id);
    if (!existing) {
      priceRangeByService.set(row.service_id, {
        min: row.price_cents,
        max: row.price_cents,
      });
    } else {
      existing.min = Math.min(existing.min, row.price_cents);
      existing.max = Math.max(existing.max, row.price_cents);
    }
  });

  type ComboServiceRow = {
    combo_id: string;
    service: { id: string; name: string; duration_minutes: number } | null;
  };

  const servicesByCombo = new Map<string, ComboWithServices["services"]>();
  ((comboServicesRes.data as unknown as ComboServiceRow[]) || []).forEach(
    (row) => {
      if (!row.service) return;
      const range = priceRangeByService.get(row.service.id) || {
        min: 0,
        max: 0,
      };
      const list = servicesByCombo.get(row.combo_id) || [];
      list.push({
        service_id: row.service.id,
        service_name: row.service.name,
        duration_minutes: row.service.duration_minutes,
        min_price_cents: range.min,
        max_price_cents: range.max,
      });
      servicesByCombo.set(row.combo_id, list);
    }
  );

  return combosRes.data.map((c) => ({
    ...c,
    services: servicesByCombo.get(c.id) || [],
  }));
}
