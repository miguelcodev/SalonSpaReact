import { formatMoney } from "@/lib/reportes/format";
import type { RevenueBucket } from "@/lib/reportes/types";

export function RevenueChart({ buckets }: { buckets: RevenueBucket[] }) {
  if (buckets.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-sm text-color-ink-faint">
        Sin ingresos en este período todavía.
      </div>
    );
  }

  const max = Math.max(...buckets.map((b) => b.revenueCents), 1);
  const maxIndex = buckets.reduce(
    (best, b, i) => (b.revenueCents > buckets[best].revenueCents ? i : best),
    0
  );
  const lastIndex = buckets.length - 1;

  return (
    <div className="flex items-end gap-3 h-44 pt-6">
      {buckets.map((b, i) => {
        const heightPct = Math.max(2, Math.round((b.revenueCents / max) * 100));
        // Label selectively (the extreme + the most recent bar), not every
        // bar — a value on every point goes unread. Hover carries the rest.
        const showLabel = i === maxIndex || i === lastIndex;
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
          >
            <div
              className="w-full max-w-9 rounded-t-md bg-gradient-to-b from-color-accent-rose to-color-accent-rose-deep relative cursor-default"
              style={{ height: `${heightPct}%` }}
              title={formatMoney(b.revenueCents)}
            >
              {showLabel && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono text-color-ink-soft whitespace-nowrap">
                  {formatMoney(b.revenueCents)}
                </span>
              )}
            </div>
            <span className="text-[11px] text-color-ink-soft font-semibold">
              {b.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
