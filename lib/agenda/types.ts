import type {
  Appointment,
  Staff,
  Service,
  ServiceCategory,
  ServiceStaffPrice,
  Client,
} from "@/types/database";

export interface AppointmentWithRelations extends Appointment {
  client: Client;
  service: Service & { category: ServiceCategory };
  staff: Staff;
}

export interface StaffColumn extends Staff {}

export interface HourSlot {
  hour: number;
  label: string;
}

export type OccupiedCellType = "appt" | "buffer";

export interface GridCell {
  staffId: string;
  slotIndex: number;
  type: "empty" | "appt" | "appt-continuation" | "buffer";
  appointment?: AppointmentWithRelations;
}

export interface StaffPriceOption {
  staff_id: string;
  staff_name: string;
  price_cents: number;
}
