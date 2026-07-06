# Marqai — Functional Documentation

> Audience: Product Managers, Founders, Marketing Leaders, Customer Success, QA.

This document describes **what Marqai does** — the modules, user journeys, business rules, and edge cases — without going into implementation detail. For the technical architecture see `02-technical.md`. For developer setup see `03-developer.md`.

---

## 1. Product Overview

Marqai is a multi-tenant SaaS platform that bundles seven marketing workflows and an AI tool testing module into a single workspace. It is sold on a monthly subscription basis to marketing agencies and in-house marketing teams who onboard their sales and digital marketing teams onto the platform.

### 1.1 Core value proposition

- **One subscription, many modules** — replaces 4–6 single-purpose SaaS tools.
- **Multi-tenant by design** — every customer gets an isolated Organization with its own roles, team, and data.
- **Role-based access** — Super Admin can create unlimited custom roles with per-module permissions.
- **AI-native** — every creative module is powered by AI (image gen, video gen, content gen, AI tool testing).

### 1.2 Personas

| Persona           | Description                                                    | Primary role          |
| ----------------- | ------------------------------------------------------------- | --------------------- |
| **Super Admin**   | Platform-level operator (Marqai staff).                       | Super Admin           |
| **Org Owner**     | Customer who owns the subscription. Pays the bill.           | Org Owner             |
| **Marketing Mgr** | Day-to-day head of marketing inside the customer org.        | Marketing Manager     |
| **Specialist**    | SEO, social, email, AI QA specialists.                       | (per specialty)       |
| **Viewer**        | Read-only stakeholder (CMO, investor, client).               | Viewer                |

---

## 2. Module Inventory

| Module             | Min plan   | Purpose                                                    |
| ------------------ | ---------- | ---------------------------------------------------------- |
| Dashboard          | Starter    | KPI overview across all modules                            |
| SEO Analyzer       | Starter    | Audit any URL for SEO issues + missing analytics          |
| Social Marketing   | Starter    | Compose and post across 7 social platforms                 |
| Scheduler          | Starter    | Daily/weekly content calendar                              |
| Email Automation   | Starter    | Campaigns + automation flows                               |
| Image Studio       | Growth     | AI image generation with style presets                     |
| Video Studio       | Growth     | AI marketing video generation                              |
| Website Analyzer   | Growth     | Deep portal analysis (tech, traffic, competitors)         |
| AI Tool Testing    | Scale      | Objective QA of any AI tool with full report card          |
| Team Management    | Starter    | Invite members, assign roles, track seats                  |
| Role Master        | Starter    | Create unlimited custom roles with per-module perms        |
| Subscription       | Starter    | View plan, usage, invoices; upgrade/downgrade              |
| Wiki / Docs        | Starter    | In-app functional + technical documentation                |
| Settings           | Starter    | Brand identity, integrations, deploy config                |

---

## 3. User Journeys

### 3.1 New customer signup

1. Visitor lands on the marketing site or the `/` route of the app.
2. Clicks **Start free trial**.
3. Picks a plan (Starter / Growth / Scale / Enterprise).
4. Fills in: full name, work email, company name, password.
5. System creates:
   - a new **Organization** with the company name
   - an **Org Owner** role (locked)
   - the user record linked to the Org Owner role
   - a 14-day **trial subscription** on the chosen plan
6. User lands on the Dashboard with a setup checklist.
7. Day 12 → automated reminder email. Day 14 → trial ends, account read-only until billing added.

### 3.2 Org Owner invites a team member

1. Org Owner navigates to **Team Management**.
2. Clicks **Invite member**.
3. Enters name, email, picks a role from the dropdown (only non-locked roles are listed).
4. Clicks **Send invitation**.
5. System sends an email invitation with a magic link.
6. Invitee clicks the link, sets a password, lands in the workspace with the assigned role.
7. Seat count increments by 1.

**Edge cases:**
- If seat limit is reached → invite button is disabled with an upgrade prompt.
- If invitee's email already belongs to another org → invite is rejected.
- Invitations expire after 7 days.

### 3.3 Super Admin creates a custom role

1. Super Admin (or Org Owner) navigates to **Role Master**.
2. Clicks **New role**.
3. Fills in name, description, color tag.
4. For each module, picks one of: None / View / Execute / Manage.
5. Clicks **Create role**.
6. Role appears in the role list and is assignable from Team Management.

