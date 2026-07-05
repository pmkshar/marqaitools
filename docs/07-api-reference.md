# Marqai — API Reference

> Audience: Backend engineers integrating Marqai programmatically (e.g. from a custom CMS, an automation tool, or a client app).

All Marqai API routes live under `/api/marqai/*`. Every request requires authentication (session cookie) and is subject to RBAC + plan limits.

---

## 1. Authentication

Marqai uses NextAuth.js with the credentials provider. After login, the session is stored as an HTTP-only JWT cookie named `next-auth.session-token`.

### Login

```http
POST /api/auth/callback/credentials
Content-Type: application/x-www-form-urlencoded

email=user@example.com&password=...&csrfToken=...
```

Returns: 302 redirect with `Set-Cookie: next-auth.session-token=...`.

### Logout

```http
POST /api/auth/signout
```

### Get current session

```http
GET /api/auth/session
```

Returns:

```json
{
  "user": {
    "id": "user-xxx",
    "email": "user@example.com",
    "name": "Jane Doe",
    "role": "Marketing Manager",
    "organizationId": "org-xxx"
  },
  "expires": "2026-08-05T12:00:00.000Z"
}
```

---

## 2. Common Request/Response Patterns

### Headers

```http
Content-Type: application/json
Cookie: next-auth.session-token=...
```

### Success response

```json
{
  "ok": true,
  "data": { ... }
}
```

### Error response

```json
{
  "ok": false,
  "error": {
    "code": "forbidden",
    "message": "You do not have permission to perform this action."
  }
}
```

### Error codes

| Code                  | HTTP | Meaning                                          |
| --------------------- | ---- | ------------------------------------------------ |
| `unauthorized`        | 401  | No session or session expired.                   |
| `forbidden`           | 403  | Session is valid but lacks RBAC permission.      |
| `credits_exhausted`   | 402  | Plan's AI credit limit reached.                  |
| `seat_limit_reached`  | 402  | Plan's seat limit reached.                       |
| `invalid_input`       | 400  | Zod validation failed.                          |
| `not_found`           | 404  | Resource not found in caller's organization.     |
| `rate_limited`        | 429  | Too many requests.                              |
| `internal_error`      | 500  | Unexpected server error.                         |

---

## 3. AI Routes

### 3.1 POST /api/marqai/analyze

Run an SEO audit OR a website analysis.

**Required permission:** `seo: execute` or `analyzer: execute` (depending on mode).

**Credit cost:** 5 (SEO) or 10 (website).

**Request body:**

```json
{
  "mode": "seo",           // or "website"
  "url": "https://example.com"
}
```

**Response (SEO mode):**

```json
{
  "ok": true,
  "data": {
    "url": "https://example.com",
    "analyzedAt": "2026-07-05T12:00:00.000Z",
    "overallScore": 78,
    "scores": {
      "performance": 85,
      "seo": 92,
      "accessibility": 70,
      "bestPractices": 80,
      "content": 75,
      "mobile": 90
    },
    "meta": {
      "title": "Example Domain",
      "titleLength": 13,
      "description": "This domain is for use in illustrative examples...",
      "descriptionLength": 100
    },
    "headings": { "h1": ["Example Domain"], "h2": [], "h3": [] },
    "keywords": [
      { "keyword": "example", "density": 2.5, "count": 5 }
    ],
    "findings": [
      {
        "id": "f1",
        "category": "warning",
        "title": "Missing meta description",
        "description": "The page has no meta description tag.",
        "recommendation": "Add a 150-160 character meta description."
      }
    ],
    "missingAnalytics": ["Google Analytics 4", "Facebook Pixel"]
  }
}
```

**Response (website mode):** See `WebsiteAnalysisReport` type in `src/lib/marqai/types.ts`.

---

### 3.2 POST /api/marqai/generate-image

Generate a marketing image.

**Required permission:** `images: execute` or higher.

**Credit cost:** 8.

**Request body:**

