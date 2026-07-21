import { startOfMonth, startOfQuarter, subDays, addDays, differenceInCalendarDays } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import type {
  ReportRange,
  RawAppointmentRow,
  StaffRow,
  ClientCreatedRow,
  RevenueBucket,
  TopServiceEntry,
  StaffPerformanceEntry,
  ReportData,
  PeriodDelta,
} from "./types";

/** Business hours assumed by Agenda's grid (9am–8pm) — used as the
 * denominator for the occupancy approximation. There's no salon working-hours
 * table in the schema, so this is a documented estimate, not exact. */
const BUSINESS_MINUTES_PER_DAY = 11 * 60;

export function getRangeBounds(
  range: ReportRange,
  timezone: string,
  now: Date = new Date()
): { start: Date; end: Date; label: string; rangeDays: number } {
  const zonedNow = toZonedTime(now, timezone);
  const endLocal = new Date(
    zonedNow.getFullYear(),
    zonedNow.getMonth(),
    zonedNow.getDate(),
    23,
    59,
    59,
    999
  );

  let startLocal: Date;
  let label: string;

  if (range === "7d") {
    startLocal = subDays(
      new Date(zonedNow.getFullYear(), zonedNow.getMonth(), zonedNow.getDate()),
      6
    );
    label = "Últimos 7 días";
  } else if (range === "quarter") {
    startLocal = startOfQuarter(zonedNow);
    label = "Este trimestre";
  } else {
    startLocal = startOfMonth(zonedNow);
    label = "Este mes";
  }

  const start = fromZonedTime(startLocal, timezone);
  const end = fromZonedTime(endLocal, timezone);
  const rangeDays = differenceInCalendarDays(endLocal, startLocal) + 1;

  return { start, end, label, rangeDays };
}

/** The same-length window immediately preceding the current range — a
 * defensible "vs. prior period" comparison. Not necessarily the calendar
 * previous month/quarter, so the UI must label it "vs. periodo anterior",
 * not "vs. junio", to stay accurate about what's being compared. */
export function getPreviousRangeBounds(bounds: {
  start: Date;
  rangeDays: number;
}): { start: Date; end: Date } {
  const end = new Date(bounds.start.getTime() - 1);
  const start = new Date(
    bounds.start.getTime() - bounds.rangeDays * 24 * 60 * 60 * 1000
  );
  return { start, end };
}

function computeDelta(current: number, previous: number): PeriodDelta {
  if (previous === 0) return { pct: null };
  return { pct: Math.round(((current - previous) / previous) * 100) };
}

function bucketLabel(range: ReportRange, date: Date): string {
  if (range === "7d") {
    return date.toLocaleDateString("es-PE", { weekday: "short" }).replace(".", "");
  }
  return date.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
}

/** Buckets completed appointments' revenue by day (7d range) or by week
 * relative to the range start (month/quarter range). */
export function bucketRevenue(
  appointments: RawAppointmentRow[],
  range: ReportRange,
  rangeStart: Date,
  timezone: string
): RevenueBucket[] {
  const completed = appointments.filter((a) => a.status === "completada");
  const bucketSizeDays = range === "7d" ? 1 : 7;
  const buckets = new Map<number, number>(); // bucket index -> revenue cents

  completed.forEach((a) => {
    const zonedStart = toZonedTime(rangeStart, timezone);
    const zonedApptDate = toZonedTime(new Date(a.start_time), timezone);
    const dayOffset = differenceInCalendarDays(
      new Date(zonedApptDate.getFullYear(), zonedApptDate.getMonth(), zonedApptDate.getDate()),
      new Date(zonedStart.getFullYear(), zonedStart.getMonth(), zonedStart.getDate())
    );
    const bucketIndex = Math.floor(dayOffset / bucketSizeDays);
    buckets.set(bucketIndex, (buckets.get(bucketIndex) || 0) + a.price_cents);
  });

  const maxBucket = buckets.size > 0 ? Math.max(...buckets.keys()) : -1;
  const result: RevenueBucket[] = [];

  for (let i = 0; i <= maxBucket; i++) {
    const bucketStartDate = addDays(rangeStart, i * bucketSizeDays);
    const label =
      bucketSizeDays === 1
        ? bucketLabel(range, bucketStartDate)
        : `Sem ${i + 1}`;
    result.push({ label, revenueCents: buckets.get(i) || 0 });
  }

  return result;
}

export function computeTotalRevenue(appointments: RawAppointmentRow[]): number {
  return appointments
    .filter((a) => a.status === "completada")
    .reduce((sum, a) => sum + a.price_cents, 0);
}

export function computeAvgTicket(appointments: RawAppointmentRow[]): number {
  const completed = appointments.filter((a) => a.status === "completada");
  if (completed.length === 0) return 0;
  return Math.round(computeTotalRevenue(appointments) / completed.length);
}

export function computeNoShowRate(appointments: RawAppointmentRow[]): number {
  const completed = appointments.filter((a) => a.status === "completada").length;
  const noShow = appointments.filter((a) => a.status === "no_show").length;
  const denominator = completed + noShow;
  if (denominator === 0) return 0;
  return Math.round((noShow / denominator) * 1000) / 10; // one decimal
}

/** Approximate occupancy: booked minutes (duration + buffer, any non-cancelled
 * status) as a fraction of total available minutes across active staff and
 * the range's business days. Documented estimate — see BUSINESS_MINUTES_PER_DAY. */
