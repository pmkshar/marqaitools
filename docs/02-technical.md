# Marqai — Technical Documentation

> Audience: Engineering, DevOps, SRE, Security review.

This document covers the technical architecture, data model, security model, deployment topology, observability, and known limitations of Marqai.

---

## 1. Technology Stack

| Layer              | Choice                                                |
| ------------------ | ---------------------------------------------------- |
| Framework          | Next.js 16 (App Router) + React 19                   |
| Language           | TypeScript 5 (strict)                                |
| Styling            | Tailwind CSS 4 + shadcn/ui (New York variant)        |
| State              | Zustand (client) + TanStack Query (server)          |
| Forms              | react-hook-form + zod                                |
| Charts             | Recharts                                              |
| Animations         | Framer Motion                                         |
| Database           | Prisma ORM + SQLite (dev) / PostgreSQL (prod)       |
| Auth               | NextAuth.js v4 (credentials provider + JWT strategy)|
| AI SDK             | z-ai-web-dev-sdk (server-side only)                 |
| Package manager    | Bun                                                  |
| Deployment         | Vercel (Next.js auto-detected)                      |
| CI/CD              | GitHub → Vercel auto-deploy on `main` branch        |

---

## 2. System Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        Vercel Edge / Node                          │
│                                                                    │
│   ┌─────────────────────────────────────────────────────────────┐ │
│   │              Next.js 16 App (single deployable)             │ │
│   │                                                             │ │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│   │   │  / (page)    │  │ /api/marqai/*│  │  Auth routes  │    │ │
│   │   │  App Shell   │  │  AI routes   │  │  /api/auth/*  │    │ │
│   │   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │ │
│   │          │                  │                  │            │ │
│   │   ┌──────▼──────────────────▼──────────────────▼──────┐    │ │
│   │   │              Server Actions / API Routes           │    │ │
│   │   │   - enforce RBAC                                    │    │ │
│   │   │   - enforce plan limits                              │    │ │
│   │   │   - multi-tenant filter (organizationId)            │    │ │
│   │   └──────┬─────────────────────────────────┬───────────┘    │ │
│   │          │                                  │                │ │
│   │   ┌──────▼───────┐                  ┌───────▼────────┐      │ │
│   │   │   Prisma     │                  │  z-ai-web-dev  │      │ │
│   │   │   Client     │                  │     SDK        │      │ │
│   │   └──────┬───────┘                  └────────────────┘      │ │
│   │          │                                                  │ │
│   └──────────┼──────────────────────────────────────────────────┘ │
└──────────────┼────────────────────────────────────────────────────┘
               │
        ┌──────▼──────┐
        │  Database   │
        │ (PostgreSQL │
        │  in prod)   │
        └─────────────┘
```

### 2.1 Request lifecycle

1. Browser request hits Vercel's edge network.
2. Next.js middleware (if any) runs — checks for active session cookie.
3. If route is `/api/marqai/*`:
   - Server reads JWT from cookie.
   - Resolves principal (Super Admin or Org User).
   - Checks RBAC permission for the requested module.
   - Checks plan limits (AI credits, seat count).
   - Calls `z-ai-web-dev-sdk` or Prisma.
   - Returns JSON.
4. If route is `/`:
   - Server-side renders the AppShell.
   - Client hydrates; Zustand store rehydrates from `localStorage` (session, brand, roles).

### 2.2 Multi-tenancy strategy

Marqai uses the **shared-database, shared-schema** multi-tenancy model:

- One database, one `Organizations` table.
- Every domain table has an `organizationId` column.
- Every Prisma query MUST filter by `organizationId` (enforced at the repository layer, not at the database level).
- Super Admin queries bypass the filter; all such queries are audit-logged.

**Trade-off:** simpler ops (one DB to back up), but careful query discipline is required. A future migration to schema-per-tenant or database-per-tenant is possible without API changes.

---

## 3. Data Model (Prisma schema)

See `prisma/schema.prisma` for the full schema. Summary:

### 3.1 Platform level

- `SuperAdmin` — platform-level operator.
- `Plan` — global plan catalog (Starter / Growth / Scale / Enterprise).

### 3.2 Organization level

- `Organization` — tenant.
- `Subscription` — ties org to plan, tracks billing cycle, seat usage, AI credit usage.
- `Invoice` — historical billing records.
- `Role` — per-org role with permission matrix stored as JSON string.
- `User` — belongs to org + role.
- `Team` — sub-grouping inside org.
- `TeamMember` — join table User ↔ Team.
- `AuditLog` — every privileged action.

### 3.3 Permission storage

Roles store their permissions as a JSON string in the `permissions` column:

```json
{
  "dashboard": "manage",
  "seo": "execute",
  "social": "view",
  "images": "none"
}
```

This is parsed into a `PermissionMatrix` (`Partial<Record<ModuleId, PermissionLevel>>`) at runtime by `src/lib/marqai/rbac.ts`.

### 3.4 Cascade rules

- Deleting an Organization cascades to: Roles, Users, Teams, Subscriptions, Invoices, AuditLogs.
- Deleting a Role sets `User.roleId = NULL` (user becomes unassigned).
- Deleting a User cascades to: TeamMemberships, AuditLogs (set to NULL).

---

## 4. Security Model

### 4.1 Authentication

- NextAuth.js v4 with the Credentials provider.
- Passwords are hashed with bcrypt (cost factor 12).
- JWT session strategy (stateless); token expires after 30 days.
- Refresh token rotation every 24 hours.
- Super Admin login uses the same flow but resolves to a `kind: "super_admin"` principal.

### 4.2 Authorization (RBAC)

The RBAC engine lives in `src/lib/marqai/rbac.ts`. The core function is:

```typescript
canAccess(principal: AuthPrincipal | null, moduleId: ModuleId, required: PermissionLevel): boolean
```

Rules:
1. If `principal.kind === "super_admin"` → always true.
2. Look up `principal.permissions[moduleId]`.
3. Compare rank: `none < view < execute < manage`.
4. Module must be in the principal's plan.

Every API route and Server Action that touches privileged data MUST call `canAccess()` first. This is enforced by code review and the lint rule `marqai/rbac-check` (TODO).

### 4.3 Multi-tenant isolation

Every Prisma query in the data-access layer accepts an `organizationId` parameter. There is NO function that returns cross-org data without an explicit Super Admin check.

```typescript
// BAD — leaks data across tenants
const posts = await db.post.findMany();

// GOOD — scoped to tenant
const posts = await db.post.findMany({
  where: { organizationId: principal.organizationId },
});
```

### 4.4 Secret management

- Local dev: `.env.local` (gitignored).
- Vercel: Environment Variables in project settings (encrypted at rest).
- Required secrets:
  - `ZAI_API_KEY` — for AI features
  - `DATABASE_URL` — Prisma datasource
  - `NEXTAUTH_SECRET` — JWT signing secret (32+ random bytes)

### 4.5 Audit logging

Every privileged mutation emits an `AuditLog` entry:

```typescript
await db.auditLog.create({
  data: {
    organizationId: principal.organizationId,
    userId: principal.userId,
    action: "role.create",
    targetType: "Role",
    targetId: newRoleId,
    metadata: JSON.stringify({ name, permissions }),
    ipAddress: request.headers.get("x-forwarded-for"),
  },
});
```

Logs are retained for 2 years. Org Owners can view their org's logs; Super Admins can view all logs.

### 4.6 Rate limiting

- Public endpoints (signup, login): 10 req/min per IP.
- Authenticated AI endpoints: limited by AI credits, not rate.
- All other endpoints: 100 req/min per user.

Implemented via Vercel Edge Middleware + Upstash Redis counter (TODO — currently no rate limiter in this build).

### 4.7 Input validation

Every API route uses zod schemas to validate input. Examples:

```typescript
const AnalyzeInput = z.object({
  mode: z.enum(["seo", "website"]),
  url: z.string().url(),
});
```

Invalid input returns HTTP 400 with a structured error.

---

## 5. AI Integration

### 5.1 SDK

Marqai uses `z-ai-web-dev-sdk` for all AI features. The SDK is **server-side only** — never imported in client components.

### 5.2 Endpoints

| Endpoint                       | AI operation                            | Credit cost |
| ------------------------------ | --------------------------------------- | ----------- |
| `/api/marqai/analyze`          | SEO audit OR website analysis           | 5 / 10      |
| `/api/marqai/generate-image`   | Image generation                        | 8           |
| `/api/marqai/generate-content` | Social post / email / script / hashtag  | 2           |
| `/api/marqai/generate-video`   | Video storyboard + thumbnail            | 25          |
| `/api/marqai/test-ai-tool`     | 40+ test cases against an AI tool       | 50          |
| `/api/marqai/send-email`       | Simulated email send (no AI)            | 0           |

### 5.3 Credit accounting

Before each AI call:
1. Check `subscription.aiCreditsUsed + cost <= subscription.aiCreditsLimit`. If not, return HTTP 402 Payment Required.
2. Run the AI call.
3. On success, increment `aiCreditsUsed` atomically.
4. Emit `AuditLog` entry.

---

## 6. Deployment Topology

### 6.1 Vercel

- Framework: Next.js (auto-detected).
- Build command: `next build` (output: standalone).
- Install command: `bun install`.
- Regions: single default region (Hobby plan); multi-region on Enterprise.
- Env vars: `ZAI_API_KEY`, `DATABASE_URL`, `NEXTAUTH_SECRET`.
- Auto-deploy: on every push to `main`.

### 6.2 Database

- Dev: SQLite at `file:./db/custom.db`.
- Prod: PostgreSQL (Vercel Postgres or external RDS). Set `DATABASE_URL` accordingly.
- Migrations: `prisma migrate deploy` runs as part of the Vercel build (`postinstall` script).

### 6.3 CI/CD

GitHub `main` branch → Vercel auto-deploy → preview URL on PRs → production URL on merge.

No separate CI workflow; Vercel handles build + deploy.

---

## 7. Observability

### 7.1 Logging

- App logs: `console.log` / `console.error` → Vercel captures.
- Audit logs: stored in DB, viewable in-app.
- AI call logs: stored in DB with prompt + response + latency.

### 7.2 Monitoring (TODO)

- Vercel Analytics for web vitals.
- Sentry for error tracking (TODO).
- Custom dashboard for AI credit consumption per org (TODO).

### 7.3 Alerting (TODO)

- AI credit > 90% of limit → email Org Owner.
- Failed payment → email Org Owner + Slack `#billing-alerts`.
- 5xx rate > 1% over 5 min → PagerDuty.

---

## 8. Known Limitations

- **Auth**: Demo build uses a Zustand-persisted session with hardcoded demo credentials. Production must wire up NextAuth credentials provider with bcrypt-hashed passwords.
- **Database**: Demo build uses in-memory Zustand state for roles, team, subscription. Production must persist to PostgreSQL via Prisma.
- **Email send**: Simulated. Production must integrate Postmark / SendGrid / SES.
- **Social posting**: Simulated. Production must integrate platform APIs (Twitter API v2, LinkedIn Marketing API, Meta Graph API, etc.).
- **Payment**: No real payment processor. Production must integrate Stripe Billing + Webhooks.
- **Rate limiting**: Not implemented in this build.
- **Sentry / monitoring**: Not wired up.

---

## 9. Performance Targets

| Metric                          | Target       |
| ------------------------------- | ------------ |
| Dashboard initial load (P95)    | < 1.5s       |
| SEO audit (P95)                 | < 30s        |
| Image generation (P95)          | < 15s        |
| AI tool test suite (P95)        | < 5min       |
| API route 99th percentile       | < 500ms (non-AI) |
| Database query (P95)            | < 100ms      |

---

## 10. Backup & Recovery

- Database: daily snapshot via Vercel Postgres / RDS automated backups. 30-day retention.
- Audit logs: exportable to S3 daily.
- User-uploaded assets (images, videos): stored in Vercel Blob (TODO); 90-day versioning.
- Disaster recovery: RPO 24h, RTO 4h.

---

## 9. v2.1 Additions

### 9.1 New Prisma models

- `LogoAsset` — tenant-scoped AI/template logos (brandName, tagline, industry, style, palette, imageUrl, svgContent, prompt).
- `WebsiteAsset` — tenant-scoped landing pages (brandName, product, audience, sections JSON, full HTML, palette, publishedUrl).
- `LeadList` + `Lead` — tenant-scoped prospect lists (productName, productCategory, targetMarket, criteria, totalLeads) with per-lead records (companyName, website, industry, size, location, linkedin, contactName, contactTitle, fitReason, score, email, status).

### 9.2 New fields on `Subscription`

- `stripeCustomerId` (String?) — populated by Stripe webhook.
- `stripeSubscriptionId` (String?) — populated by Stripe webhook.
- `stripePriceId` (String?) — synced on every subscription update.
- `stripePortalUrl` (String?) — transient URL of the latest billing portal session.

### 9.3 NextAuth wiring

- Provider: `CredentialsProvider` (email + password).
- Session: JWT (7-day expiry), stored as HTTP-only cookie `next-auth.session-token`.
- Custom claim: `token.principal` carries the full `AuthPrincipal` object (kind, userId, email, name, organizationId, roleId, permissions matrix, planSlug).
- Demo fallback: `resolveDemoLogin()` is always tried first. If credentials match a demo account, NextAuth issues a JWT without hitting the database. This means the demo is always usable even without `NEXTAUTH_SECRET` or `DATABASE_URL`.
- Production path: bcrypt-hashed passwords on `User.passwordHash` / `SuperAdmin.passwordHash`. On success, `User.lastLoginAt` is updated.

### 9.4 Stripe integration

- `POST /api/stripe/checkout` — creates a Stripe Checkout Session in `subscription` mode. Uses `STRIPE_PRICE_ID_<PLAN>` env vars to map plan slugs to Stripe Price IDs. Returns the hosted checkout URL.
- `POST /api/stripe/portal` — creates a Stripe Billing Portal session for the customer to self-manage card / cancel / view invoices.
- `POST /api/stripe/webhook` — verifies the Stripe signature, then handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, and `invoice.payment_succeeded` events. Updates the `Subscription` and creates `Invoice` rows.
- Fallback: if `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, or `STRIPE_PRICE_ID_GROWTH` are unset, the billing UI falls back to a simulated in-memory upgrade (no real charge).

### 9.5 New module APIs

- `POST /api/marqai/generate-logo` — Template mode (instant SVG) or AI mode (8 credits, PNG).
- `POST /api/marqai/generate-website` — 15 credits, returns 6 sections + full HTML.
- `POST /api/marqai/generate-leads` — `max(2, ceil(count/2))` credits, returns 3-25 leads with predicted emails.

### 9.6 New module IDs

Added to `ModuleId` type and `MODULE_CATALOG`:
- `logo-builder` (min plan: Growth)
- `website-builder` (min plan: Growth)
- `leads-generator` (min plan: Scale)

All 8 built-in roles updated with explicit permissions for these new modules.
