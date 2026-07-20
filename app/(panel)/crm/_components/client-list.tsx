import Link from "next/link";
import type { ClientWithSegments } from "@/lib/crm/types";
import { getAvatarColor, getInitials, formatRelativeDays } from "@/lib/crm/filters";

interface ClientListProps {
  clients: ClientWithSegments[];
  selectedId?: string;
  buildHref: (clientId: string) => string;
}

function tagLabel(client: ClientWithSegments): { label: string; className: string }[] {
  const tags: { label: string; className: string }[] = [];
  if (client.is_vip) {
    tags.push({ label: "VIP", className: "bg-yellow-50 text-yellow-700" });
  }
  if (client.is_birthday_month) {
    tags.push({ label: "🎂 Cumple", className: "bg-orange-50 text-color-accent-terra" });
  }
  if (client.is_inactive) {
    tags.push({ label: "Inactiva", className: "bg-color-line-soft text-color-ink-faint" });
  }
  return tags;
}

export function ClientList({ clients, selectedId, buildHref }: ClientListProps) {
  if (clients.length === 0) {
    return (
      <div className="bg-color-surface border border-color-line rounded-2xl shadow-card p-8 text-center text-sm text-color-ink-faint">
        No hay clientas en este filtro.
      </div>
    );
  }

  return (
    <div className="bg-color-surface border border-color-line rounded-2xl shadow-card overflow-hidden">
      {clients.map((client) => {
        const isSelected = client.id === selectedId;
        const tags = tagLabel(client);

        return (
          <Link
            key={client.id}
            href={buildHref(client.id)}
            className={`flex items-center gap-3 px-4 py-3.5 border-b border-color-line-soft last:border-b-0 relative transition-colors ${
              isSelected ? "bg-red-50" : "hover:bg-color-bg"
            }`}
          >
            {isSelected && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-color-accent-rose" />
            )}

            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-serif font-semibold text-sm flex-shrink-0"
              style={{ backgroundColor: getAvatarColor(client.name) }}
            >
              {getInitials(client.name)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-color-ink truncate">
                {client.name}
              </div>
              <div className="text-xs text-color-ink-soft">
                {client.visit_count} visitas · última{" "}
                {formatRelativeDays(client.last_visit_at)}
              </div>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-col gap-1 items-end flex-shrink-0">
                {tags.map((t) => (
                  <span
                    key={t.label}
                    className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${t.className}`}
                  >
                    {t.label}
                  </span>
                ))}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
