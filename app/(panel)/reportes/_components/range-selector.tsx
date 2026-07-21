"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { ReportRange } from "@/lib/reportes/types";

const RANGES: { key: ReportRange; label: string }[] = [
  { key: "7d", label: "7 días" },
  { key: "month", label: "Este mes" },
  { key: "quarter", label: "Trimestre" },
];

export function RangeSelector({ activeRange }: { activeRange: ReportRange }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setRange(range: ReportRange) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex bg-color-surface border border-color-line rounded-full p-1">
      {RANGES.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setRange(key)}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
            activeRange === key
              ? "bg-color-ink text-white"
              : "text-color-ink-soft hover:bg-color-line-soft"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
