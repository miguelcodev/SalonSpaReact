import Link from "next/link";
import type { SaleListEntry } from "@/lib/ventas/types";

const CHANNEL_LABELS: Record<string, string> = {
  tienda: "Tienda",
  whatsapp: "WhatsApp",
  cita: "Cita",
};

const STATUS_STYLES: Record<string, string> = {
  pagado: "bg-green-50 text-color-accent-sage",
  pendiente: "bg-yellow-50 text-yellow-700",
  anulado: "bg-color-line-soft text-color-ink-faint",
};

export function SalesTable({ sales }: { sales: SaleListEntry[] }) {
  if (sales.length === 0) {
    return (
      <div className="bg-color-surface border border-color-line rounded-2xl shadow-card p-8 text-center text-sm text-color-ink-faint">
        Todavía no hay ventas registradas.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-color-surface border border-color-line rounded-2xl shadow-card">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-color-bg border-b border-color-line">
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft px-4 py-3.5">
              Clienta
            </th>
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft px-4 py-3.5">
              Canal
            </th>
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft px-4 py-3.5">
              Ítems
            </th>
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft px-4 py-3.5">
              Total
            </th>
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft px-4 py-3.5">
              Estado
            </th>
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft px-4 py-3.5">
              Fecha
            </th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id} className="border-b border-color-line-soft last:border-b-0 hover:bg-color-bg">
              <td className="px-4 py-3">
                <Link
                  href={`/ventas/${sale.id}`}
                  className="text-sm font-bold text-color-ink hover:text-color-accent-rose"
                >
                  {sale.client_name || "Clienta no registrada"}
                </Link>
              </td>
              <td className="px-4 py-3 text-xs text-color-ink-soft">
                {CHANNEL_LABELS[sale.channel]}
              </td>
              <td className="px-4 py-3 text-xs text-color-ink-soft">
                {sale.item_count} producto{sale.item_count !== 1 ? "s" : ""}
              </td>
              <td className="px-4 py-3 font-mono text-sm font-bold text-color-ink">
                S/ {(sale.total_cents / 100).toFixed(2)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${STATUS_STYLES[sale.status]}`}
                >
                  {sale.status}
                </span>
              </td>
              <td className="px-4 py-3 text-xs font-mono text-color-ink-soft whitespace-nowrap">
                {new Date(sale.created_at).toLocaleString("es-PE", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
