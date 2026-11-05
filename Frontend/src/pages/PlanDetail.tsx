import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Crown,
  Globe,
  Lock,
  MapPin,
  MessageCircle,
  Pencil,
  Send,
  Share2,
  Trash2,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Button, buttonStyles } from "@/components/Button";
import { FullPageSpinner } from "@/components/RouteGuards";
import { CategoryBadge, ConfirmDialog, ErrorState, ProgressBar } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { addPending, removePending, usePendingIds } from "@/hooks/usePending";
import { ApiException, api, errorMessage } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { cn, formatLongDate, isFull, planStatus, relativeDay, timeAgo, titleCase } from "@/lib/utils";
import type { ChatMessage, MessagesPage, PlanDetail } from "@/types";

function Detail({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3.5">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="size-5" aria-hidden /></span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className="font-semibold">{children}</div>
      </div>
    </div>
  );
}

function ChatPanel({ planId, meId }: { planId: string; meId: string }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const listRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["messages", planId], queryFn: () => api.messages.list(planId) });

  const append = (message: ChatMessage) =>
    queryClient.setQueryData<MessagesPage>(["messages", planId], (old) =>
      old && !old.messages.some((m) => m._id === message._id) ? { ...old, messages: [...old.messages, message] } : old,
    );

  const send = useMutation({
    mutationFn: (value: string) => api.messages.send(planId, value),
    onSuccess: (message) => {
      append(message);
      setText("");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  useEffect(() => {
    const socket = getSocket();
    const onMessage = (message: ChatMessage) => {
      if (message.planId === planId) append(message);
    };
    socket.on("new_message", onMessage);
    return () => {
      socket.off("new_message", onMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const count = data?.messages.length ?? 0;
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [count]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (value && !send.isPending) send.mutate(value);
  }

  return (
    <section aria-label="Group chat" className="flex h-[30rem] flex-col overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-slate-200/70">
      <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600"><MessageCircle className="size-4.5" aria-hidden /></span>
        <h2 className="text-lg font-bold">Group chat</h2>
      </header>

      <div ref={listRef} className="scrollbar-thin flex-1 space-y-4 overflow-y-auto bg-slate-50/60 px-5 py-4">
        {isLoading && <p className="py-8 text-center text-sm text-slate-500">Loading messages...</p>}
        {!isLoading && count === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">No messages yet. Say hi and sort out the details.</p>
        )}
        {data?.messages.map((m) => {
          const mine = m.senderId._id === meId;
          return (
            <div key={m._id} className={cn("flex items-end gap-2.5", mine && "flex-row-reverse")}>
              {!mine && <Avatar name={m.senderId.name} src={m.senderId.avatar} size="sm" />}
              <div className={cn("max-w-[78%]", mine && "text-right")}>
                {!mine && <p className="mb-1 ml-1 text-xs font-semibold text-slate-500">{m.senderId.name}</p>}
                <p className={cn("inline-block rounded-2xl px-4 py-2.5 text-left text-[15px] leading-snug break-words", mine ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md bg-white text-ink ring-1 ring-slate-200")}>
                  {m.text}
                </p>
                <p className="mt-1 px-1 text-[11px] text-slate-400">{timeAgo(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-slate-100 p-3">
        <input value={text} maxLength={500} onChange={(e) => setText(e.target.value)} placeholder="Write a message" aria-label="Message" className="h-11 min-w-0 flex-1 rounded-xl bg-slate-100/80 px-4 text-[15px] placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none" />
        <Button type="submit" loading={send.isPending} disabled={!text.trim()} aria-label="Send message" className="size-11 px-0">
          {!send.isPending && <Send className="size-4.5" />}
        </Button>
      </form>
    </section>
  );
}

function RequestsPanel({ planId }: { planId: string }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data = [] } = useQuery({ queryKey: ["requests", planId], queryFn: () => api.plans.requests(planId) });
  const pending = data.filter((r) => r.status === "pending");

  const decide = useMutation({
    mutationFn: ({ joinId, action }: { joinId: string; action: "approve" | "reject" }) => api.plans.decide(planId, joinId, action),
    onSuccess: (_r, v) => {
      toast.success(v.action === "approve" ? "Request approved." : "Request declined.");
    },
    onError: (err) => toast.error(errorMessage(err)),
    onSettled: () => {
      for (const key of ["requests", "plan", "members"]) void queryClient.invalidateQueries({ queryKey: [key, planId] });
      void queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });

  if (pending.length === 0) return null;
  return (
    <section aria-label="Join requests" className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-amber-200">
      <h2 className="text-lg font-bold">Join requests <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-sm text-amber-800">{pending.length}</span></h2>
      <ul className="mt-4 space-y-3">
        {pending.map((r) => (
          <li key={r._id} className="flex items-center gap-3">
            <Avatar name={r.userId.name} src={r.userId.avatar} size="sm" />
            <span className="min-w-0 flex-1 truncate font-semibold">{r.userId.name}</span>
            <button type="button" aria-label={`Approve ${r.userId.name}`} disabled={decide.isPending} onClick={() => decide.mutate({ joinId: r._id, action: "approve" })} className="grid size-9 place-items-center rounded-lg bg-leaf-50 text-leaf-600 hover:bg-leaf-500 hover:text-white disabled:opacity-50"><Check className="size-4.5" /></button>
            <button type="button" aria-label={`Decline ${r.userId.name}`} disabled={decide.isPending} onClick={() => decide.mutate({ joinId: r._id, action: "reject" })} className="grid size-9 place-items-center rounded-lg bg-red-50 text-red-600 hover:bg-red-500 hover:text-white disabled:opacity-50"><X className="size-4.5" /></button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function PlanDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState<"leave" | "delete" | null>(null);
  const pendingIds = usePendingIds(user?._id);

  const { data: plan, isLoading, isError, error, refetch } = useQuery({ queryKey: ["plan", id], queryFn: () => api.plans.get(id) });
  const { data: members = [] } = useQuery({ queryKey: ["members", id], queryFn: () => api.plans.members(id), enabled: Boolean(plan) });

  // Live spot counts for this plan
  useEffect(() => {
    const socket = getSocket();
    const enter = () => socket.emit("join_plan_room", id);
    const onJoined = (p: { planId: string; joinedCount: number; totalSpots: number }) => {
      if (p.planId !== id) return;
      queryClient.setQueryData<PlanDetail>(["plan", id], (old) => (old ? { ...old, joinedCount: p.joinedCount, totalSpots: p.totalSpots } : old));
      void queryClient.invalidateQueries({ queryKey: ["members", id] });
      void queryClient.invalidateQueries({ queryKey: ["plans"] });
    };
    socket.on("connect", enter);
    socket.on("plan_joined", onJoined);
    if (socket.connected) enter();
    return () => {
      socket.off("connect", enter);
      socket.off("plan_joined", onJoined);
      socket.emit("leave_plan_room", id);
    };
  }, [id, queryClient]);

  const meId = user?._id ?? "";
  const hasJoined = plan?.hasJoined ?? false;
  useEffect(() => {
    if (hasJoined && meId) removePending(meId, id);
  }, [hasJoined, meId, id]);

  const refresh = () => {
    for (const key of ["plan", "members", "messages", "requests"]) void queryClient.invalidateQueries({ queryKey: [key, id] });
    void queryClient.invalidateQueries({ queryKey: ["plans"] });
    void queryClient.invalidateQueries({ queryKey: ["me"] });
  };

  const join = useMutation({
    mutationFn: () => api.plans.join(id),
    onSuccess: (record) => {
      if (record.status === "pending") {
        addPending(meId, id);
        toast.success("Request sent. The host will review it.");
      } else {
        removePending(meId, id);
        toast.success("You're in. See you there.");
      }
      refresh();
    },
    onError: (err) => {
      if (err instanceof ApiException && err.status === 409) {
        addPending(meId, id);
        toast.info("You've already requested to join this plan.");
      } else toast.error(errorMessage(err));
    },
  });

  const leave = useMutation({
    mutationFn: () => api.plans.leave(id),
    onSuccess: () => {
      toast.success("You've left the plan.");
      setConfirm(null);
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: () => api.plans.remove(id),
    onSuccess: () => {
      toast.success("Plan deleted.");
      void queryClient.invalidateQueries({ queryKey: ["plans"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.removeQueries({ queryKey: ["plan", id] });
      navigate("/my-plans", { replace: true });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: plan?.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied. Send it to your crew.");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast.error("Couldn't copy the link.");
    }
  }

  if (isLoading) return <FullPageSpinner />;
  if (isError || !plan) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <ErrorState message={error instanceof ApiException && error.status === 404 ? "This plan doesn't exist or was deleted." : errorMessage(error)} onRetry={() => void refetch()} />
      </div>
    );
  }

  const isHost = plan.hostedBy._id === meId;
  const status = planStatus(plan);
  const full = isFull(plan);
  const requested = pendingIds.includes(id) && !hasJoined;
  const when = relativeDay(plan);
  const canChat = isHost || hasJoined;

  let action: React.ReactNode;
  if (isHost) {
    action = (
      <div className="flex gap-3">
        <Link to={`/plans/${id}/edit`} className={buttonStyles({ variant: "secondary", size: "lg", className: "flex-1" })}><Pencil className="size-4.5" aria-hidden /> Edit</Link>
        <Button variant="secondary" size="lg" className="flex-1 text-red-600 hover:text-red-700" icon={<Trash2 className="size-4.5" />} onClick={() => setConfirm("delete")}>Delete</Button>
      </div>
    );
  } else if (hasJoined) {
    action = <Button variant="secondary" size="lg" className="w-full" onClick={() => setConfirm("leave")}>Leave plan</Button>;
  } else if (status === "completed") {
    action = <Button size="lg" className="w-full" disabled>This plan has ended</Button>;
  } else if (requested) {
    action = <Button size="lg" className="w-full" variant="secondary" disabled>Request pending</Button>;
  } else if (full) {
    action = <Button size="lg" className="w-full" disabled>Plan is full</Button>;
  } else {
    action = <Button size="lg" className="w-full" loading={join.isPending} onClick={() => join.mutate()}>{plan.isOpen ? "Join plan" : "Request to join"}</Button>;
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <Link to="/browse" className="inline-flex items-center gap-2 font-semibold text-slate-500 hover:text-ink"><ArrowLeft className="size-4.5" aria-hidden /> All plans</Link>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <article className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-card ring-1 ring-slate-200/70 sm:p-9">
            <span className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-600 via-brand-400 to-leaf-500" aria-hidden />
            <div className="flex flex-wrap items-center gap-2.5">
              <CategoryBadge category={plan.category} />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                {plan.isOpen ? <Globe className="size-3.5" aria-hidden /> : <Lock className="size-3.5" aria-hidden />}
                {plan.isOpen ? "Open to all" : "Host approval"}
              </span>
              {status === "completed" && <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-500">Completed</span>}
              {status === "ongoing" && <span className="rounded-full bg-leaf-50 px-3 py-1 text-sm font-semibold text-leaf-600">Happening now</span>}
              {status === "upcoming" && when && <span className="rounded-full bg-sun-300/40 px-3 py-1 text-sm font-semibold text-amber-800">{when}</span>}
            </div>

            <h1 className="mt-5 text-4xl leading-[1.1] font-bold sm:text-5xl">{plan.title}</h1>

            <div className="mt-6 flex items-center gap-3.5">
              <Avatar name={plan.hostedBy.name} src={plan.hostedBy.avatar} size="md" />
              <div>
                <p className="text-sm text-slate-500">Hosted by</p>
                <p className="font-bold">{plan.hostedBy.name}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 border-t border-slate-100 pt-8 sm:grid-cols-2">
              <Detail icon={Calendar} label="Date">{formatLongDate(plan)}</Detail>
              <Detail icon={Clock} label="Time">{plan.time}</Detail>
              <Detail icon={MapPin} label="Location">
                {plan.location}
                <span className="block text-sm font-normal text-slate-500">{[plan.address, titleCase(plan.city)].filter(Boolean).join(", ")}</span>
              </Detail>
              <Detail icon={Users} label="Group size">{plan.totalSpots} people</Detail>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-8">
              <h2 className="text-xl font-bold">About this plan</h2>
              <p className="mt-3 max-w-2xl leading-relaxed whitespace-pre-line text-slate-600">{plan.description || "The host hasn't added any details yet."}</p>
            </div>
          </article>

          <section aria-label="Who's going" className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-slate-200/70 sm:p-9">
            <h2 className="text-xl font-bold">Who's going <span className="ml-1 text-slate-400">{plan.joinedCount}</span></h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              <li className="flex items-center gap-3">
                <Avatar name={plan.hostedBy.name} src={plan.hostedBy.avatar} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{plan.hostedBy.name}</p>
                  <p className="flex items-center gap-1 text-sm text-amber-600"><Crown className="size-3.5" aria-hidden /> Host</p>
                </div>
              </li>
              {members.map((m) => (
                <li key={m._id} className="flex items-center gap-3">
                  <Avatar name={m.userId.name} src={m.userId.avatar} size="md" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{m.userId.name}{m.userId._id === meId && <span className="ml-1.5 text-sm font-normal text-slate-400">(you)</span>}</p>
                    {m.userId.city && <p className="truncate text-sm text-slate-500">{m.userId.city}</p>}
                  </div>
                </li>
              ))}
            </ul>
            {members.length === 0 && <p className="mt-4 text-slate-500">No one else has joined yet. Be the first.</p>}
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <section className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-slate-200/70">
            <div className="flex items-end justify-between">
              <p className="font-display text-5xl font-bold tabular-nums">{plan.joinedCount}<span className="text-2xl text-slate-400">/{plan.totalSpots}</span></p>
              <p className={cn("pb-1.5 text-sm font-semibold", full ? "text-red-600" : "text-leaf-600")}>{full ? "Full" : `${plan.totalSpots - plan.joinedCount} left`}</p>
            </div>
            <ProgressBar className="mt-4" filled={plan.joinedCount} total={plan.totalSpots} />
            <p className="mt-3 text-sm text-slate-500">
              {isHost ? "You're hosting this plan." : hasJoined ? "You're in. Use the chat to coordinate." : requested ? "The host will approve or decline your request." : plan.isOpen ? "Spots are confirmed instantly." : "The host approves each request."}
            </p>
            <div className="mt-5">{action}</div>
            <button type="button" onClick={() => void share()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 font-semibold text-brand-600 hover:bg-brand-50">
              <Share2 className="size-4.5" aria-hidden /> Share this plan
            </button>
          </section>

          {isHost && !plan.isOpen && <RequestsPanel planId={id} />}

          {canChat ? (
            <ChatPanel planId={id} meId={meId} />
          ) : (
            <section className="rounded-3xl bg-white p-6 text-center shadow-card ring-1 ring-slate-200/70">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500"><Lock className="size-5" aria-hidden /></span>
              <h2 className="mt-3 text-lg font-bold">Group chat is for members</h2>
              <p className="mt-1 text-sm text-slate-500">Join this plan to chat with everyone who's going.</p>
            </section>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirm === "leave"}
        title="Leave this plan?"
        message="Your spot will open up for someone else. You can rejoin later if there's room."
        confirmLabel="Leave plan"
        loading={leave.isPending}
        onConfirm={() => leave.mutate()}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        title="Delete this plan?"
        message="This removes the plan and all join records for everyone. It can't be undone."
        confirmLabel="Delete plan"
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
