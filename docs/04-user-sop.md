# Marqai — User Standard Operating Procedures (SOPs)

> Audience: End users — Marketing Managers, Specialists, Viewers, Org Owners.

This document is a step-by-step playbook for using Marqai day-to-day. Each SOP is self-contained — you can jump straight to the one you need.

---

## SOP 1 — First-time login & setup

**Who:** Org Owner (the person who created the workspace)
**When:** After signup

1. Open https://marqaitools.vercel.app
2. Click **Sign in**.
3. Enter your work email and password.
4. You land on the **Dashboard**.
5. Click **Settings** in the sidebar.
6. Under **Brand identity**:
   - Set your brand name (e.g. "Acme Marketing").
   - Pick a brand color.
   - Add a tagline.
7. Under **Integrations**:
   - Paste your `ZAI_API_KEY` (required for AI features).
   - Optionally connect social platform tokens (Twitter, LinkedIn, etc.).
8. Click **Save**.

**Expected outcome:** Brand identity shows in the sidebar; AI features are unlocked.

---

## SOP 2 — Inviting your first team member

**Who:** Org Owner or anyone with `team: manage` permission
**When:** After workspace setup

1. Click **Team Management** in the sidebar.
2. Click **Invite member** (top-right).
3. Fill in:
   - Full name
   - Work email
   - Role (pick from the dropdown — only non-locked roles appear)
   - Job title
   - Team position: Member / Lead / Viewer
4. Click **Send invitation**.
5. The invitee receives an email with a magic link.
6. They click the link, set a password, and land in the workspace.

**Seat budget check:** Each plan has a seat limit. Starter = 3, Growth = 10, Scale = 25, Enterprise = unlimited. If you hit the limit, the invite button is disabled — upgrade your plan first.

**Edge case — invitee didn't get the email:**
- Check spam folder.
- Resend from Team Management → click the "..." menu next to the pending invite → Resend.
- Invitations expire after 7 days.

---

## SOP 3 — Creating a custom role

**Who:** Org Owner or Super Admin
**When:** When the built-in roles don't fit your team structure

1. Click **Role Master** in the sidebar.
2. Click **New role** (top-right).
3. Fill in:
   - **Role name** — must be unique within your workspace.
   - **Description** — what this role does.
   - **Color tag** — pick a color to identify the role in lists.
4. For each module, pick a permission level:
   - **None** — module hidden from this role.
   - **View** — read-only.
   - **Execute** — can run analyses, generate content, schedule posts.
   - **Manage** — full CRUD.
5. Click **Create role**.

**Best practices:**
- Start by cloning a built-in role (click the pencil icon) and modifying it.
- Don't grant `manage` on `billing` or `roles` to specialists — that's an admin-only power.
- Use `view` liberally for stakeholders who just need to see dashboards.

---

## SOP 4 — Running an SEO audit

**Who:** Anyone with `seo: execute` or higher
**When:** Before optimizing any web page

1. Click **SEO Analyzer** in the sidebar.
2. Enter the URL you want to audit (e.g. `https://example.com/blog/post-1`).
3. Click **Run audit**.
4. Wait 20–30 seconds while the audit runs.
5. Review the results:
   - **Overall score** (0-100) — your SEO health at a glance.
   - **Per-category scores** — performance, SEO, accessibility, best practices, content, mobile.
   - **Meta info** — title, description, canonical, robots, OG tags.
   - **Headings** — H1, H2, H3 inventory.
   - **Keyword density** — top keywords with count and density %.
   - **Findings** — categorized as critical / warning / info / passed, each with a recommendation.
   - **Missing analytics** — GA, GTM, FB pixel, etc. that aren't installed.
6. To save the report, click **Save to history**. It will appear in the report history sidebar.
7. To export, click **Export PDF**.

**Credit cost:** 5 AI credits per audit.

---

## SOP 5 — Composing and scheduling a social post

**Who:** Anyone with `social: execute` or higher
**When:** Daily content workflow

1. Click **Social Marketing** in the sidebar.
2. Pick the platform (X, LinkedIn, FB, IG, YT, TikTok, Pinterest).
3. Enter a brief or topic (e.g. "Launch of our new AI feature for SEO audits").
4. Click **Generate**. AI returns 3 variations.
5. Pick one, edit as needed.
6. Click **Generate hashtags**. AI returns relevant hashtags.
7. Pick the hashtags you want.
8. To schedule:
   - Click **Schedule**.
   - Pick date and time.
   - Pick additional platforms (cross-post).
   - Click **Confirm**.
9. The post appears in the **Scheduler** module with status `scheduled`.

**Credit cost:** 2 AI credits per generation.

