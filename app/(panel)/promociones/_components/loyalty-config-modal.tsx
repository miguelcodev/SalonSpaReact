"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loyaltyProgramSchema, type LoyaltyProgramInput } from "@/lib/promociones/schemas";
import { upsertLoyaltyProgram } from "@/lib/promociones/actions";
import type { LoyaltyProgramData } from "@/lib/promociones/types";

export function LoyaltyConfigModal({
  existingProgram,
}: {
  existingProgram: LoyaltyProgramData | null;
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoyaltyProgramInput>({
    resolver: zodResolver(loyaltyProgramSchema),
    defaultValues: {
      visitsRequired: existingProgram?.visits_required ?? 6,
      rewardDescription: existingProgram?.reward_description ?? "",
    },
  });

  async function onSubmit(data: LoyaltyProgramInput) {
    setIsLoading(true);
    setError(null);

    const result = await upsertLoyaltyProgram(data, existingProgram?.id ?? null);

    if (!result.ok) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-full bg-color-line-soft text-color-ink text-xs font-bold hover:bg-color-line transition-colors"
      >
        {existingProgram ? "Configurar programa" : "Crear programa"}
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
              <h3 className="text-xl font-serif font-semibold text-color-ink">
                Programa de fidelidad
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
                <Label htmlFor="visitsRequired" className="block mb-2">
                  Visitas requeridas
                </Label>
                <Input
                  id="visitsRequired"
                  type="number"
                  min={1}
                  {...register("visitsRequired")}
                  disabled={isLoading}
                />
                {errors.visitsRequired && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.visitsRequired.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="rewardDescription" className="block mb-2">
                  Recompensa
                </Label>
                <Input
                  id="rewardDescription"
                  placeholder="Ej. 25% de descuento en el siguiente servicio"
                  {...register("rewardDescription")}
                  disabled={isLoading}
                />
                {errors.rewardDescription && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.rewardDescription.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
