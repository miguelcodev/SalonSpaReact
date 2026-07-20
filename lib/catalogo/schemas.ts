import { z } from "zod";

export const newServiceSchema = z.object({
  categoryId: z.string().uuid("Categoría inválida"),
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional(),
  durationMinutes: z.coerce.number().int().positive("Duración inválida"),
  bufferMinutes: z.coerce.number().int().min(0, "Buffer inválido"),
  prices: z
    .array(
      z.object({
        staffId: z.string().uuid("Especialista inválida"),
        priceCents: z.coerce.number().int().positive("Precio inválido"),
      })
    )
    .min(1, "Agrega el precio de al menos una especialista"),
});

export type NewServiceInput = z.infer<typeof newServiceSchema>;

export const newComboSchema = z
  .object({
    name: z.string().min(1, "El nombre es obligatorio"),
    combinedPriceCents: z.coerce.number().int().positive("Precio inválido"),
    serviceIds: z
      .array(z.string().uuid("Servicio inválido"))
      .length(2, "Selecciona exactamente 2 servicios"),
  })
  .refine((data) => new Set(data.serviceIds).size === data.serviceIds.length, {
    message: "Elige dos servicios distintos",
    path: ["serviceIds"],
  });

export type NewComboInput = z.infer<typeof newComboSchema>;
