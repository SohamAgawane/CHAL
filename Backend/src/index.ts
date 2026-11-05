import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./db/index.js";
import { app } from "./app.js";

const PORT = process.env.PORT || 8000;

//  HTTP server ─
const httpServer = createServer(app);

//  Socket.io 
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:1234",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io accessible in controllers via req.app.get("io")
app.set("io", io);

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Client calls this when viewing a plan detail page
  socket.on("join_plan_room", (planId: string) => {
    socket.join(`plan_${planId}`);
    console.log(`Socket ${socket.id} joined room: plan_${planId}`);
  });

  // Client calls this to receive personal notifications
  socket.on("join_user_room", (userId: string) => {
    socket.join(`user_${userId}`);
    console.log(`Socket ${socket.id} joined room: user_${userId}`);
  });

  socket.on("leave_plan_room", (planId: string) => {
    socket.leave(`plan_${planId}`);
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

//  Start ─
connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`⚡ Chal API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
