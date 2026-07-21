import { formatMoney } from "@/lib/reportes/format";
import type { TopServiceEntry } from "@/lib/reportes/types";

export function TopServicesList({
  services,
  emptyMessage = "Sin servicios completados en este período.",
}: {
  services: TopServiceEntry[];
  emptyMessage?: string;
}) {
  if (services.length === 0) {
    return (
      <p className="text-sm text-color-ink-faint py-6 text-center">{emptyMessage}</p>
    );
  }

  return (
    <div>
      {services.map((s, i) => (
        <div
          key={s.name}
          className="flex items-center gap-3 py-2.5 border-b border-color-line-soft last:border-b-0"
        >
          <div className="w-6 h-6 rounded-full bg-color-line-soft text-color-ink-soft text-xs font-bold flex items-center justify-center flex-shrink-0">
            {i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-color-ink truncate">{s.name}</div>
            <div className="h-1.5 bg-color-line-soft rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-color-accent-rose"
                style={{ width: `${s.pct}%` }}
              ></div>
            </div>
          </div>
          <div className="font-mono text-xs font-bold text-color-ink flex-shrink-0">
            {formatMoney(s.revenueCents)}
          </div>
        </div>
      ))}
    </div>
  );
}
