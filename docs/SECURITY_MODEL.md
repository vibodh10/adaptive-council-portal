# Security model

## Trust boundaries

The browser is untrusted. Repair payloads, IDs, roles, tenant IDs, references,
delivery state, filenames, MIME declarations and idempotency input are all
validated or replaced server-side. TypeScript types are not treated as runtime
validation.

WebMCP remains progressive enhancement. It can adapt the page, explain public
requirements, and—when a resident session exists—read/update the shared draft
or open review. It cannot authenticate, receive credentials, submit, generate a
reference or bypass the visible human confirmation.

## Authentication and sessions

- Better Auth provides scrypt password hashing and database sessions.
- Public sign-up is disabled; demo users come from an environment-driven seed.
- Session cookies are HttpOnly, SameSite=Lax, Secure in production, scoped to
  `/`, and expire after eight hours.
- Session cookie caching is disabled so protected operations use the database
  session state, including `active`, tenant and role.
- Every login creates a fresh session token; logout uses Better Auth’s session
  invalidation path.
- Login errors do not reveal whether an account exists.

## Authorisation and tenant isolation

Every protected data access starts with the authenticated principal derived
from server session headers:

- resident case query: `council_id + resident_id + case_id`;
- resident attachment query: `council_id + resident_id + case_id + attachment_id`;
- staff case/attachment query: authenticated `council_id + requested IDs`;
- staff mutations: authenticated `STAFF` role plus tenant-scoped update.

The server never accepts role, resident ID or council ID as authority from the
browser. Missing and unauthorised IDs return the same not-found result where
appropriate, limiting cross-tenant probing.

## Request integrity and abuse controls

- Better Auth validates trusted origins and fetch metadata on auth requests.
- Necivia mutations additionally require `Origin` to match `Host` or the
  trusted forwarded host.
- Cookies use SameSite=Lax; no permissive cross-origin credentials policy is
  configured.
- Login is limited by normalized identifier and trusted source address.
- Case submission is limited per resident and source.
- Upload parsing is preceded by request-size and per-resident/source limits.
- Staff mutations and delivery retries are limited.
- Durable buckets are stored in PostgreSQL under SHA-256 keys; raw source
  addresses and account identifiers are not written into rate-limit keys.
- 429 responses are structured and include `Retry-After`.

## Private attachments

- Up to five images, 5 MB each and 25 MB total.
- Only JPEG, PNG and WebP declarations are accepted.
- Actual signatures are checked; SVG and renamed executables fail.
- Display filenames are path-stripped and sanitized.
- Object keys are generated server-side from authenticated ownership and UUIDs.
- The Railway bucket remains private; credentials never enter client bundles.
- Objects are streamed through an authorisation-checked backend route.
- Partial uploads are deleted if case attachment persistence fails.

Malware scanning is not included in this milestone. Production operators with
additional threat requirements should add quarantining/scanning before making
uploaded images available to staff.

## Webhook/SSRF controls

The endpoint comes only from server environment configuration. The adapter:

- requires HTTPS with no credentials or custom port;
- rejects localhost, `.local`, `.internal`, private, loopback, link-local,
  documentation, multicast and reserved IP destinations;
- resolves DNS and rejects any disallowed result;
- follows no redirects and has a five-second timeout;
- HMAC-SHA256 signs the exact normalized body; and
- records only HTTP status and bounded request ID or a generic failure reason.

No secret, response body, repair text or presigned URL is logged. DNS rebinding
between validation and connection remains a general fetch-level residual risk;
production operators should also enforce egress controls or an allowlist.

## Browser security headers

All routes receive a CSP, `frame-ancestors 'none'`, `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, strict-origin referrer policy and a limited
permissions policy. HSTS and upgrade-insecure-requests are production-only.
Next.js currently requires inline script/style compatibility, so the CSP allows
inline scripts/styles; a future nonce-based CSP would be a further hardening
step.

## Privacy and logging

The demo is for synthetic information. Logs must not contain passwords,
sessions, S3 credentials, webhook secrets, full descriptions, access notes,
uploaded bytes or attachment URLs. Audit events use action names and minimal
workflow metadata rather than unnecessary resident text.

Production operation must be arranged under the relevant council/controller
responsibilities. This project does not claim GDPR compliance, ISO
certification or another unevidenced status.
