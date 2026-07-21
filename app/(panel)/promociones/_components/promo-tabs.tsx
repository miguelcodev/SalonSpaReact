"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { PromotionStatus } from "@/lib/promociones/types";

interface PromoTabsProps {
  activeStatus?: PromotionStatus;
  totalCount: number;
}

const TABS: { key: PromotionStatus | undefined; label: string }[] = [
  { key: undefined, label: "Todas" },
  { key: "activa", label: "Activas" },
  { key: "programada", label: "Programadas" },
  { key: "vencida", label: "Vencidas" },
];

export function PromoTabs({ activeStatus, totalCount }: PromoTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setStatus(status: PromotionStatus | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {TABS.map(({ key, label }) => {
        const isActive = activeStatus === key;
        return (
          <button
            key={key || "todas"}
            onClick={() => setStatus(key)}
            className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
              isActive
                ? "bg-color-ink text-white border-color-ink"
                : "bg-color-surface text-color-ink-soft border-color-line hover:bg-color-line-soft"
            }`}
          >
            {label}
            {key === undefined && ` (${totalCount})`}
          </button>
        );
      })}
    </div>
  );
}
