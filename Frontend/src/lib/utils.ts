import type { Plan } from "@/types";

export const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

export type PlanStatus = "upcoming" | "ongoing" | "completed";

export function planStart(plan: Pick<Plan, "date" | "time">): Date {
  const day = plan.date.slice(0, 10);
  const start = new Date(`${day}T${plan.time || "00:00"}`);
  return Number.isNaN(start.getTime()) ? new Date(plan.date) : start;
}

export function planStatus(plan: Pick<Plan, "date" | "time">): PlanStatus {
  const diff = planStart(plan).getTime() - Date.now();
  if (diff > 0) return "upcoming";
  if (diff > -3 * 3600_000) return "ongoing";
  return "completed";
}

export const formatShortDate = (plan: Pick<Plan, "date" | "time">) =>
  planStart(plan).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const formatLongDate = (plan: Pick<Plan, "date" | "time">) =>
  planStart(plan).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

export function relativeDay(plan: Pick<Plan, "date" | "time">): string | null {
  const start = planStart(plan);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(start);
  target.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 1 && days < 7) return `In ${days} days`;
  return null;
}

export const titleCase = (value: string) => value.replace(/\b\w/g, (c) => c.toUpperCase());

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

export function timeAgo(iso: string): string {
  const seconds = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const hostOf = (plan: Plan, fallback = "Host") =>
  typeof plan.hostedBy === "string" ? fallback : plan.hostedBy.name;

export const isFull = (plan: Pick<Plan, "joinedCount" | "totalSpots">) => plan.joinedCount >= plan.totalSpots;

export const CITY_SUGGESTIONS = ["Mumbai", "Pune", "Nashik", "Bengaluru", "Delhi", "Hyderabad"];

/** Upcoming and ongoing plans first (soonest first), then completed plans (most recent first). */
export function sortPlans<T extends Pick<Plan, "date" | "time">>(plans: T[]): T[] {
  const live = plans.filter((p) => planStatus(p) !== "completed").sort((a, b) => planStart(a).getTime() - planStart(b).getTime());
  const past = plans.filter((p) => planStatus(p) === "completed").sort((a, b) => planStart(b).getTime() - planStart(a).getTime());
  return [...live, ...past];
}
