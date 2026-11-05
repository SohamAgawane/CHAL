import { useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Camera, Crown, Clock, LogOut, Plus, Users, X, Zap } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { Field, inputClass } from "@/components/Field";
import { CategoryBadge } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { usePendingIds } from "@/hooks/usePending";
import { api, errorMessage } from "@/lib/api";
import { CATEGORIES } from "@/lib/categories";
import { CITY_SUGGESTIONS, titleCase } from "@/lib/utils";
import type { Category } from "@/types";

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-slate-200/70 sm:p-8">
      <h2 className="text-xl font-bold">{title}</h2>
      {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function EditProfile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [city, setCity] = useState(user?.city ?? "");

  const save = useMutation({
    mutationFn: () => api.users.updateProfile({ name: name.trim(), city: city.trim() }),
    onSuccess: (updated) => {
      setUser(updated);
      toast.success("Profile updated.");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const dirty = name.trim() !== user?.name || city.trim() !== (user?.city ?? "");
  return (
    <Card title="Edit profile" subtitle="Your name and city appear on plans you host and join.">
      <form onSubmit={(e: FormEvent) => { e.preventDefault(); if (name.trim()) save.mutate(); }} className="space-y-5">
        <Field label="Full name" htmlFor="p-name" required>
          <input id="p-name" value={name} maxLength={50} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="City" htmlFor="p-city">
          <input id="p-city" list="p-cities" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g., Pune" className={inputClass} />
          <datalist id="p-cities">{CITY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        <Button type="submit" loading={save.isPending} disabled={!dirty || !name.trim()}>Save changes</Button>
      </form>
    </Card>
  );
}

function ChangePassword() {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState("");

  const change = useMutation({
    mutationFn: () => api.users.changePassword({ currentPassword: current, newPassword: next }),
    onSuccess: () => {
      toast.success("Password changed.");
      setCurrent("");
      setNext("");
    },
    onError: (err) => setError(errorMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (next.length < 6) return setError("New password must be at least 6 characters.");
    change.mutate();
  }

  return (
    <Card title="Password" subtitle="Use at least 6 characters.">
      <form onSubmit={onSubmit} className="space-y-5">
        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">{error}</p>}
        <Field label="Current password" htmlFor="cur-pass">
          <input id="cur-pass" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} />
        </Field>
        <Field label="New password" htmlFor="new-pass">
          <input id="new-pass" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={inputClass} />
        </Field>
        <Button type="submit" variant="secondary" loading={change.isPending} disabled={!current || !next}>Update password</Button>
      </form>
    </Card>
  );
}

function CityAlerts() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const [city, setCity] = useState(user?.city ?? "");
  const [category, setCategory] = useState<Category>("sport");

  const { data: subs = [], isLoading } = useQuery({ queryKey: ["me", "subs"], queryFn: api.subscriptions.list });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["me", "subs"] });

  const add = useMutation({
    mutationFn: () => api.subscriptions.create(city.trim(), category),
    onSuccess: () => {
      toast.success(`You'll be notified about new ${category} plans in ${titleCase(city.trim())}.`);
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.subscriptions.remove(id),
    onSuccess: refresh,
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Card title="City alerts" subtitle="Get a notification while you're on Chal when a matching plan is posted.">
      <form onSubmit={(e: FormEvent) => { e.preventDefault(); if (city.trim()) add.mutate(); }} className="flex flex-col gap-3 sm:flex-row">
        <input aria-label="City" list="p-cities" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className={inputClass} />
        <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value as Category)} className={`${inputClass} sm:w-44`}>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <Button type="submit" loading={add.isPending} disabled={!city.trim()} icon={<Plus className="size-4.5" />}>Follow</Button>
      </form>

      <ul className="mt-5 flex flex-wrap gap-2.5">
        {isLoading && <li className="text-sm text-slate-500">Loading alerts...</li>}
        {!isLoading && subs.length === 0 && <li className="text-sm text-slate-500">You aren't following any cities yet.</li>}
        {subs.map((s) => (
          <li key={s._id} className="flex items-center gap-2 rounded-full bg-slate-50 py-1.5 pr-1.5 pl-3 ring-1 ring-slate-200">
            <span className="text-sm font-semibold">{titleCase(s.city)}</span>
            <CategoryBadge category={s.category} className="px-2 py-0.5 text-xs" />
            <button type="button" aria-label={`Stop following ${s.category} in ${s.city}`} onClick={() => remove.mutate(s._id)} className="grid size-6 place-items-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600"><X className="size-3.5" /></button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function Profile() {
  const { user, logout, setUser } = useAuth();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const hosted = useQuery({ queryKey: ["me", "hosted"], queryFn: api.users.hosted });
  const joined = useQuery({ queryKey: ["me", "joined"], queryFn: api.users.joined });
  const pendingIds = usePendingIds(user?._id);

  const upload = useMutation({
    mutationFn: (file: File) => api.users.updateAvatar(file),
    onSuccess: (updated) => {
      setUser(updated);
      toast.success("Photo updated.");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (!user) return null;

  function pick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file.");
    if (file.size > 5 * 1024 * 1024) return toast.error("Photo must be smaller than 5 MB.");
    upload.mutate(file);
  }

  const stats = [
    { icon: Crown, value: hosted.data?.length ?? 0, label: "Plans Hosted", tone: "text-amber-600 bg-amber-50", num: "text-amber-600" },
    { icon: Users, value: joined.data?.length ?? 0, label: "Plans Joined", tone: "text-brand-600 bg-brand-50", num: "text-brand-600" },
    { icon: Clock, value: pendingIds.length, label: "Pending", tone: "text-orange-600 bg-orange-50", num: "text-orange-600" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <section className="relative overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-slate-200/70">
        <span className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-600 via-brand-400 to-leaf-500" aria-hidden />
        <div className="flex flex-col items-center px-6 pt-14 pb-9 text-center">
          <div className="relative">
            <Avatar name={user.name} src={user.avatar} size="xl" className="shadow-lg shadow-brand-600/20" />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={upload.isPending} aria-label="Change profile photo" className="absolute -right-2 -bottom-2 grid size-10 place-items-center rounded-full bg-leaf-500 text-white shadow-lg ring-4 ring-white transition hover:bg-leaf-600 disabled:opacity-60">
              {upload.isPending ? <Zap className="size-4.5 animate-pulse" /> : <Camera className="size-4.5" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
          <h1 className="mt-5 text-3xl font-bold">{user.name}</h1>
          <p className="mt-1 text-lg text-slate-500">{user.email}</p>
          <p className="mt-3 rounded-full bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-600">
            Member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </p>
        </div>

        <dl className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
          {stats.map(({ icon: Icon, value, label, tone, num }) => (
            <div key={label} className="flex flex-col items-center px-2 py-7">
              <span className={`grid size-11 place-items-center rounded-xl ${tone}`}><Icon className="size-5" aria-hidden /></span>
              <dd className={`mt-3 font-display text-4xl font-bold tabular-nums ${num}`}>{value}</dd>
              <dt className="mt-0.5 text-sm font-medium text-slate-500">{label}</dt>
            </div>
          ))}
        </dl>

        <div className="border-t border-slate-100 p-6">
          <Button variant="secondary" size="lg" className="w-full" icon={<LogOut className="size-4.5" />} onClick={() => void logout()}>Sign Out</Button>
        </div>
      </section>

      <div className="mt-8 space-y-6">
        <CityAlerts />
        <EditProfile />
        <ChangePassword />
      </div>

      <p className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-400"><BellRing className="size-4" aria-hidden /> Alerts arrive while Chal is open in your browser.</p>
    </div>
  );
}