```json
{
  "prompt": "Flat-lay of skincare products on marble background",
  "size": "1024x1024",
  "style": "photorealistic"
}
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "id": "img-xxx",
    "url": "data:image/png;base64,...",
    "prompt": "Flat-lay of skincare products on marble background",
    "size": "1024x1024",
    "style": "photorealistic",
    "createdAt": "2026-07-05T12:00:00.000Z",
    "status": "done"
  }
}
```

---

### 3.3 POST /api/marqai/generate-content

Generate marketing copy.

**Required permission:** `social: execute` (for posts) or `email: execute` (for email) or `videos: execute` (for scripts).

**Credit cost:** 2.

**Request body:**

```json
{
  "type": "social-post",  // or "email-subject" | "email-body" | "video-script" | "hashtags"
  "platform": "linkedin",
  "topic": "Launch of our new AI feature",
  "tone": "professional",
  "count": 3
}
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "variations": [
      "Today we're launching...",
      "After 6 months of R&D...",
      "Meet the new..."
    ]
  }
}
```

---

### 3.4 POST /api/marqai/generate-video

Generate a video storyboard + thumbnail.

**Required permission:** `videos: execute` or higher.

**Credit cost:** 25.

**Request body:**

```json
{
  "title": "Product Launch Teaser",
  "script": "Introducing our new AI feature...",
  "style": "promo",
  "aspectRatio": "16:9"
}
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "id": "vid-xxx",
    "title": "Product Launch Teaser",
    "scenes": [
      { "index": 1, "text": "Hook...", "visual": "Close-up of product..." },
      { "index": 2, "text": "Problem...", "visual": "Split screen..." }
    ],
    "thumbnailUrl": "data:image/png;base64,...",
    "durationSec": 30,
    "style": "promo",
    "aspectRatio": "16:9",
    "status": "done",
    "createdAt": "2026-07-05T12:00:00.000Z"
  }
}
```

---

### 3.5 POST /api/marqai/send-email

Send an email campaign (simulated in this build).

**Required permission:** `email: manage`.

**Credit cost:** 0 (sending is free; only AI generation costs credits).

**Request body:**

```json
{
  "campaignId": "camp-xxx",
  "sendNow": true
}
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "sentAt": "2026-07-05T12:00:00.000Z",
    "recipients": 1250,
    "estimatedOpenRate": 0.22,
    "estimatedClickRate": 0.03
  }
}
```

---

### 3.6 POST /api/marqai/test-ai-tool

Run the AI tool testing suite against any AI tool.

**Required permission:** `ai-testing: execute` or higher.

**Credit cost:** 50.

**Request body:**

```json
{
  "toolName": "ChatGPT 4o",
  "toolUrl": "https://chat.openai.com",
  "toolType": "chatbot"
}
```

**Response:** See `AiToolTestReport` type in `src/lib/marqai/types.ts`.

---

## 4. RBAC Routes (TODO — not in current build)

### 4.1 GET /api/marqai/roles

List all roles in the caller's organization.

**Required permission:** `roles: view`.

**Response:**

```json
{
  "ok": true,
  "data": [
    {
      "id": "role-xxx",
      "name": "Marketing Manager",
      "description": "...",
      "permissions": {
        "dashboard": "manage",
        "seo": "manage"
      },
      "isSystem": true,
      "isLocked": false,
      "color": "teal",
      "userCount": 3,
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

### 4.2 POST /api/marqai/roles

Create a new custom role.

**Required permission:** `roles: manage`.

**Request body:**

```json
{
  "name": "Performance Marketer",
  "description": "Runs paid social + email + analytics.",
  "color": "amber",
  "permissions": {
    "dashboard": "manage",
    "social": "manage",
    "email": "manage"
  }
}
```

### 4.3 PATCH /api/marqai/roles/:id

Update a role.

**Required permission:** `roles: manage`.

### 4.4 DELETE /api/marqai/roles/:id

Delete a custom role. Locked roles cannot be deleted.

**Required permission:** `roles: manage`.

---

## 5. Team Routes (TODO — not in current build)

### 5.1 GET /api/marqai/team

List team members.

**Required permission:** `team: view`.

### 5.2 POST /api/marqai/team/invite

Invite a new member.

**Required permission:** `team: manage`.

**Request body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@company.com",
  "roleId": "role-xxx",
  "jobTitle": "SEO Specialist",
  "teamRole": "Member"
}
```

