import { useEffect, type ReactNode } from "react";
import { TriangleAlert, type LucideIcon } from "lucide-react";
import { Button } from "@/components/Button";
import { categoryMeta } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

export function CategoryBadge({ category, className }: { category: Category; className?: string }) {
  const { label, icon: Icon, pill } = categoryMeta(category);
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1", pill, className)}>
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}

export function ProgressBar({ filled, total, className }: { filled: number; total: number; className?: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((filled / total) * 100)) : 0;
  const full = filled >= total;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={filled}
      aria-label="Spots filled"
      className={cn("h-2 overflow-hidden rounded-full bg-slate-100", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-700", full ? "bg-red-500" : "bg-gradient-to-r from-brand-600 to-brand-400")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-200/70", className)} />;
}

export function PlanCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl bg-white p-6 shadow-card ring-1 ring-slate-200/70">
      <Skeleton className="h-7 w-24 rounded-full" />
      <Skeleton className="mt-5 h-6 w-3/4" />
      <Skeleton className="mt-5 h-4 w-1/2" />
      <Skeleton className="mt-3 h-4 w-2/5" />
      <Skeleton className="mt-3 h-4 w-1/3" />
      <Skeleton className="mt-7 h-2 w-full rounded-full" />
    </div>
  );
}

interface EmptyProps {
  icon: LucideIcon;
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, message, action }: EmptyProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-leaf-50 text-brand-600 ring-1 ring-brand-100">
        <Icon className="size-7" aria-hidden />
      </span>
      <h3 className="mt-5 text-xl font-bold">{title}</h3>
      <p className="mt-1.5 text-slate-500">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={TriangleAlert}
      title="We couldn't load this"
      message={message}
      action={onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
    />
  );
}

interface ConfirmProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel, loading, onConfirm, onCancel }: ConfirmProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <button type="button" aria-label="Close dialog" className="absolute inset-0 bg-brand-950/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md animate-rise rounded-3xl bg-white p-6 shadow-lift">
        <span className="grid size-12 place-items-center rounded-2xl bg-red-50 text-red-600">
          <TriangleAlert className="size-6" aria-hidden />
        </span>
        <h2 id="confirm-title" className="mt-4 text-xl font-bold">{title}</h2>
        <p className="mt-1.5 text-slate-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-4xl font-bold sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-2 text-lg text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
