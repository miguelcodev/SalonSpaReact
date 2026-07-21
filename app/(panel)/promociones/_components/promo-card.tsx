import { getCategoryColor } from "@/lib/agenda/category-colors";
import { formatDiscount, formatValidity, usagePercent, usageLabel } from "@/lib/promociones/format";
import { PromoCardActions } from "./promo-card-actions";
import type { PromotionWithStatus } from "@/lib/promociones/types";

const STATUS_STYLES: Record<string, string> = {
  activa: "bg-green-50 text-color-accent-sage",
  programada: "bg-yellow-50 text-yellow-700",
  vencida: "bg-color-line-soft text-color-ink-faint",
};

export function PromoCard({ promo }: { promo: PromotionWithStatus }) {
  const categoryColor = promo.category ? getCategoryColor(promo.category) : "#C9A227";
  const pct = usagePercent(promo);

  return (
    <div className="relative bg-color-surface border border-color-line rounded-2xl overflow-hidden shadow-card flex flex-col">
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ backgroundColor: categoryColor }}
      ></div>

      <div className="pl-5 pr-5 pt-4 pb-3.5 relative">
        <span
          className={`absolute top-4 right-5 text-[9.5px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${STATUS_STYLES[promo.status]}`}
        >
          {promo.status}
        </span>
        <div className="font-serif text-lg font-semibold text-color-ink pr-20">
          {promo.name}
        </div>
        <div className="text-xs text-color-ink-soft mt-1">
          {promo.category?.name || "Todas las categorías"}
        </div>
      </div>

      <div className="flex gap-4 pl-5 pr-5 pb-3.5 text-xs text-color-ink-soft">
        <div>
          Descuento
          <br />
          <b className="font-mono font-bold text-color-ink">{formatDiscount(promo)}</b>
        </div>
        <div>
          Vigencia
          <br />
          <b className="font-mono font-bold text-color-ink">{formatValidity(promo)}</b>
        </div>
      </div>

      <div className="px-5">
        <div className="h-1.5 bg-color-line-soft rounded-full overflow-hidden">
          <div
            className="h-full bg-color-accent-rose rounded-full"
            style={{ width: `${pct}%` }}
          ></div>
        </div>
      </div>
      <div className="px-5 pt-1 pb-4 text-xs text-color-ink-faint">
        {usageLabel(promo)}
      </div>

      <div className="mt-auto">
        <PromoCardActions promotionId={promo.id} />
      </div>
    </div>
  );
}
