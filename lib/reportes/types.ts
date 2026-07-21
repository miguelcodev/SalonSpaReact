export type ReportRange = "7d" | "month" | "quarter";

export interface RawAppointmentRow {
  id: string;
  start_time: string;
  duration_minutes: number;
  buffer_minutes: number;
  price_cents: number;
  status: string;
  client_id: string;
  staff_id: string;
  service_name: string;
  category_color: string | null;
}

export interface StaffRow {
  id: string;
  name: string;
  level: string;
  color_hex: string;
}

export interface ClientCreatedRow {
  id: string;
  created_at: string;
}

/** A sale_item row with its parent sale's status/date denormalized —
 * subtotal_cents is product revenue only (never the linked appointment's
 * price, which is already counted separately from `appointments`), so
 * summing this alongside appointment revenue never double-counts. */
export interface RawSaleItemRow {
  sale_created_at: string;
  sale_status: string;
  product_name: string;
  category_color: string | null;
  subtotal_cents: number;
}

export interface RevenueBucket {
  label: string;
  revenueCents: number;
}

export interface TopServiceEntry {
  name: string;
  revenueCents: number;
  pct: number;
  color: string;
}

export interface StaffPerformanceEntry {
  id: string;
  name: string;
  level: string;
  colorHex: string;
  occupancyPct: number;
  revenueCents: number;
}

export interface PeriodDelta {
  /** Percentage points of change vs. the immediately preceding period of the
   * same length. null when the previous period had no baseline to compare
   * against (avoids showing a fabricated ±∞% or 0%). */
  pct: number | null;
}

export interface ReportData {
  rangeLabel: string;
  totalRevenueCents: number;
  serviceRevenueCents: number;
  productRevenueCents: number;
  avgTicketCents: number;
  occupancyPct: number;
  noShowRatePct: number;
  revenueByBucket: RevenueBucket[];
  topServices: TopServiceEntry[];
  topProducts: TopServiceEntry[];
  staffPerformance: StaffPerformanceEntry[];
  newClientCount: number;
  recurringClientCount: number;
  deltas: {
    revenue: PeriodDelta;
    avgTicket: PeriodDelta;
    occupancy: PeriodDelta;
    noShowRate: PeriodDelta;
  };
}
