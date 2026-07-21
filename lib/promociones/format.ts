import type { PromotionWithStatus } from "./types";

function formatShortDate(dateISO: string): string {
  const date = new Date(`${dateISO}T00:00:00`);
  return date
    .toLocaleDateString("es-PE", { day: "2-digit", month: "short" })
    .replace(".", "");
}

export function formatDiscount(promo: PromotionWithStatus): string {
  if (promo.discount_type === "percent") {
    return `${promo.discount_value}% OFF`;
  }
  return `S/ ${(promo.discount_value / 100).toFixed(0)} de descuento`;
}

export function formatValidity(promo: PromotionWithStatus): string {
  if (promo.status === "vencida" && promo.valid_to) {
    return `Venció ${formatShortDate(promo.valid_to)}`;
  }
  if (promo.status === "programada" && promo.valid_from) {
    return `Empieza ${formatShortDate(promo.valid_from)}`;
  }
  if (promo.valid_to) {
    return `Válida hasta ${formatShortDate(promo.valid_to)}`;
  }
  return "Sin fecha de vencimiento";
}

export function usagePercent(promo: PromotionWithStatus): number {
  if (!promo.usage_limit) return 0;
  return Math.min(100, Math.round((promo.usage_count / promo.usage_limit) * 100));
}

export function usageLabel(promo: PromotionWithStatus): string {
  const limit = promo.usage_limit ? String(promo.usage_limit) : "∞";
  return `${promo.usage_count} / ${limit} cupones usados`;
}
