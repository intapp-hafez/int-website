# Security Hardening Steps & Implementation Blueprint

This document details all security hardening steps designed and executed across the INT website application.

---

## Table of Contents
1. [XSS (Cross-Site Scripting) Defense with DOMPurify](#1-xss-cross-site-scripting-defense-with-dompurify)
2. [PostgREST / SQL Filter Injection Protection](#2-postgrest--sql-filter-injection-protection)
3. [HTTP Security Headers Hardening](#3-http-security-headers-hardening)
4. [Session & Authentication Lifecycle Hardening](#4-session--authentication-lifecycle-hardening)
5. [Route Protection & Authorization Architecture](#5-route-protection--authorization-architecture)
6. [Verification & Testing Steps](#6-verification--testing-steps)

---

## 1. XSS (Cross-Site Scripting) Defense with DOMPurify
Every component that renders HTML content dynamically using `dangerouslySetInnerHTML` is sanitized with `DOMPurify.sanitize()` before being placed in the DOM. This protects against Stored XSS from database content:

- `src/routes/solutions.$slug.tsx`: Wrap `bio` and related solution content with `DOMPurify.sanitize()`.
- `src/routes/services.$slug.tsx`: Wrap `desc` with `DOMPurify.sanitize()`.
- `src/routes/products.$slug.tsx`: Wrap product `desc` with `DOMPurify.sanitize()`.
- `src/routes/terms.tsx`: Wrap terms & conditions HTML with `DOMPurify.sanitize()`.
- `src/routes/policies.tsx`: Wrap privacy policy HTML with `DOMPurify.sanitize()`.
- `src/routes/news.$slug.tsx`: Wrap news article body with `DOMPurify.sanitize()`.
- `src/routes/partners_.$id.tsx`: Wrap partner overview with `DOMPurify.sanitize()`.
- `src/components/site/EventsList.tsx`: Wrap event summary with `DOMPurify.sanitize()`.
- `src/components/site/ProjectDetailDialog.tsx`: Wrap project description with `DOMPurify.sanitize()`.
- `src/routes/dashboard.admin.projects.$id.index.tsx`: Wrap admin project description preview with `DOMPurify.sanitize()`.

---

## 2. PostgREST / SQL Filter Injection Protection
In `src/routes/dashboard.workspace.track.tsx`, user inputs passed into Supabase `.or(...)` filter clauses are sanitized:
- Determine if the input matches a valid UUID pattern (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`).
- If it is a valid UUID, include `id.eq.${uuid}`.
- If not a UUID, query only the text column `ticket_no.ilike.%${clean}%` to avoid PostgREST 400 Bad Request errors on UUID columns.
- Strip control characters (`,`, `.eq.`, `()`) from the query string.

---

## 3. HTTP Security Headers Hardening
Update `public/_headers` and `public/.htaccess` with consistent and optimal security headers:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`
- `Content-Security-Policy`:
  - `default-src 'self'`
  - `script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://challenges.cloudflare.com`
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
  - `font-src 'self' data: https://fonts.gstatic.com`
  - `img-src 'self' data: blob: https:`
  - `connect-src 'self' https: wss:`
  - `frame-src 'self' https://www.google.com https://maps.google.com https://challenges.cloudflare.com`
  - `frame-ancestors 'self'`
  - `object-src 'none'`
  - `base-uri 'self'`

---

## 4. Session & Authentication Lifecycle Hardening
- Strengthen `signOut` in `src/lib/auth.tsx` to clear any stale local storage keys (such as active chat tokens, permission caches).
- Ensure role checks always fall back to least-privilege (`client`) in case of any database lookup anomalies.

---

## 5. Route Protection & Authorization Architecture
- Gated layouts (`src/routes/dashboard.tsx`) enforce authentication before rendering dashboard contents.
- Strict role isolation prevents clients from accessing `/dashboard/admin/*` and non-clients from accessing `/dashboard/workspace/*`.
- Permission verification (`useCanAccess`) checks capabilities on each admin module (`view`, `add`, `edit`, `delete`).
- Database Row-Level Security (RLS) policies enforce zero-trust access at the PostgreSQL data layer.

---

## 6. Verification & Testing Steps
1. Run `npm run build` to confirm clean compilation across all routes.
2. Verify all modified pages render sanitized rich text without issues.
3. Commit and push all security hardening updates to GitHub.
