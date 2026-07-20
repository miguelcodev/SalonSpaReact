import { getStaffColumns, getAppointmentsForDay } from "@/lib/agenda/queries";
import { buildHourSlots, computeOccupiedCells } from "@/lib/agenda/grid";
import { AgendaGridCell } from "./agenda-grid-cell";
import { ModalProvider } from "./agenda-modal-context";
import { AppointmentDetailModal } from "./appointment-detail-modal";
import { NewAppointmentModal } from "./new-appointment-modal";

interface AgendaGridProps {
  dateISO: string; // YYYY-MM-DD
}

export async function AgendaGrid({ dateISO }: AgendaGridProps) {
  const [staff, appointments] = await Promise.all([
    getStaffColumns(),
    getAppointmentsForDay(dateISO),
  ]);

  const hourSlots = buildHourSlots(9, 20);
  const occupied = computeOccupiedCells(appointments, hourSlots);

  if (staff.length === 0) {
    return (
      <div className="text-center py-12 text-color-ink-soft">
        <p>No hay especialistas activas configuradas.</p>
      </div>
    );
  }

  return (
    <ModalProvider>
      <div className="space-y-4">
        {/* Legend */}
        <div className="flex gap-4 flex-wrap items-center text-xs">
          {[
            { name: "Cabello", color: "#C77B4B" },
            { name: "Uñas", color: "#B8697A" },
            { name: "Facial", color: "#7C9070" },
            { name: "Maquillaje", color: "#8D7B9E" },
          ].map((cat) => (
            <div key={cat.name} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded"
                style={{ backgroundColor: cat.color }}
              ></div>
              <span className="text-color-ink-soft font-semibold">
                {cat.name}
              </span>
            </div>
          ))}
          <div className="border-l border-color-line-soft"></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded bg-yellow-200"></div>
            <span className="text-color-ink-soft font-semibold">
              Buffer de limpieza
            </span>
          </div>
        </div>

        {/* Grid */}
        <div className="bg-color-surface rounded-2xl border border-color-line overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <div className="inline-grid gap-0" style={{
              gridTemplateColumns: `64px repeat(${staff.length}, minmax(180px, 1fr))`,
              minWidth: "1100px",
            }}>
              {/* Corner cell */}
              <div className="h-16 border-b border-r border-color-line flex items-center justify-center bg-color-line-soft"></div>

              {/* Staff headers */}
              {staff.map((s) => (
                <div
                  key={s.id}
                  className="h-16 border-b border-r border-color-line flex items-center gap-2 px-3 py-2 bg-color-surface sticky top-0 z-5"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold font-serif"
                    style={{ backgroundColor: s.color_hex }}
                  >
                    {s.name[0]}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-color-ink leading-tight">
                      {s.name}
                    </div>
                    <div className="text-xs text-color-ink-soft">
                      {s.level === "senior" ? "Sr." : "Jr."}
                    </div>
                  </div>
                </div>
              ))}

              {/* Hour rows */}
              {hourSlots.map((slot, slotIndex) => (
                <div key={slot.hour}>
                  {/* Hour label */}
                  <div className="h-20 border-b border-r border-color-line-soft px-2 py-1 text-right bg-color-line-soft text-xs text-color-ink-faint font-mono font-semibold flex items-start justify-end">
                    {slot.label}
                  </div>

                  {/* Cells per staff */}
                  {staff.map((s) => {
                    const cellKey = `${s.id}-${slotIndex}`;
                    const occupiedType = occupied.get(cellKey);
                    const appointment = appointments.find(
                      (a) =>
                        a.staff_id === s.id &&
                        new Date(a.start_time).getHours() === slot.hour
                    );

                    // An appointment longer than 1h occupies later slots too,
                    // but computeOccupiedCells only marks them "appt" — it
                    // doesn't repeat the appointment object. Without this
                    // branch those continuation cells fell through to
                    // "empty" and rendered as bookable, hiding an ongoing
                    // appointment and risking a double-booking attempt.
                    const cellType = appointment
                      ? "appt"
                      : occupiedType === "buffer"
                        ? "buffer"
                        : occupiedType === "appt"
                          ? "appt-continuation"
                          : "empty";

                    return (
                      <div
                        key={cellKey}
                        className="h-20 border-b border-r border-color-line-soft p-1"
                      >
                        <AgendaGridCell
                          staffId={s.id}
                          slotHour={slot.hour}
                          appointment={appointment}
                          type={cellType}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AppointmentDetailModal />
      <NewAppointmentModal dateISO={dateISO} />
    </ModalProvider>
  );
}
