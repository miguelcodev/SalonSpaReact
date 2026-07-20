import type { ClientFilter, ClientWithSegments } from "./types";

export function applySearch(
  clients: ClientWithSegments[],
  search?: string
): ClientWithSegments[] {
  if (!search) return clients;
  const q = search.toLowerCase();
  return clients.filter((c) => c.name.toLowerCase().includes(q));
}

export function applyFilter(
  clients: ClientWithSegments[],
  filter?: ClientFilter
): ClientWithSegments[] {
  if (!filter) return clients;
  if (filter === "vip") return clients.filter((c) => c.is_vip);
  if (filter === "cumple") return clients.filter((c) => c.is_birthday_month);
  if (filter === "inactiva") return clients.filter((c) => c.is_inactive);
  return clients;
}

export function countByFilter(clients: ClientWithSegments[]) {
  return {
    todas: clients.length,
    vip: clients.filter((c) => c.is_vip).length,
    cumple: clients.filter((c) => c.is_birthday_month).length,
    inactiva: clients.filter((c) => c.is_inactive).length,
  };
}

/**
 * Format elapsed time since a date in Spanish, matching the CRM prototype
 * ("hoy", "hace 3 días", "hace 2 semanas").
 */
export function formatRelativeDays(dateISO: string | null): string {
  if (!dateISO) return "sin visitas";

  const date = new Date(dateISO);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "hoy";
  if (diffDays === 1) return "hace 1 día";
  if (diffDays < 7) return `hace ${diffDays} días`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "hace 1 semana" : `hace ${weeks} semanas`;
  }
  const months = Math.floor(diffDays / 30);
  return months === 1 ? "hace 1 mes" : `hace ${months} meses`;
}

/**
 * Deterministic avatar color from the Bellamora palette, based on the
 * client's name — same client always gets the same color across renders.
 */
const AVATAR_PALETTE = [
  "#C77B4B",
  "#B8697A",
  "#7C9070",
  "#8D7B9E",
  "#C9A227",
  "#9A4F60",
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
