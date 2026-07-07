// Marqai — SaaS demo seed data
// Powers the in-browser demo without a backend.

import type {
  AuthPrincipal,
  Invoice,
  Organization,
  PlanSlug,
  Role,
  Subscription,
  Team,
  TeamMember,
} from "./types";
import { BUILT_IN_ROLES, PLANS, MODULE_CATALOG } from "./saas";
import { seedBuiltInRoles } from "./rbac";

// ============================================================
// DEMO ORGANIZATION
// ============================================================

export const DEMO_ORG: Organization = {
  id: "org-demo-acme",
  name: "Acme Marketing Pvt Ltd",
  slug: "acme-marketing",
  domain: "acme-marketing.com",
  logoUrl: undefined,
  createdAt: "2025-09-12T08:00:00.000Z",
};

// ============================================================
// DEMO ROLES (built-in + one custom)
// ============================================================

export const DEMO_ROLES: Role[] = [
  ...seedBuiltInRoles(DEMO_ORG.id),
  {
    id: "org-demo-acme-role-custom-1",
    name: "Performance Marketer",
    description: "Runs paid social + email + analytics + leads. No SEO or AI testing.",
    scope: "organization",
    permissions: {
      dashboard: "manage",
      seo: "none",
      social: "manage",
      scheduler: "manage",
      images: "execute",
      videos: "none",
      email: "manage",
      analyzer: "view",
      "logo-builder": "execute",
      "website-builder": "view",
      "leads-generator": "execute",
      "sales-agents": "execute",
      "whatsapp": "manage",
      "ai-testing": "none",
      "ai-testing-methodologies": "view",
      reports: "view",
      team: "none",
      roles: "none",
      billing: "none",
      wiki: "view",
      settings: "view",
    },
    isSystem: false,
    isLocked: false,
    color: "amber",
    createdAt: "2025-10-02T10:30:00.000Z",
  },
];

// Helper to find a demo role by name
export function findDemoRole(name: string): Role | undefined {
  return DEMO_ROLES.find((r) => r.name === name);
}

// ============================================================
// DEMO USERS (one per built-in role)
// ============================================================

export interface DemoUser {
  id: string;
  email: string;
  password: string; // demo only — never store plaintext in production
  name: string;
  avatarUrl?: string;
  jobTitle: string;
  roleName: string;
  lastLoginAt?: string;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: "user-priya",
    email: "priya@acme-marketing.com",
    password: "demo1234",
    name: "Priya Menon",
    jobTitle: "Founder & CEO",
    roleName: "Org Owner",
    lastLoginAt: "2026-07-05T11:42:00.000Z",
  },
  {
    id: "user-arjun",
    email: "arjun@acme-marketing.com",
    password: "demo1234",
    name: "Arjun Reddy",
    jobTitle: "Head of Marketing",
    roleName: "Marketing Manager",
    lastLoginAt: "2026-07-05T09:15:00.000Z",
  },
  {
    id: "user-kavya",
    email: "kavya@acme-marketing.com",
    password: "demo1234",
    name: "Kavya Iyer",
    jobTitle: "SEO Lead",
    roleName: "SEO Specialist",
    lastLoginAt: "2026-07-04T16:20:00.000Z",
  },
  {
    id: "user-rohan",
    email: "rohan@acme-marketing.com",
    password: "demo1234",
    name: "Rohan Das",
    jobTitle: "Social Media Manager",
    roleName: "Social Media Manager",
    lastLoginAt: "2026-07-05T08:45:00.000Z",
  },
  {
    id: "user-meera",
    email: "meera@acme-marketing.com",
    password: "demo1234",
    name: "Meera Nair",
    jobTitle: "Email Marketing Specialist",
    roleName: "Email Marketer",
    lastLoginAt: "2026-07-03T14:10:00.000Z",
  },
  {
    id: "user-vikram",
    email: "vikram@acme-marketing.com",
    password: "demo1234",
    name: "Vikram Shah",
    jobTitle: "AI QA Lead",
    roleName: "AI QA Analyst",
    lastLoginAt: "2026-07-04T11:30:00.000Z",
  },
  {
    id: "user-nikhil",
    email: "nikhil@acme-marketing.com",
    password: "demo1234",
    name: "Nikhil Rao",
    jobTitle: "Sales Development Rep",
    roleName: "Sales Development Rep",
    lastLoginAt: "2026-07-05T07:30:00.000Z",
  },
  {
    id: "user-isha",
    email: "isha@acme-marketing.com",
    password: "demo1234",
    name: "Isha Kapoor",
    jobTitle: "CMO",
    roleName: "Viewer",
    lastLoginAt: "2026-07-02T17:00:00.000Z",
  },
];

// ============================================================
// SUPER ADMIN (platform-level)
// ============================================================

export const DEMO_SUPER_ADMIN: DemoUser = {
  id: "sa-platform-1",
  email: "superadmin@marqai.app",
  password: "super1234",
  name: "Marqai Platform Admin",
  jobTitle: "Super Admin",
  roleName: "Super Admin",
  lastLoginAt: "2026-07-05T10:00:00.000Z",
};

// ============================================================
// DEMO TEAM
// ============================================================

