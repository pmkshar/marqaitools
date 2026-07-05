# Marqai — AI Marketing & AI Tool Testing SaaS

Marqai is a multi-tenant SaaS platform that bundles SEO analytics, multi-platform social marketing, daily content scheduling, AI image & video generation, automated email campaigns, deep website analysis, and a **dedicated AI tool testing module** into a single Next.js application. Built with role-based access control (RBAC) and monthly subscription billing so digital agencies and enterprise marketing teams can onboard their sales and digital marketing teams in minutes.

> Built with Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui · Recharts · z-ai-web-dev-sdk · Zustand · Prisma.

---

## ✨ Modules

| Module              | What it does                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| **Dashboard**       | KPIs across all modules — reach, scheduled posts, open rate, AI tools tested.                      |
| **SEO Analyzer**    | Run a full SEO audit on any URL — meta, headings, keyword density, backlinks, missing analytics.   |
| **Social Marketing**| AI composer for 7 platforms (X, LinkedIn, FB, IG, YT, TikTok, Pinterest). Hashtag suggestion.      |
| **Scheduler**       | Week-view content calendar + list view. Per-platform scheduling, draft/scheduled/published.        |
| **Image Studio**    | AI image generation with style presets and aspect ratios. Persistent gallery with previews.        |
| **Video Studio**    | Script → 3-5 scene storyboard → rendered marketing video. 5 styles, 4 aspect ratios.               |
| **Logo Builder**    | AI logos + instant SVG wordmark / monogram / emblem / abstract / gradient templates. Download as PNG or SVG. |
| **Website Builder** | AI landing pages — hero, features, testimonial, pricing, FAQ, CTA. Live preview + export HTML.    |
| **Leads Generator** | AI prospect lists per product/service — company, contact, fit-reason, 0-100 score. Export CSV.    |
| **Email Automation**| Campaigns + triggered automations. AI subject/body generation. Simulated send with metrics.        |
| **Website Analyzer**| Deep portal analysis — tech stack, traffic, sources, keywords, competitors, missing features.      |
| **AI Tool Testing** | **Dedicated module.** Run 40+ objective test cases against any AI tool. Full report card.          |
| **Role Master**     | **Super Admin only.** Create unlimited custom roles with per-module permissions.                  |
| **Team Management** | Invite team members, assign roles, manage seats against your plan.                                |
| **Subscription**    | View plan, usage, billing cycle, upgrade/downgrade, monthly invoice history. Stripe-ready.        |
| **Wiki / Docs**     | In-app documentation — functional, technical, role-wise SOPs, developer guide.                    |
| **Settings**        | Brand identity, integrations, API keys, deploy (GitHub + Vercel).                                  |

---

## 🏢 SaaS Architecture (Multi-tenant)

Marqai is built on a **multi-tenant** model:

```
Platform (Marqai)
└── Organization (tenant) — e.g. "Acme Marketing Pvt Ltd"
    ├── Subscription (Plan + billing cycle + seats)
    ├── Custom Roles (created by Org Admin / Super Admin)
    │   ├── e.g. "SEO Specialist" — view SEO, Analyzer, Dashboard
    │   ├── e.g. "Social Manager" — view Social, Scheduler, Image, Video
    │   └── e.g. "Email Marketer" — view Email, Scheduler, Dashboard
    ├── Team Members (users assigned to roles)
    └── All marketing data is scoped to this Organization
```

### Special platform-level role: Super Admin

The **Super Admin** is a platform-level role (not bound to any single Organization) who can:
- Create new Organizations (clients)
- Provision or revoke subscriptions
- Create any number of custom roles inside any Organization
- View cross-tenant analytics (platform-wide KPIs)
- Manage the global plan catalog (Starter / Growth / Scale / Enterprise)

---

## 🔐 RBAC (Role-Based Access Control)

### Permission model

Every role is a collection of **module-level permissions**. Each permission can be one of:

| Permission | Effect                                                                  |
| ---------- | ----------------------------------------------------------------------- |
| `none`     | Module hidden from sidebar; route blocked.                              |
| `view`     | Module visible; read-only access.                                       |
| `execute`  | Module visible; can run analyses, generate content, schedule posts.    |
| `manage`   | Full CRUD — create, edit, delete, publish.                              |

### Built-in roles (seeded on Organization creation)