---

## SOP 6 — Using the Scheduler

**Who:** Anyone with `scheduler: view` or higher
**When:** Daily / weekly planning

1. Click **Scheduler** in the sidebar.
2. Default view is **Week view** (calendar grid).
3. Filter by platform or status using the dropdowns at the top.
4. To move a post: drag and drop it to a new time slot.
5. To edit a post: click it → modal opens → edit → save.
6. To delete: click the post → click **Delete**.
7. To switch to list view: click **List view** tab at the top.

**Statuses:**
- `draft` — created but not scheduled.
- `scheduled` — has a future publish time.
- `published` — was successfully posted.
- `failed` — posting failed (will show error reason).

---

## SOP 7 — Generating marketing images

**Who:** Anyone with `images: execute` or higher
**When:** Need visual assets for campaigns

1. Click **Image Studio** in the sidebar.
2. Enter a prompt (e.g. "Flat-lay of skincare products on marble background, soft natural light, minimal styling").
3. Pick a style preset: Photorealistic / Illustration / 3D Render / Watercolor / Logo / Icon set.
4. Pick an aspect ratio: 1:1, 16:9, 9:16, 4:5.
5. Click **Generate**. Wait ~10-15 seconds.
6. Image appears in your gallery.
7. To download: click the image → **Download**.
8. To reuse: click **Copy prompt** to regenerate a similar one.

**Credit cost:** 8 AI credits per image.

---

## SOP 8 — Creating a marketing video

**Who:** Anyone with `videos: execute` or higher
**When:** Need a promo / explainer / social-short video

1. Click **Video Studio** in the sidebar.
2. Click **New project**.
3. Enter:
   - Title
   - Script (or brief — AI will expand it)
   - Style: Promo / Explainer / Social-short / Tutorial / Testimonial
   - Aspect ratio: 16:9 / 9:16 / 1:1 / 4:5
4. Click **Generate storyboard**. AI returns 3–5 scenes with text + visual description.
5. Edit scenes as needed.
6. Click **Render video**. Wait for rendering to complete.
7. Preview the video.
8. Download or push to Scheduler as a scheduled social post.

**Credit cost:** 25 AI credits per video.

---

## SOP 9 — Sending an email campaign

**Who:** Anyone with `email: execute` or higher
**When:** Newsletter, product launch, lifecycle campaign

1. Click **Email Automation** in the sidebar.
2. Click **New campaign**.
3. Fill in:
   - Campaign name
   - Subject line (or click **AI generate** for 3 options)
   - Preview text
   - From name
   - Body HTML (or click **AI generate** from a brief)
   - Audience segment
4. Click **Save draft**.
5. Preview the email.
6. To schedule: pick date/time → click **Schedule**.
7. To send now: click **Send now**.
8. After sending, the campaign shows open rate, click rate, unsubscribe rate.

**Credit cost:** 2 AI credits per AI generation. Sending itself is free.

---

## SOP 10 — Analyzing a competitor website

**Who:** Anyone with `analyzer: execute` or higher
**When:** Competitive intelligence, market research

1. Click **Website Analyzer** in the sidebar.
2. Enter the competitor URL.
3. Click **Analyze**.
4. Review:
   - **Tech stack** — what tools they use (with confidence scores).
   - **Performance** — LCP, CLS, FCP, TTFB, speed index.
   - **Traffic** — monthly visits, change %, avg duration, bounce rate.
   - **Traffic sources** — direct / search / social / referral / paid.
   - **Top pages** — what's driving their traffic.
   - **Keywords** — what they rank for, with position and volume.
   - **Competitors** — sites with audience overlap.
   - **Missing features** — what they don't have that you could capitalize on.
   - **Recommendations** — prioritized actions for your own site.
5. Save to history for future reference.

**Credit cost:** 10 AI credits per analysis.

---

## SOP 11 — Testing an AI tool

**Who:** Anyone with `ai-testing: execute` or higher (Scale plan and above only)
**When:** Evaluating AI tools for purchase, benchmarking, vendor comparison

The AI Testing module has 3 tabs: **Test Runner**, **Playbook**, and **Module Reports**.

### 11.1 — Run a test suite (Test Runner tab)

1. Click **AI Tool Testing** in the sidebar → **Test Runner** tab.
2. Fill in:
   - Tool name (e.g. "ChatGPT 4o")
   - Tool URL
   - Tool type: Chatbot / Image-gen / Video-gen / Agent / RAG / Code-assistant / Voice / Other
   - Focus areas (optional): All categories, Accuracy & hallucination, Latency & cost, Safety & refusal, Reasoning, Multilingual, Context handling, Output diversity
   - Custom test cases (optional): one per line