export const DEMO_TEAMS: Team[] = [
  { id: "team-1", name: "SEO Pod",        description: "Owns organic growth, technical SEO, content optimization.", memberCount: 3 },
  { id: "team-2", name: "Paid Social Pod", description: "Runs paid ads on LinkedIn, IG, TikTok, and Meta.",         memberCount: 4 },
  { id: "team-3", name: "Email Pod",       description: "Lifecycle campaigns, newsletters, drip flows.",            memberCount: 2 },
  { id: "team-4", name: "AI QA Pod",       description: "Tests and benchmarks AI tools for client deliverables.",   memberCount: 2 },
];

export const DEMO_TEAM_MEMBERS: TeamMember[] = DEMO_USERS.map((u, idx) => {
  const role = DEMO_ROLES.find((r) => r.name === u.roleName)!;
  return {
    id: `tm-${idx + 1}`,
    userId: u.id,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl,
    roleName: role.name,
    roleColor: role.color,
    teamRole: idx === 0 ? "Lead" : idx === 1 ? "Lead" : "Member",
    status: u.id === "user-isha" ? "invited" : "active",
    lastLoginAt: u.lastLoginAt,
    jobTitle: u.jobTitle,
  };
});

// ============================================================
// DEMO SUBSCRIPTION
// ============================================================

const scalePlan = PLANS.find((p) => p.slug === "scale")!;

export const DEMO_SUBSCRIPTION: Subscription = {
  id: "sub-demo-1",
  organizationId: DEMO_ORG.id,
  planSlug: "scale" as PlanSlug,
  planName: scalePlan.name,
  status: "active",
  currentPeriodStart: "2026-07-01T00:00:00.000Z",
  currentPeriodEnd: "2026-08-01T00:00:00.000Z",
  trialEndsAt: "2025-09-26T00:00:00.000Z",
  seatsUsed: 8,
  seatsLimit: scalePlan.seats,
  aiCreditsUsed: 7142,
  aiCreditsLimit: scalePlan.aiCredits,
};

// ============================================================
// DEMO INVOICES
// ============================================================

export const DEMO_INVOICES: Invoice[] = [
  {
    id: "inv-2026-07",
    amountCents: 39900,
    currency: "usd",
    status: "paid",
    issuedAt: "2026-07-01T00:00:00.000Z",
    description: "Scale plan — July 2026",
  },
  {
    id: "inv-2026-06",
    amountCents: 39900,
    currency: "usd",
    status: "paid",
    issuedAt: "2026-06-01T00:00:00.000Z",
    description: "Scale plan — June 2026",
  },
  {
    id: "inv-2026-05",
    amountCents: 14900,
    currency: "usd",
    status: "paid",
    issuedAt: "2026-05-01T00:00:00.000Z",
    description: "Growth plan — May 2026 (prorated upgrade)",
  },
  {
    id: "inv-2026-04",
    amountCents: 14900,
    currency: "usd",
    status: "paid",
    issuedAt: "2026-04-01T00:00:00.000Z",
    description: "Growth plan — April 2026",
  },
];

// ============================================================
// DEMO LOGIN RESOLVER
// ============================================================

/**
 * Resolve demo credentials to an AuthPrincipal.
 * Returns null if credentials don't match any demo user.
 */
export function resolveDemoLogin(email: string, password: string): AuthPrincipal | null {
  // Super Admin
  if (
    email.toLowerCase() === DEMO_SUPER_ADMIN.email.toLowerCase() &&
    password === DEMO_SUPER_ADMIN.password
  ) {
    return {
      kind: "super_admin",
      userId: DEMO_SUPER_ADMIN.id,
      email: DEMO_SUPER_ADMIN.email,
      name: DEMO_SUPER_ADMIN.name,
    };
  }

  // Org user
  const user = DEMO_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  );
  if (!user) return null;

  const role = DEMO_ROLES.find((r) => r.name === user.roleName);
  if (!role) return null;

  return {
    kind: "org_user",
    userId: user.id,
    email: user.email,
    name: user.name,
    organizationId: DEMO_ORG.id,
    organizationName: DEMO_ORG.name,
    organizationSlug: DEMO_ORG.slug,
    roleId: role.id,
    roleName: role.name,
    roleColor: role.color,
    permissions: role.permissions,
    planSlug: DEMO_SUBSCRIPTION.planSlug,
    planName: DEMO_SUBSCRIPTION.planName,
    trialEndsAt: DEMO_SUBSCRIPTION.trialEndsAt,
  };
}

// ============================================================
// MODULE ACCESS (which modules show in sidebar for a principal)
// ============================================================

/** Returns the list of modules a principal can see based on role + plan. */
export function visibleModulesFor(principal: AuthPrincipal | null): typeof MODULE_CATALOG {
  if (!principal) return [];
  if (principal.kind === "super_admin") return MODULE_CATALOG;
  const planSlug = principal.planSlug ?? "starter";
  return MODULE_CATALOG.filter((entry) => {
    // Must be in plan
    if (!entry.minPlan) return false;
    const planRank: PlanSlug[] = ["starter", "growth", "scale", "enterprise"];
    const planIdx = planRank.indexOf(planSlug);
    const modIdx = planRank.indexOf(entry.minPlan);
    if (modIdx > planIdx) return false;
    // Must have at least view permission
    const perm = principal.permissions?.[entry.id] ?? "none";
    return perm !== "none";
  });
}
