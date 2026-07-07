// Marqai — SaaS plan catalog + billing seed data

import type { Plan, PlanSlug, ModuleId } from "./types";

// ============================================================
// MODULE CATALOG — used for permission matrix UI
// ============================================================

export interface ModuleCatalogEntry {
  id: ModuleId;
  label: string;
  group: "System" | "Marketing" | "Creative" | "Outreach" | "Analysis" | "Administration";
  description: string;
  /** Whether this module is gated to higher-tier plans. */
  minPlan: PlanSlug;
}

export const MODULE_CATALOG: ModuleCatalogEntry[] = [
  { id: "dashboard",                label: "Dashboard",                group: "System",         description: "Overview & KPIs",                        minPlan: "starter" },
  { id: "seo",                      label: "SEO Analyzer",             group: "Analysis",       description: "Audit any URL",                          minPlan: "starter" },
  { id: "social",                   label: "Social Marketing",         group: "Marketing",      description: "Multi-platform posting",                 minPlan: "starter" },
  { id: "scheduler",                label: "Scheduler",                group: "Marketing",      description: "Daily content calendar",                 minPlan: "starter" },
  { id: "email",                    label: "Email Automation",         group: "Outreach",       description: "Campaigns & flows",                      minPlan: "starter" },
  { id: "images",                   label: "Image Studio",             group: "Creative",       description: "AI image generation",                    minPlan: "growth"  },
  { id: "videos",                   label: "Video Studio",             group: "Creative",       description: "AI marketing videos",                    minPlan: "growth"  },
  { id: "analyzer",                 label: "Website Analyzer",         group: "Analysis",       description: "Deep portal analysis",                   minPlan: "growth"  },
  { id: "logo-builder",             label: "Logo Builder",             group: "Creative",       description: "AI logos + SVG templates",               minPlan: "growth"  },
  { id: "website-builder",          label: "Website Builder",          group: "Creative",       description: "AI landing pages",                       minPlan: "growth"  },
  { id: "leads-generator",          label: "Leads Generator",          group: "Outreach",       description: "AI prospect lists per product",          minPlan: "scale"   },
  { id: "sales-agents",             label: "AI Sales Agents",          group: "Outreach",       description: "Conversational sales suite (BANT/MEDDIC)", minPlan: "scale"   },
  { id: "whatsapp",                 label: "WhatsApp Marketing",       group: "Outreach",       description: "Broadcasts, templates, contacts, API",   minPlan: "scale"   },
  { id: "ai-testing",               label: "AI Tool Testing",          group: "Analysis",       description: "Grade any AI tool",                      minPlan: "scale"   },
  { id: "ai-testing-methodologies", label: "AI Testing Methodologies", group: "Analysis",       description: "QA playbook for any AI platform",        minPlan: "starter" },
  { id: "non-ai-testing",           label: "Non-AI Testing Methodologies", group: "Analysis",    description: "QA playbook for non-AI software",        minPlan: "starter" },
  { id: "bug-tracker",              label: "Bug Tracker",              group: "Analysis",       description: "Bugzilla-style defect tracker (AI + non-AI)", minPlan: "starter" },
  { id: "team",                     label: "Team Management",          group: "Administration", description: "Invite & manage members",                minPlan: "starter" },
  { id: "roles",                    label: "Role Master",              group: "Administration", description: "Create custom roles",                    minPlan: "starter" },
  { id: "billing",                  label: "Subscription",             group: "Administration", description: "Plan, usage & invoices",                 minPlan: "starter" },
  { id: "reports",                  label: "Module Reports",           group: "Administration", description: "QA coverage & AI health per module",     minPlan: "starter" },
  { id: "wiki",                     label: "Wiki / Docs",              group: "System",         description: "Functional & technical docs",            minPlan: "starter" },
  { id: "settings",                 label: "Settings",                 group: "System",         description: "Brand & integrations",                   minPlan: "starter" },
];

