"use client";

import { useState, useTransition } from "react";
import { Trash2, Package } from "lucide-react";
import { toggleProductStatus, deleteProduct } from "@/lib/productos/actions";

export function ProductStatusToggle({
  productId,
  status,
}: {
  productId: string;
  status: "activo" | "pausado";
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      const result = await toggleProductStatus(productId, status);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div>
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full transition-opacity disabled:opacity-50 ${
          status === "activo"
            ? "bg-green-50 text-color-accent-sage"
            : "bg-color-line-soft text-color-ink-faint"
        }`}
      >
        {status === "activo" ? "● Activo" : "○ Pausado"}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export function ProductDeleteButton({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="relative">
      <button
        onClick={handleDelete}
        disabled={isPending}
        title="Eliminar"
        className="w-7 h-7 rounded-lg border border-color-line bg-color-surface hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-color-ink-soft disabled:opacity-50"
      >
        <Trash2 size={13} />
      </button>
      {error && (
        <p className="absolute right-0 top-full mt-1 w-48 text-xs text-red-600 bg-white border border-red-200 rounded-lg p-2 shadow-modal z-10">
          {error}
        </p>
      )}
    </div>
  );
}

export function StockMovementButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Registrar movimiento de stock"
      className="w-7 h-7 rounded-lg border border-color-line bg-color-surface hover:bg-color-line-soft flex items-center justify-center text-color-ink-soft"
    >
      <Package size={13} />
    </button>
  );
}
