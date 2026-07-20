"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { newComboSchema, type NewComboInput } from "@/lib/catalogo/schemas";
import { createCombo } from "@/lib/catalogo/actions";
import { getServicesWithPricing } from "@/lib/catalogo/queries";
import type { ServiceWithPricing } from "@/lib/catalogo/types";

export function NewComboModal() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceWithPricing[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<NewComboInput>({
    resolver: zodResolver(newComboSchema),
    defaultValues: { name: "", combinedPriceCents: 0, serviceIds: [] },
  });

  useEffect(() => {
    if (!open) return;
    getServicesWithPricing().then(setServices);
  }, [open]);

  async function onSubmit(data: NewComboInput) {
    setIsLoading(true);
    setError(null);

    const result = await createCombo(data);

    if (!result.ok) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    reset();
    setIsLoading(false);
    setOpen(false);
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        + Nuevo combo
      </Button>

      {open && (
        <div
          className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="bg-color-surface rounded-3xl max-w-md w-full max-h-[88vh] overflow-y-auto shadow-modal">
            <div className="px-6 py-5 border-b border-color-line-soft sticky top-0 bg-color-surface flex items-start justify-between">
              <div>
                <h3 className="text-xl font-serif font-semibold text-color-ink">
                  Nuevo combo
                </h3>
                <div className="text-xs text-color-ink-soft mt-1">
                  Elige exactamente 2 servicios
                </div>
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
                <Label htmlFor="name" className="block mb-2">
                  Nombre del combo
                </Label>
                <Input
                  id="name"
                  placeholder="Ej. Combo Novia"
                  {...register("name")}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="combinedPriceCents" className="block mb-2">
                  Precio combinado (S/)
                </Label>
                <Input
                  id="combinedPriceCents"
                  type="number"
                  min={1}
                  step="0.01"
                  placeholder="165.00"
                  {...register("combinedPriceCents", {
                    setValueAs: (v) => Math.round(parseFloat(v) * 100) || 0,
                  })}
                  disabled={isLoading}
                />
                {errors.combinedPriceCents && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.combinedPriceCents.message}
                  </p>
                )}
              </div>

              <div>
                <Label className="block mb-2">Servicios incluidos</Label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto border border-color-line rounded-lg p-2">
                  {services.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-color-bg cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        value={s.id}
                        {...register("serviceIds")}
                        disabled={isLoading}
                        className="accent-color-accent-rose"
                      />
                      <span className="flex-1">{s.name}</span>
                      <span className="text-xs text-color-ink-faint">
                        {s.duration_minutes} min
                      </span>
                    </label>
                  ))}
                </div>
                {errors.serviceIds && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.serviceIds.message || errors.serviceIds.root?.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Crear combo"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
