import type { ServiceCategory } from "@/types/database";

/**
 * Get the color for a service category.
 * Uses category.color_hex from the database (editable per salon).
 * Fallback colors if not set (these match the seed data defaults).
 */
export function getCategoryColor(
  category: ServiceCategory | undefined
): string {
  if (!category) return "#B8697A"; // Default rose

  return category.color_hex || "#B8697A";
}

/**
 * Get the Tailwind background color class for a category.
 * Used when the color is known at build time (e.g., in the legend).
 */
export function getCategoryBgClass(colorHex: string | null): string {
  if (!colorHex) return "bg-color-accent-rose";

  // Map seed colors to Tailwind classes for legend/badges
  const colorMap: Record<string, string> = {
    "#C77B4B": "bg-color-accent-terra",   // Cabello
    "#B8697A": "bg-color-accent-rose",    // Uñas
    "#7C9070": "bg-color-accent-sage",    // Facial
    "#8D7B9E": "bg-color-accent-lavender", // Maquillaje
    "#C9A227": "bg-color-accent-gold",    // (if used)
  };

  return colorMap[colorHex] || "bg-color-accent-rose";
}
