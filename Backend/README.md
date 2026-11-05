# Chal Backend (TypeScript)

Backend API for **Chal** — a city-based plan/meetup discovery app. Express + MongoDB (Mongoose) + Socket.io, written in TypeScript with ESM modules.

> Converted from JavaScript to TypeScript. See `DEPLOYMENT_GUIDE.md` for full setup, environment variable reference, MongoDB Atlas connection steps, and Render deployment instructions.

## Quick start

```bash
npm install
cp .env.example .env   # fill in real values, see DEPLOYMENT_GUIDE.md
npm run dev             # starts on http://localhost:8000 with hot reload
```

## Scripts

| Command           | What it does                                              |
|--------------------|------------------------------------------------------------|
| `npm run dev`       | Runs `src/index.ts` directly via `tsx`, with file-watch reload |
| `npm run build`     | Type-checks and compiles `src/**/*.ts` → `dist/**/*.js`    |
| `npm run start`     | Runs the compiled app from `dist/index.js` (production)    |
| `npm run typecheck` | Type-checks only, no output — good for CI                  |

## Project structure

```
src/
├── controllers/   # route handlers (business logic)
├── middlewares/    # auth, member-guard, multer upload
├── models/         # Mongoose schemas + TS interfaces (IUser, IPlan, ...)
├── routes/         # Express routers
├── types/          # global type augmentations (req.user)
├── utils/          # ApiError, ApiResponse, asyncHandler, cloudinary
├── db/index.ts      # Mongo connection
├── app.ts           # Express app, middleware stack, error handler
└── index.ts          # entrypoint: dotenv, HTTP server, Socket.io, listen
```

Full API route reference is in `API_DOCS.md`.
