import { Suspense } from "react";
import {
  getServicesWithPricing,
  getCombosWithServices,
  getServiceCategories,
} from "@/lib/catalogo/queries";
import { CatalogoTabs } from "./_components/catalogo-tabs";
import { ServiceTable } from "./_components/service-table";
import { ComboTable } from "./_components/combo-table";
import { NewServiceModal } from "./_components/new-service-modal";
import { NewComboModal } from "./_components/new-combo-modal";

interface CatalogoPageProps {
  searchParams: Promise<{ cat?: string }>;
}

export default async function CatalogoPage({ searchParams }: CatalogoPageProps) {
  const params = await searchParams;

  const [services, combos, categories] = await Promise.all([
    getServicesWithPricing(),
    getCombosWithServices(),
    getServiceCategories(),
  ]);

  const counts = services.reduce<Record<string, number>>((acc, s) => {
    acc[s.category_id] = (acc[s.category_id] || 0) + 1;
    return acc;
  }, {});

  const filtered = params.cat
    ? services.filter((s) => s.category_id === params.cat)
    : services;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-color-ink">
            Catálogo de servicios
          </h1>
          <p className="text-color-ink-soft mt-2">
            Duración, buffer de limpieza y precio por especialista — la fuente
            de verdad que usa Agenda al reservar
          </p>
        </div>
        <NewServiceModal />
      </div>

      {/* Category tabs */}
      <Suspense fallback={null}>
        <CatalogoTabs
          categories={categories}
          activeCategoryId={params.cat}
          counts={counts}
          totalCount={services.length}
        />
      </Suspense>

      {/* Services table */}
      <ServiceTable services={filtered} />

      {/* Combos */}
      <div className="pt-4 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-lg font-serif font-semibold text-color-ink flex items-center gap-2">
            🔗 Combos disponibles
          </h2>
          <NewComboModal />
        </div>
        <ComboTable combos={combos} />
      </div>
    </div>
  );
}
