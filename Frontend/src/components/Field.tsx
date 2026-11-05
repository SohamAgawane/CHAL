import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const inputClass =
  "w-full h-12 rounded-xl bg-slate-100/80 px-4 text-[15px] text-ink placeholder:text-slate-400 ring-1 ring-transparent transition focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

export const textareaClass = cn(inputClass, "h-auto min-h-28 resize-y py-3 leading-relaxed");

interface FieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, required, hint, error, children, className }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-2 flex items-baseline gap-2 text-sm font-semibold text-ink">
        <span>
          {label}
          {required && <span className="ml-1 text-red-500" aria-hidden>*</span>}
        </span>
        {hint && <span className="text-xs font-normal text-slate-500">{hint}</span>}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
