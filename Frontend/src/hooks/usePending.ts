import { useCallback, useEffect, useState } from "react";

/**
 * The API has no "my pending requests" endpoint, so join requests that came back
 * as `pending` are remembered per user in localStorage and re-checked on load.
 */
const key = (userId: string) => `chal.pending.${userId}`;
const EVENT = "chal:pending";

function read(userId: string): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key(userId)) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function write(userId: string, ids: string[]) {
  try {
    localStorage.setItem(key(userId), JSON.stringify(ids));
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(EVENT));
}

export const addPending = (userId: string, planId: string) => {
  const ids = read(userId);
  if (!ids.includes(planId)) write(userId, [...ids, planId]);
};

export const removePending = (userId: string, planId: string) => {
  const ids = read(userId);
  if (ids.includes(planId)) write(userId, ids.filter((id) => id !== planId));
};

export const isPending = (userId: string, planId: string) => read(userId).includes(planId);

export function usePendingIds(userId: string | undefined) {
  const [ids, setIds] = useState<string[]>(() => (userId ? read(userId) : []));
  const sync = useCallback(() => setIds(userId ? read(userId) : []), [userId]);

  useEffect(() => {
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  return ids;
}
