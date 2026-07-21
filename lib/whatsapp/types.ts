export interface QueuedMessage {
  id: string;
  client_id: string | null;
  client_name: string;
  appointment_id: string | null;
  rule_type: string | null;
  body: string;
  scheduled_for: string;
  status: "pendiente" | "enviando" | "enviado" | "fallido";
  attempts: number;
  last_error: string | null;
  created_at: string;
}

export interface SentMessage {
  id: string;
  client_id: string | null;
  client_name: string;
  appointment_id: string | null;
  rule_type: string | null;
  body: string;
  status: string;
  sent_at: string;
}

export type AutomationRuleType =
  | "confirmacion"
  | "recordatorio_24h"
  | "recordatorio_2h"
  | "resena"
  | "reactivacion"
  | "cumpleanos";

export interface AutomationRuleData {
  id: string;
  type: AutomationRuleType;
  enabled: boolean;
  template_text: string;
  offset_minutes: number | null;
}
