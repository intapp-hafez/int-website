# Architecture rules

- Industry lists and mutations use the database repository without sample or local-only success fallbacks, so unavailable storage and rejected writes remain visible instead of appearing persisted.

- The current Vite configuration aliases Start to a browser shim; never treat its server functions or middleware as trusted server boundaries. Privileged actions need a separately verified server deployment.
- Security scans probe the configured Supabase Auth and Data APIs without admin credentials; session lifetime, refresh rotation, and other hosted Auth settings must remain unverified unless read from the provider.