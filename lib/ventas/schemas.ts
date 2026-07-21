import { z } from "zod";

export const newSaleSchema = z
  .object({
    clientId: z.string().uuid("Cliente inválido").optional().or(z.literal("")),
    appointmentId: z.string().uuid().optional().or(z.literal("")),
    channel: z.enum(["tienda", "whatsapp", "cita"]),
    items: z
      .array(
        z.object({
          productId: z.string().uuid("Producto inválido"),
          quantity: z.coerce.number().int().positive("Cantidad inválida"),
        })
      )
      .default([]),
    discountCents: z.coerce.number().int().min(0, "Inválido").default(0),
    paymentMethod: z.enum(["stripe", "efectivo", "yape", "plin"]),
    notes: z.string().optional(),
  })
  .refine((data) => data.items.length > 0 || !!data.appointmentId, {
    message: "Agrega al menos un producto o vincula una cita",
    path: ["items"],
  });

export type NewSaleInput = z.infer<typeof newSaleSchema>;
