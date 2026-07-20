import { getClientHistory } from "@/lib/crm/queries";
import { getAvatarColor, getInitials, formatRelativeDays } from "@/lib/crm/filters";
import type { ClientWithSegments } from "@/lib/crm/types";

interface ClientProfileProps {
  client: ClientWithSegments;
}

const HISTORY_ICONS: Record<string, string> = {
  Cabello: "✂️",
  Uñas: "💅",
  Facial: "🌿",
  Maquillaje: "💄",
};

export async function ClientProfile({ client }: ClientProfileProps) {
  const history = await getClientHistory(client.id);

  const avgTicketCents =
    client.visit_count > 0
      ? Math.round(client.total_spent_cents / client.visit_count)
      : 0;

  const tags = [
    client.is_vip && { label: "VIP", className: "bg-yellow-50 text-yellow-700" },
    client.is_birthday_month && {
      label: "🎂 Cumple",
      className: "bg-orange-50 text-color-accent-terra",
    },
    client.is_inactive && {
      label: "Inactiva",
      className: "bg-color-line-soft text-color-ink-faint",
    },
  ].filter(Boolean) as { label: string; className: string }[];

  return (
    <div className="bg-color-surface border border-color-line rounded-2xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="px-7 py-6 border-b border-color-line-soft bg-gradient-to-b from-white to-color-bg flex gap-4 items-start">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white font-serif font-semibold text-xl flex-shrink-0"
          style={{ backgroundColor: getAvatarColor(client.name) }}
        >
          {getInitials(client.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-2xl font-serif font-semibold text-color-ink">
            {client.name}
          </div>

          {tags.length > 0 ? (
            <div className="flex gap-1.5 mt-1.5">
              {tags.map((t) => (
                <span
                  key={t.label}
                  className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${t.className}`}
                >
                  {t.label}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-xs text-color-ink-soft mt-1.5">
              Clienta regular
            </div>
          )}

          <div className="flex gap-4 flex-wrap text-xs text-color-ink-soft mt-2">
            {client.phone && <span>📱 {client.phone}</span>}
            {client.email && <span>✉️ {client.email}</span>}
            <span>
              Registrada desde{" "}
              {new Date(client.created_at).toLocaleDateString("es-PE", {
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 border-b border-color-line-soft">
        <div className="px-4 py-4 text-center border-r border-color-line-soft">
          <div className="text-xl font-serif font-semibold text-color-ink">
            {client.visit_count}
          </div>
          <div className="text-[10px] text-color-ink-soft uppercase tracking-wide mt-0.5">
            Visitas
          </div>
        </div>
        <div className="px-4 py-4 text-center border-r border-color-line-soft">
          <div className="text-xl font-serif font-semibold text-color-ink">
            S/ {(client.total_spent_cents / 100).toFixed(0)}
          </div>
          <div className="text-[10px] text-color-ink-soft uppercase tracking-wide mt-0.5">
            Total gastado
          </div>
        </div>
        <div className="px-4 py-4 text-center border-r border-color-line-soft">
          <div className="text-xl font-serif font-semibold text-color-ink">
            {formatRelativeDays(client.last_visit_at)}
          </div>
          <div className="text-[10px] text-color-ink-soft uppercase tracking-wide mt-0.5">
            Última visita
          </div>
        </div>
        <div className="px-4 py-4 text-center">
          <div className="text-xl font-serif font-semibold text-color-ink">
            S/ {(avgTicketCents / 100).toFixed(0)}
          </div>
          <div className="text-[10px] text-color-ink-soft uppercase tracking-wide mt-0.5">
            Ticket prom.
          </div>
        </div>
      </div>

      {/* Preferences */}
      {client.preferences && (
        <>
          <div className="px-7 pt-5 pb-2 text-xs font-bold uppercase tracking-wide text-color-ink-soft">
            Preferencias y notas
          </div>
          <div className="mx-7 mb-5 bg-color-bg rounded-lg p-4 text-sm text-color-ink-soft leading-relaxed">
            {client.preferences}
          </div>
        </>
      )}

      {/* History */}
      <div className="px-7 pt-5 pb-2 text-xs font-bold uppercase tracking-wide text-color-ink-soft">
        Historial de servicios
      </div>
      <div className="px-7 pb-6">
        {history.length === 0 ? (
          <p className="text-sm text-color-ink-faint py-4">
            Sin citas completadas todavía.
          </p>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 py-3.5 border-b border-color-line-soft last:border-b-0"
            >
              <div className="w-8 h-8 rounded-full bg-color-bg flex items-center justify-center text-sm flex-shrink-0">
                {HISTORY_ICONS[item.category_name] || "💇"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-sm font-bold text-color-ink truncate">
                    {item.service_name}
                  </span>
                  <span className="text-xs text-color-ink-faint font-mono flex-shrink-0">
                    {new Date(item.start_time).toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </div>
                <div className="text-xs text-color-ink-soft mt-0.5">
                  con {item.staff_name}
                </div>
              </div>
              <span className="text-xs font-bold text-color-accent-sage flex-shrink-0">
                S/ {(item.price_cents / 100).toFixed(2)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
