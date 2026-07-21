export const RULE_TYPE_LABELS: Record<string, string> = {
  confirmacion: "Confirmación",
  recordatorio_24h: "Recordatorio 24h antes",
  recordatorio_2h: "Recordatorio 2h antes",
  resena: "Solicitud de reseña",
  reactivacion: "Reactivación de inactivas",
  cumpleanos: "Cumpleaños",
  promocion: "Promoción",
};

export function ruleTypeLabel(type: string | null): string {
  if (!type) return "Manual";
  return RULE_TYPE_LABELS[type] || type;
}

export const OFFSET_DESCRIPTIONS: Record<string, string> = {
  confirmacion: "Al momento de crear la cita",
  recordatorio_24h: "24 horas antes de la cita",
  recordatorio_2h: "2 horas antes de la cita",
  resena: "2 horas después de completada",
  reactivacion: "Clientas sin visitas hace 60+ días (revisión periódica)",
  cumpleanos: "El día de cumpleaños de la clienta",
};
