import type { PeriodDelta } from "@/lib/reportes/types";

interface StatCardProps {
  value: string;
  label: string;
  delta?: PeriodDelta;
  /** Whether an increase is the desired direction (revenue: yes, no-show: no) */
  upIsGood?: boolean;
}

export function StatCard({ value, label, delta, upIsGood = true }: StatCardProps) {
  const showDelta = delta && delta.pct !== null && delta.pct !== 0;
  const isUp = showDelta && delta.pct! > 0;
  const isPositive = showDelta && (upIsGood ? isUp : !isUp);

  return (
    <div className="bg-color-surface border border-color-line rounded-2xl shadow-card p-5">
      <div className="text-2xl font-serif font-semibold text-color-ink">{value}</div>
      <div className="text-xs text-color-ink-soft mt-1">{label}</div>
      {showDelta && (
        <span
          className={`inline-block mt-2 text-[11px] font-bold px-2 py-0.5 rounded-full ${
            isPositive ? "bg-green-50 text-color-accent-sage" : "bg-red-50 text-red-600"
          }`}
        >
          {isUp ? "↑" : "↓"} {Math.abs(delta.pct!)}% vs. periodo anterior
        </span>
      )}
    </div>
  );
}
