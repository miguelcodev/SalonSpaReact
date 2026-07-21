"use client";

import { useState, useTransition } from "react";
import { retryQueuedMessage, cancelQueuedMessage } from "@/lib/whatsapp/actions";
import { ruleTypeLabel } from "@/lib/whatsapp/labels";
import type { QueuedMessage } from "@/lib/whatsapp/types";

const STATUS_STYLES: Record<string, string> = {
  pendiente: "bg-yellow-50 text-yellow-700",
  enviando: "bg-blue-50 text-blue-700",
  fallido: "bg-red-50 text-red-600",
};

function QueueRow({ message }: { message: QueuedMessage }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRetry() {
    setError(null);
    startTransition(async () => {
      const result = await retryQueuedMessage(message.id);
      if (!result.ok) setError(result.error);
    });
  }

  function handleCancel() {
    if (!confirm("¿Cancelar este mensaje encolado?")) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelQueuedMessage(message.id);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <tr className="border-b border-color-line-soft last:border-b-0">
      <td className="py-3 pr-3">
        <div className="text-sm font-bold text-color-ink">{message.client_name}</div>
        <div className="text-xs text-color-ink-soft">{ruleTypeLabel(message.rule_type)}</div>
      </td>
      <td className="py-3 pr-3 text-xs text-color-ink-soft max-w-xs">
        <p className="line-clamp-2">{message.body}</p>
        {message.last_error && (
          <p className="text-red-600 mt-1">{message.last_error}</p>
        )}
      </td>
      <td className="py-3 pr-3 text-xs font-mono text-color-ink-soft whitespace-nowrap">
        {new Date(message.scheduled_for).toLocaleString("es-PE", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </td>
      <td className="py-3 pr-3">
        <span
          className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${STATUS_STYLES[message.status]}`}
        >
          {message.status}
        </span>
      </td>
      <td className="py-3">
        <div className="flex gap-1.5 justify-end">
          {message.status === "fallido" && (
            <button
              onClick={handleRetry}
              disabled={isPending}
              className="text-xs font-bold text-color-accent-rose hover:underline disabled:opacity-50"
            >
              Reintentar
            </button>
          )}
          {message.status === "pendiente" && (
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="text-xs font-bold text-color-ink-soft hover:text-red-600 disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </td>
    </tr>
  );
}

export function QueueTable({ messages }: { messages: QueuedMessage[] }) {
  if (messages.length === 0) {
    return (
      <div className="bg-color-surface border border-color-line rounded-2xl shadow-card p-8 text-center text-sm text-color-ink-faint">
        No hay mensajes en cola.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-color-surface border border-color-line rounded-2xl shadow-card px-5">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-color-line">
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft py-3 pr-3">
              Clienta / Tipo
            </th>
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft py-3 pr-3">
              Mensaje
            </th>
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft py-3 pr-3">
              Programado
            </th>
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft py-3 pr-3">
              Estado
            </th>
            <th className="py-3"></th>
          </tr>
        </thead>
        <tbody>
          {messages.map((m) => (
            <QueueRow key={m.id} message={m} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