### 5.3 PATCH /api/marqai/team/:id

Update a member (e.g. change role).

### 5.4 DELETE /api/marqai/team/:id

Remove a member.

---

## 6. Subscription Routes (TODO — not in current build)

### 6.1 GET /api/marqai/subscription

Get current subscription, usage, and invoice history.

### 6.2 POST /api/marqai/subscription/upgrade

```json
{
  "planSlug": "scale"
}
```

### 6.3 POST /api/marqai/subscription/cancel

No body. Cancels at end of cycle.

---

## 7. Rate Limits

| Endpoint category          | Limit                                  |
| -------------------------- | -------------------------------------- |
| Auth (login, signup)       | 10 req/min per IP                      |
| AI endpoints (analyze, generate, test) | Limited by AI credits (no per-IP limit) |
| Other authenticated        | 100 req/min per user                   |
| Public                     | 60 req/min per IP                      |

When rate limited, you receive HTTP 429 with `Retry-After` header.

---

## 8. SDK Example (TypeScript)

```typescript
//.marqai-client.ts
const BASE = "https://marqaitools.vercel.app";

async function login(email: string, password: string) {
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ email, password, csrfToken: await getCsrf() }),
    credentials: "include",
  });
  return res.ok;
}

async function runSeoAudit(url: string) {
  const res = await fetch(`${BASE}/api/marqai/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "seo", url }),
    credentials: "include",
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error.message);
  return json.data;
}
```

---

## 9. Webhooks (TODO — not in current build)

Marqai can emit webhooks for events in your organization. Configure the webhook URL in Settings → Integrations.

### Events

| Event                       | Payload                                            |
| --------------------------- | -------------------------------------------------- |
| `seo.audit.completed`       | `{ reportId, url, score }`                         |
| `image.generated`           | `{ imageId, url, prompt }`                         |
| `video.rendered`            | `{ videoId, thumbnailUrl, durationSec }`           |
| `email.sent`                | `{ campaignId, recipients, sentAt }`               |
| `email.opened`              | `{ campaignId, recipientEmail, openedAt }`         |
| `ai_test.completed`         | `{ reportId, toolName, overallScore }`             |
| `subscription.upgraded`     | `{ organizationId, oldPlan, newPlan }`             |
| `subscription.cancelled`    | `{ organizationId, cancelledAt, effectiveAt }`     |
| `team.member_invited`       | `{ organizationId, email, roleId }`                |
| `team.member_removed`       | `{ organizationId, userId }`                       |

Webhooks are signed with HMAC-SHA256. Verify the `X-Marqai-Signature` header:

```typescript
import crypto from "crypto";

