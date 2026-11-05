import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { titleCase } from "@/lib/utils";
import type { Category } from "@/types";

export function FullPageSpinner() {
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="Loading">
      <LoaderCircle className="size-8 animate-spin text-brand-600" />
    </div>
  );
}

export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

export function GuestOnly() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? "/browse"} replace />;
  }
  return <Outlet />;
}

/** Keeps the socket connected while signed in and surfaces `new_plan` notifications. */
export function RealtimeBridge() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const userId = user?._id;

  useEffect(() => {
    if (!userId) return;
    const socket = connectSocket();
    const joinRoom = () => socket.emit("join_user_room", userId);
    const onNewPlan = (p: { planId: string; title: string; city: string; category: Category }) => {
      toast.info(`New ${p.category} plan in ${titleCase(p.city)}: ${p.title}`, { href: `/plans/${p.planId}` });
      void queryClient.invalidateQueries({ queryKey: ["plans"] });
    };
    socket.on("connect", joinRoom);
    socket.on("new_plan", onNewPlan);
    if (socket.connected) joinRoom();
    return () => {
      socket.off("connect", joinRoom);
      socket.off("new_plan", onNewPlan);
    };
  }, [userId, toast, queryClient]);

  useEffect(() => {
    if (!userId) disconnectSocket();
  }, [userId]);

  return null;
}
