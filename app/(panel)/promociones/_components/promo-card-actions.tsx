"use client";

import { useState, useTransition } from "react";
import { deletePromotion } from "@/lib/promociones/actions";

export function PromoCardActions({ promotionId }: { promotionId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!confirm("¿Eliminar esta promoción? Esta acción no se puede deshacer.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deletePromotion(promotionId);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex border-t border-color-line-soft">
      <button
        disabled
        title="Requiere el módulo de Mensajería WhatsApp (pendiente)"
        className="flex-1 py-3 text-xs font-bold text-color-ink-faint border-r border-color-line-soft cursor-not-allowed"
      >
        Enviar por WhatsApp
      </button>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="flex-1 py-3 text-xs font-bold text-color-ink-soft hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
      >
        {isPending ? "Eliminando..." : "Eliminar"}
      </button>
      {error && (
        <p className="absolute bottom-full left-0 right-0 mb-1 text-xs text-red-600 bg-white border border-red-200 rounded-lg p-2 shadow-modal mx-2">
          {error}
        </p>
      )}
    </div>
  );
}
