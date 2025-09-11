# **Auth Integration Plan (Better Auth)**

## **Overview**
This guide documents how to integrate authentication using Better Auth while keeping the Neon + Vercel Blob storage plan decoupled. It focuses on obtaining a stable `userId` on the server, protecting routes, and enforcing per-user data isolation.

See cross-references in `docs/NEON_VERCEL_BLOB_IMPLEMENTATION_PLAN.md` under “Auth Integration Touchpoints”.

## **Goals**
- Provide a reliable server-side `userId` for database and blob operations
- Protect `/api/history/*` and `/api/upload` routes
- Scope all queries/mutations by `userId`
- Keep Edge compatibility considerations explicit

## **Environment Variables**
Add the auth-related secrets to `.env.local`:

```env
# Better Auth (example – adjust to your provider setup)
AUTH_SECRET=change_me
AUTH_URL=http://localhost:3000
```

## **Server Session Access**
Expose a minimal server helper that returns the authenticated user (or null) and the `userId`. Ensure this runs server-side only.

```ts
// src/lib/auth/server.ts
export async function getServerUser() {
  // Implement using Better Auth server APIs
  // Return a minimal object: { id: string, email?: string, roles?: string[] } | null
  return null; // placeholder
}

export async function requireUser() {
  const user = await getServerUser();
  if (!user) throw new Response('Unauthorized', { status: 401 });
  return user;
}
```

## **Middleware (Optional Route Protection)**
Use middleware to protect groups of routes or pages. If your auth library doesn’t support Edge runtime, protect in handlers instead and/or set `export const runtime = 'nodejs'` on affected routes.

```ts
// src/middleware.ts (optional)
export { };
```

## **API Route Integration**
Derive `userId` on the server within handlers. Do not accept `userId` in request bodies.

```ts
// Example integration note (pseudo):
// const user = await requireUser();
// const userId = user.id;
// Use userId to scope DB queries and blob paths
```

### History Routes
- GET list: return only items where `history_items.user_id = userId`
- POST create: set `user_id = userId`
- GET/PUT/DELETE by id: ensure the item belongs to `userId`

### Upload Route
- Generate direct-upload URLs with prefix `users/{userId}/...`
- On completion callback, create DB rows with `user_id = userId`
- When deleting/listing, validate ownership via DB

## **Authorization Rules**
- Enforce per-user isolation; no cross-tenant access
- Add role checks if needed (e.g., admin tools) entirely server-side

## **Edge Runtime Considerations**
- If Better Auth supports Edge, set `export const runtime = 'edge'` for DB-backed routes
- If not, use Node runtime on specific routes, or perform auth in Node-compatible utilities

## **Rate Limiting**
- Apply per-user limits to mutation/upload routes; fall back to IP for anonymous flows

## **Migration Strategy for Existing Data**
1. Introduce nullable `userId` columns (already in schema)
2. Backfill `userId`:
   - If anonymous data exists, decide on: attach to a pseudo user, or block access until claimed post sign-in
3. After backfill, migrate to non-nullable `userId` when safe

## **Testing Checklist**
- Sign in, hit `/api/history` and verify only own items are returned
- Upload a file and confirm blob path includes `users/{userId}/...`
- Attempt cross-user access and ensure 403/404
- Verify behavior on Edge vs Node where applicable

## **Future Enhancements**
- Session caching to reduce auth lookups on hot paths
- Role-based access control for admin/teams
- Organization/Workspace scoping beyond single-user `userId`

---

This document keeps auth integration cohesive and separate. For storage specifics and end-to-end flow, see `docs/NEON_VERCEL_BLOB_IMPLEMENTATION_PLAN.md`.


