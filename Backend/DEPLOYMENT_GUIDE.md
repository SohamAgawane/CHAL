# Chal Backend — Setup, .env & Render Deployment Guide

This covers everything after the TypeScript conversion: running it locally, connecting MongoDB, and deploying to Render.

---

## 1. What changed in the TS conversion

- Every `.js` file → `.ts` with real types (Mongoose documents like `IUser`, `IPlan`, etc., typed controllers, typed middlewares).
- `req.user` is now type-safe everywhere via `src/types/express.d.ts` (a global Express `Request` augmentation).
- Build pipeline added: `tsc` compiles `src/` → `dist/`, matching the `"type": "module"` (ESM) style the project already used — so relative imports in `.ts` files still end in `.js` (e.g. `import { app } from "./app.js"`). This looks odd at first but is required for Node ESM + TypeScript; **don't remove the `.js` extensions**, they refer to the compiled output, not the source file.
- Dev workflow now uses `tsx` (instead of `nodemon`) — it runs TypeScript directly with fast hot-reload, no separate compile step needed during development.
- No behavior changes — same routes, same response shapes, same Socket.io events. I only fixed one bit of dead code in `getPlanById` (an aggregation field that was computed but immediately overwritten — harmless either way, just removed the redundant computation).
- `multer@1.x` is in the original `package.json` — it works fine, but npm will warn it's deprecated in favor of `multer@2.x`. Not changed since upgrading is a breaking-change decision, not a TS-conversion one — happy to do that separately if you want.

## 2. Local setup

```bash
npm install
cp .env.example .env      # then fill in real values (section 3 below)
npm run dev                # http://localhost:8000, hot-reloads on save
```

Before deploying, always sanity check the production build locally:

```bash
npm run build     # compiles to dist/, also catches type errors
npm run start      # runs the compiled JS, exactly like Render will
```

## 3. `.env` variable guide

| Variable | Required | What it is | Where to get it |
|---|---|---|---|
| `PORT` | No | Port the server listens on locally | Leave as `8000`. Render sets its own automatically in production — your code already handles this (`process.env.PORT \|\| 8000`). |
| `NODE_ENV` | Yes | `development` locally, `production` on Render | Set manually |
| `MONGODB_URI` | Yes | MongoDB connection string, **without** a database name at the end | MongoDB Atlas (section 4) |
| `JWT_SECRET` | Yes | Signs access & refresh tokens | Generate with `openssl rand -hex 32` (or `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` on Windows) |
| `JWT_ACCESS_EXPIRY` | No | Access token lifetime | Default `15m` is fine |
| `JWT_REFRESH_EXPIRY` | No | Refresh token lifetime | Default `7d` is fine |
| `CORS_ORIGIN` | Yes | The exact URL of your frontend (no trailing slash) | e.g. `https://chal-app.vercel.app` |
| `CLOUDINARY_CLOUD_NAME` | Yes (for avatars) | Cloudinary account name | Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key | Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret | Cloudinary dashboard → keep secret, never commit it |

**Never commit `.env`** — it's already in `.gitignore`. Only `.env.example` (with placeholders) goes to GitHub.

## 4. Connect MongoDB (Atlas — free tier)

1. Go to mongodb.com/cloud/atlas → sign up / log in.
2. **Create a cluster** → choose the free **M0** tier → pick a region close to your users (e.g. Mumbai if most users are in India).
3. **Database Access** (left sidebar) → **Add New Database User** → username/password auth → give it "Read and write to any database" → save the password somewhere safe.
4. **Network Access** (left sidebar) → **Add IP Address** → for Render deployments, add `0.0.0.0/0` (allow from anywhere). Render's outbound IPs aren't static on the free plan, so this is the practical option — Atlas auth (username/password) is still required to actually connect, so this is standard practice, not a security hole by itself.
5. **Connect** button on your cluster → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://chal_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Strip the query string and trailing slash** before pasting into `.env` — your code appends the database name itself (`DB_NAME = "chal-db"` in `src/constants.ts`):
   ```
   MONGODB_URI=mongodb+srv://chal_user:yourpassword@cluster0.xxxxx.mongodb.net
   ```
   (The app does `mongoose.connect(`${MONGODB_URI}/${DB_NAME}`)` — if you leave the `/?retryWrites=...` part in, the DB name gets appended in the wrong place and the connection breaks.)
