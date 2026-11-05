import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { LayoutGrid, MapPin, Plus, Search, SearchX } from "lucide-react";
import { buttonStyles } from "@/components/Button";
import { PlanCard } from "@/components/PlanCard";
import { EmptyState, ErrorState, PageHeader, PlanCardSkeleton } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { CATEGORIES } from "@/lib/categories";
import { cn, hostOf, isFull, planStatus, sortPlans, titleCase } from "@/lib/utils";
import type { Category } from "@/types";

const chip = (active: boolean) =>
  cn(
    "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-semibold ring-1 transition",
    active ? "bg-brand-600 text-white ring-brand-600 shadow-md shadow-brand-600/25" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:text-ink",
  );

export default function Browse() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [city, setCity] = useState("all");
  const [openOnly, setOpenOnly] = useState(false);
  const [showPast, setShowPast] = useState(false);

  // Category and city are filtered by the API; search and availability are filtered client-side.
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["plans", { category, city }],
    queryFn: () => api.plans.list({ limit: 100, category: category === "all" ? undefined : category, city: city === "all" ? undefined : city }),
  });

  // City chips come from every plan that exists, not just the filtered ones.
  const { data: everything } = useQuery({ queryKey: ["plans", "all"], queryFn: () => api.plans.list({ limit: 100 }) });
  const cities = useMemo(() => {
    const set = new Set((everything?.plans ?? data?.plans ?? []).map((p) => p.city));
    if (city !== "all") set.add(city);
    return [...set].sort();
  }, [everything, data, city]);

  const plans = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortPlans(data?.plans ?? []).filter((p) => {
      if (!showPast && planStatus(p) === "completed") return false;
      if (openOnly && isFull(p)) return false;
      if (!q) return true;
      return [p.title, p.location, p.city, p.address, hostOf(p, "")].some((v) => v.toLowerCase().includes(q));
    });
  }, [data, query, openOnly, showPast]);

  const filtered = query || category !== "all" || city !== "all" || openOnly;

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <PageHeader title="Browse Plans" subtitle="Find something fun happening near you" />

      <div className="relative mt-8">
        <Search className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search plans, locations, cities..."
          aria-label="Search plans"
          className="h-14 w-full rounded-2xl bg-white pr-5 pl-14 text-base shadow-card ring-1 ring-slate-200 transition placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none"
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2.5" role="group" aria-label="Category">
        <button type="button" className={chip(category === "all")} onClick={() => setCategory("all")} aria-pressed={category === "all"}>
          <LayoutGrid className="size-4" aria-hidden /> All
        </button>
        {CATEGORIES.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" className={chip(category === id)} onClick={() => setCategory(id)} aria-pressed={category === id}>
            <Icon className="size-4" aria-hidden /> {label}
          </button>
        ))}
      </div>

      <div className="mt-7">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
          <MapPin className="size-4" aria-hidden /> Filter by city
        </p>
        <div className="flex flex-wrap gap-2.5" role="group" aria-label="City">
          <button type="button" className={chip(city === "all")} onClick={() => setCity("all")} aria-pressed={city === "all"}>All Cities</button>
          {cities.map((c) => (
            <button key={c} type="button" className={chip(city === c)} onClick={() => setCity(c)} aria-pressed={city === c}>
              {titleCase(c)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-slate-500">
          <span className="font-bold text-ink">{plans.length}</span> {plans.length === 1 ? "plan" : "plans"}
        </p>
        <div className="flex flex-wrap items-center gap-6">
          {[
            { label: "Show past plans", on: showPast, set: setShowPast },
            { label: "Open only", on: openOnly, set: setOpenOnly },
          ].map(({ label, on, set }) => (
            <label key={label} className="flex cursor-pointer items-center gap-3 font-semibold select-none">
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={label}
                onClick={() => set(!on)}
                className={cn("relative h-7 w-12 rounded-full transition-colors", on ? "bg-brand-600" : "bg-slate-200")}
              >
                <span className={cn("absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform", on && "translate-x-5")} />
              </button>
              {label}
            </label>
          ))}
        </div>
      </div>

      {isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && Array.from({ length: 6 }, (_, i) => <PlanCardSkeleton key={i} />)}
          {plans.map((plan) => (
            <PlanCard key={plan._id} plan={plan} showCity />
          ))}
        </div>
      )}

      {!isLoading && !isError && plans.length === 0 && (
        <EmptyState
          icon={filtered ? SearchX : Plus}
          title={filtered ? "No plans match your filters" : "No plans yet"}
          message={filtered ? "Try a different search, category or city." : "Be the first to post a plan."}
          action={
            filtered ? (
              <button
                type="button"
                className={buttonStyles({ variant: "secondary" })}
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                  setCity("all");
                  setOpenOnly(false);
                }}
              >
                Clear filters
              </button>
            ) : (
              <Link to="/plans/new" className={buttonStyles()}>Post a Plan</Link>
            )
          }
        />
      )}
    </div>
  );
}
