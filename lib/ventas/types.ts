export type SaleChannel = "tienda" | "whatsapp" | "cita";
export type SaleStatus = "pendiente" | "pagado" | "anulado";
export type PaymentMethod = "stripe" | "efectivo" | "yape" | "plin";

export interface SaleListEntry {
  id: string;
  client_name: string | null;
  channel: SaleChannel;
  status: SaleStatus;
  total_cents: number;
  item_count: number;
  created_at: string;
}

export interface SaleItemDetail {
  id: string;
  product_name: string;
  quantity: number;
  unit_price_cents: number;
  subtotal_cents: number;
}

export interface SaleDetail {
  id: string;
  client_name: string | null;
  client_phone: string | null;
  appointment_id: string | null;
  appointment_service_name: string | null;
  appointment_price_cents: number | null;
  channel: SaleChannel;
  status: SaleStatus;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  notes: string | null;
  created_at: string;
  items: SaleItemDetail[];
  payment_method: PaymentMethod | null;
  paid_at: string | null;
}

export interface AppointmentForSale {
  id: string;
  client_id: string;
  client_name: string;
  service_name: string;
  price_cents: number;
}
