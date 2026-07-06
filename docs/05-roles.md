# Marqai — Role-wise Documentation

> One section per role. Each section lists: who this role is for, what they can do, what they cannot do, and a typical day in the role.

---

## 1. Super Admin (Platform-level)

### Who
Marqai platform staff. There is typically 1–3 Super Admins total. This role is NOT bound to any Organization.

### Can do
- Bypass all permission checks across all Organizations.
- Create new Organizations (provision new customers).
- Provision, suspend, or revoke any Organization's subscription.
- Create, edit, or delete any role in any Organization.
- View cross-tenant analytics (platform-wide KPIs).
- Impersonate any user in any Organization (for support).
- Manage the global plan catalog (pricing, features, trial length).
- View all audit logs across all Organizations.

### Cannot do
- Be blocked by any module permission (always full access).
- Be deleted from the platform (only by another Super Admin).

### Typical day
1. Open the platform dashboard — see total MRR, active orgs, churn, AI credit consumption.
2. Review new signups from yesterday.
3. Reach out to trial customers at day 12 to offer upgrade help.
4. Investigate a support ticket → impersonate the customer's Org Owner (audit-logged) → debug.
5. Exit impersonation. Reply to the ticket.
6. Review audit logs for any suspicious activity.

---

## 2. Org Owner

### Who
The customer who owns the subscription. Usually the marketing agency founder or the in-house marketing director. Created with the Organization.

### Can do
- Everything any other role can do, plus:
- Manage billing (upgrade, downgrade, cancel, view invoices).
- Create, edit, delete custom roles (Role Master).
- Invite, remove, reassign team members.
- Configure brand identity and integrations.
- View the org's audit log.

### Cannot do
- Create or delete other Organizations.
- View cross-org data.
- Delete the Org Owner role (locked).
- Remove themselves if they are the only Org Owner.

### Typical day
1. Check the Dashboard for yesterday's KPIs.
2. Review scheduled posts for the day in Scheduler.
3. Reply to a thread from the Social Media Manager about an underperforming post.
4. Invite a new contractor (SEO Specialist role).
5. Review this month's AI credit usage — decide whether to upgrade from Growth to Scale.
6. Run an AI Tool Testing report on a vendor they're considering.

---

## 3. Marketing Manager

### Who
The day-to-day head of marketing inside the customer org. Reports to the Org Owner.

### Can do
- All marketing modules with `manage` permission:
  - Dashboard, SEO, Social, Scheduler, Image, Video, Email, Analyzer
- AI Tool Testing: view only (cannot run new tests).
- Team Management: view only.
- Subscription: view only.
- Wiki: view.
- Settings: view only.

### Cannot do
- Create or edit roles (Role Master hidden).
- Upgrade or cancel the subscription.
- Change brand identity or integrations.
- Delete other team members.

### Typical day
1. Open Dashboard — review week-over-week KPIs.
2. Run a quick SEO audit on a competitor's landing page.
3. Review the content calendar for the week — drag a few posts to better time slots.
4. Generate a new image for the launch campaign.
5. Approve the email campaign draft from the Email Marketer.
6. Brief the Social Media Manager on next week's content themes.

---

## 4. SEO Specialist

### Who
An in-house or contractor SEO expert.

