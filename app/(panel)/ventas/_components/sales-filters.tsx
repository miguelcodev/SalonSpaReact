"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { SaleChannel, SaleStatus } from "@/lib/ventas/types";

const CHANNELS: { key: SaleChannel | undefined; label: string }[] = [
  { key: undefined, label: "Todos los canales" },
  { key: "tienda", label: "Tienda" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "cita", label: "Cita" },
];

const STATUSES: { key: SaleStatus | undefined; label: string }[] = [
  { key: undefined, label: "Todos los estados" },
  { key: "pagado", label: "Pagado" },
  { key: "pendiente", label: "Pendiente" },
  { key: "anulado", label: "Anulado" },
];

interface SalesFiltersProps {
  activeChannel?: SaleChannel;
  activeStatus?: SaleStatus;
}

export function SalesFilters({ activeChannel, activeStatus }: SalesFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // any filter change resets pagination
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 flex-wrap">
        {CHANNELS.map(({ key, label }) => (
          <button
            key={key || "todos"}
            onClick={() => setParam("channel", key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              activeChannel === key
                ? "bg-color-ink text-white border-color-ink"
                : "bg-color-surface text-color-ink-soft border-color-line hover:bg-color-line-soft"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(({ key, label }) => (
          <button
            key={key || "todos"}
            onClick={() => setParam("status", key)}
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
