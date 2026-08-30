import {
    bigint,
    boolean,
    date,
    index,
    integer,
    jsonb,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["RESIDENT", "STAFF"]);
export const repairType = pgEnum("repair_type", [
    "plumbing",
    "heating",
    "electrical",
    "roof_or_ceiling",
    "windows_or_doors",
    "damp_or_mould",
    "structural",
    "other",
]);
export const repairStatus = pgEnum("repair_status", [
    "NEW",
    "ACKNOWLEDGED",
    "IN_PROGRESS",
    "RESOLVED",
]);
export const deliveryStatus = pgEnum("delivery_status", [
    "PENDING",
    "SUCCEEDED",
    "FAILED",
]);
export const deliveryAdapterType = pgEnum("delivery_adapter_type", [
    "SANDBOX",
    "WEBHOOK",
]);
export const deliveryAttemptStatus = pgEnum("delivery_attempt_status", [
    "SUCCEEDED",
    "FAILED",
]);

const timestamps = {
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
};

export const councils = pgTable(
    "councils",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        slug: text("slug").notNull(),
        name: text("name").notNull(),
        demo: boolean("demo").default(false).notNull(),
        ...timestamps,
    },
    (table) => [uniqueIndex("councils_slug_unique").on(table.slug)],
);

// Better Auth core user model with Necivia's server-controlled tenant fields.
export const user = pgTable(
    "user",
    {
        id: text("id").primaryKey(),
        name: text("name").notNull(),
        email: text("email").notNull(),
        emailVerified: boolean("email_verified").default(false).notNull(),
        image: text("image"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        councilId: uuid("council_id")
            .notNull()
            .references(() => councils.id, { onDelete: "restrict" }),
        role: userRole("role").default("RESIDENT").notNull(),
        active: boolean("active").default(true).notNull(),
    },
    (table) => [
        uniqueIndex("user_email_unique").on(table.email),
        index("user_council_role_idx").on(table.councilId, table.role),
    ],
);

export const session = pgTable(
    "session",
    {
        id: text("id").primaryKey(),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
        token: text("token").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
    },
    (table) => [
        uniqueIndex("session_token_unique").on(table.token),
        index("session_user_idx").on(table.userId),
        index("session_expiry_idx").on(table.expiresAt),
    ],
);

export const account = pgTable(
    "account",
    {
        id: text("id").primaryKey(),
        issuer: text("issuer").notNull(),
        accountId: text("account_id").notNull(),
        providerId: text("provider_id").notNull(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        accessToken: text("access_token"),
        refreshToken: text("refresh_token"),
        idToken: text("id_token"),
        accessTokenExpiresAt: timestamp("access_token_expires_at", {
            withTimezone: true,
        }),
        refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
            withTimezone: true,
        }),
        scope: text("scope"),
        password: text("password"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        uniqueIndex("account_issuer_account_unique").on(
            table.issuer,
            table.accountId,
        ),
        index("account_user_idx").on(table.userId),
    ],
);

export const verification = pgTable(
    "verification",
    {
        id: text("id").primaryKey(),
        identifier: text("identifier").notNull(),
        value: text("value").notNull(),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const rateLimit = pgTable(
    "rate_limit",
    {
        id: text("id").primaryKey(),
        key: text("key").notNull(),
        count: integer("count").notNull(),
        lastRequest: bigint("last_request", { mode: "number" }).notNull(),
    },
    (table) => [uniqueIndex("rate_limit_key_unique").on(table.key)],
);

export const repairCases = pgTable(
    "repair_cases",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        councilId: uuid("council_id")
            .notNull()
            .references(() => councils.id, { onDelete: "restrict" }),
        residentId: text("resident_id")
            .notNull()
            .references(() => user.id, { onDelete: "restrict" }),
        reference: text("reference").notNull(),
        idempotencyKey: text("idempotency_key").notNull(),
        address: text("address").notNull(),
        repairType: repairType("repair_type").notNull(),
        issueDescription: text("issue_description").notNull(),
        whenProblemStarted: date("when_problem_started", {
            mode: "string",
        }).notNull(),
        isGettingWorse: boolean("is_getting_worse").notNull(),
        immediateDanger: boolean("immediate_danger").notNull(),
        accessNotes: text("access_notes"),
        additionalNotes: text("additional_notes"),
        status: repairStatus("status").default("NEW").notNull(),
        deliveryStatus: deliveryStatus("delivery_status")
            .default("PENDING")
            .notNull(),
        ...timestamps,
    },
    (table) => [
        uniqueIndex("repair_cases_reference_unique").on(table.reference),
        uniqueIndex("repair_cases_resident_idempotency_unique").on(
            table.residentId,
            table.idempotencyKey,
        ),
        index("repair_cases_council_status_idx").on(
            table.councilId,
            table.status,
            table.createdAt,
        ),
        index("repair_cases_resident_created_idx").on(
            table.councilId,
            table.residentId,
            table.createdAt,
        ),
        index("repair_cases_delivery_idx").on(
            table.councilId,
            table.deliveryStatus,
        ),
    ],
);

export const attachments = pgTable(
    "attachments",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        caseId: uuid("case_id")
            .notNull()
            .references(() => repairCases.id, { onDelete: "cascade" }),
        councilId: uuid("council_id")
            .notNull()
            .references(() => councils.id, { onDelete: "restrict" }),
        residentId: text("resident_id")
            .notNull()
            .references(() => user.id, { onDelete: "restrict" }),
        objectKey: text("object_key").notNull(),
        originalFilename: text("original_filename").notNull(),
        mimeType: text("mime_type").notNull(),
        size: integer("size").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        uniqueIndex("attachments_object_key_unique").on(table.objectKey),
        index("attachments_case_idx").on(table.caseId),
        index("attachments_tenant_owner_idx").on(
            table.councilId,
            table.residentId,
        ),
    ],
);

export const deliveryAttempts = pgTable(
    "delivery_attempts",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        caseId: uuid("case_id")
            .notNull()
            .references(() => repairCases.id, { onDelete: "cascade" }),
        adapterType: deliveryAdapterType("adapter_type").notNull(),
        status: deliveryAttemptStatus("status").notNull(),
        safeResponseMetadata: jsonb("safe_response_metadata")
            .$type<Record<string, string | number | boolean | null>>()
            .default({})
            .notNull(),
        attemptNumber: integer("attempt_number").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [index("delivery_attempts_case_idx").on(table.caseId)],
);

export const auditEvents = pgTable(
    "audit_events",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        councilId: uuid("council_id")
            .notNull()
            .references(() => councils.id, { onDelete: "restrict" }),
        actorUserId: text("actor_user_id").references(() => user.id, {
            onDelete: "set null",
        }),
        caseId: uuid("case_id").references(() => repairCases.id, {
            onDelete: "cascade",
        }),
        action: text("action").notNull(),
        metadata: jsonb("metadata")
            .$type<Record<string, string | number | boolean | null>>()
            .default({})
            .notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("audit_events_council_created_idx").on(
            table.councilId,
            table.createdAt,
        ),
        index("audit_events_case_idx").on(table.caseId, table.createdAt),
    ],
);

export const abuseBuckets = pgTable(
    "abuse_buckets",
    {
        keyHash: text("key_hash").primaryKey(),
        count: integer("count").notNull(),
        windowStartedAt: timestamp("window_started_at", {
            withTimezone: true,
        }).notNull(),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    },
    (table) => [index("abuse_buckets_expiry_idx").on(table.expiresAt)],
);

export const schema = {
    councils,
    user,
    session,
    account,
    verification,
    rateLimit,
    repairCases,
    attachments,
    deliveryAttempts,
    auditEvents,
    abuseBuckets,
};

export type DatabaseUser = typeof user.$inferSelect;
export type RepairCaseRecord = typeof repairCases.$inferSelect;
export type AttachmentRecord = typeof attachments.$inferSelect;
