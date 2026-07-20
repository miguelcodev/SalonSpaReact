import { Suspense } from "react";
import { getClientsWithSegments } from "@/lib/crm/queries";
import { applyFilter, applySearch, countByFilter } from "@/lib/crm/filters";
import { CrmFilters } from "./_components/crm-filters";
import { CrmSearch } from "./_components/crm-search";
import { ClientList } from "./_components/client-list";
import { ClientProfile } from "./_components/client-profile";
import { NewClientModal } from "./_components/new-client-modal";
import type { ClientFilter } from "@/lib/crm/types";

interface CrmPageProps {
  searchParams: Promise<{ filter?: string; q?: string; client?: string }>;
}

const VALID_FILTERS: ClientFilter[] = ["vip", "cumple", "inactiva"];

export default async function CrmPage({ searchParams }: CrmPageProps) {
  const params = await searchParams;
  const filter = VALID_FILTERS.includes(params.filter as ClientFilter)
    ? (params.filter as ClientFilter)
    : undefined;

  const allClients = await getClientsWithSegments();
  const bySearch = applySearch(allClients, params.q);
  const counts = countByFilter(bySearch);
  const filtered = applyFilter(bySearch, filter);

  const selectedId = params.client || filtered[0]?.id;
  const selectedClient = filtered.find((c) => c.id === selectedId);

  function buildHref(clientId: string) {
    const p = new URLSearchParams();
    if (filter) p.set("filter", filter);
    if (params.q) p.set("q", params.q);
    p.set("client", clientId);
    return `/crm?${p.toString()}`;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-color-ink">
            Clientes
          </h1>
          <p className="text-color-ink-soft mt-2">
            Historial, preferencias y segmentación de tus clientas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense fallback={null}>
            <CrmSearch />
          </Suspense>
          <NewClientModal />
        </div>
      </div>

      {/* Filters */}
      <Suspense fallback={null}>
        <CrmFilters counts={counts} activeFilter={filter} />
      </Suspense>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5 items-start">
        <ClientList
          clients={filtered}
          selectedId={selectedId}
          buildHref={buildHref}
        />

        {selectedClient ? (
          <ClientProfile client={selectedClient} />
        ) : (
          <div className="bg-color-surface border border-color-line rounded-2xl shadow-card p-12 text-center text-color-ink-faint">
            {allClients.length === 0
              ? "Todavía no hay clientas registradas."
              : "Selecciona una clienta para ver su perfil."}
          </div>
        )}
      </div>
    </div>
  );
}
