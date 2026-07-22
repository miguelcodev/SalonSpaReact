import { Suspense } from "react";
import { AgendaDateNav } from "./_components/agenda-date-nav";
import { AgendaGrid } from "./_components/agenda-grid";

interface AgendaPageProps {
  searchParams: Promise<{ date?: string; staff?: string; status?: string; q?: string }>;
}

export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  const params = await searchParams;
  const dateISO = params.date || "2026-07-16"; // Default to seed data date
  const staffFilter = params.staff ? params.staff.split(",") : [];
  const statusFilter =
    params.status === "pendiente" || params.status === "confirmada"
      ? params.status
      : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-color-ink">
            Agenda de citas
          </h1>
          <p className="text-color-ink-soft mt-2">
            Gestiona las citas del salón por especialista y horario
          </p>
        </div>
        <AgendaDateNav />
      </div>

      {/* Grid */}
      <Suspense
        fallback={
          <div className="bg-color-surface rounded-2xl border border-color-line p-12 text-center text-color-ink-soft">
            Cargando agenda...
          </div>
        }
      >
        <AgendaGrid
          dateISO={dateISO}
          staffFilter={staffFilter}
          statusFilter={statusFilter}
          searchQuery={params.q}
        />
      </Suspense>
    </div>
  );
}
