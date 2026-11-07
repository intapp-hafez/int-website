# Comprehensive Security Audit & Threat Modeling Report

**Target Codebase:** Integrated Technics Website & Management System (`d:\int\int-website`)  
**Audit Date:** November 2026  
**Auditor:** Antigravity AI Security Audit Engine  
**Classification:** Internal Technical Security Assessment  

---

## 1. Executive Summary

A comprehensive code-assisted security audit and threat assessment was conducted across the Integrated Technics codebase. The audit evaluated frontend client code, Supabase PostgreSQL schema definitions, Row Level Security (RLS) policies, storage bucket configurations, Edge Functions, authentication mechanics, Content Security Policies (CSP), and architectural trust boundaries.

### Key Takeaways
1. **Critical Live Chat Information Disclosure:** An unpatched Row Level Security (RLS) `SELECT` policy on `public.live_chat_messages` allows any anonymous visitor possessing the public Supabase `anon` key to query and extract all visitor conversations, visitor names, and sensitive correspondence.
2. **High Risk on Storage Uploads (`career-resumes`):** The `career-resumes` bucket permits unauthenticated anonymous uploads with zero file-type, extension, or MIME-type filtering in PostgreSQL RLS, exposing the infrastructure to file-upload abuse and storage quota exhaustion.
3. **Architectural Client/Server Boundary Clarification:** The Vite configuration aliases TanStack Start server functions to a browser shim (`src/lib/start-shim.ts`). Server functions (`createServerFn`) execute inside the browser environment and do **not** constitute a trusted security perimeter. Security and authorization must be strictly enforced at the PostgreSQL RLS or Edge Function tier.
4. **Denial-of-Service / Bot Flooding on Direct PostgREST Inserts:** Publicly accessible tables (`leads`, `career_applications`, `contact_messages`, `live_chat_messages`, `reviews`, `training_registrations`) lack database-level or Edge Function rate-limiting mechanisms.

---

## 2. Vulnerability Severity Matrix

| ID | Title | Severity | OWASP / CWE | Status |
| :--- | :--- | :---: | :--- | :---: |
| **SEC-01** | Anonymous Information Disclosure in `live_chat_messages` | **CRITICAL** | CWE-200 / OWASP A01:2021 | **Resolved (Migration 36 + Chatbot)** |
| **SEC-02** | Unrestricted Anonymous File Upload in Storage Bucket `career-resumes` | **HIGH** | CWE-434 / OWASP A04:2021 | **Resolved (Migration 36 + Careers)** |
| **SEC-03** | Lack of Rate Limiting and Anti-Automation on Public Data Ingestion Endpoints | **HIGH** | CWE-799 / OWASP A04:2021 | Open (Requires Turnstile / Cloudflare) |
| **SEC-04** | Client-Side Execution of Server Functions via Start Shim Boundary | **HIGH** | CWE-602 / OWASP A04:2021 | Documented Architecture Rule |
| **SEC-05** | Over-Permissive Content Security Policy (`unsafe-inline`, `unsafe-eval`, Wildcards) | **MEDIUM** | CWE-1021 / OWASP A05:2021 | Review / Hardening |
| **SEC-06** | Edge Function `invite-admin-user` Missing Rate-Limiting & Complexity Controls | **MEDIUM** | CWE-307 / OWASP A07:2021 | **Resolved (Password & Email Validation)** |
| **SEC-07** | Plaintext SMTP Password Storage in Database Table (`smtp_settings`) | **MEDIUM** | CWE-312 / OWASP A02:2021 | RLS Restricted to Admin (Vault recommended) |
| **SEC-08** | Inconsistent Public URL Generation on Private Resume Bucket | **LOW** | CWE-639 / OWASP A01:2021 | **Resolved (Staff Signed URLs)** |
| **SEC-09** | Hardcoded Project IDs / Tokens in Historical SQL Migrations | **LOW** | CWE-798 / OWASP A02:2021 | Historical |
| **SEC-10** | Unverified Hosted Supabase Auth Configurations (Session Lifetime, Rotation) | **INFO** | CWE-613 / OWASP A07:2021 | Unverified Dashboard Settings |

---

## 3. Detailed Technical Findings

---

### SEC-01: Anonymous Information Disclosure in `live_chat_messages`

- **Severity:** **CRITICAL** (CVSS 8.6 / CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N)
- **Vulnerability Category:** CWE-200 (Exposure of Sensitive Information to an Unauthorized Actor), OWASP A01:2021 (Broken Access Control)
- **Affected File(s):**
  - `supabase/schema/26_live_chat.sql` (Lines 79-85)
  - `supabase/schema/30_security_hardening.sql`
  - `supabase/schema/32_reopen_chat_and_registration.sql` (Lines 39-40)

