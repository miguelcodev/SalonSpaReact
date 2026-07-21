"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { newProductSchema, type NewProductInput } from "@/lib/productos/schemas";
import { createProduct } from "@/lib/productos/actions";
import { getProductCategories } from "@/lib/productos/queries";
import type { ProductCategory } from "@/lib/productos/types";

export function NewProductModal() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<NewProductInput>({
    resolver: zodResolver(newProductSchema),
    defaultValues: {
      categoryId: "",
      name: "",
      description: "",
      sku: "",
      priceCents: 0,
      initialStock: 0,
      lowStockThreshold: 3,
    },
  });

  useEffect(() => {
    if (!open) return;
    getProductCategories().then(setCategories);
  }, [open]);

  async function onSubmit(data: NewProductInput) {
    setIsLoading(true);
    setError(null);

    const result = await createProduct(data);

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
      <Button onClick={() => setOpen(true)}>+ Nuevo producto</Button>

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
                Nuevo producto
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
                  Nombre del producto
                </Label>
                <Input
                  id="name"
                  placeholder="Ej. Tinte orgánico Nº6"
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
                  placeholder="Ej. Sin amoniaco, tono castaño claro"
                  {...register("description")}
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="sku" className="block mb-2 text-xs">
                    SKU (opcional)
                  </Label>
                  <Input id="sku" {...register("sku")} disabled={isLoading} />
                </div>
                <div>
                  <Label htmlFor="priceCents" className="block mb-2 text-xs">
                    Precio (S/)
                  </Label>
                  <Input
                    id="priceCents"
                    type="number"
                    min={1}
                    step="0.01"
                    {...register("priceCents", {
                      setValueAs: (v) => Math.round(parseFloat(v) * 100) || 0,
                    })}
                    disabled={isLoading}
                  />
                  {errors.priceCents && (
                    <p className="text-xs text-red-600 mt-1">{errors.priceCents.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="initialStock" className="block mb-2 text-xs">
                    Stock inicial
                  </Label>
                  <Input
                    id="initialStock"
                    type="number"
                    min={0}
                    {...register("initialStock")}
                    disabled={isLoading}
                  />
                  {errors.initialStock && (
                    <p className="text-xs text-red-600 mt-1">{errors.initialStock.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lowStockThreshold" className="block mb-2 text-xs">
                    Alerta de bajo stock en
                  </Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    min={0}
                    {...register("lowStockThreshold")}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Crear producto"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
