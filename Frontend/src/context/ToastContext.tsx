import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Kind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  kind: Kind;
  message: string;
  href?: string;
}
interface ToastOptions {
  href?: string;
}
interface ToastApi {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ICONS = {
  success: { Icon: CircleCheck, tone: "text-leaf-600 bg-leaf-50" },
  error: { Icon: CircleAlert, tone: "text-red-600 bg-red-50" },
  info: { Icon: Info, tone: "text-brand-600 bg-brand-50" },
} as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (kind: Kind, message: string, options?: ToastOptions) => {
      const id = ++counter.current;
      setItems((list) => [...list.slice(-3), { id, kind, message, href: options?.href }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m, o) => push("success", m, o),
      error: (m, o) => push("error", m, o),
      info: (m, o) => push("info", m, o),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6"
      >
        {items.map((t) => {
          const { Icon, tone } = ICONS[t.kind];
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm animate-rise items-start gap-3 rounded-2xl bg-white p-3.5 pr-3 shadow-lift ring-1 ring-slate-200"
            >
              <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg", tone)}>
                <Icon className="size-4.5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <p className="text-sm leading-snug font-medium text-ink">{t.message}</p>
                {t.href && (
                  <Link to={t.href} onClick={() => dismiss(t.id)} className="mt-1 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700">
                    View plan
                  </Link>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