3. Click **Run test suite**.
4. Wait ~30 seconds while 8-12 test cases run, each tagged with the AI test scenario it maps to.
5. Review the report card:
   - **Overall score** (0-100) and **grade** (A+ to F).
   - **Per-category scores** — accuracy, latency, safety, reasoning, code, cost, diversity, context.
   - **Per-test-case detail** — prompt, expected behavior, actual behavior, pass/partial/fail, latency, scenario tag.
   - **Strengths** and **weaknesses**.
   - **Recommendations** — prioritized improvements or use-case fits.
   - **Benchmark comparison** — how this tool stacks up vs industry averages.
   - **Scenarios covered** — list of AI test scenarios from Marqai's 33-item testing taxonomy.
6. Save to history. Export as PDF for stakeholder review.

**Credit cost:** 50 AI credits per test suite.

### 11.2 — Browse the testing playbook (Playbook tab)

1. Click **AI Tool Testing** → **Playbook** tab.
2. Browse the 33-item QA playbook across 3 categories:
   - **Testing Strategies** (14 items) — WHAT to test: functional, regression, integration, performance, security, accessibility, AI model validation, AI bias, disaster recovery, and more.
   - **Testing Methodologies** (10 items) — HOW to test: Agile sprint, shift-left, manual, API, automation, exploratory, data validation, UAT, production smoke.
   - **AI-Specific Test Scenarios** (9 items) — Concrete AI test cases: recommendation relevance, semantic search, chatbot correctness, prompt injection, personalization, duplicate detection, latency, feedback learning, AI fallback.
3. Click any item to expand it — see description, examples, pass criteria, when-in-SDLC it runs.
4. Use this tab to plan a comprehensive QA strategy for any AI platform, AI tool, or AI-powered software.

**Credit cost:** 0 (read-only).

### 11.3 — Check live QA status (Module Reports tab)

1. Click **AI Tool Testing** → **Module Reports** tab.
2. UI auto-loads from `GET /api/marqai/module-reports` — probes every AI-powered module's endpoint in parallel.
3. Review summary KPIs: total modules, AI working (live count), avg functional coverage, open issues.
4. For each of the 17 modules, see:
   - Module name + category (AI-powered / Integration / CRUD / Informational)
   - Functional coverage % (progress bar)
   - AI integration status: works / fallback / broken / n/a
   - Smoke test status: pass / fail / n/a
   - Open issues count
   - Applicable Testing Strategies + AI Test Scenarios (as tags)
   - Notes explaining what the module does + any known issues
5. Click **Re-probe** to re-run the live AI endpoint check.
6. Use this tab to identify which modules need attention, which AI endpoints are down, and which strategies apply to each module.

**Credit cost:** 0 (read-only — uses tiny ping calls, not full AI generations).

---

## SOP 12 — Upgrading or downgrading your plan

**Who:** Org Owner or anyone with `billing: manage`
**When:** Outgrowing current plan, or cutting costs

1. Click **Subscription** in the sidebar.
2. Review your current usage (seats, AI credits).
3. Scroll to the plan catalog.
4. To **upgrade**: click **Upgrade** on the target plan → confirm proration → done.
5. To **downgrade**: click **Downgrade** → confirm → change takes effect at end of billing cycle.
6. To **cancel**: click **Cancel subscription** → confirm → account becomes read-only at end of cycle.

**Proration:** Upgrades are charged immediately, prorated for the remainder of the cycle. Downgrades are free but take effect at the end of the cycle — you keep access to higher-tier features until then.

---

## SOP 13 — Switching role (for demo / Super Admin)

**Who:** Super Admin only
**When:** Testing the app from another role's perspective

1. Sign in as Super Admin (`superadmin@marqai.app` / `super1234`).
2. Click the user menu (top-right).
3. Click **Switch role**.
4. Pick any role from any organization.
5. The app reloads with that role's permissions.
6. To switch back: click the user menu → **Exit impersonation**.

**Audit:** Every impersonation is logged.

---

## SOP 14 — Reading the Wiki / Docs

**Who:** Anyone with `wiki: view` (default for all roles)

1. Click **Wiki / Docs** in the sidebar.
2. Pick a document from the left nav:
   - Functional documentation
   - Technical documentation
   - Developer documentation
   - User SOPs (this document)
   - Role-wise documentation
   - Billing & subscription guide
   - API reference
3. Use the search bar to find specific terms.
4. Click **Print** for a printable version.

---

## SOP 15 — Logging out

1. Click your avatar (top-right).
2. Click **Sign out**.
3. You return to the login screen.

**Session timeout:** Sessions expire after 30 days of inactivity.
