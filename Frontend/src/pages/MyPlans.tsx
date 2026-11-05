import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Clock, Users, Zap, type LucideIcon } from "lucide-react";
import { buttonStyles } from "@/components/Button";
import { PlanCard } from "@/components/PlanCard";
import { EmptyState, ErrorState, PageHeader, PlanCardSkeleton } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { removePending, usePendingIds } from "@/hooks/usePending";
import { api, errorMessage } from "@/lib/api";
import { cn, planStatus, sortPlans } from "@/lib/utils";
import type { Plan } from "@/types";

type Tab = "hosted" | "joined" | "pending";

const empty: Record<Tab, { icon: LucideIcon; title: string; message: string; cta: string; to: string }> = {
  hosted: { icon: Zap, title: "No hosted plans", message: "You haven't posted any plans yet.", cta: "Post a Plan", to: "/plans/new" },
  joined: { icon: Users, title: "No joined plans", message: "Find something fun and grab a spot.", cta: "Browse Plans", to: "/browse" },
  pending: { icon: Clock, title: "No pending requests", message: "Requests to join approval-only plans show up here until the host replies.", cta: "Browse Plans", to: "/browse" },
};

export default function MyPlans() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("hosted");

  const hosted = useQuery({ queryKey: ["me", "hosted"], queryFn: api.users.hosted });
  const joined = useQuery({ queryKey: ["me", "joined"], queryFn: api.users.joined });

  const pendingIds = usePendingIds(user?._id);
  const pendingQueries = useQueries({
    queries: pendingIds.map((id) => ({ queryKey: ["plan", id], queryFn: () => api.plans.get(id), retry: false })),
  });

  // Drop requests that were approved, or whose plan no longer exists
  useEffect(() => {
    if (!user) return;
    pendingQueries.forEach((q, i) => {
      const id = pendingIds[i]!;
      if (q.data?.hasJoined || q.isError) removePending(user._id, id);
    });
  }, [pendingQueries, pendingIds, user]);

  if (!user) return null;

  const pendingPlans = pendingQueries
    .map((q) => q.data)
    .filter((p): p is NonNullable<typeof p> => Boolean(p) && !p!.hasJoined && planStatus(p!) !== "completed");

  const lists: Record<Tab, { plans: Plan[]; loading: boolean; error: unknown; retry: () => void }> = {
    hosted: { plans: sortPlans(hosted.data ?? []), loading: hosted.isLoading, error: hosted.error, retry: () => void hosted.refetch() },
    joined: { plans: sortPlans(joined.data ?? []), loading: joined.isLoading, error: joined.error, retry: () => void joined.refetch() },
    pending: { plans: pendingPlans as unknown as Plan[], loading: pendingQueries.some((q) => q.isLoading), error: null, retry: () => undefined },
  };
  const current = lists[tab];
  const e = empty[tab];

  const tabs: Array<{ id: Tab; label: string; count: number }> = [
    { id: "hosted", label: "Hosted", count: lists.hosted.plans.length },
    { id: "joined", label: "Joined", count: lists.joined.plans.length },
    { id: "pending", label: "Pending", count: lists.pending.plans.length },
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <PageHeader title="My Plans" subtitle="Plans you've hosted, joined, or are waiting on" />

      <div role="tablist" aria-label="My plans" className="mt-8 inline-flex rounded-2xl bg-white p-1.5 shadow-card ring-1 ring-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn("rounded-xl px-5 py-2.5 text-[15px] font-semibold transition", tab === t.id ? "bg-brand-600 text-white shadow-md shadow-brand-600/25" : "text-slate-500 hover:text-ink")}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div role="tabpanel" className="mt-8">
        {current.error ? (
          <ErrorState message={errorMessage(current.error)} onRetry={current.retry} />
        ) : current.loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <PlanCardSkeleton key={i} />)}</div>
        ) : current.plans.length === 0 ? (
          <EmptyState icon={e.icon} title={e.title} message={e.message} action={<Link to={e.to} className={buttonStyles()}>{e.cta}</Link>} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {current.plans.map((plan) => (
              <PlanCard key={plan._id} plan={plan} hostName={user.name} showCity />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
