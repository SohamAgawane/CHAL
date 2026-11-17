import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "../node_modules/helmet/index.cjs";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "../node_modules/express-rate-limit/dist/index.cjs";
import { ApiError } from "./utils/ApiError.js";

const app = express();

//  Security middleware 
app.use(helmet());

//  CORS -
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:1234",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  })
);

//  Body parsing 
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static("public"));

//  Compression + Logging 
app.use(compression());
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

//  Rate limiting (auth routes only) ─
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: "Too many requests — try again in 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

//  Health check 
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), env: process.env.NODE_ENV });
});

//  Routes 
import userRouter from "./routes/user.routes.js";
import planRouter from "./routes/plan.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import { getStats } from "./controllers/stats.controller.js";
import { verifyJWT } from "./middlewares/auth.middleware.js";

app.use("/api/users", authLimiter, userRouter);
app.use("/api/plans", planRouter);
app.use("/api/subscribe", subscriptionRouter);
app.get("/api/stats", verifyJWT, getStats);

//  Global error handler ─
app.use((err: ApiError | Error, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = (err as ApiError).statusCode || 500;
  const message = err.message || "Internal Server Error";

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: (err as ApiError).errors || [],
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

export { app };
