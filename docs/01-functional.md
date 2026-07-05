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

1. User with `ai-testing: manage` navigates to **AI Tool Testing**.
2. Enters the AI tool's name and URL.
3. Picks tool type (chatbot, image-gen, video-gen, agent, rag, code-assistant, voice, other).
4. Clicks **Run test suite**.
5. Backend runs 40+ test cases against the tool.
6. UI shows: overall score (0-100), grade (A+ to F), per-category scores, per-test pass/partial/fail, strengths/weaknesses, recommendations, benchmark vs industry, radar chart.
7. Report is saved to history. **Cost: 50 AI credits.**

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
