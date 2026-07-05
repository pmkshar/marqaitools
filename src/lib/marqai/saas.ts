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
  { id: "dashboard",  label: "Dashboard",        group: "System",         description: "Overview & KPIs",                     minPlan: "starter" },
  { id: "seo",        label: "SEO Analyzer",     group: "Analysis",       description: "Audit any URL",                       minPlan: "starter" },
  { id: "social",     label: "Social Marketing", group: "Marketing",      description: "Multi-platform posting",              minPlan: "starter" },
  { id: "scheduler",  label: "Scheduler",        group: "Marketing",      description: "Daily content calendar",              minPlan: "starter" },
  { id: "email",      label: "Email Automation", group: "Outreach",       description: "Campaigns & flows",                   minPlan: "starter" },
  { id: "images",     label: "Image Studio",     group: "Creative",       description: "AI image generation",                 minPlan: "growth"  },
  { id: "videos",     label: "Video Studio",     group: "Creative",       description: "AI marketing videos",                 minPlan: "growth"  },
  { id: "analyzer",   label: "Website Analyzer", group: "Analysis",       description: "Deep portal analysis",                minPlan: "growth"  },
  { id: "ai-testing", label: "AI Tool Testing",  group: "Analysis",       description: "Grade any AI tool",                   minPlan: "scale"   },
  { id: "team",       label: "Team Management",  group: "Administration", description: "Invite & manage members",            minPlan: "starter" },
  { id: "roles",      label: "Role Master",      group: "Administration", description: "Create custom roles",                 minPlan: "starter" },
  { id: "billing",    label: "Subscription",     group: "Administration", description: "Plan, usage & invoices",              minPlan: "starter" },
  { id: "wiki",       label: "Wiki / Docs",      group: "System",         description: "Functional & technical docs",         minPlan: "starter" },
  { id: "settings",   label: "Settings",         group: "System",         description: "Brand & integrations",                minPlan: "starter" },
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
    modules: ["dashboard", "seo", "social", "scheduler", "email", "team", "roles", "billing", "wiki", "settings"],
    features: [
      "3 team members",
      "1,000 AI credits / month",
      "SEO, Social, Scheduler, Email",
      "Daily content calendar",
      "Email automation (2 flows)",
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
    modules: ["dashboard", "seo", "social", "scheduler", "email", "images", "videos", "analyzer", "team", "roles", "billing", "wiki", "settings"],
    features: [
      "10 team members",
      "5,000 AI credits / month",
      "Everything in Starter",
      "AI Image Studio",
      "AI Video Studio",
      "Website Analyzer",
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
    modules: ["dashboard", "seo", "social", "scheduler", "email", "images", "videos", "analyzer", "ai-testing", "team", "roles", "billing", "wiki", "settings"],
    features: [
      "25 team members",
      "20,000 AI credits / month",
      "Everything in Growth",
      "AI Tool Testing module",
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
    modules: ["dashboard", "seo", "social", "scheduler", "email", "images", "videos", "analyzer", "ai-testing", "team", "roles", "billing", "wiki", "settings"],
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
      "ai-testing": "manage",
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
      "ai-testing": "view",
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
      "ai-testing": "none",
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
      "ai-testing": "none",
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
      "ai-testing": "none",
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
      "ai-testing": "manage",
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
      "ai-testing": "view",
      team: "none",
      roles: "none",
      billing: "none",
      wiki: "view",
      settings: "view",
    },
  },
];
