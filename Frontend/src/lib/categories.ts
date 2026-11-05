import { BookOpen, Clapperboard, Coffee, Mountain, Trophy, type LucideIcon } from "lucide-react";
import type { Category } from "@/types";

export interface CategoryMeta {
  id: Category;
  label: string;
  icon: LucideIcon;
  pill: string;
  dot: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "sport", label: "Sport", icon: Trophy, pill: "bg-blue-50 text-blue-700 ring-blue-100", dot: "bg-blue-500" },
  { id: "trek", label: "Trek", icon: Mountain, pill: "bg-emerald-50 text-emerald-700 ring-emerald-100", dot: "bg-emerald-500" },
  { id: "hangout", label: "Hangout", icon: Coffee, pill: "bg-amber-50 text-amber-700 ring-amber-100", dot: "bg-amber-500" },
  { id: "movie", label: "Movie", icon: Clapperboard, pill: "bg-violet-50 text-violet-700 ring-violet-100", dot: "bg-violet-500" },
  { id: "study", label: "Study", icon: BookOpen, pill: "bg-teal-50 text-teal-700 ring-teal-100", dot: "bg-teal-500" },
];

export const categoryMeta = (id: Category): CategoryMeta => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0]!;
