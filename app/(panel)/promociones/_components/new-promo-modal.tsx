"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { newPromotionSchema, type NewPromotionInput } from "@/lib/promociones/schemas";
import { createPromotion } from "@/lib/promociones/actions";
import { getServiceCategories } from "@/lib/promociones/queries";
import type { ServiceCategory } from "@/types/database";

export function NewPromoModal() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<NewPromotionInput>({
    resolver: zodResolver(newPromotionSchema),
    defaultValues: {
      name: "",
      categoryId: "",
      discountType: "percent",
      discountValue: 0,
      validFrom: "",
      validTo: "",
      usageLimit: undefined,
      sendWhatsapp: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    getServiceCategories().then(setCategories);
  }, [open]);

  async function onSubmit(data: NewPromotionInput) {
    setIsLoading(true);
    setError(null);

    const result = await createPromotion(data);

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
      <Button onClick={() => setOpen(true)}>+ Nueva promoción</Button>

      {open && (
        <div
          className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="bg-color-surface rounded-3xl max-w-md w-full max-h-[88vh] overflow-y-auto shadow-modal">
            <div className="px-6 py-5 border-b border-color-line-soft sticky top-0 bg-color-surface flex items-start justify-between">
              <h3 className="text-xl font-serif font-semibold text-color-ink">
                Nueva promoción
              </h3>
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
                  Nombre de la promoción
                </Label>
                <Input
                  id="name"
                  placeholder="Ej. Miércoles de uñas"
                  {...register("name")}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="categoryId" className="block mb-2 text-xs">
                    Categoría
                  </Label>
                  <select
                    id="categoryId"
                    {...register("categoryId")}
                    disabled={isLoading}
                    className="w-full px-3 py-2 rounded-lg border border-color-line text-sm focus:border-color-accent-rose focus:outline-none"
                  >
                    <option value="">Todas</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="discountType" className="block mb-2 text-xs">
                    Tipo de descuento
                  </Label>
                  <select
                    id="discountType"
                    {...register("discountType")}
                    disabled={isLoading}
                    className="w-full px-3 py-2 rounded-lg border border-color-line text-sm focus:border-color-accent-rose focus:outline-none"
                  >
                    <option value="percent">Porcentaje (%)</option>
                    <option value="fixed">Monto fijo (S/)</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="discountValue" className="block mb-2">
                  Valor del descuento
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  min={1}
                  step="0.01"
                  placeholder="Ej. 20"
                  {...register("discountValue")}
                  disabled={isLoading}
                />
                {errors.discountValue && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.discountValue.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="validFrom" className="block mb-2 text-xs">
                    Vigencia desde
                  </Label>
                  <Input
                    id="validFrom"
                    type="date"
                    {...register("validFrom")}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="validTo" className="block mb-2 text-xs">
                    Vigencia hasta
                  </Label>
                  <Input
                    id="validTo"
                    type="date"
                    {...register("validTo")}
                    disabled={isLoading}
                  />
                  {errors.validTo && (
                    <p className="text-xs text-red-600 mt-1">{errors.validTo.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="usageLimit" className="block mb-2">
                  Límite de usos (opcional, vacío = ilimitado)
                </Label>
                <Input
                  id="usageLimit"
                  type="number"
                  min={1}
                  placeholder="Ej. 100"
                  {...register("usageLimit")}
                  disabled={isLoading}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-color-ink cursor-pointer">
                <input
                  type="checkbox"
                  {...register("sendWhatsapp")}
                  disabled={isLoading}
                  className="accent-color-accent-rose"
                />
                Enviar por WhatsApp a clientas segmentadas
              </label>
              <p className="text-xs text-color-ink-faint -mt-2">
                El envío real requiere el módulo de Mensajería (pendiente) — por ahora
                solo se guarda la preferencia.
              </p>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Crear promoción"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
