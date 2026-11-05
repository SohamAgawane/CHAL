import { Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-leaf-500 text-white shadow-md shadow-brand-600/25", className)}>
      <Zap className="size-5" strokeWidth={2.2} aria-hidden />
    </span>
  );
}

export function Logo({ light, to = "/" }: { light?: boolean; to?: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2.5" aria-label="Chal home">
      <LogoMark />
      <span className={cn("font-display text-2xl font-bold tracking-tight", light ? "text-white" : "text-ink")}>
        Chal<span className={light ? "text-sun-400" : "text-brand-600"}>.</span>
      </span>
    </Link>
  );
}
