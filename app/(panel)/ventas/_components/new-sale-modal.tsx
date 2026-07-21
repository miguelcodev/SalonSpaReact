"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientPicker } from "@/components/client-picker";
import { createSale } from "@/lib/ventas/actions";
import { getProductsForSearch } from "@/lib/productos/queries";
import { getAppointmentForSale } from "@/lib/ventas/queries";
import type { ClientSearchResult } from "@/lib/crm/types";
import type { ProductSearchResult } from "@/lib/productos/types";
import type { AppointmentForSale } from "@/lib/ventas/types";
import type { SaleChannel, PaymentMethod } from "@/lib/ventas/types";

interface CartLine {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  maxStock: number;
}

interface NewSaleModalProps {
  prefillAppointmentId?: string;
}

export function NewSaleModal({ prefillAppointmentId }: NewSaleModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(!!prefillAppointmentId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [appointment, setAppointment] = useState<AppointmentForSale | null>(null);
  const [client, setClient] = useState<ClientSearchResult | null>(null);
  const [channel, setChannel] = useState<SaleChannel>(
    prefillAppointmentId ? "cita" : "tienda"
  );
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discountCents, setDiscountCents] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");

  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<ProductSearchResult[]>([]);
  const [productSearchOpen, setProductSearchOpen] = useState(false);

  // Pre-fill from the appointment when opened from Agenda's "Cobrar" button
  useEffect(() => {
    if (!prefillAppointmentId) return;
    getAppointmentForSale(prefillAppointmentId).then((appt) => {
      if (appt) {
        setAppointment(appt);
        setClient({ id: appt.client_id, name: appt.client_name, phone: null });
      }
    });
  }, [prefillAppointmentId]);

  useEffect(() => {
    if (!productSearchOpen) return;
    const timeout = setTimeout(() => {
      getProductsForSearch(productQuery).then(setProductResults);
    }, 250);
    return () => clearTimeout(timeout);
  }, [productQuery, productSearchOpen]);

  function addProduct(product: ProductSearchResult) {
    setCart((prev) => {
      const existing = prev.find((line) => line.productId === product.id);
      if (existing) {
        return prev.map((line) =>
          line.productId === product.id
            ? { ...line, quantity: Math.min(line.quantity + 1, product.stock_quantity) }
            : line
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPriceCents: product.price_cents,
          maxStock: product.stock_quantity,
        },
      ];
    });
    setProductQuery("");
    setProductSearchOpen(false);
  }

  function updateQuantity(productId: string, quantity: number) {
    setCart((prev) =>
      prev.map((line) =>
        line.productId === productId
          ? { ...line, quantity: Math.max(1, Math.min(quantity, line.maxStock)) }
          : line
      )
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((line) => line.productId !== productId));
  }

  const itemsSubtotal = cart.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
  const serviceSubtotal = appointment?.price_cents || 0;
  const subtotal = itemsSubtotal + serviceSubtotal;
  const total = Math.max(subtotal - discountCents, 0);

  function handleClose() {
    setOpen(false);
    if (prefillAppointmentId) {
      router.replace("/ventas");
    }
  }

  async function handleSubmit() {
    setError(null);
    if (cart.length === 0 && !appointment) {
      setError("Agrega al menos un producto o vincula una cita");
      return;
    }
    setIsLoading(true);

    const result = await createSale({
      clientId: client?.id || "",
      appointmentId: appointment?.id || "",
      channel,
      items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      discountCents,
      paymentMethod,
      notes: "",
    });

    if (!result.ok) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setOpen(false);
    router.push(`/ventas/${result.saleId}`);
  }

  return (
    <>
      {!prefillAppointmentId && <Button onClick={() => setOpen(true)}>+ Nueva venta</Button>}

      {open && (
        <div
          className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="bg-color-surface rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-modal">
            <div className="px-6 py-5 border-b border-color-line-soft sticky top-0 bg-color-surface flex items-start justify-between z-10">
              <div>
                <h3 className="text-xl font-serif font-semibold text-color-ink">
                  Nueva venta
                </h3>
                <p className="text-xs text-color-ink-soft mt-1">
                  Recibo interno — no es comprobante SUNAT
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-7 h-7 rounded-full bg-color-line-soft hover:bg-color-line flex items-center justify-center text-color-ink-soft flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Linked appointment (locked) */}
              {appointment && (
                <div className="bg-color-bg border border-color-line rounded-lg p-3 text-sm">
                  <p className="font-bold text-color-ink">Cita vinculada</p>
                  <p className="text-color-ink-soft">
                    {appointment.service_name} — {appointment.client_name} — S/{" "}
                    {(appointment.price_cents / 100).toFixed(2)}
                  </p>
                </div>
              )}

              {/* Client */}
              {!appointment && (
                <div>
                  <label className="block mb-2 text-xs font-bold uppercase tracking-wide text-color-ink-soft">
                    Clienta (opcional)
                  </label>
                  {client ? (
                    <div className="flex items-center justify-between bg-color-bg border border-color-line rounded-lg px-3 py-2">
                      <span className="text-sm font-semibold text-color-ink">
                        {client.name}
                      </span>
                      <button
                        onClick={() => setClient(null)}
                        className="text-xs text-color-ink-soft hover:text-red-600"
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <ClientPicker onSelect={setClient} disabled={isLoading} />
                  )}
                </div>
              )}

              {/* Channel */}
              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-wide text-color-ink-soft">
                  Canal
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as SaleChannel)}
                  disabled={isLoading || !!appointment}
                  className="w-full px-3 py-2 rounded-lg border border-color-line text-sm focus:border-color-accent-rose focus:outline-none"
                >
                  <option value="tienda">Tienda</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="cita">Cita</option>
                </select>
              </div>

              {/* Product search */}
              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-wide text-color-ink-soft">
                  Agregar producto
                </label>
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-color-ink-faint"
                  />
                  <input
                    value={productQuery}
                    onChange={(e) => {
                      setProductQuery(e.target.value);
                      setProductSearchOpen(true);
                    }}
                    onFocus={() => setProductSearchOpen(true)}
                    placeholder="Buscar producto..."
                    disabled={isLoading}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-color-line text-sm focus:border-color-accent-rose focus:outline-none"
                  />
                  {productSearchOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setProductSearchOpen(false)}
                      />
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-color-surface border border-color-line rounded-lg shadow-modal max-h-48 overflow-y-auto">
                        {productResults.length === 0 && (
                          <div className="px-3 py-3 text-xs text-color-ink-soft text-center">
                            Sin productos disponibles con ese nombre
                          </div>
                        )}
                        {productResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => addProduct(p)}
                            className="w-full text-left px-3 py-2 hover:bg-color-line-soft text-sm border-b border-color-line-soft last:border-b-0"
                          >
                            <div className="flex justify-between">
                              <span className="font-semibold text-color-ink">{p.name}</span>
                              <span className="font-mono text-color-ink-soft">
                                S/ {(p.price_cents / 100).toFixed(2)}
                              </span>
                            </div>
                            <div className="text-xs text-color-ink-faint">
                              {p.stock_quantity} disponibles
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Cart */}
              {cart.length > 0 && (
                <div className="space-y-2">
                  {cart.map((line) => (
                    <div
                      key={line.productId}
                      className="flex items-center gap-2 bg-color-bg rounded-lg px-3 py-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-color-ink truncate">
                          {line.name}
                        </div>
                        <div className="text-xs text-color-ink-soft">
                          S/ {(line.unitPriceCents / 100).toFixed(2)} c/u
                        </div>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={line.maxStock}
                        value={line.quantity}
                        onChange={(e) =>
                          updateQuantity(line.productId, parseInt(e.target.value) || 1)
                        }
                        disabled={isLoading}
                        className="w-14 px-2 py-1 rounded-lg border border-color-line text-sm text-center"
                      />
                      <span className="font-mono text-sm font-bold text-color-ink w-20 text-right">
                        S/ {((line.unitPriceCents * line.quantity) / 100).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeLine(line.productId)}
                        disabled={isLoading}
                        className="text-color-ink-faint hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Discount + payment method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-2 text-xs font-bold uppercase tracking-wide text-color-ink-soft">
                    Descuento (S/)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={discountCents / 100}
                    onChange={(e) =>
                      setDiscountCents(Math.round((parseFloat(e.target.value) || 0) * 100))
                    }
                    disabled={isLoading}
                    className="w-full px-3 py-2 rounded-lg border border-color-line text-sm focus:border-color-accent-rose focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-xs font-bold uppercase tracking-wide text-color-ink-soft">
                    Método de pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    disabled={isLoading}
                    className="w-full px-3 py-2 rounded-lg border border-color-line text-sm focus:border-color-accent-rose focus:outline-none"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="yape">Yape</option>
                    <option value="plin">Plin</option>
                    <option value="stripe">Tarjeta (Stripe)</option>
                  </select>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-color-bg rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between text-color-ink-soft">
                  <span>Subtotal</span>
                  <span>S/ {(subtotal / 100).toFixed(2)}</span>
                </div>
                {discountCents > 0 && (
                  <div className="flex justify-between text-color-ink-soft">
                    <span>Descuento</span>
                    <span>- S/ {(discountCents / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-color-ink text-base pt-1 border-t border-color-line-soft">
                  <span>Total</span>
                  <span>S/ {(total / 100).toFixed(2)}</span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button onClick={handleSubmit} className="w-full" disabled={isLoading}>
                {isLoading ? "Cobrando..." : `Cobrar S/ ${(total / 100).toFixed(2)}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
