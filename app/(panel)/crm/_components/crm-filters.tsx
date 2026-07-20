"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { ClientFilter } from "@/lib/crm/types";

interface CrmFiltersProps {
  counts: {
    todas: number;
    vip: number;
    cumple: number;
    inactiva: number;
  };
  activeFilter?: ClientFilter;
}

const FILTERS: { key: ClientFilter | undefined; label: (n: number) => string }[] = [
  { key: undefined, label: (n) => `Todas (${n})` },
  { key: "vip", label: (n) => `VIP (${n})` },
  { key: "cumple", label: (n) => `🎂 Cumpleañeras del mes (${n})` },
  { key: "inactiva", label: (n) => `Inactivas 60+ días (${n})` },
];

export function CrmFilters({ counts, activeFilter }: CrmFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setFilter(filter: ClientFilter | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (filter) {
      params.set("filter", filter);
    } else {
      params.delete("filter");
    }
    params.delete("client"); // reset selection when switching filters
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {FILTERS.map(({ key, label }) => {
        const count = key ? counts[key] : counts.todas;
        const isActive = activeFilter === key;
        return (
          <button
            key={key || "todas"}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
              isActive
                ? "bg-color-ink text-white border-color-ink"
                : "bg-color-surface text-color-ink-soft border-color-line hover:bg-color-line-soft"
            }`}
          >
            {label(count)}
          </button>
        );
      })}
    </div>
  );
}
