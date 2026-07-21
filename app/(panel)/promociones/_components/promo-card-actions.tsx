"use client";

import { useState, useTransition } from "react";
import { deletePromotion, sendPromotionBlast } from "@/lib/promociones/actions";

export function PromoCardActions({ promotionId }: { promotionId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSend() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await sendPromotionBlast(promotionId);
      if (!result.ok) {
        setError(result.error);
      } else {
        setSuccess(`Encolado para ${result.recipientCount} clientas`);
      }
    });
  }

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
    <div className="relative flex border-t border-color-line-soft">
      <button
        onClick={handleSend}
        disabled={isPending}
        className="flex-1 py-3 text-xs font-bold text-color-ink-soft hover:bg-color-line-soft transition-colors border-r border-color-line-soft disabled:opacity-50"
      >
        {isPending ? "Enviando..." : "Enviar por WhatsApp"}
      </button>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="flex-1 py-3 text-xs font-bold text-color-ink-soft hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
      >
        {isPending ? "..." : "Eliminar"}
      </button>
      {(error || success) && (
        <p
          className={`absolute bottom-full left-0 right-0 mb-1 text-xs rounded-lg p-2 shadow-modal mx-2 border ${
            error
              ? "text-red-600 bg-white border-red-200"
              : "text-color-accent-sage bg-white border-green-200"
          }`}
        >
          {error || success}
        </p>
      )}
    </div>
  );
}
