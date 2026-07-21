import type { Promotion, ServiceCategory } from "@/types/database";

export type PromotionStatus = "activa" | "programada" | "vencida";

export interface PromotionWithStatus extends Promotion {
  status: PromotionStatus;
  category: ServiceCategory | null;
}

export interface LoyaltyProgramData {
  id: string;
  visits_required: number;
  reward_description: string | null;
  active: boolean;
}

export interface LoyaltyProgressEntry {
  client_id: string;
  client_name: string;
  stamps: number;
  last_stamp_at: string | null;
}
