# Marqai — Billing & Subscription Guide

> Audience: Org Owners, Finance teams, Customer Success.

This document covers everything you need to know about pricing, billing cycles, trials, refunds, and overages.

---

## 1. Plan Catalog

### Starter — $49/month

**For:** Solo marketers and small teams getting started with AI marketing.

- 3 team seats
- 1,000 AI credits / month
- Modules: Dashboard, SEO Analyzer, Social Marketing, Scheduler, Email Automation, Team, Role Master, Subscription, Wiki, Settings
- 14-day free trial
- Community support

### Growth — $149/month (most popular)

**For:** Growing marketing teams that need creative production at scale.

- 10 team seats
- 5,000 AI credits / month
- Everything in Starter, plus:
  - AI Image Studio
  - AI Video Studio
  - Website Analyzer
- Priority email support

### Scale — $399/month

**For:** Agencies and enterprises that also test & benchmark AI tools.

- 25 team seats
- 20,000 AI credits / month
- Everything in Growth, plus:
  - AI Tool Testing module (40+ test cases per tool)
  - Custom Role Master (unlimited custom roles)
  - Advanced audit logs
- Dedicated success manager

### Enterprise — Contact sales

**For:** Large organizations with custom SSO, security, and volume needs.

- Unlimited team seats
- Custom AI credits
- Everything in Scale, plus:
  - SSO / SAML
  - Custom data residency
  - Dedicated infrastructure
  - 24/7 phone support
  - Custom SLA
- 30-day free trial

---

## 2. AI Credit Costs

Every AI operation consumes credits. Credits reset on the first day of each billing cycle.

| Operation              | Credits |
| ---------------------- | ------- |
| SEO audit              | 5       |
| Website analysis       | 10      |
| Image generation       | 8       |
| Video generation       | 25      |
| Content generation     | 2       |
| Hashtag generation     | 1       |
| Email subject AI       | 1       |
| Email body AI          | 2       |
| Video storyboard AI    | 3       |
| AI tool test suite     | 50      |

**Examples:**
- A typical week for a Growth plan team: 10 SEO audits (50) + 20 image gens (160) + 50 content gens (100) + 1 video (25) + 1 website analysis (10) = 345 credits. Well within 5,000.
- A Scale plan team running 5 AI tool tests/week = 250 credits/week = 1,000/month. Plus normal marketing usage ~2,000. Total ~3,000 of 20,000.

---

## 3. Billing Cycle

- Billing cycle = 1 month, starting from the day you add billing details.
- Cycle renews automatically on the same day each month.
- Example: If you add billing on July 15, your cycle is the 15th of each month.
- Invoice is generated and charged on the cycle start date.
- Failed charges: 3-day grace period, then account suspended.

---

## 4. Trials

- All paid plans (Starter, Growth, Scale): 14-day free trial.
- Enterprise: 30-day free trial.
- No credit card required to start a trial.
- Trial gives full access to the chosen plan's features.
- Trial ends at midnight UTC on day 14 (or 30).
- After trial: account becomes read-only. Add billing to resume.

### Trial reminders

| Day   | Action                                                        |
| ----- | ------------------------------------------------------------ |
| 0     | Trial starts — welcome email                                  |
| 5     | "How's it going?" tips email                                  |
| 10    | "Trial ending in 4 days" reminder                             |
| 12    | "Add billing to keep your data" — final reminder              |
| 14    | Trial ends — account read-only                                |
| +3    | "Last chance — your data will be deleted in 4 days"           |
| +7    | Trial data permanently deleted                                |

---

## 5. Upgrades

### Mid-cycle upgrade

- Upgrade takes effect immediately.
- Prorated charge today = (new_plan_price - old_plan_price) × (days_remaining / days_in_cycle).
- Example: On day 15 of a Growth cycle ($149), you upgrade to Scale ($399). Days remaining = 15. Proration = ($399 - $149) × (15/30) = $125. You're charged $125 today, then $399 on the next cycle start.
- AI credits: your limit immediately jumps to the new plan's limit. Used credits carry over.
- Seats: your limit immediately jumps. If you're over the old limit (e.g. had 10 seats on Growth, upgrading to Scale's 25), nothing breaks.

### Cycle-end downgrade

- Downgrade is queued for the end of the current cycle.
- Until then, you keep full access to the higher-tier features.
- At cycle end: plan changes, AI credit limit drops, modules not in the new plan become hidden (data preserved).
- If you have more team members than the new plan's seat limit: the most recently added members are marked "suspended" until you remove some or upgrade again.

---

## 6. Cancellations

