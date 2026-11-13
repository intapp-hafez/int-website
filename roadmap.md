# Roadmap

- [x] Add homepage testimonial form; real pending submissions save successfully and remain hidden from public reads.
- [ ] Apply review validation safeguards and verify Admin approval — database policy migration disabled; authenticated Admin testing unavailable. Two clearly labeled workflow test reviews await cleanup in Admin.

- [ ] Enhance Permissions Management: staff search and confirmed save/error states.
- [ ] Enforce permission-table access and atomic grant approval in Supabase.
- [ ] Connect approval emails and verify delivery — trusted email deployment and authenticated testing required.

- [x] Audit industry CRUD and remove false local-only saves, deletes and sample fallback rendering.
- [ ] Create the missing industries table and verify Admin create/edit/hide/reorder/delete through the website — BLOCKED: database migration disabled by approval preference; authenticated Admin checks unavailable with external managed authentication.

- [x] Add API, session, and token verification controls; real Auth rejects malformed, unsigned, and forged credentials.
- [ ] Enforce application API authorization and verify session expiry/rotation — BLOCKED: current app uses browser-only server shims; needs trusted server deployment and access to hosted Auth settings. External managed authentication prevents signed-in end-to-end checks.

- [ ] Apply supabase/schema/30_security_hardening.sql — BLOCKED: migration tool disabled by approval preference; user must run it in the Supabase SQL editor, then re-scan
- [~] SEO findings: careers/industries og tags + news og:type=article already in code (scanner stale); og:image + sitemap need a published URL first
- [ ] Submit sitemap to Google — BLOCKED: site not published, no public URL
- [ ] Apply supabase/schema/29_access_quotes.sql — BLOCKED: migration tool disabled; user must run it in the Supabase SQL editor

- [x] Make founder section badge, highlights, button labels/links, and photo editable alongside existing bilingual profile fields.