export function computeOccupancy(
  appointments: RawAppointmentRow[],
  activeStaffCount: number,
  rangeDays: number
): number {
  if (activeStaffCount === 0 || rangeDays === 0) return 0;

  const bookedMinutes = appointments
    .filter((a) => a.status !== "cancelada")
    .reduce((sum, a) => sum + a.duration_minutes + a.buffer_minutes, 0);

  const availableMinutes = activeStaffCount * rangeDays * BUSINESS_MINUTES_PER_DAY;
  return Math.min(100, Math.round((bookedMinutes / availableMinutes) * 1000) / 10);
}

export function computeTopServices(
  appointments: RawAppointmentRow[],
  limit = 5
): TopServiceEntry[] {
  const completed = appointments.filter((a) => a.status === "completada");
  const byService = new Map<string, { revenue: number; color: string }>();

  completed.forEach((a) => {
    const existing = byService.get(a.service_name);
    if (existing) {
      existing.revenue += a.price_cents;
    } else {
      byService.set(a.service_name, {
        revenue: a.price_cents,
        color: a.category_color || "#B8697A",
      });
    }
  });

  const sorted = Array.from(byService.entries())
    .map(([name, v]) => ({ name, revenueCents: v.revenue, color: v.color }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, limit);

  const max = sorted[0]?.revenueCents || 1;

  return sorted.map((s) => ({
    ...s,
    pct: Math.round((s.revenueCents / max) * 100),
  }));
}

export function computeStaffPerformance(
  appointments: RawAppointmentRow[],
  staff: StaffRow[],
  rangeDays: number
): StaffPerformanceEntry[] {
  return staff
    .map((s) => {
      const staffAppts = appointments.filter((a) => a.staff_id === s.id);
      const revenueCents = staffAppts
        .filter((a) => a.status === "completada")
        .reduce((sum, a) => sum + a.price_cents, 0);
      const bookedMinutes = staffAppts
        .filter((a) => a.status !== "cancelada")
        .reduce((sum, a) => sum + a.duration_minutes + a.buffer_minutes, 0);
      const availableMinutes = rangeDays * BUSINESS_MINUTES_PER_DAY;
      const occupancyPct =
        availableMinutes === 0
          ? 0
          : Math.min(100, Math.round((bookedMinutes / availableMinutes) * 100));

      return {
        id: s.id,
        name: s.name,
        level: s.level,
        colorHex: s.color_hex,
        occupancyPct,
        revenueCents,
      };
    })
    .sort((a, b) => b.revenueCents - a.revenueCents);
}

/** A client counts as "new" if their record was created within the selected
 * range; "recurring" otherwise. Only clients with at least one non-cancelled
 * appointment in the range are counted — matches the prototype's framing of
 * "clientas [active] this period", not the full client roster. */
export function computeNewVsRecurring(
  appointments: RawAppointmentRow[],
  clients: ClientCreatedRow[],
  rangeStart: Date
): { newCount: number; recurringCount: number } {
  const activeClientIds = new Set(
    appointments.filter((a) => a.status !== "cancelada").map((a) => a.client_id)
  );
  const clientMap = new Map(clients.map((c) => [c.id, c]));

  let newCount = 0;
  let recurringCount = 0;

  activeClientIds.forEach((id) => {
    const client = clientMap.get(id);
    if (!client) return;
    if (new Date(client.created_at) >= rangeStart) {
      newCount++;
    } else {
      recurringCount++;
    }
  });

  return { newCount, recurringCount };
}

export function buildReportData(
  range: ReportRange,
  bounds: { start: Date; label: string; rangeDays: number },
  appointments: RawAppointmentRow[],
  staff: StaffRow[],
  clients: ClientCreatedRow[],
  timezone: string,
  previousAppointments: RawAppointmentRow[] = []
): ReportData {
  const { newCount, recurringCount } = computeNewVsRecurring(
    appointments,
    clients,
    bounds.start
  );

  const revenue = computeTotalRevenue(appointments);
  const avgTicket = computeAvgTicket(appointments);
  const occupancy = computeOccupancy(appointments, staff.length, bounds.rangeDays);
  const noShowRate = computeNoShowRate(appointments);

  const prevRevenue = computeTotalRevenue(previousAppointments);
  const prevAvgTicket = computeAvgTicket(previousAppointments);
  const prevOccupancy = computeOccupancy(previousAppointments, staff.length, bounds.rangeDays);
  const prevNoShowRate = computeNoShowRate(previousAppointments);

  return {
    rangeLabel: bounds.label,
    totalRevenueCents: revenue,
    avgTicketCents: avgTicket,
    occupancyPct: occupancy,
    noShowRatePct: noShowRate,
    revenueByBucket: bucketRevenue(appointments, range, bounds.start, timezone),
    topServices: computeTopServices(appointments),
    staffPerformance: computeStaffPerformance(appointments, staff, bounds.rangeDays),
    newClientCount: newCount,
    recurringClientCount: recurringCount,
    deltas: {
      revenue: computeDelta(revenue, prevRevenue),
      avgTicket: computeDelta(avgTicket, prevAvgTicket),
      occupancy: computeDelta(occupancy, prevOccupancy),
      noShowRate: computeDelta(noShowRate, prevNoShowRate),
    },
  };
}
