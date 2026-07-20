"use client";

import { useModal } from "./agenda-modal-context";
import type { AppointmentWithRelations } from "@/lib/agenda/types";

interface AgendaGridCellProps {
  staffId: string;
  slotHour: number;
  appointment?: AppointmentWithRelations;
  type: "empty" | "appt" | "appt-continuation" | "buffer";
}

export function AgendaGridCell({
  staffId,
  slotHour,
  appointment,
  type,
}: AgendaGridCellProps) {
  const { openDetailModal, openNewModal } = useModal();

  if (type === "appt" && appointment) {
    const categoryColor = appointment.service.category?.color_hex || "#B8697A";
    const isCombo = !!appointment.combo_group_id;

    return (
      <div
        onClick={() => openDetailModal(appointment)}
        className="relative cursor-pointer h-full overflow-hidden rounded-lg bg-white border border-color-line shadow-card hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col"
      >
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: categoryColor }}
        ></div>

        <div className="pl-2.5 pr-1.5 py-1 flex flex-col gap-0.5 min-w-0">
          {/* Time + status badge, same row so nothing overlaps */}
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono text-color-ink-soft leading-none">
              {new Date(appointment.start_time).toLocaleTimeString("es-PE", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {appointment.status === "confirmada" ? (
              <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full bg-color-accent-sage text-white text-[9px] font-bold leading-none">
                Confirmada
              </span>
            ) : (
              <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[9px] font-bold leading-none">
                Pendiente
              </span>
            )}
          </div>

          {/* Client name + combo tag */}
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-xs font-bold text-color-ink truncate">
              {appointment.client.name}
            </span>
            {isCombo && (
              <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-color-accent-lavender text-white leading-none">
                Combo
              </span>
            )}
          </div>

          {/* Service name */}
          <div className="text-[11px] text-color-ink-soft truncate leading-tight">
            {appointment.service.name}
          </div>
        </div>
      </div>
    );
  }

  if (type === "appt-continuation") {
    // Later slots of an appointment that started earlier and runs past 1h.
    // Non-clickable: still occupied, just not the row with the details.
    return (
      <div className="h-full rounded-lg bg-[repeating-linear-gradient(135deg,#F6F1EF,#F6F1EF_6px,#F0E9E6_6px,#F0E9E6_12px)] flex items-center justify-center">
        <span className="text-[10px] text-color-ink-faint font-semibold">
          · cita en curso ·
        </span>
      </div>
    );
  }

  if (type === "buffer") {
    return (
      <div className="h-full rounded-lg bg-[repeating-linear-gradient(135deg,#FBF7EE,#FBF7EE_6px,#F6EFDD_6px,#F6EFDD_12px)] flex items-center justify-center">
        <span className="text-[10px] text-yellow-700 font-semibold">
          🧹 preparación
        </span>
      </div>
    );
  }

  // Empty slot (clickable to create appointment)
  return (
    <div
      onClick={() => openNewModal(staffId, slotHour)}
      className="group h-full bg-color-surface border border-color-line-soft rounded-lg hover:bg-color-line-soft cursor-pointer transition-colors flex items-center justify-center"
    >
      <span className="text-xs text-color-accent-rose font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
        + Reservar
      </span>
    </div>
  );
}