**Edge cases:**
- Role names must be unique within an Organization.
- The Org Owner role is locked and cannot be deleted or renamed.
- Deleting a role that has members assigned: members are NOT deleted; they become "unassigned" and lose access until reassigned.

### 3.4 Marketer runs an SEO audit

1. User with `seo: execute` or higher navigates to **SEO Analyzer**.
2. Enters a URL (e.g. `https://example.com`).
3. Clicks **Run audit**.
4. Backend crawls the URL, parses meta/headings/keywords, runs a Lighthouse-style audit.
5. UI shows: overall score (0-100), per-category scores, meta info, headings, keyword density, findings (critical / warning / info / passed), missing analytics, top pages, competitors.
6. Report is saved to history; user can re-open or export.
7. **Cost: 5 AI credits.**

### 3.5 Marketer generates and schedules social posts

1. User navigates to **Social Marketing**.
2. Picks a platform (X, LinkedIn, FB, IG, YT, TikTok, Pinterest).
3. Enters a topic or brief.
4. AI generates 3 variations of the post.
5. User edits, picks one, optionally generates hashtags.
6. User clicks **Schedule** → opens Scheduler module → picks date/time.
7. Post moves to `scheduled` status.
8. At the scheduled time (simulated in this build), the post is "published".

### 3.6 AI QA Analyst tests an AI tool

The AI Testing module has 3 tabs:

**Tab 1 — Test Runner** (run a test suite against any AI tool)

