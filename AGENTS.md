# Architecture rules

- Validate supplied server-action bearer credentials against Supabase Auth and reject cross-origin browser actions; public actions may omit credentials, while protected actions still require their existing authorization middleware.
- Keep authentication request validation in server-only helpers and expose a no-store, identity-free session probe for live API/token audits.
- Security scans report only observed checks; session lifetime, refresh rotation, and other hosted Auth settings must not be inferred from token validity.