For a Supabase + TypeScript website, these are the main security steps and logic we should take care of:

Authentication & Authorization
Supabase Auth
Email verification
Strong password policy
MFA / 2FA
Session management
Secure logout
Session expiration
Refresh-token protection
Role-Based Access Control (RBAC)
Permission-Based Access Control
Admin / Manager / User separation
Server-side authorization
Route/page protection
API/action authorization
Privilege escalation prevention
Supabase Database Security
Row Level Security (RLS)
RLS on every exposed table
RLS for SELECT
RLS for INSERT
RLS for UPDATE
RLS for DELETE
Ownership validation
User/tenant isolation
Company/branch-level isolation
Role-based database policies
Prevent direct unauthorized database access
Restrict database functions
Secure PostgreSQL functions
Prevent SQL injection
Database constraints
Foreign-key validation
Unique constraints
NOT NULL constraints
CHECK constraints
API & Backend Security
Never expose Supabase service_role key
Keep secrets in environment variables
Use only the public/anon key in frontend
Server-side validation
Input validation
Request authorization
Rate limiting
API abuse protection
Request size limits
Secure Edge Functions
Validate JWT inside backend functions
Validate user role inside backend functions
Never trust frontend-supplied user IDs
Never trust frontend-supplied prices
Never trust frontend-supplied permissions
Never trust frontend-supplied company/branch IDs
TypeScript Security
Strict TypeScript mode
Avoid any
Runtime schema validation
Zod / equivalent validation
Type-safe database queries
Type-safe API responses
Validate all form inputs
Sanitize user-generated content
Prevent unsafe HTML rendering
Avoid dangerous eval()
Avoid dynamic code execution
Secure error handling
Don't expose stack traces
Don't expose database errors to users
Frontend Security
Protected routes
Protected layouts
Permission-based UI
Hide unauthorized actions
But never rely on hidden UI for security
XSS protection
CSRF protection where applicable
Secure file upload validation
File type validation
File size limits
Secure Supabase Storage policies
Private buckets for sensitive files
Signed URLs for private files
Image/document access control
Business Logic Security
Server-side business rules
Approval workflow validation
Status transition validation
Prevent duplicate transactions
Prevent negative quantities
Prevent unauthorized stock changes
Prevent unauthorized price changes
Prevent unauthorized financial changes
Audit sensitive operations
Transaction/atomic operation logic
Concurrency protection
Race-condition prevention
Idempotency for critical operations
Prevent manipulation of timestamps
Prevent manipulation of user identity
Prevent bypassing approval workflows
Financial / ERP-Type Systems
Immutable transaction records
Payment authorization
Invoice permission checks
Purchase approval controls
Stock movement authorization
Inventory ownership validation
Financial record audit trail
Transaction reversal instead of deletion
Prevent unauthorized record deletion
Approval limits
Role-based financial permissions
Security Monitoring
Audit logs
Login history
Failed-login monitoring
Permission-change logs
Data-change logs
Admin activity logs
Suspicious activity detection
Error monitoring
Security alerts
Backup strategy
Database recovery plan
Infrastructure & Deployment
HTTPS only
Secure cookies
Security headers
Content Security Policy (CSP)
HSTS
X-Content-Type-Options
X-Frame-Options
Referrer-Policy
CORS restrictions
Environment separation
Development / staging / production separation
Secret rotation
Dependency updates
Vulnerability scanning
npm audit / dependency security
Git secret scanning
Never commit .env secrets
Most Important Rule

For your architecture, think of security in three layers:

Frontend → Backend/Edge Functions → PostgreSQL/RLS