1. **Org Owner** — all modules `manage` (created with the org)
2. **Marketing Manager** — all marketing modules `manage`, AI Testing `view`
3. **SEO Specialist** — SEO + Analyzer `manage`, Dashboard `view`
4. **Social Media Manager** — Social + Scheduler + Image + Video + Logo Builder `manage`
5. **Email Marketer** — Email + Scheduler `manage`, Leads Generator `execute`
6. **AI QA Analyst** — AI Tool Testing `manage`, Dashboard + Analyzer `view`
7. **Sales Development Rep** — Leads Generator `manage`, Email `execute`, Dashboard `view`
8. **Viewer** — all modules `view` (read-only stakeholder)

The Org Owner can clone, edit, or extend any of these — or build brand-new roles from scratch in the **Role Master** module.

---

## 🔑 Authentication (NextAuth)

Marqai ships with a production-ready NextAuth setup using the **Credentials provider** and **JWT sessions** (7-day expiry).

- **Demo mode (default):** The in-app auth screen accepts any of the 8 demo accounts listed on the sign-in page. No database required.
- **Production mode:** Set `NEXTAUTH_SECRET` and point `DATABASE_URL` at a real Postgres/MySQL — NextAuth will then check the `User` / `SuperAdmin` tables with **bcrypt-hashed passwords**. Demo accounts still work as a fallback so you never lock yourself out.

Routes:
- `POST /api/auth/[...nextauth]` — sign-in / sign-out / session
- `GET  /api/auth/[...nextauth]` — session reader

Env vars:
```
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://yourdomain.com
```

---

## 💳 Billing (Stripe)

Live subscription billing is wired up through Stripe Checkout + Webhooks + Billing Portal. When Stripe env vars are **not** configured, the billing module falls back to a simulated in-memory upgrade so the demo always works.

**Flow:**
1. User clicks **Upgrade** in the Subscription module
2. `POST /api/stripe/checkout` creates a Checkout Session and redirects to Stripe
3. Stripe redirects back to `/` on success
4. `POST /api/stripe/webhook` receives `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded` and syncs the DB
5. Users can self-manage their card / cancel via `POST /api/stripe/portal` → Stripe Billing Portal

**Env vars:**
```
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID_STARTER=price_xxx
STRIPE_PRICE_ID_GROWTH=price_xxx
STRIPE_PRICE_ID_SCALE=price_xxx
STRIPE_PRICE_ID_ENTERPRISE=price_xxx   # optional (Enterprise is "contact sales")
```

Configure the webhook endpoint in Stripe → Webhooks → Add endpoint → `https://yourdomain.com/api/stripe/webhook`.

---

## 💳 Subscription & Billing

### Plan catalog (monthly billing)

| Plan         | Price/mo | Seats | AI Credits | Modules unlocked                                  |
| ------------ | -------- | ----- | ---------- | ------------------------------------------------- |
| **Starter**  | $49      | 3     | 1,000      | SEO, Social, Scheduler, Email, Dashboard           |
| **Growth**   | $149     | 10    | 5,000      | All Starter + Image Studio, Video Studio, Analyzer |
| **Scale**    | $399     | 25    | 20,000     | All Growth + AI Tool Testing                       |
| **Enterprise**| Contact | Unlimited | Custom | All modules + SSO + dedicated support              |

- 14-day free trial on all paid plans
- AI credits are consumed by image gen, video gen, content gen, SEO audit, website analysis, AI tool testing
- Overages billed automatically at the end of each cycle
- Plan can be upgraded mid-cycle (prorated) or downgraded at the end of the cycle

### Trial & dunning flow

1. New client signs up → 14-day Growth trial activated
2. Day 12 → automated email reminder to add billing
3. Day 14 → trial ends; account read-only until billing added
4. Failed payment → 3-day grace → account suspended (data preserved 90 days)

---

## 🚀 Quick start (local)

```bash
# install
bun install

# run dev server
bun run dev
# → http://localhost:3000

# lint
bun run lint

# database (optional — only if you extend the Prisma schema)
bun run db:push
```

### Environment variables

See `.env.example`. The minimum required for production:

