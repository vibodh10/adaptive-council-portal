# Production architecture

## Product and tenant model

Necivia is the platform. Westbridge Council is a fictional demonstration
tenant, not a real UK council. The resident interface retains the Westbridge
civic identity because Necivia is designed to integrate into a council-facing
service rather than replace it with a generic SaaS dashboard.

```text
ExperienceProvider ──────────────┐
                                 ├─ six WebMCP tools
HousingRepairProvider ───────────┤
        │                        └─ shared visible draft/review
        └─ HousingRepairForm
                 │
      human Confirm and submit
                 │
          POST /api/repairs
                 │
  auth → origin → rate limit → runtime validation
                 │
 PostgreSQL case + audit + private attachments
                 │
       CouncilDeliveryAdapter
          ├─ Westbridge sandbox staff inbox
          └─ authorised HTTPS/HMAC webhook
```

## Data architecture

Drizzle schema and checked-in SQL migrations define:

- `councils`: tenant ID, slug, name and demo flag;
- Better Auth `user`, `session`, `account`, `verification` and `rate_limit`
  tables;
- `repair_cases`: server-derived tenant/resident ownership, server reference,
  idempotency key, validated report, workflow and delivery status;
- `attachments`: private object key and ownership copied from the server case;
- `delivery_attempts`: adapter, outcome, attempt number and safe metadata;
- `audit_events`: actor, tenant, case, action and minimal safe metadata; and
- `abuse_buckets`: durable hashed keys for case/upload/staff limits.

References are unique. `(resident_id, idempotency_key)` is unique. Tenant,
owner, status, delivery, reference, case and attachment indexes cover the main
resident/staff access paths.

Necivia's single deployment runner selects safe first-run bootstrap when no
application schema objects exist, or strict migration when `public.councils`
identifies an initialized database. Both paths share one advisory-locked
transaction, compare exact ordered migration hashes, and verify the resulting
schema. It does not rely on Drizzle's single timestamp high-watermark. The
explicit bootstrap command remains available for diagnosis, but is not needed
as a separate Railway pre-deploy setting.

The database client is constructed without opening a connection. This permits
`npm run build` without a live database; runtime protected requests still fail
closed when configuration or PostgreSQL is unavailable.

## Case creation transaction boundaries

1. Authenticate and authorise the resident.
2. Check request origin, request size and durable limits.
3. Strictly parse the report; reject unknown/server-owned fields.
4. Validate every image by file count, byte size and magic signature.
5. Reserve the case with a unique server reference and idempotency constraint,
   recording `REPAIR_CASE_CREATED` in the same database transaction.
6. Upload private objects and insert attachment records. If any upload or
   attachment insert fails, remove uploaded objects and the still-pending
   reservation.
7. Invoke the selected delivery adapter after persistence.
8. Record the delivery attempt, case delivery status and audit event in one
   transaction.
9. Return the persisted case ID/reference only after acknowledgment.

An idempotent retry returns the existing case. It never uploads another set of
files or generates another reference.

## Delivery ownership

Westbridge sandbox delivery is the database-backed staff inbox in this demo. It
does not claim an external integration. Production councils configure a static,
authorised endpoint through the webhook adapter. Necivia can therefore hand a
normalized case to the council’s system without claiming to be that council’s
permanent system of record.

## Build and deployment

Migrations are generated with `npm run db:generate` and applied non-
interactively with `npm run db:deploy`. Demo seeding is explicit and
idempotent; app startup never resets or destroys production data.
