import { ComboActiveToggle, ComboDeleteButton } from "./combo-row-actions";
import type { ComboWithServices } from "@/lib/catalogo/types";

interface ComboTableProps {
  combos: ComboWithServices[];
}

function formatPriceRange(minCents: number, maxCents: number): string {
  const min = (minCents / 100).toFixed(0);
  const max = (maxCents / 100).toFixed(0);
  return min === max ? `S/ ${min}` : `S/ ${min}–${max}`;
}

export function ComboTable({ combos }: ComboTableProps) {
  if (combos.length === 0) {
    return (
      <div className="bg-color-surface border border-color-line rounded-2xl shadow-card p-8 text-center text-sm text-color-ink-faint">
        No hay combos configurados todavía.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-color-surface border border-color-line rounded-2xl shadow-card">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-color-bg border-b border-color-line">
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft px-4 py-3.5">
              Combo
            </th>
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft px-4 py-3.5">
              Incluye
            </th>
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft px-4 py-3.5">
              Precio combinado
            </th>
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft px-4 py-3.5">
              Por separado (aprox.)
            </th>
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft px-4 py-3.5">
              Estado
            </th>
            <th className="px-4 py-3.5"></th>
          </tr>
        </thead>
        <tbody>
          {combos.map((combo) => {
            const separateMin = combo.services.reduce(
              (sum, s) => sum + s.min_price_cents,
              0
            );
            const separateMax = combo.services.reduce(
              (sum, s) => sum + s.max_price_cents,
              0
            );

            return (
              <tr
                key={combo.id}
                className="border-b border-color-line-soft last:border-b-0 hover:bg-color-bg"
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-color-accent-lavender/10 flex items-center justify-center text-sm flex-shrink-0">
                      🔗
                    </div>
                    <span className="font-bold text-sm text-color-ink">
                      {combo.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-xs text-color-ink-soft">
                  {combo.services.map((s) => s.service_name).join(" + ") || "—"}
                </td>
                <td className="px-4 py-3.5 font-mono font-bold text-sm">
                  S/ {(combo.combined_price_cents / 100).toFixed(2)}
                </td>
                <td className="px-4 py-3.5 text-xs text-color-ink-soft">
                  {combo.services.length > 0
                    ? formatPriceRange(separateMin, separateMax)
                    : "—"}
                </td>
                <td className="px-4 py-3.5">
                  <ComboActiveToggle comboId={combo.id} active={combo.active} />
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex justify-end">
                    <ComboDeleteButton comboId={combo.id} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
