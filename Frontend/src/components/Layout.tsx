import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, Plus, X } from "lucide-react";
import { Logo, LogoMark } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";
import { buttonStyles } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/browse", label: "Browse" },
  { to: "/my-plans", label: "My Plans" },
  { to: "/profile", label: "Profile" },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn("rounded-lg px-3 py-2 text-[15px] font-semibold transition-colors", isActive ? "text-brand-600" : "text-slate-500 hover:text-ink");

function Navbar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Logo />

        <nav aria-label="Primary" className="hidden items-center gap-2 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!user && (
            <Link to="/login" className={buttonStyles({ variant: "ghost", size: "sm", className: "hidden sm:inline-flex" })}>
              Sign in
            </Link>
          )}
          <Link to="/plans/new" className={buttonStyles({ size: "sm", className: "px-4" })}>
            <Plus className="size-4" aria-hidden />
            Post Plan
          </Link>
          {user && (
            <Link to="/profile" aria-label="Your profile" className="ml-1 hidden sm:block">
              <Avatar name={user.name} src={user.avatar} size="sm" />
            </Link>
          )}
          <button
            type="button"
            className="grid size-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="Mobile" className="border-t border-slate-100 bg-white px-5 py-3 md:hidden">
          <div className="flex flex-col">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => cn(linkClass({ isActive }), "py-3")}>
                {l.label}
              </NavLink>
            ))}
            {!user && (
              <NavLink to="/login" className={({ isActive }) => cn(linkClass({ isActive }), "py-3")}>
                Sign in
              </NavLink>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-5 py-8 sm:flex-row sm:items-center sm:px-8">
        <div className="flex items-center gap-3">
          <LogoMark className="size-9" />
          <p className="text-slate-500">
            <span className="font-display text-lg font-bold text-ink">Chal.</span>
            <span className="ml-2">Let's make plans happen</span>
          </p>
        </div>
        <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Chal. Built for spontaneous hangouts.</p>
      </div>
    </footer>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg">
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
