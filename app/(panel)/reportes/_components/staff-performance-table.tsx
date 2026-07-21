import { formatMoney } from "@/lib/reportes/format";
import type { StaffPerformanceEntry } from "@/lib/reportes/types";

export function StaffPerformanceTable({
  staff,
}: {
  staff: StaffPerformanceEntry[];
}) {
  if (staff.length === 0) {
    return (
      <p className="text-sm text-color-ink-faint py-6 text-center">
        No hay especialistas activas configuradas.
      </p>
    );
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft pb-2 border-b border-color-line">
            Especialista
          </th>
          <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft pb-2 border-b border-color-line">
            Ocupación
          </th>
          <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft pb-2 border-b border-color-line">
            Ingresos
          </th>
        </tr>
      </thead>
      <tbody>
        {staff.map((s) => (
          <tr key={s.id} className="border-b border-color-line-soft last:border-b-0">
            <td className="py-2.5">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: s.colorHex }}
                >
                  {s.name[0]}
                </div>
                <span className="text-sm font-bold text-color-ink">{s.name}</span>
              </div>
            </td>
            <td className="py-2.5">
              <div className="flex items-center gap-2">
                {/* Meter: fill carries the value; unfilled track is a lighter
                    step of the same hue so state reads across the whole bar */}
                <div className="w-16 h-1.5 rounded-full bg-color-accent-sage/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-color-accent-sage"
                    style={{ width: `${s.occupancyPct}%` }}
                  ></div>
                </div>
                <span className="text-xs font-mono text-color-ink-soft">
                  {s.occupancyPct}%
                </span>
              </div>
            </td>
            <td className="py-2.5 font-mono text-sm font-bold text-color-ink">
              {formatMoney(s.revenueCents)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
