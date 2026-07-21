"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModal } from "./agenda-modal-context";
import { cancelAppointment, sendAppointmentReminder } from "@/lib/agenda/actions";
import { formatTimeRange } from "@/lib/agenda/grid";

export function AppointmentDetailModal() {
  const { detailModal, closeDetailModal } = useModal();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reminderSent, setReminderSent] = useState(false);

  if (!detailModal.isOpen || !detailModal.appointment) {
    return null;
  }

  const appt = detailModal.appointment;
  const timeRange = formatTimeRange(
    new Date(appt.start_time).getHours(),
    appt.duration_minutes
  );

  async function handleCancel() {
    setIsLoading(true);
    setError(null);

    const result = await cancelAppointment(appt.id);
    if (!result.ok) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    closeDetailModal();
  }

  async function handleSendReminder() {
    setIsLoading(true);
    setError(null);

    const result = await sendAppointmentReminder(appt.id);
    if (!result.ok) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setReminderSent(true);
    setIsLoading(false);
  }

  return (
    <div
      className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeDetailModal();
      }}
    >
      <div className="bg-color-surface rounded-3xl max-w-md w-full max-h-[88vh] overflow-y-auto shadow-modal">
        {/* Header */}
        <div className="px-6 py-5 border-b border-color-line-soft sticky top-0 bg-color-surface flex items-start justify-between">
          <div>
            <h3 className="text-xl font-serif font-semibold text-color-ink">
              {appt.client.name}
            </h3>
            <div className="text-sm text-color-ink-soft mt-1">
              {appt.service.name} · con {appt.staff.name}
            </div>
          </div>
          <button
            onClick={closeDetailModal}
            className="w-7 h-7 rounded-full bg-color-line-soft hover:bg-color-line flex items-center justify-center text-color-ink-soft flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Info rows */}
          <div className="flex justify-between py-2.5 border-b border-color-line-soft">
            <span className="text-sm text-color-ink-soft font-semibold">
              Fecha
            </span>
            <span className="text-sm font-bold text-color-ink">
              {new Date(appt.start_time).toLocaleDateString("es-PE", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>

          <div className="flex justify-between py-2.5 border-b border-color-line-soft">
            <span className="text-sm text-color-ink-soft font-semibold">
              Hora
            </span>
            <span className="text-sm font-bold text-color-ink">{timeRange}</span>
          </div>

          <div className="flex justify-between py-2.5 border-b border-color-line-soft">
            <span className="text-sm text-color-ink-soft font-semibold">
              Buffer de limpieza
            </span>
            <span className="text-sm font-bold text-color-ink">
              {appt.buffer_minutes} min después
            </span>
          </div>

          <div className="flex justify-between py-2.5 border-b border-color-line-soft">
            <span className="text-sm text-color-ink-soft font-semibold">
              Precio
            </span>
            <span className="text-sm font-bold text-color-ink">
              S/ {(appt.price_cents / 100).toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between py-2.5 border-b border-color-line-soft">
            <span className="text-sm text-color-ink-soft font-semibold">
              Estado
            </span>
            <span className="text-sm font-bold text-color-ink capitalize">
              {appt.status === "confirmada"
                ? "Confirmada ✓"
                : appt.status === "pendiente"
                  ? "Pendiente ⏱"
                  : appt.status}
            </span>
          </div>

          {appt.notes && (
            <div className="bg-color-bg rounded-lg p-3 mt-4">
              <div className="text-sm font-semibold text-color-ink mb-1">
                Nota:
              </div>
              <div className="text-sm text-color-ink-soft">{appt.notes}</div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-5 border-t border-color-line-soft space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleSendReminder}
            disabled={isLoading || reminderSent || appt.status === "cancelada"}
          >
            {reminderSent
              ? "Recordatorio encolado ✓"
              : isLoading
                ? "Enviando..."
                : "Enviar recordatorio por WhatsApp"}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={closeDetailModal}
              disabled={isLoading}
            >
              Cerrar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {isLoading ? "Cancelando..." : "Cancelar cita"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