// ============================================================
// PLAN CATALOG
// ============================================================

export const PLANS: Plan[] = [
  {
    slug: "starter",
    name: "Starter",
    pricePerMonth: 49,
    seats: 3,
    aiCredits: 1000,
    trialDays: 14,
    description: "For solo marketers and small teams getting started with AI marketing.",
    modules: ["dashboard", "seo", "social", "scheduler", "email", "team", "roles", "billing", "reports", "ai-testing-methodologies", "non-ai-testing", "bug-tracker", "wiki", "settings"],
    features: [
      "3 team members",
      "1,000 AI credits / month",
      "SEO, Social, Scheduler, Email",
      "Daily content calendar",
      "Email automation (2 flows)",
      "AI + Non-AI testing methodologies",
      "Bug tracker for QA",
      "Community support",
    ],
  },
  {
    slug: "growth",
    name: "Growth",
    pricePerMonth: 149,
    seats: 10,
    aiCredits: 5000,
    trialDays: 14,
    popular: true,
    description: "For growing marketing teams that need creative production at scale.",
    modules: ["dashboard", "seo", "social", "scheduler", "email", "images", "videos", "analyzer", "logo-builder", "website-builder", "team", "roles", "billing", "reports", "ai-testing-methodologies", "non-ai-testing", "bug-tracker", "wiki", "settings"],
    features: [
      "10 team members",
      "5,000 AI credits / month",
      "Everything in Starter",
      "AI Image Studio",
      "AI Video Studio",
      "Website Analyzer",
      "AI Logo Builder",
      "AI Website Builder",
      "Priority email support",
    ],
  },
  {
    slug: "scale",
    name: "Scale",
    pricePerMonth: 399,
    seats: 25,
    aiCredits: 20000,
    trialDays: 14,
    description: "For agencies and enterprises that also test & benchmark AI tools.",
    modules: ["dashboard", "seo", "social", "scheduler", "email", "images", "videos", "analyzer", "logo-builder", "website-builder", "leads-generator", "sales-agents", "whatsapp", "ai-testing", "ai-testing-methodologies", "non-ai-testing", "bug-tracker", "reports", "team", "roles", "billing", "wiki", "settings"],
    features: [
      "25 team members",
      "20,000 AI credits / month",
      "Everything in Growth",
      "AI Leads Generator",
      "AI Sales Agents (BANT/MEDDIC)",
      "WhatsApp Marketing",
      "AI Tool Testing module",
      "Non-AI testing methodologies",
      "Bug tracker (Bugzilla-style)",
      "Custom role master",
      "Advanced audit logs",
      "Dedicated success manager",
    ],
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    pricePerMonth: 0, // contact sales
    seats: 999,
    aiCredits: 100000,
    trialDays: 30,
    description: "For large organizations with custom SSO, security, and volume needs.",
    modules: ["dashboard", "seo", "social", "scheduler", "email", "images", "videos", "analyzer", "logo-builder", "website-builder", "leads-generator", "sales-agents", "whatsapp", "ai-testing", "ai-testing-methodologies", "non-ai-testing", "bug-tracker", "reports", "team", "roles", "billing", "wiki", "settings"],
    features: [
      "Unlimited team members",
      "Custom AI credits",
      "Everything in Scale",
      "SSO / SAML",
      "Custom data residency",
      "Dedicated infrastructure",
      "24/7 phone support",
      "Custom SLA",
    ],
  },
];

// ============================================================
// STRIPE PRICE ID MAP
// ------------------------------------------------------------
// Populate STRIPE_PRICE_ID_* env vars in production to enable
// real checkout. The keys below map a plan slug to its Stripe
// recurring Price ID (price_xxx). When unset, the billing UI
// falls back to a simulated in-memory upgrade.
// ============================================================

export function stripePriceIdFor(slug: PlanSlug): string | null {
  const env: Record<PlanSlug, string | undefined> = {
    starter: process.env.STRIPE_PRICE_ID_STARTER,
    growth: process.env.STRIPE_PRICE_ID_GROWTH,
    scale: process.env.STRIPE_PRICE_ID_SCALE,
    enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE,
  };
  return env[slug] ?? null;
}

