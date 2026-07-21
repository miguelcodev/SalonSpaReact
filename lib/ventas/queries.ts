"use server";

import { createClient } from "@/lib/supabase/server";
import type { SaleListEntry, SaleDetail, AppointmentForSale } from "./types";

type SaleListRow = {
  id: string;
  channel: string;
  status: string;
  total_cents: number;
  created_at: string;
  client: { name: string } | null;
  sale_items: { id: string }[];
};

export async function getSales(): Promise<SaleListEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sales")
    .select(
      `id, channel, status, total_cents, created_at,
      client:clients (name),
      sale_items (id)
    `
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching sales:", error);
    return [];
  }

  return (data as unknown as SaleListRow[]).map((row) => ({
    id: row.id,
    client_name: row.client?.name ?? null,
    channel: row.channel as SaleListEntry["channel"],
    status: row.status as SaleListEntry["status"],
    total_cents: row.total_cents,
    item_count: row.sale_items.length,
    created_at: row.created_at,
  }));
}

type SaleDetailRow = {
  id: string;
  appointment_id: string | null;
  channel: string;
  status: string;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  notes: string | null;
  created_at: string;
  client: { name: string; phone: string | null } | null;
  appointment: { price_cents: number; service: { name: string } | null } | null;
  sale_items: {
    id: string;
    quantity: number;
    unit_price_cents: number;
    subtotal_cents: number;
    product: { name: string } | null;
  }[];
  payments: { method: string; paid_at: string | null }[];
};

export async function getSaleDetail(saleId: string): Promise<SaleDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sales")
    .select(
      `id, appointment_id, channel, status, subtotal_cents, discount_cents,
      total_cents, notes, created_at,
      client:clients (name, phone),
      appointment:appointments (price_cents, service:services (name)),
      sale_items (id, quantity, unit_price_cents, subtotal_cents, product:products (name)),
      payments (method, paid_at)
    `
    )
    .eq("id", saleId)
    .single();

  if (error || !data) {
    console.error("Error fetching sale detail:", error);
    return null;
  }

  const row = data as unknown as SaleDetailRow;
  const payment = row.payments[0];

  return {
    id: row.id,
    client_name: row.client?.name ?? null,
    client_phone: row.client?.phone ?? null,
    appointment_id: row.appointment_id,
    appointment_service_name: row.appointment?.service?.name ?? null,
    appointment_price_cents: row.appointment?.price_cents ?? null,
    channel: row.channel as SaleDetail["channel"],
    status: row.status as SaleDetail["status"],
    subtotal_cents: row.subtotal_cents,
    discount_cents: row.discount_cents,
    total_cents: row.total_cents,
    notes: row.notes,
    created_at: row.created_at,
    items: row.sale_items.map((item) => ({
      id: item.id,
      product_name: item.product?.name ?? "Producto eliminado",
      quantity: item.quantity,
      unit_price_cents: item.unit_price_cents,
      subtotal_cents: item.subtotal_cents,
    })),
    payment_method: (payment?.method as SaleDetail["payment_method"]) ?? null,
    paid_at: payment?.paid_at ?? null,
  };
}

/**
 * Feeds the "Cobrar" flow from Agenda's appointment detail modal — resolves
 * the appointment's client + service + price so the new-sale form can
 * pre-fill and lock them.
 */
export async function getAppointmentForSale(
  appointmentId: string
): Promise<AppointmentForSale | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `id, price_cents,
      client:clients (id, name),
      service:services (name)
    `
    )
    .eq("id", appointmentId)
    .single();

  if (error || !data) {
    console.error("Error fetching appointment for sale:", error);
    return null;
  }

  type Row = {
    id: string;
    price_cents: number;
    client: { id: string; name: string } | null;
    service: { name: string } | null;
  };
  const row = data as unknown as Row;
  if (!row.client || !row.service) return null;

  return {
    id: row.id,
    client_id: row.client.id,
    client_name: row.client.name,
    service_name: row.service.name,
    price_cents: row.price_cents,
  };
}
