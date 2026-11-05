import { io, type Socket } from "socket.io-client";
import { API_ORIGIN } from "@/lib/api";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) socket = io(API_ORIGIN, { autoConnect: false, withCredentials: true });
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  socket?.disconnect();
}
