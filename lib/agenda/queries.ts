"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  AppointmentWithRelations,
  StaffColumn,
  StaffPriceOption,
} from "./types";
import type { Service, ServiceCategory } from "@/types/database";

/**
 * Get all active staff for the salon of the authenticated user.
 * RLS ensures we only see staff from our salon.
 */
export async function getStaffColumns(): Promise<StaffColumn[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("staff")
    .select("*")
    .eq("active", true)
    .order("name");

  if (error) {
    console.error("Error fetching staff:", error);
    return [];
  }

  return data;
}

/**
 * Get service categories for the salon.
 */
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
 * Get all active services with their category info.
 * Used for the service selector in the new appointment form.
 */
export async function getServicesForNewAppointment(): Promise<
  (Service & { category: ServiceCategory })[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("services")
    .select(
      `*,
      category:service_categories (*)
    `
    )
    .eq("status", "activo")
    .order("name");

  if (error) {
    console.error("Error fetching services:", error);
    return [];
  }

  return data;
}

/**
 * Get pricing options (staff + price) for a given service.
 * Returns which staff members can perform the service and at what price.
 */
export async function getStaffPricesForService(
  serviceId: string
): Promise<StaffPriceOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_staff_prices")
    .select(
      `staff_id,
      price_cents,
      staff:staff (name, active)
    `
    )
    .eq("service_id", serviceId)
    .order("staff(name)");

  if (error) {
    console.error("Error fetching staff prices:", error);
    return [];
  }

  return data
    .filter((row: any) => row.staff?.active) // Only active staff
    .map((row: any) => ({
      staff_id: row.staff_id,
      staff_name: row.staff.name,
      price_cents: row.price_cents,
    }));
}

/**
 * Get all appointments for a given date (in salon's timezone).
 * Fetches related client, service+category, and staff info.
 *
 * The date is interpreted in the salon's timezone (America/Lima).
 * RLS ensures we only see appointments from our salon.
 */
export async function getAppointmentsForDay(
  dateISO: string // YYYY-MM-DD
): Promise<AppointmentWithRelations[]> {
  const supabase = await createClient();

  // Get the salon's timezone to interpret the date correctly
  const { data: salonData } = await supabase
    .from("salons")
    .select("timezone")
    .limit(1)
    .single();

  const timezone = salonData?.timezone || "America/Lima";

  // Parse the date in the salon's timezone
  // E.g., "2026-07-16" in Lima time = [00:00, 23:59:59.999] in Lima, which is UTC-5
  // So 2026-07-16 00:00 Lima = 2026-07-16 05:00 UTC
  //    2026-07-16 23:59:59 Lima = 2026-07-17 04:59:59 UTC

  // For simplicity, we construct the range in UTC manually:
  // Lima (UTC-5): take [date 00:00 to date 23:59:59]
  // Convert to UTC: add 5 hours to both boundaries
  const [year, month, day] = dateISO.split("-").map(Number);
  const startLima = new Date(year, month - 1, day, 0, 0, 0);
  const endLima = new Date(year, month - 1, day, 23, 59, 59, 999);

  // UTC time: add 5 hours (Lima is UTC-5)
  const startUTC = new Date(startLima.getTime() + 5 * 60 * 60 * 1000);
  const endUTC = new Date(endLima.getTime() + 5 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `*,
      client:clients (*),
      service:services (
        *,
        category:service_categories (*)
      ),
      staff:staff (*)
    `
    )
    .gte("start_time", startUTC.toISOString())
    .lt("start_time", endUTC.toISOString())
    .neq("status", "cancelada") // Don't show cancelled appointments in the grid
    .order("start_time");

  if (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }

  return data;
}