7. Test locally: `npm run dev` → you should see `MongoDB connected ✅ Host: ...` in the terminal.

## 5. Deploy to Render

### Option A — Blueprint (`render.yaml`), fastest

A `render.yaml` is already included in the project root. 

1. Push the project to a GitHub repo.
2. On Render → **New** → **Blueprint** → connect the repo → Render reads `render.yaml` and proposes the service.
3. It'll prompt you for the values marked `sync: false` (these are the secrets — `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`, Cloudinary keys). Fill them in.
4. Click **Apply** → Render builds and deploys.

### Option B — Manual dashboard setup

1. Push to GitHub.
2. Render → **New** → **Web Service** → connect the repo.
3. Settings:
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Region**: Singapore (closest to India) or whichever is nearest your users
   - **Instance Type**: Free (fine for testing; cold-starts after 15 min idle — see section 7)
   - **Health Check Path**: `/api/health` (already exists in `app.ts`)
4. **Environment** tab → add every variable from section 3 except `PORT` (Render injects its own automatically and your code already respects `process.env.PORT`).
5. **Create Web Service** → watch the build logs.

Either way, once deployed you'll get a URL like `https://chal-backend.onrender.com`.

## 6. Verify it's live

```bash
curl https://chal-backend.onrender.com/api/health
# { "status": "ok", "uptime": ..., "env": "production" }
```

If that works, the server, env vars, and process are fine. Then test a real DB-touching route, e.g. `POST /api/users/register`, to confirm the Mongo connection works in production too.

## 7. Connecting your frontend — the gotchas

- **`CORS_ORIGIN`** must exactly match your deployed frontend's URL (protocol + domain, no trailing slash), since `cors()` is configured with `credentials: true` and an explicit origin — wildcards won't work with cookies.
- **Cookies across different domains**: `cookieOptions` in `user.controller.ts` currently uses `sameSite: "strict"`. That's the safest setting, but it means the `accessToken`/`refreshToken` cookies **will not be sent** if your frontend lives on a different domain than the backend (e.g. frontend on Vercel, backend on Render — that's two different domains, even though both are "production"). If you hit a situation where login works (200 OK) but every subsequent request looks unauthenticated, this is almost always why. Fix: change `sameSite` to `"none"` when `NODE_ENV === "production"` and keep `secure: true` (already conditional on production) — `sameSite: "none"` requires `secure: true`, which you already have. Happy to make this env-aware change for you if you confirm your frontend will be on a different domain.
- **Socket.io from the frontend**: connect with `io("https://chal-backend.onrender.com", { withCredentials: true })` and make sure that URL is also covered by `CORS_ORIGIN` server-side — Render web services support WebSockets natively, no extra config needed.

## 8. Common errors

| Symptom | Likely cause |
|---|---|
| `MongoServerSelectionError` / timeout on Render | Atlas Network Access doesn't allow Render's IP — add `0.0.0.0/0` (section 4, step 4) |
| App crashes immediately on Render with no useful log | Missing required env var (`JWT_SECRET` or `MONGODB_URI` not set) — check the Environment tab |
| Login works but `/me` returns 401 | `sameSite: "strict"` cookie issue, cross-domain frontend (section 7) |
| Avatar upload fails | Cloudinary env vars wrong, or `public/temp` not writable — Render's filesystem is ephemeral but writable at runtime, so this should work as-is since files are deleted right after upload |
| Render service "sleeps" / first request is very slow | Expected on the **Free** plan — it spins down after 15 minutes of no traffic and takes ~30-50s to wake on the next request. Upgrade to a paid instance to avoid this for a real launch. |

---

That's the full loop: TS build → MongoDB Atlas → Render → frontend. Ping me if you hit a specific error message and I'll help debug it directly.
