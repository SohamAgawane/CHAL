import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Camera, Eye, EyeOff, MessageCircle, UserCheck, Zap } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { Field, inputClass } from "@/components/Field";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { errorMessage } from "@/lib/api";
import { CITY_SUGGESTIONS } from "@/lib/utils";

function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <aside className="hero-bg hero-grid relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="relative"><Logo light /></div>
        <div className="relative max-w-md">
          <h2 className="text-5xl leading-[1.05] font-bold">Plans that actually happen.</h2>
          <ul className="mt-10 space-y-6">
            {[
              { icon: Zap, title: "Post in 30 seconds", text: "Pick a spot, a time and the number of people you need." },
              { icon: UserCheck, title: "You control who joins", text: "Open to everyone, or approve each request yourself." },
              { icon: MessageCircle, title: "Chat once you're in", text: "Every plan gets a group chat for its members." },
            ].map(({ icon: Icon, title: t, text }) => (
              <li key={t} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/12 ring-1 ring-white/25"><Icon className="size-5" aria-hidden /></span>
                <div>
                  <p className="font-bold">{t}</p>
                  <p className="mt-0.5 text-brand-100">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-brand-200">&copy; {new Date().getFullYear()} Chal. Built for spontaneous hangouts.</p>
      </aside>

      <main className="flex flex-col justify-center px-5 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10 lg:hidden"><Logo /></div>
          <h1 className="text-4xl font-bold">{title}</h1>
          <p className="mt-2 text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-center text-slate-500">{footer}</p>
        </div>
      </main>
    </div>
  );
}

function PasswordInput({ id, value, onChange, autoComplete }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={id} type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} placeholder="At least 6 characters" className={`${inputClass} pr-12`} required />
      <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:text-slate-600">
        {show ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
      </button>
    </div>
  );
}

const FormError = ({ message }: { message: string }) =>
  message ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">{message}</p> : null;

export function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  const registerState = (location.state as { from?: string } | null) ?? undefined;

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to join plans, chat with your group and post your own."
      footer={<>New to Chal? <Link to="/register" state={registerState} className="font-semibold text-brand-600 hover:text-brand-700">Create an account</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <FormError message={error} />
        <Field label="Email" htmlFor="email">
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" className={inputClass} required />
        </Field>
        <Field label="Password" htmlFor="password">
          <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" />
        </Field>
        <Button type="submit" size="lg" loading={busy} className="w-full" disabled={!email || !password}>Sign in</Button>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const location = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: "", email: "", city: "", password: "" });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  function pickAvatar(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choose an image file for your photo.");
    if (file.size > 5 * 1024 * 1024) return setError("Photo must be smaller than 5 MB.");
    setError("");
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    setBusy(true);
    try {
      await register({ ...form, avatar });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  const loginState = (location.state as { from?: string } | null) ?? undefined;

  return (
    <AuthShell
      title="Create your account"
      subtitle="It takes under a minute. No credit card, no fuss."
      footer={<>Already have an account? <Link to="/login" state={loginState} className="font-semibold text-brand-600 hover:text-brand-700">Sign in</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <FormError message={error} />
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => fileRef.current?.click()} aria-label="Upload profile photo" className="group relative rounded-2xl">
            <Avatar name={form.name || "You"} src={preview} size="lg" />
            <span className="absolute -right-1.5 -bottom-1.5 grid size-6 place-items-center rounded-full bg-white text-brand-600 shadow ring-1 ring-slate-200 group-hover:text-brand-700"><Camera className="size-3.5" /></span>
          </button>
          <div>
            <p className="font-semibold">Profile photo</p>
            <p className="text-sm text-slate-500">Optional. JPG or PNG, up to 5 MB.</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickAvatar(e.target.files?.[0])} />
        </div>
        <Field label="Full name" htmlFor="name" required>
          <input id="name" value={form.name} maxLength={50} onChange={(e) => set("name")(e.target.value)} autoComplete="name" placeholder="Your name" className={inputClass} required />
        </Field>
        <Field label="Email" htmlFor="reg-email" required>
          <input id="reg-email" type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} autoComplete="email" placeholder="you@example.com" className={inputClass} required />
        </Field>
        <Field label="City" htmlFor="reg-city" hint="Used to suggest plans near you">
          <input id="reg-city" list="city-options" value={form.city} onChange={(e) => set("city")(e.target.value)} autoComplete="address-level2" placeholder="e.g., Pune" className={inputClass} />
          <datalist id="city-options">{CITY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        <Field label="Password" htmlFor="reg-password" required>
          <PasswordInput id="reg-password" value={form.password} onChange={set("password")} autoComplete="new-password" />
        </Field>
        <Button type="submit" size="lg" loading={busy} className="w-full" disabled={!form.name || !form.email || !form.password} icon={<Zap className="size-4.5" />}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
