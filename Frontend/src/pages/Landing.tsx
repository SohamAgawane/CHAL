import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BellRing,
  ClipboardList,
  Crown,
  LayoutGrid,
  Link2,
  MessageCircle,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { buttonStyles } from "@/components/Button";
import { PlanCard } from "@/components/PlanCard";
import { CategoryBadge, EmptyState, PlanCardSkeleton, ProgressBar } from "@/components/ui";
import { api } from "@/lib/api";
import { cn, formatShortDate, planStatus, sortPlans } from "@/lib/utils";
import type { Plan } from "@/types";

const rise = (delay: number) => ({ animationDelay: `${delay}ms` });

const steps: Array<{ icon: LucideIcon; title: string; text: string }> = [
  { icon: ClipboardList, title: "Post a Plan", text: "Takes 30 seconds. Set your spot, date, and vibe." },
  { icon: Link2, title: "Share the Link", text: "Send it to your group or let strangers discover it." },
  { icon: Zap, title: "Spots Fill Up", text: "People join, chat, and show up. It actually happens." },
];

const features: Array<{ icon: LucideIcon; title: string; text: string; tone: string }> = [
  { icon: UserCheck, title: "Open or approval-only", text: "Let anyone join instantly, or review every request before it's approved.", tone: "bg-amber-50 text-amber-600" },
  { icon: MessageCircle, title: "Group chat", text: "Every plan has a members-only chat, so details never get lost in a group thread.", tone: "bg-brand-50 text-brand-600" },
  { icon: Activity, title: "Live spot counts", text: "Spots update in real time the moment someone joins or leaves.", tone: "bg-leaf-50 text-leaf-600" },
  { icon: BellRing, title: "City alerts", text: "Follow a city and category to hear about new plans as soon as they're posted.", tone: "bg-violet-50 text-violet-600" },
  { icon: Crown, title: "Host controls", text: "Edit the details, change the number of spots, or cancel. You stay in charge.", tone: "bg-rose-50 text-rose-600" },
  { icon: LayoutGrid, title: "Five categories", text: "Sport, trek, hangout, movie and study. Filter down to what you're in the mood for.", tone: "bg-teal-50 text-teal-600" },
];

function FloatingPlan({ plan, className, tilt }: { plan: Plan; className: string; tilt: string }) {
  return (
    <div
      aria-hidden
      style={{ "--tilt": tilt } as React.CSSProperties}
      className={cn("absolute hidden w-60 animate-float rounded-2xl bg-white p-4 text-left text-ink shadow-2xl shadow-brand-950/30 2xl:block", className)}
    >
      <CategoryBadge category={plan.category} className="px-2.5 py-0.5 text-xs" />
      <p className="mt-2.5 line-clamp-1 font-display text-base font-bold">{plan.title}</p>
      <p className="mt-0.5 text-xs text-slate-500">
        {formatShortDate(plan)} at {plan.time}
      </p>
      <ProgressBar className="mt-3 h-1.5" filled={plan.joinedCount} total={plan.totalSpots} />
      <p className="mt-1.5 text-xs font-semibold text-slate-600">
        {plan.joinedCount}/{plan.totalSpots} spots filled
      </p>
    </div>
  );
}

