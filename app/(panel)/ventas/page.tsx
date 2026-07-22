import { Suspense } from "react";
import { getSales } from "@/lib/ventas/queries";
import { SalesFilters } from "./_components/sales-filters";
import { SalesSearch } from "./_components/sales-search";
import { SalesTable } from "./_components/sales-table";
import { Pagination } from "./_components/pagination";
import { NewSaleModal } from "./_components/new-sale-modal";
import type { SaleChannel, SaleStatus } from "@/lib/ventas/types";

interface VentasPageProps {
  searchParams: Promise<{
    appointment?: string;
    channel?: string;
    status?: string;
    q?: string;
    page?: string;
  }>;
}

const VALID_CHANNELS: SaleChannel[] = ["tienda", "whatsapp", "cita"];
const VALID_STATUSES: SaleStatus[] = ["pendiente", "pagado", "anulado"];
const PAGE_SIZE = 20;

export default async function VentasPage({ searchParams }: VentasPageProps) {
  const params = await searchParams;

  const channel = VALID_CHANNELS.includes(params.channel as SaleChannel)
    ? (params.channel as SaleChannel)
    : undefined;
  const status = VALID_STATUSES.includes(params.status as SaleStatus)
    ? (params.status as SaleStatus)
    : undefined;
  const page = Math.max(1, parseInt(params.page || "1") || 1);

  const { sales, totalCount } = await getSales({
    channel,
    status,
    search: params.q,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-color-ink">
            Ventas
          </h1>
          <p className="text-color-ink-soft mt-2">
            Cobranza de servicios y productos — recibo interno, no comprobante SUNAT
          </p>
        </div>
        <NewSaleModal prefillAppointmentId={params.appointment} />
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <Suspense fallback={null}>
          <SalesFilters activeChannel={channel} activeStatus={status} />
        </Suspense>
        <Suspense fallback={null}>
          <SalesSearch />
        </Suspense>
      </div>

      <SalesTable sales={sales} />

      <Suspense fallback={null}>
        <Pagination page={page} pageSize={PAGE_SIZE} totalCount={totalCount} />
      </Suspense>
    </div>
  );
}
