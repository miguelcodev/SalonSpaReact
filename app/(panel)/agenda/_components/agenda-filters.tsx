"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import type { StaffColumn } from "@/lib/agenda/types";

interface AgendaFiltersProps {
  staff: StaffColumn[];
  activeStaffIds: string[]; // empty = all
  activeStatus?: "pendiente" | "confirmada";
}

const STATUSES: { key: "pendiente" | "confirmada" | undefined; label: string }[] = [
  { key: undefined, label: "Todos los estados" },
  { key: "confirmada", label: "Confirmadas" },
  { key: "pendiente", label: "Pendientes" },
];

export function AgendaFilters({ staff, activeStaffIds, activeStatus }: AgendaFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }
      router.push(`${pathname}?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function toggleStaff(staffId: string) {
    const params = new URLSearchParams(searchParams.toString());
    const current = activeStaffIds;
    const next = current.includes(staffId)
      ? current.filter((id) => id !== staffId)
      : [...current, staffId];

    if (next.length === 0) {
      params.delete("staff");
    } else {
      params.set("staff", next.join(","));
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function setStatus(status: "pendiente" | "confirmada" | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Staff column toggles */}
        <div className="flex gap-2 flex-wrap">
          {staff.map((s) => {
            const isHidden = activeStaffIds.length > 0 && !activeStaffIds.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggleStaff(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  isHidden
                    ? "bg-color-surface text-color-ink-faint border-color-line-soft"
                    : "bg-color-surface text-color-ink border-color-line hover:bg-color-line-soft"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: isHidden ? "#D9D2D5" : s.color_hex }}
                ></span>
                {s.name}
              </button>
            );
          })}
        </div>

        {/* Client search */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-color-ink-faint"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar clienta..."
            className="w-52 pl-8 pr-3 py-2 rounded-full border border-color-line bg-color-surface text-sm focus:border-color-accent-rose focus:outline-none"
          />
        </div>
      </div>

      {/* Status chips */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(({ key, label }) => (
          <button
            key={key || "todos"}
            onClick={() => setStatus(key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              activeStatus === key
                ? "bg-color-accent-rose text-white border-color-accent-rose"
                : "bg-color-surface text-color-ink-soft border-color-line hover:bg-color-line-soft"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