### Can do
- SEO Analyzer: `manage` (run audits, save reports, export).
- Website Analyzer: `manage` (deep portal analysis).
- Dashboard: `view`.
- Scheduler: `view` (see what's scheduled, no editing).
- Wiki: `view`.
- Settings: `view`.

### Cannot do
- Social Marketing, Email, Image, Video modules — all hidden.
- AI Tool Testing — hidden.
- Team / Role / Billing — hidden.

### Typical day
1. Open SEO Analyzer.
2. Run audits on 5 target URLs.
3. Review findings, prioritize by impact.
4. Open Website Analyzer on the top competitor.
5. Pull keyword gap analysis.
6. Write a brief for the content team based on findings.
7. Save all reports to history for the weekly sync.

---

## 5. Social Media Manager

### Who
Owns social posting end-to-end.

### Can do
- Social Marketing: `manage`.
- Scheduler: `manage` (drag, edit, delete posts).
- Image Studio: `manage` (generate images for posts).
- Video Studio: `manage` (generate social-shorts).
- Dashboard: `view`.
- SEO: `view` (read audits run by others).
- Analyzer: `view`.
- Wiki: `view`.
- Settings: `view`.

### Cannot do
- Email Automation — hidden.
- AI Tool Testing — hidden.
- Team / Role / Billing — hidden.

### Typical day
1. Open Scheduler — week view.
2. See what's queued for today.
3. Open Social Marketing → generate 3 posts for the morning slots.
4. Generate images for each post in Image Studio.
5. Schedule them.
6. Reply to comments / DMs (outside Marqai, in the social platform).
7. Generate a 15-second social-short video for an upcoming product launch.

---

## 6. Email Marketer

### Who
Owns email campaigns and lifecycle automations.

### Can do
- Email Automation: `manage` (campaigns + flows).
- Scheduler: `manage` (email schedule is part of content calendar).
- Image Studio: `view` (use existing images, not generate new ones).
- Dashboard: `view`.
- Social: `view`.
- Wiki: `view`.
- Settings: `view`.

### Cannot do
- SEO, Video, Analyzer, AI Testing — hidden.
- Team / Role / Billing — hidden.

### Typical day
1. Open Email Automation.
2. Draft this week's newsletter — use AI to generate subject line + body.
3. Pick an image from the existing gallery.
4. Send a test to yourself.
5. Schedule for Tuesday 10am.
6. Review last week's campaign metrics — open rate, click rate.
7. Tweak the welcome automation flow (add a new wait step).

---

## 7. AI QA Analyst

### Who
Tests AI tools for the agency's clients or for internal procurement.

### Can do
- AI Tool Testing: `manage` (run tests, save reports, export).
- Dashboard: `view`.
- Website Analyzer: `view`.
- Wiki: `view`.
- Settings: `view`.

### Cannot do
- All marketing modules (SEO, Social, Email, Image, Video) — hidden.
- Scheduler — hidden.
- Team / Role / Billing — hidden.

### Typical day
1. Open AI Tool Testing.
2. A client asked you to evaluate 3 AI tools (ChatGPT 4o, Claude Sonnet, Gemini Pro) for a customer support use case.
3. Run the test suite on all three (each takes ~3 min).
4. Compare the report cards side by side.
5. Export a combined PDF for the client.
6. Write a recommendation memo based on strengths/weaknesses.

---

## 8. Viewer (Read-only stakeholder)

### Who
CMO, founder, investor, or client who needs visibility but no editing power.

### Can do
- All unlocked modules with `view` permission:
  - Dashboard, SEO, Social, Scheduler, Image, Video, Email, Analyzer, AI Testing
- Wiki: `view`.
- Settings: `view`.

### Cannot do
- Run any AI operation (no `execute` permission).
- Edit, create, or delete anything.
- See Team, Role, or Billing modules.

### Typical day
1. Open Dashboard.
2. Glance at the KPIs.
3. Open Scheduler to see what's publishing this week.
4. Open Email Automation → review last campaign's metrics.
5. Open the latest AI Tool Testing report.
6. Close the tab. Done.

---

## 9. Custom Role Example — "Performance Marketer"

This is an example of a custom role you might create in Role Master. It is NOT built-in — it's a template for inspiration.

### Who
A paid-ads specialist who runs paid social + email + analytics, but doesn't do SEO or AI testing.

### Permission matrix

| Module             | Permission |
| ------------------ | ---------- |
| Dashboard          | manage     |
| SEO Analyzer       | none       |
| Social Marketing   | manage     |
| Scheduler          | manage     |
| Email Automation   | manage     |
| Image Studio       | execute    |
| Video Studio       | none       |
| Website Analyzer   | view       |
| AI Tool Testing    | none       |
| Team Management    | none       |
| Role Master        | none       |
| Subscription       | none       |
| Wiki / Docs        | view       |
| Settings           | view       |

### Use case
This role fits an agency where one person handles paid social campaigns and email blasts, while SEO is handled by a different specialist.

---

## 10. Permission Quick Reference

| Module             | Super Admin | Org Owner | Mktg Mgr | SEO Spec | Social Mgr | Email Mgr | AI QA | Viewer |
| ------------------ | ----------- | --------- | -------- | -------- | ---------- | --------- | ----- | ------ |
| Dashboard          | manage      | manage    | manage   | view     | view       | view      | view  | view   |
| SEO Analyzer       | manage      | manage    | manage   | manage   | view       | none      | none  | view   |
| Social Marketing   | manage      | manage    | manage   | none     | manage     | view      | none  | view   |
| Scheduler          | manage      | manage    | manage   | view     | manage     | manage    | none  | view   |
| Image Studio       | manage      | manage    | manage   | none     | manage     | view      | none  | view   |
| Video Studio       | manage      | manage    | manage   | none     | manage     | none      | none  | view   |
| Email Automation   | manage      | manage    | manage   | none     | none       | manage    | none  | view   |
| Website Analyzer   | manage      | manage    | manage   | manage   | view       | none      | view  | view   |
| AI Tool Testing    | manage      | manage    | view     | none     | none       | none      | manage| view   |
| Team Management    | manage      | manage    | view     | none     | none       | none      | none  | none   |
| Role Master        | manage      | manage    | none     | none     | none       | none      | none  | none   |
| Subscription       | manage      | manage    | view     | none     | none       | none      | none  | none   |
| Wiki / Docs        | manage      | manage    | view     | view     | view       | view      | view  | view   |
| Settings           | manage      | manage    | view     | view     | view       | view      | view  | view   |

---

## 9. v2.1 Role Updates

### 9.1 New built-in role: Sales Development Rep

| Module | Permission |
| --- | --- |
| Dashboard | view |
| Email | execute |
| Leads Generator | manage |
| Wiki / Docs | view |
| Settings | view |

**Use case:** Sales reps who need to build prospect lists with the AI Leads Generator, then queue outreach emails. They cannot modify billing, roles, or team membership.

**Demo account:** `nikhil@acme-marketing.com` / `demo1234`

### 9.2 New module permissions added to existing roles

| Role | logo-builder | website-builder | leads-generator |
| --- | --- | --- | --- |
| Org Owner | manage | manage | manage |
| Marketing Manager | manage | manage | execute |
| SEO Specialist | none | none | none |
| Social Media Manager | execute | none | none |
| Email Marketer | none | none | execute |
| AI QA Analyst | none | none | none |
| Sales Development Rep | none | none | manage |
| Viewer | view | view | view |

### 9.3 Plan gating

| Module | Min plan |
| --- | --- |
| Logo Builder | Growth |
| Website Builder | Growth |
| Leads Generator | Scale |

A user with `manage` permission on Leads Generator but on the Growth plan will see a "Upgrade to unlock" screen instead of the module. Plan gating takes precedence over role permissions.
