"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { stockMovementSchema, type StockMovementInput } from "@/lib/productos/schemas";
import { registerStockMovement } from "@/lib/productos/actions";

interface StockMovementControlProps {
  productId: string;
  productName: string;
  currentStock: number;
}

export function StockMovementControl({
  productId,
  productName,
  currentStock,
}: StockMovementControlProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<StockMovementInput>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: { productId, type: "entrada", quantity: 1, reason: "" },
  });

  const selectedType = watch("type");

  async function onSubmit(data: StockMovementInput) {
    setIsLoading(true);
    setError(null);

    const result = await registerStockMovement(data);

    if (!result.ok) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    reset({ productId, type: "entrada", quantity: 1, reason: "" });
    setIsLoading(false);
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Registrar movimiento de stock"
        className="w-7 h-7 rounded-lg border border-color-line bg-color-surface hover:bg-color-line-soft flex items-center justify-center text-color-ink-soft"
      >
        <Package size={13} />
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="bg-color-surface rounded-3xl max-w-sm w-full shadow-modal">
            <div className="px-6 py-5 border-b border-color-line-soft flex items-start justify-between">
              <div>
                <h3 className="text-lg font-serif font-semibold text-color-ink">
                  Movimiento de stock
                </h3>
                <p className="text-xs text-color-ink-soft mt-1">
                  {productName} — {currentStock} unidades actuales
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full bg-color-line-soft hover:bg-color-line flex items-center justify-center text-color-ink-soft flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
              <div>
                <Label htmlFor="type" className="block mb-2">
                  Tipo
                </Label>
                <select
                  id="type"
                  {...register("type")}
                  disabled={isLoading}
                  className="w-full px-3 py-2 rounded-lg border border-color-line text-sm focus:border-color-accent-rose focus:outline-none"
                >
                  <option value="entrada">Entrada (reposición)</option>
                  <option value="salida">Salida (merma / corrección)</option>
                </select>
              </div>

              <div>
                <Label htmlFor="quantity" className="block mb-2">
                  Cantidad
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  max={selectedType === "salida" ? currentStock : undefined}
                  {...register("quantity")}
                  disabled={isLoading}
                />
                {errors.quantity && (
                  <p className="text-xs text-red-600 mt-1">{errors.quantity.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="reason" className="block mb-2">
                  Motivo
                </Label>
                <Input
                  id="reason"
                  placeholder={
                    selectedType === "entrada" ? "Ej. Reposición de proveedor" : "Ej. Merma, producto vencido"
                  }
                  {...register("reason")}
                  disabled={isLoading}
                />
                {errors.reason && (
                  <p className="text-xs text-red-600 mt-1">{errors.reason.message}</p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Registrar movimiento"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
