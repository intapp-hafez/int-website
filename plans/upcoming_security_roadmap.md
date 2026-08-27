# Upcoming Security Roadmap & Implementation Milestones

This document stores the next top priority security items identified from the security audit checklist (`plans/.plan/security-steps.md`) to be implemented in upcoming sprints.

---

## 1. 🔒 Private Storage Buckets & Signed URLs (Confidentiality Protection)
**Checklist Reference**: *Lines 82–85 ("Private buckets for sensitive files", "Signed URLs for private files", "Image/document access control")*

### Objectives:
- Protect candidate resumes, support ticket attachments, and private client proposals from public indexing or URL guessing.

### Technical Implementation Steps:
1. **Supabase Storage Configuration**:
   - Change bucket `career-resumes` and `ticket-attachments` to `public = false`.
   - Configure RLS storage policies on `storage.objects`:
     - Allow authenticated applicants/clients to insert objects (`INSERT` with folder convention).
     - Restrict read access (`SELECT`) exclusively to `authenticated` users with `admin` or `hr` roles.
2. **Signed URL Generation**:
   - In [`src/routes/careers.tsx`](file:///d:/int/int-website/src/routes/careers.tsx), store the file path rather than the public URL.
   - In [`src/routes/dashboard.admin.careers.applications.$id.tsx`](file:///d:/int/int-website/src/routes/dashboard.admin.careers.applications.$id.tsx) and Helpdesk Ticket views, generate short-lived signed URLs via:
     ```typescript
     const { data } = await supabase.storage
       .from("career-resumes")
       .createSignedUrl(filePath, 3600); // 1 hour validity
     ```
   - Render a secure preview / download button that dynamically resolves signed links on demand.

---

## 2. 🛡️ Two-Factor Authentication (MFA / 2FA via TOTP)
**Checklist Reference**: *Line 7 ("MFA / 2FA")*

### Objectives:
- Provide enterprise-grade multi-factor authentication for administrative staff and enterprise clients using standard TOTP apps (Google Authenticator, Microsoft Authenticator, 1Password, Authy).

### Technical Implementation Steps:
1. **Enrollment Flow (`/dashboard/admin/security` & Profile Settings)**:
   - Call `supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'Integrated Technics' })`.
   - Render the returned QR code (`totp.qr_code`) and secret key for the user to scan.
   - User inputs the 6-digit confirmation code.
   - Call `supabase.auth.mfa.challengeAndVerify({ factorId, code })` to activate.
2. **Sign-In Challenge Gate (`/signin`)**:
   - If user has active MFA factors enrolled, redirect to an MFA verification step upon password success.
   - Call `supabase.auth.mfa.challenge()` and `supabase.auth.mfa.verify()` before granting the full session token.
3. **Unenroll / Recovery**:
   - Allow admins to unenroll/reset MFA factors in case of lost devices.

---

## 3. 📋 Real-Time Security Audit & Auth Activity Monitoring
**Checklist Reference**: *Lines 116–124 ("Audit logs", "Login history", "Failed-login monitoring", "Admin activity logs")*

### Objectives:
- Provide full visibility into administrative actions, privilege modifications, and suspicious authentication patterns.

### Technical Implementation Steps:
1. **Database Schema**:
   - Create `public.security_audit_logs` table (`id`, `user_id`, `actor_email`, `action_type`, `ip_address`, `user_agent`, `details_json`, `created_at`).
2. **Audit Logging Trigger Functions**:
   - Automatically record log entries on:
     - Role changes in `user_roles`.
     - Permission preset updates in `permission_presets`.
     - System settings & SMTP modifications in `site_settings`.
     - Live chat & ticket closures.
3. **Admin Dashboard Feed**:
   - Create an interactive **Audit Log Viewer** in `/dashboard/admin/security` with search, date filters, and export capabilities (CSV/PDF).

---

## 4. 🔄 Automated Backup Verification & Recovery Protocol
**Checklist Reference**: *Lines 125–126 ("Backup strategy", "Database recovery plan")*

### Objectives:
- Guarantee zero data loss with automated snapshots and verified rollback scripts.

### Technical Implementation Steps:
1. Document Supabase daily backup scheduling and Point-in-Time Recovery (PITR).
2. Create automated export scripts for schema and critical reference data tables.
