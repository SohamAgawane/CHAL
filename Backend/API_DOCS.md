# Chal Backend — API Documentation

Base URL: `http://localhost:8000/api`

---

## Auth

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/users/register` | ❌ | Register with name, email, password, city, avatar |
| POST | `/users/login` | ❌ | Login — sets httpOnly cookies |
| POST | `/users/logout` | ✅ | Clears cookies |
| POST | `/users/refresh-token` | ❌ | Issue new access token using refresh token |

## User Profile

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/users/me` | ✅ | Get current user profile |
| PATCH | `/users/me` | ✅ | Update name, city |
| PATCH | `/users/me/avatar` | ✅ | Upload new avatar (multipart) |
| PATCH | `/users/me/password` | ✅ | Change password |
| GET | `/users/me/activity` | ✅ | All hosted + joined plans with planStatus |
| GET | `/users/me/hosted` | ✅ | Plans hosted by current user |
| GET | `/users/me/joined` | ✅ | Plans current user has joined |

## Plans

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/plans` | ❌ | List plans — ?city=nashik&category=sport&status=upcoming&page=1&limit=10 |
| GET | `/plans/trending` | ❌ | Plans with most joins this week |
| GET | `/plans/:id` | ✅ | Plan detail with hostedBy, memberCount, hasJoined |
| POST | `/plans` | ✅ | Create plan |
| PATCH | `/plans/:id` | ✅ | Update plan (host only) |
| DELETE | `/plans/:id` | ✅ | Delete plan (host or admin) |

## Join Flow

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/plans/:id/join` | ✅ | Join plan (auto-approved if isOpen, else pending) |
| PATCH | `/plans/:id/join/:joinId` | ✅ | Approve or reject — body: { action: "approve" \| "reject" } |
| DELETE | `/plans/:id/leave` | ✅ | Leave a plan |
| GET | `/plans/:id/members` | ✅ | List approved members |

## Group Chat

| Method | Route | Auth | Member Only |
|--------|-------|------|-------------|
| POST | `/plans/:id/messages` | ✅ | ✅ | Send message |
| GET | `/plans/:id/messages` | ✅ | ✅ | Get messages — ?page=1&limit=30 |

## Subscriptions

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/subscribe` | ✅ | Subscribe to city + category |
| GET | `/subscribe/me` | ✅ | My subscriptions |
| DELETE | `/subscribe/:id` | ✅ | Unsubscribe |

## Stats & Health

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/stats` | ✅ | totalPlansToday, joinsToday, avgJoinsPerPlan |
| GET | `/health` | ❌ | API health check |

---

## Response Format

```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Success",
  "success": true
}
```

## Error Format

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Description of what went wrong",
  "errors": []
}
```

---

## Socket Events

Connect to the same server URL with socket.io-client.

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join_plan_room` | `planId` | Join real-time room for a plan |
| `leave_plan_room` | `planId` | Leave plan room |
| `join_user_room` | `userId` | Join personal notification room |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `plan_joined` | `{ planId, joinedCount, totalSpots }` | Spot count updated |
| `new_message` | Message object with sender | New chat message |
| `new_plan` | `{ planId, title, city, category }` | New plan in subscribed city+category |
