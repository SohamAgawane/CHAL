import { CalendarDays, Clock, MapPin, User } from "lucide-react";
import { Link } from "react-router-dom";
import { CategoryBadge, ProgressBar } from "@/components/ui";
import { cn, formatShortDate, hostOf, isFull, planStatus, relativeDay, titleCase } from "@/lib/utils";
import type { Plan } from "@/types";

interface Props {
  plan: Plan;
  /** Used when `hostedBy` is an id (the "my hosted plans" endpoint doesn't populate it). */
  hostName?: string;
  showCity?: boolean;
}

export function PlanCard({ plan, hostName, showCity }: Props) {
  const full = isFull(plan);
  const status = planStatus(plan);
  const done = status === "completed";
  const when = relativeDay(plan);

  return (
    <Link
      to={`/plans/${plan._id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl bg-white p-6 pt-7 shadow-card ring-1 ring-slate-200/70 transition duration-300 hover:-translate-y-1 hover:shadow-lift hover:ring-brand-200",
        done && "opacity-75",
      )}
    >
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-600 via-brand-400 to-leaf-500" aria-hidden />

      <div className="flex items-start justify-between gap-3">
        <CategoryBadge category={plan.category} />
        {full && !done && <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold tracking-wide text-white">FULL</span>}
        {done && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">Completed</span>}
        {!done && !full && when && <span className="rounded-full bg-sun-300/40 px-2.5 py-1 text-xs font-semibold text-amber-800">{when}</span>}
      </div>

      <h3 className="mt-4 text-xl leading-snug font-bold transition-colors group-hover:text-brand-600">{plan.title}</h3>

      <ul className="mt-4 space-y-2 text-[15px] text-slate-600">
        <li className="flex items-center gap-2.5">
          <MapPin className="size-4 shrink-0 text-brand-500" aria-hidden />
          <span className="truncate">
            {plan.location}
            {showCity && `, ${titleCase(plan.city)}`}
          </span>
        </li>
        <li className="flex items-center gap-4">
          <span className="flex items-center gap-2.5">
            <CalendarDays className="size-4 shrink-0 text-brand-500" aria-hidden />
            {formatShortDate(plan)}
          </span>
          <span className="flex items-center gap-2">
            <Clock className="size-4 shrink-0 text-brand-500" aria-hidden />
            {plan.time}
          </span>
        </li>
        <li className="flex items-center gap-2.5">
          <User className="size-4 shrink-0 text-brand-500" aria-hidden />
          <span className="truncate">{hostOf(plan, hostName)}</span>
        </li>
      </ul>

      <div className="mt-6">
        <p className="mb-2 text-sm font-semibold">
          {plan.joinedCount}/{plan.totalSpots} spots filled
        </p>
        <ProgressBar filled={plan.joinedCount} total={plan.totalSpots} />
      </div>
    </Link>
  );
}
