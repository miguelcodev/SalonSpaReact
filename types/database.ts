// Auto-generated or manually maintained database types
// Schema reference: documentos/schema.sql
// To regenerate: supabase gen types typescript --project-id your-project > types/database.ts

export type UUID = string;

export interface Salon {
  id: UUID;
  name: string;
  whatsapp_number: string | null;
  timezone: string;
  plan: "starter" | "pro" | "enterprise";
  created_at: string;
}

export interface User {
  id: UUID;
  salon_id: UUID;
  staff_id: UUID | null;
  role: "owner" | "admin" | "staff";
  email: string;
  created_at: string;
}

export interface Staff {
  id: UUID;
  salon_id: UUID;
  name: string;
  level: "senior" | "junior";
  color_hex: string;
  active: boolean;
  created_at: string;
}

export interface ServiceCategory {
  id: UUID;
  salon_id: UUID;
  name: string;
  color_hex: string | null;
}

export interface Service {
  id: UUID;
  salon_id: UUID;
  category_id: UUID;
  name: string;
  description: string | null;
  duration_minutes: number;
  buffer_minutes: number;
  status: "activo" | "pausado";
  created_at: string;
  updated_at: string;
}

export interface ServiceStaffPrice {
  id: UUID;
  service_id: UUID;
  staff_id: UUID;
  price_cents: number;
}

export interface Combo {
  id: UUID;
  salon_id: UUID;
  name: string;
  combined_price_cents: number;
  active: boolean;
}

export interface ComboService {
  id: UUID;
  combo_id: UUID;
  service_id: UUID;
}

export interface Client {
  id: UUID;
  salon_id: UUID;
  name: string;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
  preferences: string | null;
  visit_count: number;
  total_spent_cents: number;
  last_visit_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: UUID;
  salon_id: UUID;
  client_id: UUID;
  service_id: UUID;
  staff_id: UUID;
  combo_group_id: UUID | null;
  start_time: string;
  end_time: string;
  buffer_minutes: number;
  duration_minutes: number;
  price_cents: number;
  status: "pendiente" | "confirmada" | "completada" | "cancelada" | "no_show";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Promotion {
  id: UUID;
  salon_id: UUID;
  name: string;
  category_id: UUID | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  valid_from: string | null;
  valid_to: string | null;
  usage_limit: number | null;
  usage_count: number;
  send_whatsapp: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromotionRedemption {
  id: UUID;
  promotion_id: UUID;
  client_id: UUID;
  appointment_id: UUID | null;
  redeemed_at: string;
}

export interface LoyaltyProgram {
  id: UUID;
  salon_id: UUID;
  visits_required: number;
  reward_description: string | null;
  active: boolean;
}

export interface LoyaltyProgress {
  id: UUID;
  client_id: UUID;
  program_id: UUID;
  stamps: number;
  last_stamp_at: string | null;
}

export interface AutomationRule {
  id: UUID;
  salon_id: UUID;
  type:
    | "confirmacion"
    | "recordatorio_24h"
    | "recordatorio_2h"
    | "resena"
    | "reactivacion"
    | "cumpleanos";
  enabled: boolean;
  template_text: string;
  offset_minutes: number | null;
  created_at: string;
}

export interface MessageQueue {
  id: UUID;
  salon_id: UUID;
  client_id: UUID | null;
  appointment_id: UUID | null;
  rule_type: string | null;
  body: string;
  scheduled_for: string;
  status: "pendiente" | "enviando" | "enviado" | "fallido";
  attempts: number;
  last_error: string | null;
  created_at: string;
}

export interface WhatsappMessage {
  id: UUID;
  salon_id: UUID;
  client_id: UUID | null;
  appointment_id: UUID | null;
  direction: "outbound" | "inbound";
  rule_type: string | null;
  body: string;
  status: "enviado" | "entregado" | "leido" | "fallido";
  sent_at: string;
}

export interface Payment {
  id: UUID;
  appointment_id: UUID;
  amount_cents: number;
  method: "stripe" | "efectivo" | "yape" | "plin";
  status: "pendiente" | "pagado" | "reembolsado";
  stripe_payment_intent_id: string | null;
  paid_at: string | null;
}