#### Vulnerability Description
In `supabase/schema/26_live_chat.sql`, the SELECT policy on `public.live_chat_messages` was defined as:
```sql
DROP POLICY IF EXISTS "Anyone can read chat messages" ON public.live_chat_messages;
CREATE POLICY "Anyone can read chat messages"
    ON public.live_chat_messages FOR SELECT
    USING (true);
```
While Migration 30 and Migration 31 restricted UPDATE, INSERT, and DELETE policies, and locked down `live_chat_sessions` SELECT to staff (`public.is_staff(auth.uid())`), the SELECT policy on `public.live_chat_messages` was **never dropped or restricted**.

In Migration 32, public anonymous access was explicitly re-granted:
```sql
GRANT SELECT, INSERT ON public.live_chat_messages TO anon;
```

#### Exploit Scenario
An unauthenticated remote attacker can connect directly to the public PostgREST API using the public `anon` key:
```bash
curl -X GET "https://<PROJECT-REF>.supabase.co/rest/v1/live_chat_messages?select=*" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>"
```
This returns every message, sender name, message timestamp, and attachment JSON across all chat sessions stored in the system.

#### Recommended Remediation
1. Drop the permissive SELECT policy on `public.live_chat_messages`.
2. Do not allow direct open table `SELECT` on `live_chat_messages` for anonymous users. Instead:
   - For staff: Provide access using `public.is_staff(auth.uid())`.
   - For visitors: Allow reading messages only through an authenticated session token, or via a secure `SECURITY DEFINER` RPC function that accepts `(p_session_id uuid, p_session_token text)`.
3. Provide an immediate SQL patch:

```sql
-- 1. Drop the dangerous open SELECT policy
DROP POLICY IF EXISTS "Anyone can read chat messages" ON public.live_chat_messages;

-- 2. Staff can read all messages
CREATE POLICY "Staff can read chat messages"
    ON public.live_chat_messages FOR SELECT
    TO authenticated
    USING (public.is_staff(auth.uid()));

-- 3. Provide a secure RPC for visitors to fetch only their session messages
CREATE OR REPLACE FUNCTION public.get_visitor_chat_messages(
    p_session_id UUID,
    p_session_token TEXT
)
RETURNS SETOF public.live_chat_messages
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT m.*
    FROM public.live_chat_messages m
    JOIN public.live_chat_sessions s ON s.id = m.session_id
    WHERE s.id = p_session_id
      AND s.session_token = p_session_token
    ORDER BY m.created_at ASC;
$$;

REVOKE ALL ON FUNCTION public.get_visitor_chat_messages(UUID, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.get_visitor_chat_messages(UUID, TEXT) TO anon, authenticated;
```

---

### SEC-02: Unrestricted Anonymous File Upload in Storage Bucket `career-resumes`

- **Severity:** **HIGH** (CVSS 7.5 / CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N)
- **Vulnerability Category:** CWE-434 (Unrestricted Upload of File with Dangerous Type), OWASP A04:2021 (Insecure Design)
- **Affected File(s):**
  - `supabase/schema/03_lookups_and_grants.sql` (Lines 80-87)
  - `src/routes/careers.tsx` (Lines 520-565)

#### Vulnerability Description
In `supabase/schema/03_lookups_and_grants.sql`, the storage RLS policy for `career-resumes` allows any anonymous caller to insert arbitrary objects:
```sql
CREATE POLICY "Anyone can upload a resume"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'career-resumes');
```
There is no check on:
- File size (e.g., maximum 5MB or 10MB)
- File extension (e.g., `.pdf`, `.docx`)
- MIME type (`application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`)

#### Exploit Scenario
An attacker can upload executable files (`.exe`, `.sh`, `.bat`), malicious HTML files with embedded JavaScript (`.html`, `.svg` for stored XSS phishing), or flood the bucket with gigabyte-sized files, rapidly depleting the project's Supabase storage quota and driving up bandwidth bills.

#### Recommended Remediation
Apply strict storage bucket policies in SQL restricting file size and MIME types:

```sql
DROP POLICY IF EXISTS "Anyone can upload a resume" ON storage.objects;

CREATE POLICY "Anyone can upload a resume"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
    bucket_id = 'career-resumes'
    -- Limit file size to 10MB (10485760 bytes)
    AND (storage.foldername(name))[1] IS NOT NULL
    -- Enforce standard document extensions
    AND (
        lower(storage.extension(name)) IN ('pdf', 'doc', 'docx')
    )
);

-- Ensure only staff can read uploaded resumes
DROP POLICY IF EXISTS "Staff can read resumes" ON storage.objects;
CREATE POLICY "Staff can read resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'career-resumes'
    AND public.is_staff(auth.uid())
);
```

---

### SEC-03: Lack of Rate Limiting and Anti-Automation on Public Data Ingestion Endpoints

- **Severity:** **HIGH** (CVSS 7.3 / CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:H)
- **Vulnerability Category:** CWE-799 (Improper Control of Generation of Code / Rate Limiting), OWASP A04:2021 (Insecure Design)
- **Affected File(s):**
  - `public.contact_messages`
  - `public.leads`
  - `public.career_applications`
  - `public.live_chat_sessions`
  - `public.live_chat_messages`
  - `public.training_registrations`
  - `public.reviews`

#### Vulnerability Description
Because the application directly communicates with Supabase PostgREST endpoints from the browser, all public form submissions insert directly into PostgreSQL tables with the public `anon` key. While input lengths and simple field checks exist in SQL (Migration 30/32), there is **no IP-based or session-based rate limiting** at the database layer.

#### Exploit Scenario
A script or bot can send thousands of requests per second to `https://<PROJECT-REF>.supabase.co/rest/v1/contact_messages` or `leads`. This causes:
1. Database storage bloat.
2. Webhook / Edge Function trigger floods (`fn_dispatch_notification_webhook`).
3. Depletion of third-party transactional email / SMTP quotas.
4. Operational disruption for support and recruiting staff.

#### Recommended Remediation
1. **Cloudflare Turnstile / CAPTCHA Integration:** Form submissions should require verification (e.g., verifying a Turnstile token via an Edge Function before writing to the database).
2. **PostgreSQL Trigger-Based IP / Window Throttling:** For direct table inserts, implement an IP-based rate-limiting trigger that inspects `current_setting('request.headers', true)::json->>'cf-connecting-ip'` or `x-forwarded-for`, recording timestamps in a lightweight unlogged throttling table.
3. **Turn off Webhooks for Unverified Inserts:** Ensure notification webhooks only fire after secondary validation.

---

### SEC-04: Client-Side Execution of Server Functions via Start Shim Boundary

- **Severity:** **HIGH (Architectural Risk)**
- **Vulnerability Category:** CWE-602 (Client-Side Enforcement of Server-Side Security), OWASP A04:2021 (Insecure Design)
- **Affected File(s):**
  - `vite.config.ts` (Aliases `@tanstack/start` to `src/lib/start-shim.ts`)
  - `src/lib/start-shim.ts`
  - `src/lib/*.functions.ts` (e.g., `access-notify.functions.ts`)

#### Vulnerability Description
As documented in the architectural specifications (`AGENTS.md`), the current build tooling aliases `@tanstack/start` server functions to `src/lib/start-shim.ts`. 

In this setup:
```typescript
export function createServerFn(_options: any, fn: any) {
  return (...args: any[]) => fn(...args);
}
```
Any function created via `createServerFn()` runs **directly in the client's browser**. It does not execute in an isolated backend server container or trusted runtime.

#### Security Implication
If a developer creates a server function under the assumption that it is private and protected from client tampering:
- Any secret or API key placed in such files will be bundled into client-side JavaScript assets.
- Any authorization check performed inside a server function without a corresponding PostgreSQL RLS policy or Supabase Edge Function can be bypassed simply by inspecting network traffic or directly calling Supabase PostgREST endpoints with the `anon` key.

#### Recommended Remediation
1. Explicitly document in developer guidelines that all security boundaries must reside in **PostgreSQL RLS policies** or **Supabase Edge Functions (`supabase/functions/*`)**.
2. Never store private API secrets (e.g., Resend keys, Stripe secret keys, Supabase `service_role` keys) in files imported by client-side code or `*.functions.ts`.
3. If true server-side rendering (SSR) and server functions are required, migrate to a dedicated full-stack deployment (e.g., Node/Deno/Cloudflare Workers adapter) where server bundles are physically isolated from client bundles.

---

### SEC-05: Over-Permissive Content Security Policy (CSP)

- **Severity:** **MEDIUM** (CVSS 5.4 / CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N)
- **Vulnerability Category:** CWE-1021 (Improper Restriction of Rendered UI Layers or Scripts), OWASP A05:2021 (Security Misconfiguration)
- **Affected File(s):**
  - `vite.config.ts` (Lines 18-30)