- Cancel anytime from Subscription → Cancel subscription.
- Account remains active until the end of the current billing cycle.
- At cycle end: account becomes read-only. No new AI operations. Existing data is preserved.
- Data retention: 90 days after cancellation. During this window, you can re-subscribe and restore full access.
- After 90 days: all data is permanently deleted (campaigns, reports, scheduled posts, images, videos, audit logs).
- Invoices are retained for 7 years for tax compliance.

---

## 7. Refunds

- **Within 7 days of payment:** Full refund, no questions asked. Email `billing@marqai.app`.
- **After 7 days:** Case-by-case. We evaluate based on usage. If you've used >50% of your AI credits, partial refund. If you've used <50%, full refund minus a $10 processing fee.
- **Trial periods:** Always free, no refund needed.
- **Annual plans (TODO):** Prorated refund for unused months.

---

## 8. Overage Policy

When you exhaust your monthly AI credits:

1. Marqai does NOT stop you — your campaigns continue running.
2. Each additional credit is billed at $0.01.
3. Overages are calculated and charged at the end of the billing cycle.
4. You receive an email when you hit 80%, 90%, and 100% of your credit limit.
5. You can set a "credit hard cap" in Settings → Billing → "Halt AI operations at limit". With this on, AI operations return HTTP 402 instead of running.

**Example:** Growth plan, 5,000 credits included. You use 6,200. Overages = 1,200 × $0.01 = $12. Your next invoice is $149 + $12 = $161.

---

## 9. Annual Plans (TODO — not in current build)

- Pay annually, get 2 months free (12 months for the price of 10).
- Annual plans are non-refundable except for the first 14 days.
- Upgrade from monthly to annual: prorated credit for unused monthly days applied to the annual invoice.

---

## 10. Enterprise Custom Contracts

For Enterprise customers, the standard catalog is a starting point. Custom contracts can include:

- Volume discounts (typically 15–30% off catalog for 100+ seats).
- Custom AI credit pools (e.g. 500,000/month).
- Multi-year commitments (2–3% discount per year).
- Custom SLA (uptime, support response time).
- Custom data residency (EU-only, US-only, India-only).
- White-glove onboarding (dedicated CSM, weekly check-ins).
- Custom integrations (SSO with Okta/Azure AD, custom reporting).

Contact `enterprise@marqai.app` for a custom quote.

---

## 11. Taxes

- US customers: sales tax added based on your state.
- EU customers: VAT added based on your country.
- India customers: GST (18%) added.
- Other: no tax added (your jurisdiction may require self-reporting).
- Tax-exempt organizations (non-profits, educational institutions): email `billing@marqai.app` with your tax-exempt certificate to have tax removed.

---

## 12. Failed Payments & Dunning

If a payment fails:

| Day | Action                                                              |
| --- | ------------------------------------------------------------------ |
| 0   | Payment fails — automatic retry (Vercel/Stripe handles).            |
| 1   | Email: "Payment failed — please update your billing details."       |
| 3   | Account suspended (read-only). Second email.                        |
| 7   | Final email: "Account will be cancelled in 3 days."                 |
| 10  | Subscription cancelled. Data retained 90 days.                      |

To reactivate: log in → Subscription → Update payment method → pay outstanding invoice → account restored.

---

## 13. Billing FAQ

**Q: Can I get a single invoice for multiple Organizations?**
A: Yes, on Enterprise plans. We can consolidate billing across multiple orgs under one parent account. Contact `enterprise@marqai.app`.

**Q: Can I pay by bank transfer instead of card?**
A: Yes, on annual plans >= $5,000. Email `billing@marqai.app`.

**Q: Do you offer discounts for startups or non-profits?**
A: Yes — 30% off for verified non-profits and startups < 2 years old with < $1M funding. Apply at `marqai.app/startup-program`.

**Q: Can I export my invoices for accounting?**
A: Yes — Subscription → Invoice history → Download PDF. All invoices are also emailed to the billing contact.

**Q: What happens to my data if I downgrade and a module becomes hidden?**
A: Your data in that module is preserved for 90 days. If you upgrade again within 90 days, you'll see all your old data. After 90 days of being on a lower plan, the data is archived (still recoverable for Enterprise; deleted for other plans).

**Q: Can I pause my subscription instead of cancelling?**
A: Yes — Subscription → Pause subscription. You can pause for 1–3 months. During the pause, your account is read-only and you're not charged. After the pause, billing resumes automatically.

**Q: How do I change my billing email?**
A: Settings → Billing contact → Update. The new email receives all future invoices.
