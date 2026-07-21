"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { toZonedTime } from "date-fns-tz";
import { renderTemplate } from "./template";

interface SalonRow {
  id: string;
  timezone: string;
}

async function getAllSalons(supabase: SupabaseClient): Promise<SalonRow[]> {
  const { data } = await supabase.from("salons").select("id, timezone");
  return data || [];
}

/**
 * Birthday and reactivation aren't tied to a booking event (unlike
 * confirmacion/recordatorios/resena, enqueued once at booking time in
 * lib/whatsapp/queue.ts) — they're calendar/segment scans that only the
 * periodic cron can discover. Both run with the service-role client (no
 * authenticated user in a cron context) and therefore MUST filter by
 * salon_id explicitly for every query — RLS provides no protection here.
 */
export async function enqueueBirthdayMessages(supabase: SupabaseClient): Promise<number> {
  const salons = await getAllSalons(supabase);
  let enqueued = 0;

  for (const salon of salons) {
    const { data: rule } = await supabase
      .from("automation_rules")
      .select("template_text")
      .eq("salon_id", salon.id)
      .eq("type", "cumpleanos")
      .eq("enabled", true)
      .maybeSingle();
    if (!rule) continue;

    const zonedNow = toZonedTime(new Date(), salon.timezone);
    const month = zonedNow.getMonth() + 1;
    const day = zonedNow.getDate();

    const { data: clients } = await supabase
      .from("clients")
      .select("id, name, birth_date")
      .eq("salon_id", salon.id)
      .not("birth_date", "is", null);

    // birth_date is a DATE column ("1994-03-12"); Date() parses it as UTC
    // midnight, so UTC getters are the correct match here (no local-tz drift).
    const todaysBirthdays = (clients || []).filter((c) => {
      const bd = new Date(c.birth_date);
      return bd.getUTCMonth() + 1 === month && bd.getUTCDate() === day;
    });
    if (todaysBirthdays.length === 0) continue;

    // Dedupe: a client whose birthday message was already queued this
    // calendar year is skipped — otherwise every 15-minute cron tick during
    // their birthday would re-send the same greeting all day.
    const yearStart = new Date(Date.UTC(zonedNow.getFullYear(), 0, 1)).toISOString();
    const { data: alreadyQueued } = await supabase
      .from("message_queue")
      .select("client_id")
      .eq("salon_id", salon.id)
      .eq("rule_type", "cumpleanos")
      .gte("created_at", yearStart);

    const excluded = new Set((alreadyQueued || []).map((r) => r.client_id));
    const toSend = todaysBirthdays.filter((c) => !excluded.has(c.id));
    if (toSend.length === 0) continue;

    const rows = toSend.map((c) => ({
      salon_id: salon.id,
      client_id: c.id,
      appointment_id: null,
      rule_type: "cumpleanos",
      body: renderTemplate(rule.template_text, { nombre: c.name }),
      scheduled_for: new Date().toISOString(),
      status: "pendiente" as const,
    }));

    const { error } = await supabase.from("message_queue").insert(rows);
    if (error) {
      console.error(`Error enqueueing birthday messages for salon ${salon.id}:`, error);
    } else {
      enqueued += rows.length;
    }
  }

  return enqueued;
}

/**
 * Uses view_client_segments (is_inactive: last_visit_at > 60 days ago).
 * A 30-day cooldown dedupe prevents re-nagging the same inactive client
 * every cron cycle for as long as she stays inactive.
 */
export async function enqueueReactivationMessages(supabase: SupabaseClient): Promise<number> {
  const salons = await getAllSalons(supabase);
  let enqueued = 0;

  for (const salon of salons) {
    const { data: rule } = await supabase
      .from("automation_rules")
      .select("template_text")
      .eq("salon_id", salon.id)
      .eq("type", "reactivacion")
      .eq("enabled", true)
      .maybeSingle();
    if (!rule) continue;

    const { data: segments } = await supabase
      .from("view_client_segments")
      .select("client_id")
      .eq("salon_id", salon.id)
      .eq("is_inactive", true);
    if (!segments || segments.length === 0) continue;

    const cooldownStart = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();
    const { data: recentlyMessaged } = await supabase
      .from("message_queue")
      .select("client_id")
      .eq("salon_id", salon.id)
      .eq("rule_type", "reactivacion")
      .gte("created_at", cooldownStart);

    const excluded = new Set((recentlyMessaged || []).map((r) => r.client_id));
    const targetIds = segments.map((s) => s.client_id).filter((id) => !excluded.has(id));
    if (targetIds.length === 0) continue;

    const { data: clients } = await supabase
      .from("clients")
      .select("id, name")
      .in("id", targetIds);

    const rows = (clients || []).map((c) => ({
      salon_id: salon.id,
      client_id: c.id,
      appointment_id: null,
      rule_type: "reactivacion",
      body: renderTemplate(rule.template_text, { nombre: c.name }),
      scheduled_for: new Date().toISOString(),
      status: "pendiente" as const,
    }));

    const { error } = await supabase.from("message_queue").insert(rows);
    if (error) {
      console.error(`Error enqueueing reactivation messages for salon ${salon.id}:`, error);
    } else {
      enqueued += rows.length;
    }
  }

  return enqueued;
}
