import { Suspense } from "react";
import { getPromotionsWithStatus } from "@/lib/promociones/queries";
import { createClient } from "@/lib/supabase/server";
import { PromoTabs } from "./_components/promo-tabs";
import { PromoCard } from "./_components/promo-card";
import { NewPromoModal } from "./_components/new-promo-modal";
import { LoyaltySection } from "./_components/loyalty-section";
import type { PromotionStatus } from "@/lib/promociones/types";

interface PromocionesPageProps {
  searchParams: Promise<{ status?: string }>;
}

const VALID_STATUSES: PromotionStatus[] = ["activa", "programada", "vencida"];

async function getDistinctLoyaltyClientCount(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.from("loyalty_progress").select("client_id");
  return new Set((data || []).map((r) => r.client_id)).size;
}

export default async function PromocionesPage({ searchParams }: PromocionesPageProps) {
  const params = await searchParams;
  const status = VALID_STATUSES.includes(params.status as PromotionStatus)
    ? (params.status as PromotionStatus)
    : undefined;

  const [allPromos, loyaltyClientCount] = await Promise.all([
    getPromotionsWithStatus(),
    getDistinctLoyaltyClientCount(),
  ]);

  const filtered = status ? allPromos.filter((p) => p.status === status) : allPromos;

  const stats = {
    activas: allPromos.filter((p) => p.status === "activa").length,
    programadas: allPromos.filter((p) => p.status === "programada").length,
    vencidas: allPromos.filter((p) => p.status === "vencida").length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-color-ink">
            Promociones
          </h1>
          <p className="text-color-ink-soft mt-2">
            Cupones, descuentos por categoría y el programa de fidelidad
          </p>
        </div>
        <NewPromoModal />
      </div>

      {/* Stats — all derived from real data, no placeholder numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-color-surface border border-color-line rounded-2xl shadow-card p-5">
          <div className="text-2xl font-serif font-semibold text-color-ink">
            {stats.activas}
          </div>
          <div className="text-xs text-color-ink-soft mt-1">Promociones activas</div>
        </div>
        <div className="bg-color-surface border border-color-line rounded-2xl shadow-card p-5">
          <div className="text-2xl font-serif font-semibold text-color-ink">
            {stats.programadas}
          </div>
          <div className="text-xs text-color-ink-soft mt-1">Programadas</div>
        </div>
        <div className="bg-color-surface border border-color-line rounded-2xl shadow-card p-5">
          <div className="text-2xl font-serif font-semibold text-color-ink">
            {stats.vencidas}
          </div>
          <div className="text-xs text-color-ink-soft mt-1">Vencidas</div>
        </div>
        <div className="bg-color-surface border border-color-line rounded-2xl shadow-card p-5">
          <div className="text-2xl font-serif font-semibold text-color-ink">
            {loyaltyClientCount}
          </div>
          <div className="text-xs text-color-ink-soft mt-1">
            Clientas en programa de fidelidad
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Suspense fallback={null}>
        <PromoTabs activeStatus={status} totalCount={allPromos.length} />
      </Suspense>

      {/* Promo grid */}
      {filtered.length === 0 ? (
        <div className="bg-color-surface border border-color-line rounded-2xl shadow-card p-12 text-center text-color-ink-faint">
          No hay promociones en este filtro.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((promo) => (
            <PromoCard key={promo.id} promo={promo} />
          ))}
        </div>
      )}

      {/* Loyalty program */}
      <div className="pt-4">
        <LoyaltySection />
      </div>
    </div>
  );
}
