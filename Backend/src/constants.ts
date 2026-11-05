export const DB_NAME = "chal-db";

export const PLAN_CATEGORIES = ["sport", "trek", "hangout", "movie", "study"] as const;
export type PlanCategory = (typeof PLAN_CATEGORIES)[number];

export const JOIN_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;
export type JoinStatus = (typeof JOIN_STATUS)[keyof typeof JOIN_STATUS];

export const PLAN_STATUS = {
  UPCOMING: "upcoming",
  ONGOING: "ongoing",
  COMPLETED: "completed",
} as const;
export type PlanStatusValue = (typeof PLAN_STATUS)[keyof typeof PLAN_STATUS];