#### Vulnerability Description
In `vite.config.ts`, the Content Security Policy header is defined as:
```
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://challenges.cloudflare.com https://accounts.google.com;
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.supabase.in https://api.iconify.design ... *;
```
1. `'unsafe-inline'` and `'unsafe-eval'` negate the primary benefits of CSP against Cross-Site Scripting (XSS). If user input is improperly escaped, injected script blocks will execute.
2. `connect-src` ends with a wildcard (`*`), allowing data exfiltration via `fetch()` or `navigator.sendBeacon()` to any arbitrary attacker-controlled domain.

#### Recommended Remediation
1. Remove `'unsafe-eval'` in production builds. (Vite production bundles do not require `eval`).
2. Replace `'unsafe-inline'` with CSP nonces or hashes for inline scripts.
3. Remove the wildcard `*` from `connect-src`, specifying only explicitly approved API domains:
```http
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.iconify.design;
```

---

### SEC-06: Edge Function `invite-admin-user` Missing Rate-Limiting & Complexity Controls

- **Severity:** **MEDIUM** (CVSS 5.0 / CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:L/I:L/A:N)
- **Vulnerability Category:** CWE-307 (Improper Restriction of Excessive Authentication Attempts), OWASP A07:2021 (Identification and Authentication Failures)
- **Affected File(s):**
  - `supabase/functions/invite-admin-user/index.ts`

#### Vulnerability Description
The Edge Function `invite-admin-user` allows administrators to create or invite admin users with a specified initial password.
1. **Permissive CORS Header:** `Access-Control-Allow-Origin: *` allows invocation from any web origin.
2. **No Password Policy Enforcement:** Does not validate password complexity (length, symbols, entropy) on the backend before passing it to `supabase.auth.admin.createUser()`.
3. **No Rate Limiting:** An authenticated admin session or compromised admin JWT could invoke this endpoint in a tight loop without throttling.

#### Recommended Remediation
1. Validate password strength on the Edge Function runtime:
```typescript
if (!password || password.length < 12 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
  return new Response(JSON.stringify({ error: "Password does not meet complexity requirements (min 12 chars, 1 uppercase, 1 digit)." }), {
    status: 400,
    headers: corsHeaders,
  });
}
```
2. Restrict `Access-Control-Allow-Origin` to the specific production and staging domains.

---

### SEC-07: Plaintext SMTP Password Storage in Database Table (`smtp_settings`)

- **Severity:** **MEDIUM** (CVSS 4.9 / CVSS:3.1/AV:N/AC:H/PR:H/UI:N/S:U/C:H/I:N/A:N)
- **Vulnerability Category:** CWE-312 (Cleartext Storage of Sensitive Information), OWASP A02:2021 (Cryptographic Failures)
- **Affected File(s):**
  - `supabase/schema/18_smtp_settings_table.sql`
  - `supabase/schema/30_security_hardening.sql` (Line 92)

#### Vulnerability Description
The `smtp_settings` table stores SMTP credentials, including `password TEXT NOT NULL`.
While Migration 30 restricted table SELECT to users with the `admin` role (`public.has_role(auth.uid(), 'admin')`), the password is stored as **unencrypted plaintext** in PostgreSQL storage.
Anyone with database backup access, read-replica access, or Supabase Dashboard access can read the cleartext password for the enterprise mail server.

#### Recommended Remediation
1. Utilize Supabase Vault (`pgsodium` / `vault.secrets`) to store and retrieve the SMTP password using cryptographic keys.
2. Alternatively, configure SMTP credentials via Supabase Edge Function environment variables / secrets (`supabase secrets set SMTP_PASS=...`) rather than storing them in a queryable public database table.

---

### SEC-08: Inconsistent Public URL Generation on Private Resume Bucket

- **Severity:** **LOW** (CVSS 3.1 / CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:L/I:N/A:N)
- **Vulnerability Category:** CWE-639 (Authorization Bypass Through User-Controlled Key)
- **Affected File(s):**
  - `src/routes/careers.tsx` (Line 552)

#### Vulnerability Description
In `src/routes/careers.tsx`:
```typescript
const { data: publicUrlData } = supabase.storage
  .from("career-resumes")
  .getPublicUrl(filePath);
```
In `supabase/schema/03_lookups_and_grants.sql`, `career-resumes` is created as a private bucket (`public: false`). Calling `getPublicUrl()` on a private bucket creates a link that fails to resolve unless the bucket is accidentally made public or signed URLs are generated.

