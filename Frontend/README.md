# Chal Frontend

React 18, TypeScript, Tailwind CSS v4 and Vite. Built for the `chal-backend-typescript` API.

## Run it

```bash
npm install
cp .env.example .env        # set VITE_API_URL to your API (default http://localhost:8000)
npm run dev                 # http://localhost:1234
```

Port 1234 matches the backend's default `CORS_ORIGIN`, so the two work together without extra config.
Run the backend in another terminal (`npm run dev` inside `chal-backend-typescript`).

```bash
npm run build               # typecheck + production build in dist/
npm run preview
```

## Stack

| Concern | Choice |
| --- | --- |
| UI | React 18, Tailwind CSS v4, lucide-react icons |
| Routing | React Router 6 with auth guards |
| Server state | TanStack Query (caching, mutations, invalidation) |
| Real-time | socket.io-client: live spot counts, group chat, new-plan alerts |
| Auth | Bearer access token + automatic refresh-token retry on 401 |

## Structure

```
src/
  components/   Button, Field, PlanCard, Layout, route guards, shared UI
  context/      AuthContext, ToastContext
  hooks/        usePending (locally tracked join requests)
  lib/          api client, socket, categories, utils
  pages/        Landing, Browse, PlanDetail, PlanFormPages, MyPlans, Profile, Auth
  types.ts      Types mirroring the API models
```

## How it maps to the API

- `GET /plans` powers Landing and Browse. Category and city are filtered by the API; search and "open only" run in the browser.
- `GET /plans/:id` is behind `verifyJWT`, so plan pages ask guests to sign in first.
- Closed (approval) plans return a `pending` join. The API has no "my pending requests" endpoint, so the app remembers those per user in `localStorage` and shows them in the Pending tab.
- Host approval UI calls `GET /plans/:id/requests`. Add that endpoint using `docs/BACKEND_ADDITIONS.md`; until then the panel stays hidden.

See `docs/BACKEND_ADDITIONS.md` for the three small backend changes that make deployment and approvals work smoothly.

## Deploying

Build with `npm run build` and host `dist/` on Vercel, Netlify or Render Static. Set `VITE_API_URL` to your deployed API and set the API's `CORS_ORIGIN` to the frontend URL. Add a rewrite of all paths to `/index.html` so deep links like `/plans/123` work.
