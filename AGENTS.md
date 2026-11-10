# Architecture rules

- About content renders through an allowlisted rich-text renderer that drops editor wrappers and unsafe attributes; headings and image labels use plain text so saved HTML never appears literally.

- System category creation uses the authenticated browser database client and only updates the selector after the database returns the saved row, so rejected writes never appear saved.

- Admin Partners pagination uses a pure list helper after search filtering and preserves global ordering indices, so page boundaries do not change reorder behavior.

- Industry lists and mutations use the database repository without sample or local-only success fallbacks, so unavailable storage and rejected writes remain visible instead of appearing persisted.

- The current Vite configuration aliases Start to a browser shim; never treat its server functions or middleware as trusted server boundaries. Privileged actions need a separately verified server deployment.
- Security scans probe the configured Supabase Auth and Data APIs without admin credentials; session lifetime, refresh rotation, and other hosted Auth settings must remain unverified unless read from the provider.