export default function Landing() {
  const { data, isLoading } = useQuery({ queryKey: ["plans", "all"], queryFn: () => api.plans.list({ limit: 100 }) });

  const plans = sortPlans(data?.plans ?? []);
  const active = plans.filter((p) => planStatus(p) !== "completed");
  const stats = [
    { icon: Zap, value: active.length, label: "Active Plans", tone: "bg-brand-50 text-brand-600", num: "text-brand-600" },
    { icon: Users, value: active.reduce((n, p) => n + p.joinedCount, 0), label: "People Joined", tone: "bg-leaf-50 text-leaf-600", num: "text-leaf-600" },
    { icon: TrendingUp, value: active.reduce((n, p) => n + Math.max(0, p.totalSpots - p.joinedCount), 0), label: "Open Spots", tone: "bg-amber-50 text-amber-600", num: "text-amber-600" },
  ];

  return (
    <>
      {/* Hero */}
      <section className="hero-bg hero-grid relative overflow-hidden text-white">
        {active[0] && <FloatingPlan plan={active[0]} tilt="-6deg" className="top-28 left-[4%]" />}
        {active[1] && <FloatingPlan plan={active[1]} tilt="5deg" className="top-40 right-[4%]" />}

        <div className="relative mx-auto max-w-7xl px-5 pt-20 pb-24 text-center sm:px-8 sm:pt-28 lg:pt-32">
          <span
            style={rise(0)}
            className="inline-flex animate-rise items-center gap-2.5 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold ring-1 ring-white/30 backdrop-blur-sm"
          >
            <span className="size-2 rounded-full bg-leaf-400 shadow-[0_0_0_4px_rgb(92_193_122/0.25)]" aria-hidden />
            Plans that actually happen
          </span>

          <h1 className="mx-auto mt-8 max-w-4xl text-[clamp(2.75rem,8.5vw,6.5rem)] leading-[1.02] font-bold">
            <span style={rise(120)} className="block animate-rise">Stop saying</span>
            <span style={rise(240)} className="block animate-rise font-medium text-sun-400 italic">
              &ldquo;let&rsquo;s plan&rdquo;
            </span>
            <span style={rise(360)} className="mt-1 flex animate-rise flex-wrap items-center justify-center gap-x-5">
              Just say
              <span className="-rotate-2 rounded-2xl bg-white px-5 pt-1 pb-2 text-brand-600 shadow-2xl shadow-brand-950/30">Chal.</span>
            </span>
          </h1>

          <p style={rise(500)} className="mx-auto mt-8 max-w-xl animate-rise text-lg leading-relaxed text-brand-100 sm:text-xl">
            From turf games to treks, movie nights to study sessions. Post a plan and watch your crew show up.
          </p>

          <div style={rise(620)} className="mt-10 flex animate-rise flex-wrap items-center justify-center gap-3">
            <Link to="/browse" className={buttonStyles({ variant: "white", size: "lg" })}>
              Browse Plans
              <ArrowRight className="size-4.5" aria-hidden />
            </Link>
            <Link to="/plans/new" className={buttonStyles({ variant: "glass", size: "lg" })}>
              <Zap className="size-4.5 text-sun-400" aria-hidden />
              Post a Plan
            </Link>
          </div>

          <ol style={rise(780)} className="mx-auto mt-24 grid max-w-4xl animate-rise gap-10 text-center sm:grid-cols-3 sm:gap-6">
            {steps.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex flex-col items-center">
                <span className="grid size-16 place-items-center rounded-2xl bg-white/12 ring-1 ring-white/25 backdrop-blur-sm">
                  <Icon className="size-7 text-white" aria-hidden />
                </span>
                <h2 className="mt-4 text-base font-bold">{title}</h2>
                <p className="mt-1.5 max-w-[15rem] text-sm leading-relaxed text-brand-100">{text}</p>
              </li>
            ))}
          </ol>
        </div>

        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-14 w-full fill-canvas sm:h-20" aria-hidden>
          <path d="M0,70 C240,108 480,104 720,76 C960,48 1200,38 1440,70 L1440,121 L0,121 Z" />
        </svg>
      </section>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Stats */}
        <section aria-label="Platform activity" className="grid gap-5 pt-14 sm:grid-cols-3">
          {stats.map(({ icon: Icon, value, label, tone, num }) => (
            <div key={label} className="flex flex-col items-center rounded-3xl bg-white p-8 text-center shadow-card ring-1 ring-slate-200/70">
              <span className={cn("grid size-12 place-items-center rounded-2xl", tone)}>
                <Icon className="size-6" aria-hidden />
              </span>
              <p className={cn("mt-4 font-display text-5xl font-bold tabular-nums", num)}>{isLoading ? "–" : value}</p>
              <p className="mt-1 font-medium text-slate-500">{label}</p>
            </div>
          ))}
        </section>

        {/* Features */}
        <section className="pt-24">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">Everything you need to make it happen</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-lg text-slate-500">
            Chal handles the awkward parts of organizing, so people spend less time asking who's in.
          </p>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text, tone }) => (
              <div key={title} className="flex gap-4 rounded-3xl bg-white p-6 shadow-card ring-1 ring-slate-200/70 transition hover:ring-brand-200">
                <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", tone)}>
                  <Icon className="size-6" aria-hidden />
                </span>
                <div>
                  <h3 className="text-lg font-bold">{title}</h3>
                  <p className="mt-1 leading-relaxed text-slate-600">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent plans */}
        <section className="pt-24">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold sm:text-4xl">Recent Plans</h2>
              <p className="mt-1.5 text-slate-500">Jump in before spots fill up</p>
            </div>
            <Link to="/browse" className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700">
              View all <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading && Array.from({ length: 6 }, (_, i) => <PlanCardSkeleton key={i} />)}
            {active.slice(0, 6).map((plan) => (
              <PlanCard key={plan._id} plan={plan} showCity />
            ))}
          </div>

          {!isLoading && active.length === 0 && (
            <EmptyState
              icon={Zap}
              title="No plans yet"
              message="Be the first to post one in your city."
              action={<Link to="/plans/new" className={buttonStyles()}>Post a Plan</Link>}
            />
          )}

          {active.length > 0 && (
            <div className="mt-10 text-center">
              <Link to="/browse" className={buttonStyles({ variant: "secondary", size: "lg" })}>
                See all plans <ArrowRight className="size-4.5" aria-hidden />
              </Link>
            </div>
          )}
        </section>

        {/* Closing call to action */}
        <section className="pt-24">
          <div className="hero-bg relative overflow-hidden rounded-[2rem] px-6 py-16 text-center text-white sm:px-12 sm:py-20">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold sm:text-5xl">Your next plan is one post away.</h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-brand-100">Pick a spot, set a time, and let your city come to you.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/plans/new" className={buttonStyles({ variant: "white", size: "lg" })}>
                <Zap className="size-4.5" aria-hidden /> Post a Plan
              </Link>
              <Link to="/register" className={buttonStyles({ variant: "glass", size: "lg" })}>Create an account</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
