"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { renderTemplate, formatApptDate, formatApptTime } from "./template";
import { getSender } from "./sender";

interface AppointmentContext {
  id: string;
  salon_id: string;
  client_id: string;
  start_time: string;
  end_time: string;
  client: { name: string; phone: string | null } | null;
  service: { name: string } | null;
  staff: { name: string } | null;
}

async function fetchAppointmentContext(
  supabase: SupabaseClient,
  appointmentId: string
): Promise<AppointmentContext | null> {
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `id, salon_id, client_id, start_time, end_time,
      client:clients (name, phone),
      service:services (name),
      staff:staff (name)
    `
    )
    .eq("id", appointmentId)
    .single();

  if (error || !data) return null;
  return data as unknown as AppointmentContext;
}

async function getSalonTimezone(supabase: SupabaseClient, salonId: string): Promise<string> {
  const { data } = await supabase
    .from("salons")
    .select("timezone")
    .eq("id", salonId)
    .single();
  return data?.timezone || "America/Lima";
}

/**
 * Called right after an appointment is created. Enqueues every enabled
 * appointment-relative automation rule (confirmacion, recordatorio_24h,
 * recordatorio_2h, resena — excludes cumpleanos/reactivacion, which are
 * calendar-based and handled by the periodic scheduler instead) with the
 * correct scheduled_for computed once, up front. The cron only needs to ask
 * "what's due now?" — no runtime scanning of "is this appointment within its
 * reminder window" required.
 */
export async function enqueueAppointmentMessages(
  supabase: SupabaseClient,
  appointmentId: string
): Promise<void> {
  const appt = await fetchAppointmentContext(supabase, appointmentId);
  if (!appt || !appt.client || !appt.service || !appt.staff) return;

  const timezone = await getSalonTimezone(supabase, appt.salon_id);

  const { data: rules, error: rulesError } = await supabase
    .from("automation_rules")
    .select("type, template_text, offset_minutes")
    .eq("salon_id", appt.salon_id)
    .eq("enabled", true)
    .not("offset_minutes", "is", null);

  if (rulesError || !rules || rules.length === 0) return;

  const vars = {
    nombre: appt.client.name,
    servicio: appt.service.name,
    especialista: appt.staff.name,
    fecha: formatApptDate(appt.start_time, timezone),
    hora: formatApptTime(appt.start_time, timezone),
  };

  const rows = rules.map((rule) => {
    const baseTime =
      rule.type === "resena" ? new Date(appt.end_time) : new Date(appt.start_time);
    const scheduledFor = new Date(
      baseTime.getTime() + (rule.offset_minutes || 0) * 60 * 1000
    );

    return {
      salon_id: appt.salon_id,
      client_id: appt.client_id,
      appointment_id: appt.id,
      rule_type: rule.type,
      body: renderTemplate(rule.template_text, vars),
      scheduled_for: scheduledFor.toISOString(),
      status: "pendiente" as const,
    };
  });

  const { error } = await supabase.from("message_queue").insert(rows);
  if (error) {
    console.error("Error enqueueing appointment messages:", error);
  }
}

/**
 * Called on cancellation — removes any still-pending queued messages for
 * the appointment so a reminder doesn't go out for a cita that no longer
 * exists. Already-sent messages (history) are left untouched.
 */
export async function cancelAppointmentMessages(
  supabase: SupabaseClient,
  appointmentId: string
): Promise<void> {
  const { error } = await supabase
    .from("message_queue")
    .delete()
    .eq("appointment_id", appointmentId)
    .eq("status", "pendiente");

  if (error) {
    console.error("Error cancelling appointment messages:", error);
  }
}

/**
 * On-demand reminder triggered manually from the Agenda UI ("Enviar
 * recordatorio"), independent of the scheduled automation rules.
 */
export async function sendManualReminder(
  supabase: SupabaseClient,
  appointmentId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const appt = await fetchAppointmentContext(supabase, appointmentId);
  if (!appt || !appt.client || !appt.service || !appt.staff) {
    return { ok: false, error: "Cita no encontrada" };
  }
  if (!appt.client.phone) {
    return { ok: false, error: "La clienta no tiene teléfono registrado" };
  }

  const timezone = await getSalonTimezone(supabase, appt.salon_id);
  const body = `Hola ${appt.client.name} 🌸 Te recordamos tu cita de ${appt.service.name} el ${formatApptDate(appt.start_time, timezone)} a las ${formatApptTime(appt.start_time, timezone)} con ${appt.staff.name}. ¡Te esperamos en Bellamora!`;

  const { error } = await supabase.from("message_queue").insert({
    salon_id: appt.salon_id,
    client_id: appt.client_id,
    appointment_id: appt.id,
    rule_type: null,
    body,
    scheduled_for: new Date().toISOString(),
    status: "pendiente",
  });

  if (error) {
    console.error("Error enqueueing manual reminder:", error);
    return { ok: false, error: "No se pudo encolar el recordatorio" };
  }

  return { ok: true };
}

interface PendingRow {
  id: string;
  salon_id: string;
  client_id: string | null;
  appointment_id: string | null;
  rule_type: string | null;
  body: string;
  attempts: number;
  client: { name: string; phone: string | null } | null;
}

/**
 * Processes everything due right now: sends via the configured sender,
 * moves successes to whatsapp_messages (history), retries failures up to 3
 * attempts before giving up. This is the only piece that actually talks to
 * an external API — everything upstream just decides *what* and *when*.
 */
export async function processPendingQueue(
  supabase: SupabaseClient
): Promise<{ sent: number; failed: number }> {
  const sender = getSender();
  const nowISO = new Date().toISOString();

  const { data: pending, error } = await supabase
    .from("message_queue")
    .select(
      `id, salon_id, client_id, appointment_id, rule_type, body, attempts,
      client:clients (name, phone)
    `
    )
    .eq("status", "pendiente")
    .lte("scheduled_for", nowISO)
    .limit(50);

  if (error) {
    console.error("Error fetching pending queue:", error);
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const msg of (pending || []) as unknown as PendingRow[]) {
    if (!msg.client?.phone) {
      await supabase
        .from("message_queue")
        .update({
          status: "fallido",
          last_error: "Clienta sin teléfono registrado",
          attempts: msg.attempts + 1,
        })
        .eq("id", msg.id);
      failed++;
      continue;
    }

    await supabase.from("message_queue").update({ status: "enviando" }).eq("id", msg.id);

    const result = await sender.send(msg.client.phone, msg.body);

    if (result.success) {
      await supabase.from("message_queue").update({ status: "enviado" }).eq("id", msg.id);
      await supabase.from("whatsapp_messages").insert({
        salon_id: msg.salon_id,
        client_id: msg.client_id,
        appointment_id: msg.appointment_id,
        direction: "outbound",
        rule_type: msg.rule_type,
        body: msg.body,
        status: "enviado",
      });
      sent++;
    } else {
      const attempts = msg.attempts + 1;
      const giveUp = attempts >= 3;
      await supabase
        .from("message_queue")
        .update({
          status: giveUp ? "fallido" : "pendiente",
          attempts,
          last_error: result.error || "Error desconocido",
        })
        .eq("id", msg.id);
      failed++;
    }
  }

  return { sent, failed };
}
