"use client";

import { useModal } from "./agenda-modal-context";
import type { AppointmentWithRelations } from "@/lib/agenda/types";

interface AgendaGridCellProps {
  staffId: string;
  slotHour: number;
  appointment?: AppointmentWithRelations;
  type: "empty" | "appt" | "buffer";
}

export function AgendaGridCell({
  staffId,
  slotHour,
  appointment,
  type,
}: AgendaGridCellProps) {
  const { openDetailModal, openNewModal } = useModal();

  if (type === "appt" && appointment) {
    // Clickable appointment ticket
    const categoryColor = appointment.service.category?.color_hex || "#B8697A";
    const isCombo = !!appointment.combo_group_id;

    return (
      <div
        onClick={() => openDetailModal(appointment)}
        className="relative cursor-pointer h-full p-1 rounded-lg bg-white border border-color-line shadow-card hover:shadow-lg hover:-translate-y-0.5 transition-all"
      >
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
          style={{ backgroundColor: categoryColor }}
        ></div>

        <div className="pl-2 space-y-1">
          <div className="text-xs font-mono text-color-ink-soft">
            {new Date(appointment.start_time).toLocaleTimeString("es-PE", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <div className="text-xs font-bold text-color-ink line-clamp-1">
            {appointment.client.name}
          </div>
          <div className="text-xs text-color-ink-soft line-clamp-1">
            {appointment.service.name}
          </div>
          {isCombo && (
            <div className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-color-accent-lavender text-white inline-block">
              🔗 Combo
            </div>
          )}
        </div>

        {/* Status badge */}
        <div className="absolute top-1 right-1">
          {appointment.status === "confirmada" ? (
            <div className="px-1.5 py-0.5 rounded-full bg-color-accent-sage text-white text-xs font-bold">
              ✓
            </div>
          ) : (
            <div className="px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
              ⏱
            </div>
          )}
        </div>
      </div>
    );
  }

  if (type === "buffer") {
    // Buffer cell (non-clickable)
    return (
      <div className="h-full bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 flex items-center justify-center p-1 rounded-lg">
        <div className="text-xs text-yellow-700 font-semibold text-center">
          🧹 prep
        </div>
      </div>
    );
  }

  // Empty slot (clickable to create appointment)
  return (
    <div
      onClick={() => openNewModal(staffId, slotHour)}
      className="h-full bg-color-surface border border-color-line-soft rounded-lg hover:bg-color-line-soft cursor-pointer transition-colors flex items-center justify-center"
    >
      <div className="text-xs text-color-accent-rose font-semibold opacity-0 hover:opacity-100 transition-opacity">
        + Reservar
      </div>
    </div>
  );
}
