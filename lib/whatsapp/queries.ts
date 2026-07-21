"use server";

import { createClient } from "@/lib/supabase/server";
import type { QueuedMessage, SentMessage, AutomationRuleData } from "./types";

type QueueRow = {
  id: string;
  client_id: string | null;
  appointment_id: string | null;
  rule_type: string | null;
  body: string;
  scheduled_for: string;
  status: "pendiente" | "enviando" | "enviado" | "fallido";
  attempts: number;
  last_error: string | null;
  created_at: string;
  client: { name: string } | null;
};

export async function getQueuedMessages(): Promise<QueuedMessage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("message_queue")
    .select(
      `id, client_id, appointment_id, rule_type, body, scheduled_for,
      status, attempts, last_error, created_at,
      client:clients (name)
    `
    )
    .in("status", ["pendiente", "enviando", "fallido"])
    .order("scheduled_for", { ascending: true })
    .limit(100);

  if (error) {
    console.error("Error fetching message queue:", error);
    return [];
  }

  return (data as unknown as QueueRow[]).map((row) => ({
    id: row.id,
    client_id: row.client_id,
    client_name: row.client?.name ?? "—",
    appointment_id: row.appointment_id,
    rule_type: row.rule_type,
    body: row.body,
    scheduled_for: row.scheduled_for,
    status: row.status,
    attempts: row.attempts,
    last_error: row.last_error,
    created_at: row.created_at,
  }));
}

type SentRow = {
  id: string;
  client_id: string | null;
  appointment_id: string | null;
  rule_type: string | null;
  body: string;
  status: string;
  sent_at: string;
  client: { name: string } | null;
};

export async function getSentMessages(): Promise<SentMessage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("whatsapp_messages")
    .select(
      `id, client_id, appointment_id, rule_type, body, status, sent_at,
      client:clients (name)
    `
    )
    .eq("direction", "outbound")
    .order("sent_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching sent messages:", error);
    return [];
  }

  return (data as unknown as SentRow[]).map((row) => ({
    id: row.id,
    client_id: row.client_id,
    client_name: row.client?.name ?? "—",
    appointment_id: row.appointment_id,
    rule_type: row.rule_type,
    body: row.body,
    status: row.status,
    sent_at: row.sent_at,
  }));
}

export async function getAutomationRules(): Promise<AutomationRuleData[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("automation_rules")
    .select("id, type, enabled, template_text, offset_minutes")
    .order("type");

  if (error) {
    console.error("Error fetching automation rules:", error);
    return [];
  }

  return data;
}
