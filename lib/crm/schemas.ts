import { z } from "zod";

export const newClientSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  birthDate: z.string().optional(),
  preferences: z.string().optional(),
});

export type NewClientInput = z.infer<typeof newClientSchema>;
