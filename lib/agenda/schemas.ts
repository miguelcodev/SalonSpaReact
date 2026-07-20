import { z } from "zod";

export const newAppointmentSchema = z.object({
  clientId: z.string().uuid("Cliente inválido"),
  serviceId: z.string().uuid("Servicio inválido"),
  staffId: z.string().uuid("Especialista inválida"),
  startTimeISO: z.string().datetime("Hora de inicio inválida"),
  notes: z.string().optional(),
});

export type NewAppointmentInput = z.infer<typeof newAppointmentSchema>;

export const comboAppointmentSchema = z.object({
  clientId: z.string().uuid("Cliente inválido"),
  comboId: z.string().uuid("Combo inválido"),
  items: z
    .array(
      z.object({
        serviceId: z.string().uuid("Servicio inválido"),
        staffId: z.string().uuid("Especialista inválida"),
        startTimeISO: z.string().datetime("Hora de inicio inválida"),
      })
    )
    .min(2, "El combo debe tener al menos 2 servicios")
    .max(2, "El combo puede tener máximo 2 servicios"),
});

export type ComboAppointmentInput = z.infer<typeof comboAppointmentSchema>;