```bash
ZAI_API_KEY=your_zai_api_key
DATABASE_URL="file:./db/custom.db"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

> Without `ZAI_API_KEY`, the AI-powered modules will return error toasts. The rest of the app works without it.

---

## 🧪 The AI Tool Testing module (separate, dedicated)

This is Marqai's differentiator. Use it to objectively grade any AI tool — chatbots, image generators, video generators, autonomous agents, RAG systems, code assistants, and voice tools.

**What it evaluates:** accuracy & hallucination rate, latency (median/P95/P99), safety & refusal behavior, reasoning, code generation, cost efficiency, output diversity, context handling.

**What you get:** overall score (0-100) and grade (A+ to F), per-category scores, per-test-case pass/partial/fail with prompt vs. expected vs. actual, strengths & weaknesses, prioritized recommendations, benchmark comparison vs. industry averages, and a score profile radar chart.

---

## 🔌 API routes

| Route                              | Method | Purpose                                                   |
| ---------------------------------- | ------ | --------------------------------------------------------- |
| `/api/marqai/analyze`              | POST   | SEO (`mode: "seo"`) or website (`mode: "website"`) audit  |
| `/api/marqai/generate-image`       | POST   | AI image generation via z-ai-web-dev-sdk                  |
| `/api/marqai/generate-content`     | POST   | AI copywriting (social posts, email, scripts, hashtags)   |
| `/api/marqai/generate-video`       | POST   | Video script → scenes → thumbnail (simulated render)      |
| `/api/marqai/send-email`           | POST   | Simulated email send with realistic open/click metrics    |
| `/api/marqai/test-ai-tool`         | POST   | Run the AI Tool Testing module against any tool URL       |

All AI routes use `z-ai-web-dev-sdk` server-side. Never expose the SDK client-side.

---

## 🗂 Project structure

```
src/
├── app/
│   ├── api/marqai/         # Server routes (AI / analyze / send)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx            # Renders <AppShell />
├── components/
│   ├── ui/                 # shadcn/ui (preinstalled)
│   └── marqai/
│       ├── app-shell.tsx   # Top-level layout + module router
│       ├── auth-screen.tsx # Login / signup / role switch
│       ├── sidebar.tsx     # Module navigation (permission-gated)
│       ├── topbar.tsx      # Header with user + role + org + plan
│       ├── kpi-card.tsx
│       ├── score-ring.tsx
│       ├── loading-states.tsx
│       └── modules/
│           ├── dashboard.tsx
│           ├── seo-module.tsx
│           ├── social-module.tsx
│           ├── scheduler-module.tsx
│           ├── image-module.tsx
│           ├── video-module.tsx
│           ├── email-module.tsx
│           ├── analyzer-module.tsx
│           ├── ai-testing-module.tsx
│           ├── roles-module.tsx       # NEW: Role Master
│           ├── team-module.tsx        # NEW: Team Management
│           ├── billing-module.tsx     # NEW: Subscription / Billing
│           ├── wiki-module.tsx        # NEW: In-app documentation
│           └── settings-module.tsx
└── lib/
    └── marqai/
        ├── types.ts        # All shared TypeScript interfaces
        ├── store.ts        # Zustand store (app state + RBAC state)
        ├── rbac.ts         # NEW: RBAC engine, permission checks
        ├── saas.ts         # NEW: Plan catalog, usage limits, billing seed
        ├── mock-data.ts    # Seed data + simulated APIs
        └── utils.ts        # Helpers
docs/                       # NEW: in-app wiki source markdown
├── 01-functional.md
├── 02-technical.md
├── 03-developer.md
├── 04-user-sop.md
├── 05-roles.md
├── 06-billing.md
└── 07-api-reference.md
```

---

## ☁️ Deploy to Vercel

The repo is already connected to Vercel — every push to `main` triggers an automatic deploy.

- **Production URL:** https://marqaitools.vercel.app
- **Vercel dashboard:** https://vercel.com/pmkshars-projects/marqaitools

### Required env vars on Vercel

| Var              | Purpose                                                        |
| ---------------- | -------------------------------------------------------------- |
| `ZAI_API_KEY`    | Powers all AI features (image gen, content gen, AI tool testing) |
| `DATABASE_URL`   | Prisma datasource (defaults to `file:./db/custom.db`)          |
| `NEXTAUTH_SECRET | Session signing secret                                          |

---

## 🎨 Design

- **Primary accent:** emerald/teal — avoids blue/indigo per Marqai brand guidelines.
- **Dark sidebar** with light main content; full dark mode support via CSS variables.
- **Charts:** Recharts (area, bar, pie, radar).
- **Icons:** lucide-react.
- **Type:** Geist Sans / Mono.

---

## 📝 License

MIT — built for the Marqai SaaS platform.
