import { getSales } from "@/lib/ventas/queries";
import { SalesTable } from "./_components/sales-table";
import { NewSaleModal } from "./_components/new-sale-modal";

interface VentasPageProps {
  searchParams: Promise<{ appointment?: string }>;
}

export default async function VentasPage({ searchParams }: VentasPageProps) {
  const params = await searchParams;
  const sales = await getSales();

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

      <SalesTable sales={sales} />
    </div>
  );
}
