"use server";

import { fromZonedTime } from "date-fns-tz";
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

  type StaffPriceRow = {
    staff_id: string;
    price_cents: number;
    staff: { name: string; active: boolean } | null;
  };

  return (data as unknown as StaffPriceRow[])
    .filter((row) => row.staff?.active) // Only active staff
    .map((row) => ({
      staff_id: row.staff_id,
      staff_name: row.staff!.name,
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

  // dateISO is a civil date ("2026-07-16"), interpreted in the salon's
  // timezone — never assume a fixed UTC offset (fromZonedTime resolves DST
  // correctly for timezones that observe it, even though Lima doesn't).
  const startUTC = fromZonedTime(`${dateISO}T00:00:00`, timezone);
  const endUTC = fromZonedTime(`${dateISO}T23:59:59.999`, timezone);

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
