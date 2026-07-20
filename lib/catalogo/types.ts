import type { Service, ServiceCategory, Staff } from "@/types/database";

export interface ServicePriceEntry {
  staff_id: string;
  staff_name: string;
  price_cents: number;
}

export interface ServiceWithPricing extends Service {
  category: ServiceCategory;
  prices: ServicePriceEntry[];
}

export interface ComboServiceEntry {
  service_id: string;
  service_name: string;
  duration_minutes: number;
  /** Cheapest listed price across staff for this service — used to compute
   * an approximate "buy separately" comparison, since combos don't pin a
   * specific staff member per service (that's chosen at booking time). */
  min_price_cents: number;
  max_price_cents: number;
}

export interface ComboWithServices {
  id: string;
  salon_id: string;
  name: string;
  combined_price_cents: number;
  active: boolean;
  services: ComboServiceEntry[];
}

export type StaffOption = Pick<Staff, "id" | "name" | "level" | "color_hex">;
