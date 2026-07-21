import { z } from "zod";

export const newPromotionSchema = z
  .object({
    name: z.string().min(1, "El nombre es obligatorio"),
    categoryId: z.string().optional(), // "" or omitted = applies to all categories
    discountType: z.enum(["percent", "fixed"]),
    discountValue: z.coerce.number().positive("El descuento debe ser mayor a 0"),
    validFrom: z.string().optional(),
    validTo: z.string().optional(),
    usageLimit: z.preprocess(
      (v) => (v === "" || v === undefined || v === null ? undefined : v),
      z.coerce.number().int().positive("El límite debe ser mayor a 0").optional()
    ),
    sendWhatsapp: z.boolean(),
  })
  .refine(
    (data) =>
      !data.validFrom || !data.validTo || data.validFrom <= data.validTo,
    { message: "La fecha de inicio debe ser anterior a la de fin", path: ["validTo"] }
  );

export type NewPromotionInput = z.infer<typeof newPromotionSchema>;

export const loyaltyProgramSchema = z.object({
  visitsRequired: z.coerce.number().int().positive("Debe ser mayor a 0"),
  rewardDescription: z.string().min(1, "Describe la recompensa"),
});

export type LoyaltyProgramInput = z.infer<typeof loyaltyProgramSchema>;
