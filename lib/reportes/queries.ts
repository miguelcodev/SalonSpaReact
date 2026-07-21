"use server";

import { createClient } from "@/lib/supabase/server";
import { getRangeBounds, getPreviousRangeBounds, buildReportData } from "./compute";
import type { ReportRange, RawAppointmentRow, StaffRow, ClientCreatedRow } from "./types";
import type { ReportData } from "./types";

const APPOINTMENT_SELECT = `id,
  start_time,
  duration_minutes,
  buffer_minutes,
  price_cents,
  status,
  client_id,
  staff_id,
  service:services (name, category:service_categories (color_hex))
`;

type AppointmentRow = {
  id: string;
  start_time: string;
  duration_minutes: number;
  buffer_minutes: number;
  price_cents: number;
  status: string;
  client_id: string;
  staff_id: string;
  service: { name: string; category: { color_hex: string | null } | null } | null;
};

function mapAppointmentRows(rows: AppointmentRow[]): RawAppointmentRow[] {
  return rows.map((a) => ({
    id: a.id,
    start_time: a.start_time,
    duration_minutes: a.duration_minutes,
    buffer_minutes: a.buffer_minutes,
    price_cents: a.price_cents,
    status: a.status,
    client_id: a.client_id,
    staff_id: a.staff_id,
    service_name: a.service?.name ?? "Servicio eliminado",
    category_color: a.service?.category?.color_hex ?? null,
  }));
}

export async function getReportData(range: ReportRange): Promise<ReportData> {
  const supabase = await createClient();

  const { data: salonData } = await supabase
    .from("salons")
    .select("timezone")
    .limit(1)
    .single();
  const timezone = salonData?.timezone || "America/Lima";

  const bounds = getRangeBounds(range, timezone);
  const prevBounds = getPreviousRangeBounds(bounds);

  const [appointmentsRes, prevAppointmentsRes, staffRes, clientsRes] = await Promise.all([
    supabase
      .from("appointments")
      .select(APPOINTMENT_SELECT)
      .gte("start_time", bounds.start.toISOString())
      .lte("start_time", bounds.end.toISOString()),
    supabase
      .from("appointments")
      .select(APPOINTMENT_SELECT)
      .gte("start_time", prevBounds.start.toISOString())
      .lte("start_time", prevBounds.end.toISOString()),
    supabase.from("staff").select("id, name, level, color_hex").eq("active", true),
    supabase.from("clients").select("id, created_at"),
  ]);

  if (appointmentsRes.error) {
    console.error("Error fetching report appointments:", appointmentsRes.error);
  }
  if (prevAppointmentsRes.error) {
    console.error("Error fetching previous period appointments:", prevAppointmentsRes.error);
  }
  if (staffRes.error) {
    console.error("Error fetching report staff:", staffRes.error);
  }
  if (clientsRes.error) {
    console.error("Error fetching report clients:", clientsRes.error);
  }

  const appointments = mapAppointmentRows(
    (appointmentsRes.data as unknown as AppointmentRow[]) || []
  );
  const previousAppointments = mapAppointmentRows(
    (prevAppointmentsRes.data as unknown as AppointmentRow[]) || []
  );

  const staff: StaffRow[] = staffRes.data || [];
  const clients: ClientCreatedRow[] = clientsRes.data || [];

  return buildReportData(
    range,
    bounds,
    appointments,
    staff,
    clients,
    timezone,
    previousAppointments
  );
}
