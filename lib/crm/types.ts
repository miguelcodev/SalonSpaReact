import type { Client } from "@/types/database";

export interface ClientWithSegments extends Client {
  is_vip: boolean;
  is_inactive: boolean;
  is_birthday_month: boolean;
}

export type ClientFilter = "vip" | "cumple" | "inactiva";

export interface ClientHistoryItem {
  id: string;
  service_name: string;
  category_name: string;
  staff_name: string;
  start_time: string;
  price_cents: number;
}

export interface ClientSearchResult {
  id: string;
  name: string;
  phone: string | null;
}
