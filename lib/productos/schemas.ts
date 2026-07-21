import { z } from "zod";

export const newProductSchema = z.object({
  categoryId: z.string().uuid("Categoría inválida"),
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional(),
  sku: z.string().optional(),
  priceCents: z.coerce.number().int().positive("Precio inválido"),
  initialStock: z.coerce.number().int().min(0, "El stock inicial no puede ser negativo"),
  lowStockThreshold: z.coerce.number().int().min(0, "Inválido"),
});

export type NewProductInput = z.infer<typeof newProductSchema>;

export const stockMovementSchema = z.object({
  productId: z.string().uuid("Producto inválido"),
  type: z.enum(["entrada", "salida"]),
  quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a 0"),
  reason: z.string().min(1, "Indica el motivo"),
});

export type StockMovementInput = z.infer<typeof stockMovementSchema>;