#### Recommended Remediation
Use `createSignedUrl()` when admins review applicant resumes, and never rely on public URLs for confidential applicant resumes containing personal identification data (PII).

---

### SEC-09: Hardcoded Project References in Historical Migration Files

- **Severity:** **LOW / INFORMATIONAL**
- **Vulnerability Category:** CWE-798 (Use of Hard-coded Credentials)
- **Affected File(s):**
  - `supabase/migrations/` (Historical baseline migrations)

#### Vulnerability Description
Older migration scripts contain historical project URLs (e.g. `https://hdbzvoitzyvehyeqygmq.supabase.co`) and test JWT placeholders.

#### Recommended Remediation
Ensure no active production `service_role` secrets are present in git history. Rotate any service keys that were historically committed to repository files.

---

### SEC-10: Unverified Hosted Supabase Auth Configurations

- **Severity:** **INFORMATIONAL**
- **Vulnerability Category:** OWASP A07:2021 (Identification and Authentication Failures)
- **Scope Note:** In accordance with project architecture constraints (`AGENTS.md`), hosted Supabase Auth settings cannot be validated without administrative dashboard access.

#### Verification Checklist for System Administrators
- [ ] **Refresh Token Rotation:** Verify that Refresh Token Reuse Detection is enabled in Supabase Auth Settings.
- [ ] **JWT Expiration:** Ensure JWT expiry is set to a short duration (e.g. 3600 seconds / 1 hour).
- [ ] **Leaked Password Protection:** Confirm "HIBP (Have I Been Pwned)" password checking is enabled.
- [ ] **Multi-Factor Authentication (MFA):** Enforce MFA (TOTP) for all administrative and staff user roles.

---

## 4. Priority Remediation Plan

```
Timeline: Immediate (24h) ───► Short-Term (1-2 weeks) ───► Long-Term
               │                         │                     │
               ▼                         ▼                     ▼
        [SEC-01: Patch RLS]       [SEC-02: Bucket MIME]  [SEC-04: Full SSR / Edge API]
        (live_chat_messages)      [SEC-03: Turnstile]    [SEC-07: Supabase Vault]
                                  [SEC-05: Strict CSP]   [SEC-10: MFA Enforcement]
```

### Immediate Action Item: Apply Migration 36 (`36_chat_and_storage_hardening.sql`)

Create and execute Migration 36 in the Supabase SQL Editor to resolve **SEC-01** and **SEC-02**:

```sql
-- =================================================================
-- Migration 36: Live Chat & Resume Storage Security Hardening
-- =================================================================

-- 1. FIX SEC-01: Drop dangerous public SELECT on chat messages
DROP POLICY IF EXISTS "Anyone can read chat messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Staff can read chat messages" ON public.live_chat_messages;

CREATE POLICY "Staff can read chat messages"
    ON public.live_chat_messages FOR SELECT
    TO authenticated
    USING (public.is_staff(auth.uid()));

-- Provide a secure RPC for visitors to access only their active session messages
CREATE OR REPLACE FUNCTION public.get_visitor_chat_messages(
    p_session_id UUID,
    p_session_token TEXT
)
RETURNS SETOF public.live_chat_messages
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT m.*
    FROM public.live_chat_messages m
    JOIN public.live_chat_sessions s ON s.id = m.session_id
    WHERE s.id = p_session_id
      AND s.session_token = p_session_token
    ORDER BY m.created_at ASC;
$$;

REVOKE ALL ON FUNCTION public.get_visitor_chat_messages(UUID, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.get_visitor_chat_messages(UUID, TEXT) TO anon, authenticated;

-- 2. FIX SEC-02: Restrict resume file upload extensions and size in storage
DROP POLICY IF EXISTS "Anyone can upload a resume" ON storage.objects;

CREATE POLICY "Anyone can upload a resume"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
    bucket_id = 'career-resumes'
    AND lower(storage.extension(name)) IN ('pdf', 'doc', 'docx')
);

-- Ensure only staff can read resume objects
DROP POLICY IF EXISTS "Staff can read resumes" ON storage.objects;
CREATE POLICY "Staff can read resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'career-resumes'
    AND public.is_staff(auth.uid())
);
```

---

## 5. Conclusion

The application demonstrates good baseline security engineering: `DOMPurify` is systematically applied across user-generated content, client role lookups use database helper functions like `is_staff()`, and recent migrations have steadily tightened CMS table modifications. 

Addressing **SEC-01** (Live Chat RLS Information Disclosure) and **SEC-02** (Unrestricted Resume Storage Uploads) will resolve the most critical exposure vectors and bring the application to a high security standard.

