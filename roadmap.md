# Roadmap

- [x] Add API, session, and token verification controls; real Auth rejects malformed, unsigned, and forged credentials.
- [ ] Enforce application API authorization and verify session expiry/rotation — BLOCKED: current app uses browser-only server shims; needs trusted server deployment and access to hosted Auth settings. External managed authentication prevents signed-in end-to-end checks.

- [ ] Apply supabase/schema/30_security_hardening.sql — BLOCKED: migration tool disabled by approval preference; user must run it in the Supabase SQL editor, then re-scan
- [~] SEO findings: careers/industries og tags + news og:type=article already in code (scanner stale); og:image + sitemap need a published URL first
- [ ] Submit sitemap to Google — BLOCKED: site not published, no public URL
- [ ] Apply supabase/schema/29_access_quotes.sql — BLOCKED: migration tool disabled; user must run it in the Supabase SQL editor
