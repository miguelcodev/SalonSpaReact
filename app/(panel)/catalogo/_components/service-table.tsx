import { getCategoryColor } from "@/lib/agenda/category-colors";
import { ServiceStatusToggle, ServiceDeleteButton } from "./service-row-actions";
import type { ServiceWithPricing } from "@/lib/catalogo/types";

const CATEGORY_ICONS: Record<string, string> = {
  Cabello: "✂️",
  Uñas: "💅",
  Facial: "🌿",
  Maquillaje: "💄",
};

interface ServiceTableProps {
  services: ServiceWithPricing[];
}

export function ServiceTable({ services }: ServiceTableProps) {
  if (services.length === 0) {
    return (
      <div className="bg-color-surface border border-color-line rounded-2xl shadow-card p-8 text-center text-sm text-color-ink-faint">
        No hay servicios en esta categoría todavía.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-color-surface border border-color-line rounded-2xl shadow-card">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-color-bg border-b border-color-line">
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft px-4 py-3.5">
              Servicio
            </th>
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft px-4 py-3.5">
              Duración
            </th>
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft px-4 py-3.5">
              Buffer limpieza
            </th>
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft px-4 py-3.5">
              Precio por especialista
            </th>
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft px-4 py-3.5">
              Estado
            </th>
            <th className="px-4 py-3.5"></th>
          </tr>
        </thead>
        <tbody>
          {services.map((service) => {
            const categoryColor = getCategoryColor(service.category);
            return (
              <tr
                key={service.id}
                className="border-b border-color-line-soft last:border-b-0 hover:bg-color-bg"
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                      style={{ backgroundColor: `${categoryColor}22` }}
                    >
                      {CATEGORY_ICONS[service.category?.name] || "💇"}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-color-ink">
                        {service.name}
                      </div>
                      {service.description && (
                        <div className="text-xs text-color-ink-soft mt-0.5">
                          {service.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-mono text-xs text-color-ink-soft">
                  {service.duration_minutes} min
                </td>
                <td className="px-4 py-3.5">
                  <span className="font-mono text-xs text-yellow-700 bg-yellow-50 px-2.5 py-1 rounded-full">
                    +{service.buffer_minutes} min
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  {service.prices.length === 0 ? (
                    <span className="text-xs text-red-600 font-semibold">
                      Sin precio — no reservable
                    </span>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {service.prices.map((p) => (
                        <div
                          key={p.staff_id}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span className="text-color-ink-soft">{p.staff_name}</span>
                          <span className="font-mono font-bold ml-auto">
                            S/ {(p.price_cents / 100).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <ServiceStatusToggle serviceId={service.id} status={service.status} />
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex justify-end">
                    <ServiceDeleteButton serviceId={service.id} />
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