export function isStripeConfigured(): boolean {
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    stripePriceIdFor("growth")
  );
}

export function getPlan(slug: PlanSlug): Plan {
  return PLANS.find((p) => p.slug === slug) ?? PLANS[0];
}

export function isModuleInPlan(moduleId: ModuleId, planSlug: PlanSlug): boolean {
  const plan = getPlan(planSlug);
  return plan.modules.includes(moduleId);
}

// ============================================================
// SEEDED BUILT-IN ROLES (per Organization)
// ============================================================

export interface BuiltInRoleSeed {
  name: string;
  description: string;
  color: string;
  isLocked?: boolean;
  permissions: Partial<Record<ModuleId, "none" | "view" | "execute" | "manage">>;
}

export const BUILT_IN_ROLES: BuiltInRoleSeed[] = [
  {
    name: "Org Owner",
    description: "Full control of the organization, billing, and all modules.",
    color: "emerald",
    isLocked: true,
    permissions: {
      dashboard: "manage",
      seo: "manage",
      social: "manage",
      scheduler: "manage",
      images: "manage",
      videos: "manage",
      email: "manage",
      analyzer: "manage",
      "logo-builder": "manage",
      "website-builder": "manage",
      "leads-generator": "manage",
      "sales-agents": "manage",
      "whatsapp": "manage",
      "ai-testing": "manage",
      "ai-testing-methodologies": "manage",
      "non-ai-testing": "manage",
      "bug-tracker": "manage",
      reports: "manage",
      team: "manage",
      roles: "manage",
      billing: "manage",
      wiki: "manage",
      settings: "manage",
    },
  },
  {
    name: "Marketing Manager",
    description: "Manages all marketing modules end-to-end. Read-only on AI tool testing.",
    color: "teal",
    permissions: {
      dashboard: "manage",
      seo: "manage",
      social: "manage",
      scheduler: "manage",
      images: "manage",
      videos: "manage",
      email: "manage",
      analyzer: "manage",
      "logo-builder": "manage",
      "website-builder": "manage",
      "leads-generator": "execute",
      "sales-agents": "manage",
      "whatsapp": "manage",
      "ai-testing": "view",
      "ai-testing-methodologies": "view",
      "non-ai-testing": "view",
      "bug-tracker": "view",
      reports: "view",
      team: "view",
      roles: "none",
      billing: "view",
      wiki: "view",
      settings: "view",
    },
  },
  {
    name: "SEO Specialist",
    description: "Runs SEO audits, competitor analysis, and keyword research.",
    color: "amber",
    permissions: {
      dashboard: "view",
      seo: "manage",
      social: "none",
      scheduler: "view",
      images: "none",
      videos: "none",
      email: "none",
      analyzer: "manage",
      "logo-builder": "none",
      "website-builder": "none",
      "leads-generator": "none",
      "sales-agents": "none",
      "whatsapp": "none",
      "ai-testing": "none",
      "ai-testing-methodologies": "view",
      "non-ai-testing": "view",
      "bug-tracker": "view",
      reports: "view",
      team: "none",
      roles: "none",
      billing: "none",
      wiki: "view",
      settings: "view",
    },
  },
  {
    name: "Social Media Manager",
    description: "Owns social posting, scheduling, and creative production.",
    color: "rose",
    permissions: {
      dashboard: "view",
      seo: "view",
      social: "manage",
      scheduler: "manage",
      images: "manage",
      videos: "manage",
      email: "none",
      analyzer: "view",
      "logo-builder": "execute",
      "website-builder": "none",
      "leads-generator": "none",
      "sales-agents": "none",
      "whatsapp": "execute",
      "ai-testing": "none",
      "ai-testing-methodologies": "view",
      "non-ai-testing": "view",
      "bug-tracker": "execute",
      reports: "view",
      team: "none",
      roles: "none",
      billing: "none",
      wiki: "view",
      settings: "view",
    },
  },
  {
    name: "Email Marketer",
    description: "Builds and sends email campaigns and automation flows.",
    color: "violet",
    permissions: {
      dashboard: "view",
      seo: "none",
      social: "view",
      scheduler: "manage",
      images: "view",
      videos: "none",
      email: "manage",
      analyzer: "none",
      "logo-builder": "none",
      "website-builder": "none",
      "leads-generator": "execute",
      "sales-agents": "execute",
      "whatsapp": "manage",
      "ai-testing": "none",
      "ai-testing-methodologies": "view",
      "non-ai-testing": "view",
      "bug-tracker": "execute",
      reports: "view",
      team: "none",
      roles: "none",
      billing: "none",
      wiki: "view",
      settings: "view",
    },
  },
  {
    name: "AI QA Analyst",
    description: "Tests AI tools and benchmarks against industry standards.",
    color: "cyan",
    permissions: {
      dashboard: "view",
      seo: "none",
      social: "none",
      scheduler: "none",
      images: "none",
      videos: "none",
      email: "none",
      analyzer: "view",
      "logo-builder": "none",
      "website-builder": "none",
      "leads-generator": "none",
      "sales-agents": "none",
      "whatsapp": "none",
      "ai-testing": "manage",
      "ai-testing-methodologies": "manage",
      "non-ai-testing": "manage",
      "bug-tracker": "manage",
      reports: "manage",
      team: "none",
      roles: "none",
      billing: "none",
      wiki: "view",
      settings: "view",
    },
  },
  {
    name: "Developer",
    description: "Debugs bugs in the Bug Tracker. Read-only on marketing modules.",
    color: "indigo",
    permissions: {
      dashboard: "view",
      seo: "view",
      social: "view",
      scheduler: "view",
      images: "view",
      videos: "view",
      email: "view",
      analyzer: "view",
      "logo-builder": "view",
      "website-builder": "view",
      "leads-generator": "view",
      "sales-agents": "view",
      "whatsapp": "view",
      "ai-testing": "view",
      "ai-testing-methodologies": "view",
      "non-ai-testing": "view",
      "bug-tracker": "manage",
      reports: "view",
      team: "none",
      roles: "none",
      billing: "none",
      wiki: "view",
      settings: "view",
    },
  },
  {
    name: "Sales Development Rep",
    description: "Uses AI Leads Generator to build prospect lists and qualify leads.",
    color: "amber",
    permissions: {
      dashboard: "view",
      seo: "none",
      social: "none",
      scheduler: "none",
      images: "none",
      videos: "none",
      email: "execute",
      analyzer: "none",
      "logo-builder": "none",
      "website-builder": "none",
      "leads-generator": "manage",
      "sales-agents": "manage",
      "whatsapp": "execute",
      "ai-testing": "none",
      "ai-testing-methodologies": "view",
      "non-ai-testing": "view",
      "bug-tracker": "execute",
      reports: "view",
      team: "none",
      roles: "none",
      billing: "none",
      wiki: "view",
      settings: "view",
    },
  },
  {
    name: "Viewer",
    description: "Read-only access to all unlocked modules. Ideal for stakeholders.",
    color: "slate",
    permissions: {
      dashboard: "view",
      seo: "view",
      social: "view",
      scheduler: "view",
      images: "view",
      videos: "view",
      email: "view",
      analyzer: "view",
      "logo-builder": "view",
      "website-builder": "view",
      "leads-generator": "view",
      "sales-agents": "view",
      "whatsapp": "view",
      "ai-testing": "view",
      "ai-testing-methodologies": "view",
      "non-ai-testing": "view",
      "bug-tracker": "view",
      reports: "view",
      team: "none",
      roles: "none",
      billing: "none",
      wiki: "view",
      settings: "view",
    },
  },
];
