import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Globe, Lock, Zap } from "lucide-react";
import { Button } from "@/components/Button";
import { Field, inputClass, textareaClass } from "@/components/Field";
import { LogoMark } from "@/components/Logo";
import { FullPageSpinner } from "@/components/RouteGuards";
import { ErrorState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api, errorMessage } from "@/lib/api";
import { CATEGORIES } from "@/lib/categories";
import { cn, CITY_SUGGESTIONS, titleCase } from "@/lib/utils";
import type { Category, PlanDetail, PlanInput } from "@/types";

interface FormState {
  title: string;
  category: Category | "";
  totalSpots: string;
  location: string;
  address: string;
  city: string;
  date: string;
  time: string;
  isOpen: boolean;
  description: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

const today = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

function validate(f: FormState, minSpots: number, editing: boolean): Errors {
  const errors: Errors = {};
  if (!f.title.trim()) errors.title = "Give your plan a title.";
  if (!f.category) errors.category = "Pick a category.";
  const spots = Number(f.totalSpots);
  if (!f.totalSpots || !Number.isInteger(spots)) errors.totalSpots = "Enter a whole number.";
  else if (spots < 2 || spots > 100) errors.totalSpots = "Spots must be between 2 and 100.";
  else if (spots < minSpots) errors.totalSpots = `${minSpots} people have already joined.`;
  if (!f.location.trim()) errors.location = "Add the place where you'll meet.";
  if (!f.city.trim()) errors.city = "Add a city.";
  if (!f.date) errors.date = "Choose a date.";
  else if (!editing && f.date < today()) errors.date = "Pick today or a later date.";
  if (!f.time) errors.time = "Choose a start time.";
  return errors;
}

function PlanForm({ initial }: { initial?: PlanDetail }) {
  const editing = Boolean(initial);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormState>({
    title: initial?.title ?? "",
    category: initial?.category ?? "",
    totalSpots: initial ? String(initial.totalSpots) : "",
    location: initial?.location ?? "",
    address: initial?.address ?? "",
    city: initial ? titleCase(initial.city) : user?.city ?? "",
    date: initial?.date.slice(0, 10) ?? "",
    time: initial?.time ?? "",
    isOpen: initial?.isOpen ?? true,
    description: initial?.description ?? "",
  });
  const [errors, setErrors] = useState<Errors>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload: PlanInput = {
        title: form.title.trim(),
        category: form.category as Category,
        location: form.location.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        date: form.date,
        time: form.time,
        totalSpots: Number(form.totalSpots),
        isOpen: form.isOpen,
        description: form.description.trim(),
      };
      if (initial) {
        const { category: _c, city: _ci, ...editable } = payload;
        return api.plans.update(initial._id, editable);
      }
      return api.plans.create(payload);
    },
    onSuccess: (plan) => {
      void queryClient.invalidateQueries({ queryKey: ["plans"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      void queryClient.invalidateQueries({ queryKey: ["plan", plan._id] });
      toast.success(editing ? "Plan updated." : "Plan posted. Share the link to fill your spots.");
      navigate(`/plans/${plan._id}`);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validate(form, initial?.joinedCount ?? 2, editing);
    setErrors(found);
    if (Object.keys(found).length === 0) save.mutate();
  }

  const visibility = [
    { open: true, icon: Globe, title: "Open", text: "Anyone can join instantly." },
    { open: false, icon: Lock, title: "Approval", text: "You review each request." },
  ];

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-12">
      <Link to={initial ? `/plans/${initial._id}` : "/browse"} className="inline-flex items-center gap-2 font-semibold text-slate-500 hover:text-ink">
        <ArrowLeft className="size-4.5" aria-hidden /> Back
      </Link>

      <form onSubmit={onSubmit} noValidate className="relative mt-6 overflow-hidden rounded-3xl bg-white p-6 shadow-card ring-1 ring-slate-200/70 sm:p-10">
        <span className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-600 via-brand-400 to-leaf-500" aria-hidden />
        <div className="flex items-center gap-4">
          <LogoMark className="size-14 rounded-2xl" />
          <div>
            <h1 className="text-3xl font-bold">{editing ? "Edit Plan" : "Post a Plan"}</h1>
            <p className="text-slate-500">{editing ? "Update the details your members see" : "Create something fun, watch spots fill up"}</p>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <Field label="Plan Title" htmlFor="title" required error={errors.title}>
            <input id="title" value={form.title} maxLength={100} onChange={(e) => set("title", e.target.value)} placeholder="e.g., Sunday Turf Football Game" className={inputClass} />
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Category" htmlFor="category" required error={errors.category} hint={editing ? "Can't be changed" : undefined}>
              <select id="category" value={form.category} disabled={editing} onChange={(e) => set("category", e.target.value as Category)} className={cn(inputClass, "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%2394a3b8%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m4 6 4 4 4-4%22/></svg>')] bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10", !form.category && "text-slate-400")}>
                <option value="" disabled>Select</option>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Total Spots" htmlFor="spots" required error={errors.totalSpots} hint="Including you">
              <input id="spots" type="number" inputMode="numeric" min={2} max={100} value={form.totalSpots} onChange={(e) => set("totalSpots", e.target.value)} placeholder="e.g., 12" className={inputClass} />
            </Field>
          </div>

          <Field label="Location" htmlFor="location" required error={errors.location}>
            <input id="location" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g., Playzone Turf, Baner" className={inputClass} />
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="City" htmlFor="city" required error={errors.city} hint={editing ? "Can't be changed" : undefined}>
              <input id="city" list="plan-cities" value={form.city} disabled={editing} onChange={(e) => set("city", e.target.value)} placeholder="e.g., Pune" className={inputClass} />
              <datalist id="plan-cities">{CITY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}</datalist>
            </Field>
            <Field label="Date" htmlFor="date" required error={errors.date}>
              <input id="date" type="date" min={editing ? undefined : today()} value={form.date} onChange={(e) => set("date", e.target.value)} className={inputClass} />
            </Field>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Time" htmlFor="time" required error={errors.time}>
              <input id="time" type="time" value={form.time} onChange={(e) => set("time", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Address" htmlFor="address" hint="Optional">
              <input id="address" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Street or landmark" className={inputClass} />
            </Field>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Who can join</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {visibility.map(({ open, icon: Icon, title, text }) => {
                const active = form.isOpen === open;
                return (
                  <label key={title} className={cn("flex cursor-pointer items-start gap-3 rounded-2xl p-4 ring-1 transition", active ? "bg-brand-50 ring-2 ring-brand-500" : "bg-white ring-slate-200 hover:ring-slate-300")}>
                    <input type="radio" name="visibility" className="sr-only" checked={active} onChange={() => set("isOpen", open)} />
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500")}><Icon className="size-4.5" aria-hidden /></span>
                    <span>
                      <span className="block font-semibold">{title}</span>
                      <span className="block text-sm text-slate-500">{text}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <Field label="Description" htmlFor="description" hint={`${form.description.length}/500`}>
            <textarea id="description" value={form.description} maxLength={500} rows={4} onChange={(e) => set("description", e.target.value)} placeholder="What's the vibe? What to bring? Any rules?" className={textareaClass} />
          </Field>

          <Button type="submit" size="lg" loading={save.isPending} className="w-full" icon={<Zap className="size-4.5" />}>
            {editing ? "Save changes" : "Post Plan"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function CreatePlanPage() {
  return <PlanForm />;
}

export function EditPlanPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["plan", id], queryFn: () => api.plans.get(id) });

  if (isLoading) return <FullPageSpinner />;
  if (isError || !data) return <div className="mx-auto max-w-7xl px-5 py-16"><ErrorState message={errorMessage(error)} onRetry={() => void refetch()} /></div>;
  if (data.hostedBy._id !== user?._id) return <Navigate to={`/plans/${id}`} replace />;
  return <PlanForm key={data._id} initial={data} />;
}
