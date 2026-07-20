"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  newAppointmentSchema,
  comboAppointmentSchema,
  type NewAppointmentInput,
  type ComboAppointmentInput,
} from "./schemas";
import { getServicesForNewAppointment, getStaffPricesForService } from "./queries";
import { formatTimeRange } from "./grid";

export async function createAppointment(input: NewAppointmentInput): Promise<
  | { ok: true; appointmentId: string }
  | { ok: false; error: string }
> {
  // Validate input
  const parsed = newAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos" };
  }

  const { clientId, serviceId, staffId, startTimeISO, notes } = parsed.data;
  const supabase = await createClient();

  try {
    // Get service details (duration, buffer, and resolve price)
    const allServices = await getServicesForNewAppointment();
    const service = allServices.find((s) => s.id === serviceId);
    if (!service) {
      return { ok: false, error: "Servicio no encontrado" };
    }

    // Get the price for this staff member
    const prices = await getStaffPricesForService(serviceId);
    const priceOption = prices.find((p) => p.staff_id === staffId);
    if (!priceOption) {
      return {
        ok: false,
        error: `No hay precio definido para ${service.name} con esta especialista`,
      };
    }

    // Parse start time and compute end time
    const startDate = new Date(startTimeISO);
    const endDate = new Date(
      startDate.getTime() + service.duration_minutes * 60 * 1000
    );

    // Insert the appointment
    const { data, error: insertError } = await supabase
      .from("appointments")
      .insert({
        client_id: clientId,
        service_id: serviceId,
        staff_id: staffId,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        duration_minutes: service.duration_minutes,
        buffer_minutes: service.buffer_minutes,
        price_cents: priceOption.price_cents,
        status: "pendiente",
        notes: notes || null,
      })
      .select("id")
      .single();

    if (insertError) {
      // Handle Postgres exclusion constraint (23P01 = exclusion violation)
      if (insertError.code === "23P01") {
        return {
          ok: false,
          error: `${priceOption.staff_name} ya tiene una cita en ese horario (${formatTimeRange(startDate.getHours(), service.duration_minutes)} incluido buffer de limpieza).`,
        };
      }
      console.error("Insert error:", insertError);
      return { ok: false, error: "Error al crear la cita" };
    }

    revalidatePath("/agenda");
    return { ok: true, appointmentId: data.id };
  } catch (error) {
    console.error("createAppointment error:", error);
    return { ok: false, error: "Error al crear la cita" };
  }
}

export async function createComboAppointment(input: ComboAppointmentInput): Promise<
  | { ok: true; comboGroupId: string }
  | { ok: false; error: string }
> {
  // Validate input
  const parsed = comboAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos de combo inválidos" };
  }

  const { clientId, comboId, items } = parsed.data;
  const supabase = await createClient();

  try {
    // Call the Postgres function fn_create_combo_appointments
    // which handles atomicity and validation
    const { data, error } = await supabase.rpc("fn_create_combo_appointments", {
      p_salon_id: (await supabase.auth.getUser()).data.user?.id || null, // Will be fetched from RLS
      p_client_id: clientId,
      p_combo_id: comboId,
      p_items: items.map((item) => ({
        service_id: item.serviceId,
        staff_id: item.staffId,
        start_time: item.startTimeISO,
      })),
    });

    if (error) {
      // Parse error message from Postgres raise exception
      let errorMsg = "Error al crear el combo";
      if (error.message.includes("No hay precio definido")) {
        errorMsg =
          "Una de las especialistas no tiene precio definido para el servicio";
      } else if (error.message.includes("Horario ocupado")) {
        errorMsg = "Una de las especialistas no está libre en ese horario";
      }
      return { ok: false, error: errorMsg };
    }

    revalidatePath("/agenda");
    return { ok: true, comboGroupId: data };
  } catch (error) {
    console.error("createComboAppointment error:", error);
    return { ok: false, error: "Error al crear el combo" };
  }
}

export async function cancelAppointment(appointmentId: string): Promise<
  | { ok: true }
  | { ok: false; error: string }
> {
  if (!appointmentId) {
    return { ok: false, error: "ID de cita inválido" };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("appointments")
      .update({ status: "cancelada" })
      .eq("id", appointmentId)
      .select("id")
      .single();

    if (error || !data) {
      return { ok: false, error: "No se pudo cancelar la cita" };
    }

    revalidatePath("/agenda");
    return { ok: true };
  } catch (error) {
    console.error("cancelAppointment error:", error);
    return { ok: false, error: "Error al cancelar la cita" };
  }
}
