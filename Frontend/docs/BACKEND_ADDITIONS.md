# Optional backend changes

The frontend works against the API as shipped. These three changes remove the rough edges.

## 1. Cross-site cookies when deployed (needed on Render + Vercel)

`user.controller.ts` sets cookies with `sameSite: "strict"`. A frontend on another domain never sends them, so token refresh fails and users are signed out after 15 minutes. Change the options:

```ts
const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};
```

Also add `app.set("trust proxy", 1);` in `app.ts` when running behind Render's proxy.

## 2. Let guests view a plan

`GET /plans/:id` reads `req.user?._id`, so it was designed for optional auth, but the route uses `verifyJWT`, which rejects guests. Add this middleware and use it on that one route, then remove `RequireAuth` from `plans/:id` in `src/App.tsx`:

```ts
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { _id: string };
      req.user = (await User.findById(decoded._id).select("-password -refreshToken")) ?? undefined;
    } catch { /* treat as guest */ }
  }
  next();
});
```

## 3. List pending join requests for hosts

Hosts can approve or reject, but nothing returns the pending requests. Add to `join.controller.ts`:

```ts
const getJoinRequests = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);
  if (!plan) throw new ApiError(404, "Plan not found");
  if (plan.hostedBy.toString() !== req.user!._id.toString()) throw new ApiError(403, "Only the host can view requests");

  const requests = await Join.find({ planId: plan._id, status: JOIN_STATUS.PENDING })
    .populate("userId", "name avatar city")
    .sort({ createdAt: 1 });
  return res.status(200).json(new ApiResponse(200, requests, "Join requests fetched"));
});
```

And in `plan.routes.ts`:

```ts
router.get("/:id/requests", verifyJWT, getJoinRequests);
```
