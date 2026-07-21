import { notFound } from "next/navigation";
import Link from "next/link";
import { getSaleDetail } from "@/lib/ventas/queries";
import { PrintButton } from "./_components/print-button";

const CHANNEL_LABELS: Record<string, string> = {
  tienda: "Tienda",
  whatsapp: "WhatsApp",
  cita: "Cita",
};

const METHOD_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  yape: "Yape",
  plin: "Plin",
  stripe: "Tarjeta",
};

export default async function ReciboPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sale = await getSaleDetail(id);

  if (!sale) {
    notFound();
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      {/* Screen-only controls, hidden when printing */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <Link href="/ventas" className="text-sm text-color-ink-soft hover:text-color-ink">
          ← Volver a ventas
        </Link>
        <PrintButton />
      </div>

      <div className="bg-color-surface border border-color-line rounded-2xl shadow-card p-8 print:shadow-none print:border-none">
        {/* Header */}
        <div className="text-center border-b border-dashed border-color-line pb-4 mb-4">
          <div className="font-serif text-xl font-semibold text-color-ink">Bellamora</div>
          <div className="text-xs text-color-ink-soft mt-1">
            Recibo interno — no es comprobante de pago SUNAT
          </div>
          <div className="text-xs text-color-ink-faint font-mono mt-2">
            #{sale.id.slice(0, 8).toUpperCase()}
          </div>
        </div>

        {/* Meta */}
        <div className="text-sm space-y-1 mb-4">
          <div className="flex justify-between">
            <span className="text-color-ink-soft">Fecha</span>
            <span className="text-color-ink font-semibold">
              {new Date(sale.created_at).toLocaleString("es-PE", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-color-ink-soft">Clienta</span>
            <span className="text-color-ink font-semibold">
              {sale.client_name || "No registrada"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-color-ink-soft">Canal</span>
            <span className="text-color-ink font-semibold">
              {CHANNEL_LABELS[sale.channel]}
            </span>
          </div>
        </div>

        {/* Line items */}
        <div className="border-t border-dashed border-color-line pt-4 space-y-2">
          {sale.appointment_service_name && (
            <div className="flex justify-between text-sm">
              <span className="text-color-ink">
                {sale.appointment_service_name}
                <span className="text-color-ink-faint"> (servicio)</span>
              </span>
              <span className="font-mono text-color-ink">
                S/ {((sale.appointment_price_cents || 0) / 100).toFixed(2)}
              </span>
            </div>
          )}
          {sale.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-color-ink">
                {item.product_name}{" "}
                <span className="text-color-ink-faint">x{item.quantity}</span>
              </span>
              <span className="font-mono text-color-ink">
                S/ {(item.subtotal_cents / 100).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-dashed border-color-line mt-4 pt-4 space-y-1 text-sm">
          <div className="flex justify-between text-color-ink-soft">
            <span>Subtotal</span>
            <span>S/ {(sale.subtotal_cents / 100).toFixed(2)}</span>
          </div>
          {sale.discount_cents > 0 && (
            <div className="flex justify-between text-color-ink-soft">
              <span>Descuento</span>
              <span>- S/ {(sale.discount_cents / 100).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-color-ink text-base pt-1 border-t border-color-line-soft">
            <span>Total</span>
            <span>S/ {(sale.total_cents / 100).toFixed(2)}</span>
          </div>
          {sale.payment_method && (
            <div className="flex justify-between text-color-ink-soft pt-1">
              <span>Pagado con</span>
              <span>{METHOD_LABELS[sale.payment_method]}</span>
            </div>
          )}
        </div>

        <div className="text-center text-xs text-color-ink-faint mt-6 pt-4 border-t border-dashed border-color-line">
          ¡Gracias por tu preferencia! 🌸
        </div>
      </div>
    </div>
  );
}
