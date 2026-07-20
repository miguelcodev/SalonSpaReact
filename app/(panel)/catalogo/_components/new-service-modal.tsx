"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { newServiceSchema, type NewServiceInput } from "@/lib/catalogo/schemas";
import { createService } from "@/lib/catalogo/actions";
import { getServiceCategories, getStaffOptions } from "@/lib/catalogo/queries";
import type { ServiceCategory } from "@/types/database";
import type { StaffOption } from "@/lib/catalogo/types";

export function NewServiceModal() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<NewServiceInput>({
    resolver: zodResolver(newServiceSchema),
    defaultValues: {
      categoryId: "",
      name: "",
      description: "",
      durationMinutes: 30,
      bufferMinutes: 5,
      prices: [{ staffId: "", priceCents: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "prices" });

  useEffect(() => {
    if (!open) return;
    getServiceCategories().then(setCategories);
    getStaffOptions().then(setStaffOptions);
  }, [open]);

  async function onSubmit(data: NewServiceInput) {
    setIsLoading(true);
    setError(null);

    const result = await createService(data);

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
      <Button onClick={() => setOpen(true)}>+ Nuevo servicio</Button>

      {open && (
        <div
          className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="bg-color-surface rounded-3xl max-w-lg w-full max-h-[88vh] overflow-y-auto shadow-modal">
            <div className="px-6 py-5 border-b border-color-line-soft sticky top-0 bg-color-surface flex items-start justify-between">
              <h3 className="text-xl font-serif font-semibold text-color-ink">
                Nuevo servicio
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
                  Nombre del servicio
                </Label>
                <Input
                  id="name"
                  placeholder="Ej. Corte + Balayage"
                  {...register("name")}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="categoryId" className="block mb-2">
                  Categoría
                </Label>
                <select
                  id="categoryId"
                  {...register("categoryId")}
                  disabled={isLoading}
                  className="w-full px-3 py-2 rounded-lg border border-color-line text-sm focus:border-color-accent-rose focus:outline-none"
                >
                  <option value="">Elige categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-xs text-red-600 mt-1">{errors.categoryId.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description" className="block mb-2">
                  Descripción (opcional)
                </Label>
                <Input
                  id="description"
                  placeholder="Ej. Corte a medida con mechas balayage"
                  {...register("description")}
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="durationMinutes" className="block mb-2 text-xs">
                    Duración (min)
                  </Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    min={1}
                    {...register("durationMinutes")}
                    disabled={isLoading}
                  />
                  {errors.durationMinutes && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.durationMinutes.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="bufferMinutes" className="block mb-2 text-xs">
                    Buffer de limpieza (min)
                  </Label>
                  <Input
                    id="bufferMinutes"
                    type="number"
                    min={0}
                    {...register("bufferMinutes")}
                    disabled={isLoading}
                  />
                  {errors.bufferMinutes && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.bufferMinutes.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Per-staff pricing repeater */}
              <div className="border-t border-color-line-soft pt-4">
                <div className="flex items-center justify-between mb-2">
                  <Label>Precio por especialista</Label>
                  <button
                    type="button"
                    onClick={() => append({ staffId: "", priceCents: 0 })}
                    className="flex items-center gap-1 text-xs font-semibold text-color-accent-rose hover:underline"
                  >
                    <Plus size={12} /> Agregar
                  </button>
                </div>

                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-start">
                      <select
                        {...register(`prices.${index}.staffId`)}
                        disabled={isLoading}
                        className="flex-1 px-3 py-2 rounded-lg border border-color-line text-sm focus:border-color-accent-rose focus:outline-none"
                      >
                        <option value="">Especialista</option>
                        {staffOptions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        min={1}
                        step="0.01"
                        placeholder="Precio S/"
                        className="w-28"
                        {...register(`prices.${index}.priceCents`, {
                          setValueAs: (v) => Math.round(parseFloat(v) * 100) || 0,
                        })}
                        disabled={isLoading}
                      />
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="w-9 h-9 flex-shrink-0 rounded-lg border border-color-line hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-color-ink-soft"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {errors.prices && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.prices.message || errors.prices.root?.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Crear servicio"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
