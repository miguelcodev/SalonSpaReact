import type { AppointmentWithRelations, HourSlot, OccupiedCellType } from "./types";

/**
 * Build the array of hour slots for the agenda grid.
 * Default: 9am to 7pm (9-19), one slot per hour.
 */
export function buildHourSlots(
  openHour: number = 9,
  closeHour: number = 20,
): HourSlot[] {
  const slots: HourSlot[] = [];
  for (let h = openHour; h < closeHour; h++) {
    const period = h >= 12 ? "pm" : "am";
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const label = `${h12}:00 ${period}`;
    slots.push({ hour: h, label });
  }
  return slots;
}

/**
 * Compute occupied cells (appointment + buffer) from a list of appointments.
 * Returns a Map keyed by "${staffId}-${slotIndex}" with value "appt" or "buffer".
 *
 * Duration and buffer are ALREADY STORED in the appointment row (copied from
 * the service catalog at reservation time — immutable for historical correctness).
 */
export function computeOccupiedCells(
  appointments: AppointmentWithRelations[],
  hourSlots: HourSlot[],
): Map<string, OccupiedCellType> {
  const occupied = new Map<string, OccupiedCellType>();

  appointments.forEach((appt) => {
    // Only mark occupied if not cancelled (cancelled appointments free the slot)
    if (appt.status === "cancelada") {
      return;
    }

    const startHour = new Date(appt.start_time).getHours();
    const startIndex = hourSlots.findIndex((s) => s.hour === startHour);

    if (startIndex === -1) return; // Appointment outside business hours

    // Duration in slots (each slot is 1 hour)
    const apptSlots = Math.max(1, Math.ceil(appt.duration_minutes / 60));

    // Total slots occupied: appointment + buffer
    const totalSlots = Math.max(
      apptSlots,
      Math.ceil((appt.duration_minutes + appt.buffer_minutes) / 60)
    );

    // Mark appointment slots
    for (let i = 0; i < apptSlots; i++) {
      const slotKey = `${appt.staff_id}-${startIndex + i}`;
      if (!occupied.has(slotKey)) {
        occupied.set(slotKey, "appt");
      }
    }

    // Mark buffer slots
    for (let i = apptSlots; i < totalSlots; i++) {
      const slotKey = `${appt.staff_id}-${startIndex + i}`;
      if (!occupied.has(slotKey)) {
        occupied.set(slotKey, "buffer");
      }
    }
  });

  return occupied;
}

/**
 * Check if a given time slot is free for a staff member.
 * Used as optimistic validation before creating an appointment.
 * (The definitive check is Postgres constraint `no_overlap` on commit.)
 */
export function isSlotFree(
  staffId: string,
  startHour: number,
  durationMinutes: number,
  bufferMinutes: number,
  appointments: AppointmentWithRelations[],
  hourSlots: HourSlot[],
): boolean {
  const startIndex = hourSlots.findIndex((s) => s.hour === startHour);
  if (startIndex === -1) return false;

  const apptSlots = Math.max(1, Math.ceil(durationMinutes / 60));
  const totalSlots = Math.max(
    apptSlots,
    Math.ceil((durationMinutes + bufferMinutes) / 60)
  );

  const occupied = computeOccupiedCells(appointments, hourSlots);

  for (let i = 0; i < totalSlots; i++) {
    const slotIndex = startIndex + i;
    if (slotIndex >= hourSlots.length) return false; // Outside business hours

    const slotKey = `${staffId}-${slotIndex}`;
    if (occupied.has(slotKey)) return false;
  }

  return true;
}

/**
 * Format a time value (hours as decimal) to 12-hour format.
 * E.g., 9 -> "9:00 am", 14.5 -> "2:30 pm"
 */
export function formatHour(hour: number): string {
  const hh = Math.floor(hour);
  const mm = hour - hh;
  const mmStr = mm === 0 ? "00" : String(Math.round(mm * 60)).padStart(2, "0");
  const period = hh >= 12 ? "pm" : "am";
  const h12 = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
  return `${h12}:${mmStr} ${period}`;
}

/**
 * Format a time range (start hour + duration).
 */
export function formatTimeRange(startHour: number, durationMinutes: number): string {
  const endHour = startHour + durationMinutes / 60;
  return `${formatHour(startHour)} – ${formatHour(endHour)}`;
}