function verifyWebhook(rawBody: string, signature: string, secret: string) {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
```

---

## 10. New Module APIs (v2.1)

### 10.1 Generate Logo

```http
POST /api/marqai/generate-logo
Content-Type: application/json

{
  "brandName": "Acme Marketing",
  "tagline": "Marketing that compounds",
  "industry": "SaaS · B2B",
  "style": "minimal",            // minimal|wordmark|monogram|emblem|abstract|gradient
  "palette": ["#0d9488", "#14b8a6", "#f59e0b"],
  "mode": "template"             // template|ai
}
```

**Response (template mode):**
```json
{ "ok": true, "svg": "<svg xmlns=...>...</svg>" }
```

**Response (AI mode):**
```json
{ "ok": true, "url": "https://...", "prompt": "Professional logo for ..." }
```

| Mode | Cost | Output |
| --- | --- | --- |
| `template` | Free | Inline SVG string |
| `ai` | 8 AI credits | PNG image URL |

### 10.2 Generate Website

```http
POST /api/marqai/generate-website
Content-Type: application/json

{
  "brandName": "Acme Marketing",
  "product": "AI-powered SEO audit tool for in-house marketing teams",
  "audience": "B2B marketing teams and founders",
  "palette": ["#0d9488", "#14b8a6", "#f59e0b"],
  "tone": "confident, clear, benefit-led"
}
```

**Response:**
```json
{
  "ok": true,
  "sections": [
    { "type": "hero", "html": "<section>...</section>" },
    { "type": "features", "html": "..." },
    { "type": "testimonial", "html": "..." },
    { "type": "pricing", "html": "..." },
    { "type": "faq", "html": "..." },
    { "type": "cta", "html": "..." }
  ],
  "html": "<!DOCTYPE html>..."
}
```

Cost: 15 AI credits. Output: 6 sections + full assembled HTML document (export-ready).

### 10.3 Generate Leads

```http
POST /api/marqai/generate-leads
Content-Type: application/json

{
  "productName": "AI-powered SEO audit tool",
  "productCategory": "SaaS",
  "targetMarket": "India",
  "criteria": "Mid-market companies with marketing teams of 5+",
  "count": 12                   // 3-25
}
```

**Response:**
```json
{
  "ok": true,
  "leads": [
    {
      "id": "lead-...",
      "companyName": "Acme Health",
      "website": "acmehealth.com",
      "industry": "Healthcare SaaS",
      "size": "51-200",
      "location": "Bangalore, India",
      "linkedin": "linkedin.com/company/acme-health",
      "contactName": "Priya Menon",
      "contactTitle": "VP Marketing",
      "fitReason": "Mid-market SaaS with a 10-person marketing team running paid ads — likely to need SEO tooling.",
      "score": 82,
      "email": "priya.menon@acmehealth.com",
      "status": "new",
      "createdAt": "2026-07-06T..."
    }
  ]
}
```

Cost: `max(2, ceil(count/2))` AI credits. Emails are predicted using `first.last@domain` pattern and MUST be verified before sending.

---

## 11. Authentication (NextAuth)

Marqai uses NextAuth v4 with the Credentials provider and JWT sessions (7-day expiry).

```http
POST /api/auth/callback/credentials
Content-Type: application/x-www-form-urlencoded

email=user@example.com&password=...&csrfToken=...
```

After login, the session is stored as an HTTP-only JWT cookie named `next-auth.session-token`. The session payload includes the full `AuthPrincipal` object under `session.principal` (custom claim).

**Demo accounts (no DB required):**
- `superadmin@marqai.app` / `super1234` — Super Admin
- `priya@acme-marketing.com` / `demo1234` — Org Owner
- `arjun@acme-marketing.com` / `demo1234` — Marketing Manager
- `kavya@acme-marketing.com` / `demo1234` — SEO Specialist
- `rohan@acme-marketing.com` / `demo1234` — Social Media Manager
- `meera@acme-marketing.com` / `demo1234` — Email Marketer
- `vikram@acme-marketing.com` / `demo1234` — AI QA Analyst
- `nikhil@acme-marketing.com` / `demo1234` — Sales Development Rep
- `isha@acme-marketing.com` / `demo1234` — Viewer

**Production mode:** Set `NEXTAUTH_SECRET` and point `DATABASE_URL` at a real Postgres/MySQL — NextAuth will check the `User` / `SuperAdmin` tables with bcrypt-hashed passwords.

---

## 12. Billing (Stripe)

### 12.1 Create Checkout Session

```http
POST /api/stripe/checkout
Content-Type: application/json

{ "planSlug": "growth", "organizationId": "org-..." }
```

**Response (200):** `{ "ok": true, "url": "https://checkout.stripe.com/...", "sessionId": "cs_..." }`
**Response (503):** `{ "error": "Stripe not configured...", "simulated": true }`

### 12.2 Open Billing Portal

```http
POST /api/stripe/portal
Content-Type: application/json

{ "organizationId": "org-..." }
```

**Response:** `{ "ok": true, "url": "https://billing.stripe.com/..." }`

### 12.3 Webhook

```http
POST /api/stripe/webhook
Stripe-Signature: t=...,v1=...
<raw body>
```

Handles:
- `checkout.session.completed` → records `stripeCustomerId`, `stripeSubscriptionId`
- `customer.subscription.updated` → syncs plan, period, status, price
- `customer.subscription.deleted` → marks subscription as `cancelled`
- `invoice.payment_succeeded` → records a paid invoice

Configure the endpoint at `https://yourdomain.com/api/stripe/webhook` in your Stripe dashboard.