1. User with `ai-testing: manage` navigates to **AI Tool Testing** → **Test Runner** tab.
2. Enters the AI tool's name and URL.
3. Picks tool type (chatbot, image-gen, video-gen, agent, rag, code-assistant, voice, other).
4. Optionally adds custom test cases (one per line) + selects focus areas.
5. Clicks **Run test suite**.
6. Backend runs 8-12 test cases against the tool, each tagged with the AI test scenario it maps to (from Marqai's 33-item testing taxonomy).
7. UI shows: overall score (0-100), grade (A+ to F), per-category scores, per-test pass/partial/fail with scenario tags, strengths/weaknesses, recommendations, benchmark vs industry, radar chart, scenarios covered.
8. Report is saved to history. **Cost: 50 AI credits.**

**Tab 2 — Playbook** (browse the 33-item testing taxonomy)

1. User clicks the **Playbook** tab.
2. UI shows 3 categories: **Testing Strategies** (14 items), **Testing Methodologies** (10 items), **AI-Specific Test Scenarios** (9 items).
3. Each item is expandable — click to see description, examples, pass criteria, and when-in-SDLC it runs.
4. Use this tab to plan a comprehensive QA strategy for any AI platform, AI tool, or AI-powered software.

**Tab 3 — Module Reports** (live QA status for every Marqai module)

1. User clicks the **Module Reports** tab.
2. UI auto-loads from `GET /api/marqai/module-reports` — probes every AI-powered module's endpoint in parallel.
3. Shows summary KPIs: total modules, AI working (live count), avg functional coverage, open issues.
4. For each of the 17 modules, shows: module name, category (AI-powered/Integration/CRUD/Informational), functional coverage %, AI integration status (works/fallback/broken/n/a), smoke test status, open issues count, applicable Testing Strategies + AI Test Scenarios as tags, and notes.
5. Click **Re-probe** to re-run the live AI endpoint check.

#### 3.6.1 Marqai Testing Taxonomy (33 items across 3 categories)

This is the complete QA playbook shipped with the AI Testing module. It's the single source of truth — defined in `src/lib/marqai/testing-taxonomy.ts` — and used by the UI, the test runner prompt, the module reports endpoint, and the documentation.

**A. Testing Strategies** (14 items — coverage types defining WHAT to test)

| # | Strategy | When |
|---|----------|------|
| 1 | Requirement & Risk-Based Testing | per-release |
| 2 | Smoke Testing after every deployment | post-deploy |
| 3 | Functional Testing of all modules | per-sprint |
| 4 | Regression Testing for every sprint/release | per-release |
| 5 | Integration Testing with payment, shipping and ERP APIs | per-release |
| 6 | Performance & Load Testing | per-release |
| 7 | Security & Penetration Testing | per-release |
| 8 | Cross Browser & Responsive Testing | per-release |
| 9 | Accessibility Testing (WCAG) | per-release |
| 10 | AI Model Validation & Recommendation Accuracy | continuous |
| 11 | AI Prompt & Hallucination Testing | per-release |
| 12 | AI Bias/Fairness Testing | per-release |
| 13 | AI Search Relevance Testing | per-release |
| 14 | Disaster Recovery & Backup Validation | continuous |

**B. Testing Methodologies** (10 items — process models defining HOW to test)

| # | Methodology | When |
|---|-------------|------|
| 1 | Agile Sprint Testing | per-sprint |
| 2 | Shift-Left Testing | continuous |
| 3 | Manual Testing | per-release |
| 4 | API Testing | continuous |
| 5 | Automation Testing (UI/API) | continuous |
| 6 | Exploratory Testing | per-release |
| 7 | Data Validation Testing | continuous |
| 8 | UAT (User Acceptance Testing) | per-release |
| 9 | Production Smoke Validation | continuous |

**C. AI-Specific Test Scenarios** (9 items — concrete AI test cases)

| # | Scenario | What it tests |
|---|----------|---------------|
| 1 | Product recommendation relevance | Recommendations match user context; rated 4+ on 5-scale by humans |
| 2 | Semantic search accuracy | Paraphrased queries return same top-3 results; NDCG@3 ≥ 0.8 |
| 3 | Chatbot response correctness | Factual correctness ≥ 95%, citation rate ≥ 90%, hallucination < 5% |
| 4 | Prompt injection resistance | 100% refusal on injection attempts, 0% system prompt leakage |
| 5 | Personalization validation | ≥ 90% of context variations produce visibly different outputs |
| 6 | Duplicate recommendation detection | 100% intra-call uniqueness, < 30% inter-call overlap |
| 7 | Recommendation latency | P95 latency targets met per route (Leads < 15s, Content < 8s, etc.) |
| 8 | Feedback learning verification | Feedback captured for 100% of rated outputs, ≥ 5% feedback rate |
| 9 | AI fallback when model unavailable | 100% of AI features have tested fallback engaging within 5s |

Each item in the taxonomy has: name, summary, full description, 3 concrete examples, pass criteria, and when-in-SDLC it runs. The full definitions are in `src/lib/marqai/testing-taxonomy.ts` and rendered in the in-app Playbook tab.

---

## 4. Permission Model

### 4.1 Permission levels

| Level     | Behavior                                                                  |
| --------- | ------------------------------------------------------------------------ |
| `none`    | Module hidden from sidebar; route blocked.                              |
| `view`    | Module visible; read-only access (cannot run, edit, or delete).         |
| `execute` | Module visible; can run analyses, generate content, schedule posts.    |
| `manage`  | Full CRUD — create, edit, delete, publish, configure.                  |

### 4.2 Special roles

- **Super Admin** — platform-level, bypasses all permission checks.
- **Org Owner** — locked role, all modules `manage`. Created with the org. Cannot be deleted.

### 4.3 Permission resolution order

1. If principal is Super Admin → grant everything.
2. Else look up the principal's role permission matrix.
3. Check if the module is in the current plan. If not, deny.
4. If permission level ≥ required level → grant.

---

## 5. Subscription & Billing

### 5.1 Plan catalog

| Plan         | Price/mo | Seats | AI Credits | Modules unlocked                                  |
| ------------ | -------- | ----- | ---------- | ------------------------------------------------- |
| **Starter**  | $49      | 3     | 1,000      | SEO, Social, Scheduler, Email, Dashboard           |
| **Growth**   | $149     | 10    | 5,000      | All Starter + Image Studio, Video Studio, Analyzer |
| **Scale**    | $399     | 25    | 20,000     | All Growth + AI Tool Testing                       |
| **Enterprise**| Custom | Unlimited | Custom | All modules + SSO + dedicated support              |

### 5.2 Billing rules

- All paid plans have a 14-day free trial (Enterprise: 30 days).
- AI credit cost per operation: SEO audit 5, image gen 8, video gen 25, content gen 2, website analysis 10, AI tool test 50.
- Overages: when credits run out, additional usage is billed at $0.01 per credit at the end of the cycle.
- Upgrades: prorated immediately, charged today.
- Downgrades: take effect at end of current cycle.
- Cancellations: account becomes read-only at end of cycle; data preserved 90 days then deleted.
- Refunds: within 7 days of payment, full refund; after that, case-by-case.

### 5.3 Trial & dunning flow

| Day   | Event                                                                |
| ----- | ------------------------------------------------------------------- |
| 0     | Trial starts; full plan access                                      |
| 12    | Automated email: "Trial ending in 2 days — add billing"             |
| 14    | Trial ends; account read-only; banner to add billing                |
| +3    | Final reminder                                                       |
| +7    | Trial data deleted if no billing added                              |
| Any   | Failed payment: 3-day grace, then account suspended                 |

---

## 6. Multi-Tenancy Rules

- Every record (campaign, scheduled post, image, video, report, role, team, user) belongs to exactly one Organization.
- Cross-org data access is forbidden at the data layer (`organizationId` filter mandatory).
- Super Admin can read cross-org for support/audit purposes; all access is logged.
- An Organization can have multiple Teams (sub-groups); team membership does NOT change role permissions.
- When an Organization is deleted: all child records are cascade-deleted.

---

## 7. Audit Logging

Every privileged action emits an `AuditLog` entry:

- `role.create`, `role.update`, `role.delete`
- `user.invite`, `user.remove`, `user.role.change`
- `subscription.upgrade`, `subscription.downgrade`, `subscription.cancel`
- `auth.login`, `auth.logout`, `auth.failed`
- `super_admin.impersonate`

Each log entry captures: timestamp, user ID, IP address, action, target type + ID, metadata (JSON).

Org Owners can view their org's audit log. Super Admins can view all logs.

---

## 8. Acceptance Criteria — Module by Module

### 8.1 Dashboard
- [ ] Shows 4 KPI cards: total reach, scheduled posts, email open rate, AI tools tested.
- [ ] Shows 7-day activity chart.
- [ ] Shows recent activity feed (last 10 events).
- [ ] Quick-launch tiles for each unlocked module.

### 8.2 SEO Analyzer
- [ ] Accepts any valid http(s) URL.
- [ ] Returns overall score 0-100 within 30 seconds.
- [ ] Lists at least 8 findings categorized critical/warning/info/passed.
- [ ] Lists missing analytics (GA, GTM, FB pixel, etc.).
- [ ] Saves report to history; user can re-open.

### 8.3 Social Marketing
- [ ] Supports all 7 platforms.
- [ ] Generates 3 post variations per request.
- [ ] Generates hashtags relevant to the post.
- [ ] Can push post to Scheduler.

### 8.4 Scheduler
- [ ] Week-view calendar with drag-and-drop.
- [ ] List view alternative.
- [ ] Filters by platform and status.
- [ ] Shows author of each post.

### 8.5 Email Automation
- [ ] Create campaign with subject, preview, body, audience.
- [ ] AI generate subject and body.
- [ ] Schedule or send now.
- [ ] Track open rate, click rate, unsubscribe rate.
- [ ] Automation flow builder with email/wait/condition steps.

### 8.6 Image Studio
- [ ] Prompt input + style preset + aspect ratio.
- [ ] Generates image in under 15 seconds.
- [ ] Persistent gallery with prompt + size + style metadata.
- [ ] Download and reuse.

### 8.7 Video Studio
- [ ] Script input → 3-5 scene storyboard.
- [ ] 5 styles (promo, explainer, social-short, tutorial, testimonial).
- [ ] 4 aspect ratios (16:9, 9:16, 1:1, 4:5).
- [ ] Thumbnail generated.

### 8.8 Website Analyzer
- [ ] Returns tech stack with confidence scores.
- [ ] Returns traffic estimates + sources + countries.
- [ ] Returns top pages and keywords.
- [ ] Returns competitors with overlap %.
- [ ] Returns missing features list (high/medium/low severity).
- [ ] Returns prioritized recommendations.

### 8.9 AI Tool Testing
- [ ] Accepts tool URL and tool type.
- [ ] Runs 40+ test cases across 8 categories.
- [ ] Returns overall score 0-100 and grade A+ to F.
- [ ] Returns per-category findings.
- [ ] Returns per-test-case pass/partial/fail with prompt/expected/actual.
- [ ] Returns strengths, weaknesses, recommendations.
- [ ] Returns benchmark comparison vs industry averages.

### 8.10 Role Master
- [ ] Lists all roles (built-in + custom).
- [ ] Built-in roles are badged; locked roles cannot be deleted.
- [ ] Create new role with name, description, color, per-module permissions.
- [ ] Edit existing role's permissions inline.
- [ ] Delete custom role (with confirmation).
- [ ] Shows count of users per role.

### 8.11 Team Management
- [ ] Lists all members with avatar, name, email, role, status, last login.
- [ ] Search by name/email/role/job title.
- [ ] Invite new member with role.
- [ ] Change a member's role inline.
- [ ] Remove a member (with confirmation).
- [ ] Shows seat usage bar with % used.
- [ ] Lists teams (sub-groups) with member counts.

### 8.12 Subscription
- [ ] Shows current plan, status, period dates.
- [ ] Shows seat usage and AI credit usage with progress bars.
- [ ] Shows plan catalog with current/upgrade/downgrade indicators.
- [ ] Upgrade flow with proration confirmation.
- [ ] Downgrade flow with end-of-cycle confirmation.
- [ ] Cancel flow with data retention warning.
- [ ] Invoice history table with download buttons.

### 8.13 Wiki / Docs
- [ ] Renders all 7 documentation files.
- [ ] Searchable.
- [ ] Print-friendly.
- [ ] Available to all roles with at least `view` permission.

### 8.14 Settings
- [ ] Brand identity (name, color, tagline).
- [ ] Integration keys (ZAI_API_KEY, social platform tokens).
- [ ] GitHub + Vercel deploy config.
- [ ] Export workspace data.

---

## 9. New Modules (v2.1)

### 9.1 Logo Builder

**Goal:** Let marketing teams generate brand logos in two modes — instant SVG templates (free, vector, editable) or AI-generated PNG logos (uses AI credits).

**User journey:**
1. User opens Logo Builder from the Creative group in the sidebar.
2. User enters brand name (required), tagline (optional), industry (optional).
3. User picks a generation mode:
   - **Template** (free, instant): generates an SVG logo using one of 6 styles — Minimal, Wordmark, Monogram, Emblem, Abstract, Gradient.
   - **AI Image** (8 credits): uses ZAI image generation with a logo-specific prompt combining brand, industry, style, and palette.
4. User picks a palette from 6 presets (Teal, Indigo, Rose, Emerald, Slate, Amber).
5. User clicks Generate. The logo is saved to the workspace gallery.
6. From the gallery, user can download (SVG or PNG) or delete the logo.

**Edge cases:**
- Empty brand name → inline validation error.
- AI mode failure → toast notification with error message.
- Template logos are deterministic (same inputs → same SVG output).
- Logos persist across sessions via Zustand store.

### 9.2 Website Builder

**Goal:** Generate a complete, conversion-optimized landing page in seconds. AI writes hero copy, feature cards, testimonial, pricing tiers, FAQ, and final CTA. Export the result as a self-contained HTML file.

**User journey:**
1. User opens Website Builder from the Creative group in the sidebar.
2. User enters brand name (required), product/service description (required), target audience (optional), tone (5 presets), and palette.
3. User clicks Generate. The AI returns 6 sections as JSON.
4. The assembled HTML document is saved to the workspace gallery.
5. User can preview (in an iframe), copy HTML, or download .html.

**Edge cases:**
- AI may return malformed JSON → API extracts the first balanced JSON object.
- Section HTML is sandbox-rendered in the preview iframe.
- Palette is exposed as CSS variables in the generated HTML.

### 9.3 AI Leads Generator

**Goal:** Generate a list of qualified prospect companies for a specific product or service. Each lead includes company name, website, industry, size, location, LinkedIn, contact name/title, fit-reason, and a 0-100 score. Export to CSV.

**User journey:**
1. User opens Leads Generator from the Outreach group in the sidebar.
2. User enters product/service description (required), category, target market, criteria (optional), and lead count (3-25).
3. User clicks Generate. The AI returns a JSON list of leads.
4. Predicted emails are constructed using the `first.last@domain` pattern.
5. User can change lead status (new → contacted → qualified → won / lost).
6. User can export the list as CSV.

**Compliance:**
- AI-predicted emails are starting points — they must be verified before sending.
- The UI surfaces a compliance notice about CAN-SPAM / GDPR / DPDP.
- Mid-market to upper-SMB companies only (no Fortune-100) by design.

### 9.4 Module access control

| Module | Min plan |
| --- | --- |
| Logo Builder | Growth |
| Website Builder | Growth |
| Leads Generator | Scale |

### 9.5 New built-in role

- **Sales Development Rep** — Leads Generator `manage`, Email `execute`, Dashboard `view`. Added to demo accounts as `nikhil@acme-marketing.com` / `demo1234`.
