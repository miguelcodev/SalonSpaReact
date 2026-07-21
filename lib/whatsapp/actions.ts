"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Ok = { ok: true };
type Err = { ok: false; error: string };
type ActionResult<T extends object = object> = (Ok & T) | Err;

export async function toggleAutomationRule(
  ruleId: string,
  currentEnabled: boolean
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("automation_rules")
    .update({ enabled: !currentEnabled })
    .eq("id", ruleId);

  if (error) {
    console.error("Error toggling automation rule:", error);
    return { ok: false, error: "No se pudo actualizar la regla" };
  }

  revalidatePath("/whatsapp");
  return { ok: true };
}

export async function updateAutomationRuleTemplate(
  ruleId: string,
  templateText: string
): Promise<ActionResult> {
  if (!templateText.trim()) {
    return { ok: false, error: "La plantilla no puede estar vacía" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("automation_rules")
    .update({ template_text: templateText })
    .eq("id", ruleId);

  if (error) {
    console.error("Error updating automation rule template:", error);
    return { ok: false, error: "No se pudo guardar la plantilla" };
  }

  revalidatePath("/whatsapp");
  return { ok: true };
}

/** Resets a failed (or still-pending) message so the next cron tick retries it. */
export async function retryQueuedMessage(messageId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("message_queue")
    .update({ status: "pendiente", attempts: 0, last_error: null, scheduled_for: new Date().toISOString() })
    .eq("id", messageId);

  if (error) {
    console.error("Error retrying queued message:", error);
    return { ok: false, error: "No se pudo reintentar el envío" };
  }

  revalidatePath("/whatsapp");
  return { ok: true };
}

export async function cancelQueuedMessage(messageId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("message_queue").delete().eq("id", messageId);

  if (error) {
    console.error("Error cancelling queued message:", error);
    return { ok: false, error: "No se pudo cancelar el mensaje" };
  }

  revalidatePath("/whatsapp");
  return { ok: true };
}
