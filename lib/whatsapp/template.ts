/**
 * Renders {placeholder} tokens in automation_rules.template_text.
 * Unknown placeholders are left as-is rather than silently dropped, so a
 * typo in a template is visible in the sent message instead of vanishing.
 */
export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}

export function formatApptDate(dateISO: string, timezone: string): string {
  return new Date(dateISO).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    timeZone: timezone,
  });
}

export function formatApptTime(dateISO: string, timezone: string): string {
  return new Date(dateISO).toLocaleTimeString("es-PE", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  });
}
