"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ModuleId,
  SocialAccount,
  ScheduledPost,
  EmailCampaign,
  EmailAutomation,
  GeneratedImage,
  VideoProject,
  SeoReport,
  WebsiteAnalysisReport,
  AiToolTestReport,
  AuthPrincipal,
  Role,
  Team,
  TeamMember,
  Subscription,
  Invoice,
  PermissionMatrix,
  PermissionLevel,
  PlanSlug,
  LogoAsset,
  WebsiteAsset,
  LeadList,
  Lead,
  LeadStatus,
} from "./types";
import {
  seedAccounts,
  seedScheduledPosts,
  seedEmailCampaigns,
  seedEmailAutomations,
  seedImages,
  seedVideos,
  seedAiTestReports,
} from "./mock-data";
import {
  DEMO_ORG,
  DEMO_ROLES,
  DEMO_TEAMS,
  DEMO_TEAM_MEMBERS,
  DEMO_SUBSCRIPTION,
  DEMO_INVOICES,
  resolveDemoLogin,
  DEMO_USERS,
} from "./saas-seed";
import { createCustomRole, seedBuiltInRoles } from "./rbac";

interface MarqaiState {
  // ---------- AUTH ----------
  principal: AuthPrincipal | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  switchRole: (roleId: string) => void; // for demo / super admin impersonation

  // ---------- NAVIGATION ----------
  activeModule: ModuleId;
  setActiveModule: (m: ModuleId) => void;

  // ---------- BRAND ----------
  brand: { name: string; color: string; tagline: string };
  setBrand: (b: Partial<MarqaiState["brand"]>) => void;

  // ---------- ORGANIZATION ----------
  organization: typeof DEMO_ORG;
  roles: Role[];
  teams: Team[];
  teamMembers: TeamMember[];
  subscription: Subscription;
  invoices: Invoice[];

  // ---------- ROLE MASTER ACTIONS ----------
  createRole: (input: {
    name: string;
    description?: string;
    color: string;
    permissions: PermissionMatrix;
  }) => void;
  updateRole: (id: string, patch: Partial<Role>) => void;
  deleteRole: (id: string) => void;
  setRolePermission: (roleId: string, moduleId: ModuleId, level: PermissionLevel) => void;

  // ---------- TEAM ACTIONS ----------
  inviteMember: (input: {
    name: string;
    email: string;
    roleId: string;
    jobTitle?: string;
    teamRole?: "Member" | "Lead" | "Viewer";
  }) => void;
  removeMember: (id: string) => void;
  updateMemberRole: (id: string, roleId: string) => void;

  // ---------- BILLING ACTIONS ----------
  upgradePlan: (slug: PlanSlug) => void;
  downgradePlan: (slug: PlanSlug) => void;
  cancelSubscription: () => void;
  setStripeCheckout: (customerId: string, subscriptionId: string, priceId: string) => void;

  // ---------- MARKETING DOMAIN ----------
  accounts: SocialAccount[];
  toggleAccount: (id: string) => void;

  scheduledPosts: ScheduledPost[];
  addScheduledPost: (p: ScheduledPost) => void;
  updateScheduledPost: (id: string, patch: Partial<ScheduledPost>) => void;
  deleteScheduledPost: (id: string) => void;

  images: GeneratedImage[];
  addImage: (i: GeneratedImage) => void;
  updateImage: (id: string, patch: Partial<GeneratedImage>) => void;

  videos: VideoProject[];
  addVideo: (v: VideoProject) => void;
  updateVideo: (id: string, patch: Partial<VideoProject>) => void;

  emailCampaigns: EmailCampaign[];
  addEmailCampaign: (c: EmailCampaign) => void;
  updateEmailCampaign: (id: string, patch: Partial<EmailCampaign>) => void;
  deleteEmailCampaign: (id: string) => void;
  emailAutomations: EmailAutomation[];
  toggleAutomation: (id: string) => void;

  seoReports: SeoReport[];
  addSeoReport: (r: SeoReport) => void;

  websiteReports: WebsiteAnalysisReport[];
  addWebsiteReport: (r: WebsiteAnalysisReport) => void;

  aiTestReports: AiToolTestReport[];
  addAiTestReport: (r: AiToolTestReport) => void;

  // ---------- LOGO BUILDER ----------
  logos: LogoAsset[];
  addLogo: (l: LogoAsset) => void;
  deleteLogo: (id: string) => void;

  // ---------- WEBSITE BUILDER ----------
  websites: WebsiteAsset[];
  addWebsite: (w: WebsiteAsset) => void;
  deleteWebsite: (id: string) => void;

  // ---------- LEADS GENERATOR ----------
  leadLists: LeadList[];
  addLeadList: (ll: LeadList) => void;
  deleteLeadList: (id: string) => void;
  updateLeadStatus: (listId: string, leadId: string, status: LeadStatus) => void;
}

export const useMarqai = create<MarqaiState>()(
  persist(
    (set, get) => ({
      // ---------- AUTH ----------
      principal: null,
      login: (email, password) => {
        const p = resolveDemoLogin(email, password);
        if (!p) return false;
        set({ principal: p, activeModule: "dashboard" });
        return true;
      },
      logout: () => set({ principal: null, activeModule: "dashboard" }),
      switchRole: (roleId) => {
        const p = get().principal;
        if (!p) return;
        const role = get().roles.find((r) => r.id === roleId);
        if (!role) return;
        set({
          principal: {
            ...p,
            roleId: role.id,
            roleName: role.name,
            roleColor: role.color,
            permissions: role.permissions,
          },
        });
      },

      // ---------- NAV ----------
      activeModule: "dashboard",
      setActiveModule: (m) => set({ activeModule: m }),

      // ---------- BRAND ----------
      brand: {
        name: "Marqai",
        color: "#0d9488",
        tagline: "All-in-one AI marketing & AI tool testing suite",
      },
      setBrand: (b) => set((s) => ({ brand: { ...s.brand, ...b } })),

      // ---------- ORGANIZATION ----------
      organization: DEMO_ORG,
      roles: DEMO_ROLES,
      teams: DEMO_TEAMS,
      teamMembers: DEMO_TEAM_MEMBERS,
      subscription: DEMO_SUBSCRIPTION,
      invoices: DEMO_INVOICES,

      // ---------- ROLE MASTER ----------
      createRole: ({ name, description, color, permissions }) =>
        set((s) => {
          const role = createCustomRole(s.organization.id, name, description, color);
          role.permissions = permissions;
          return { roles: [...s.roles, role] };
        }),
      updateRole: (id, patch) =>
        set((s) => ({
          roles: s.roles.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),
      deleteRole: (id) =>
        set((s) => ({
          roles: s.roles.filter((r) => r.id !== id || r.isLocked),
        })),
      setRolePermission: (roleId, moduleId, level) =>
        set((s) => ({
          roles: s.roles.map((r) =>
            r.id === roleId
              ? { ...r, permissions: { ...r.permissions, [moduleId]: level } }
              : r,
          ),
        })),

      // ---------- TEAM ----------
      inviteMember: ({ name, email, roleId, jobTitle, teamRole = "Member" }) =>
        set((s) => {
          const role = s.roles.find((r) => r.id === roleId);
          if (!role) return s;
          const newMember: TeamMember = {
            id: `tm-${Date.now()}`,
            userId: `user-${Date.now()}`,
            name,
            email,
            roleName: role.name,
            roleColor: role.color,
            teamRole,
            status: "invited",
            jobTitle,
          };
          return {
            teamMembers: [...s.teamMembers, newMember],
            subscription: {
              ...s.subscription,
              seatsUsed: Math.min(s.subscription.seatsUsed + 1, s.subscription.seatsLimit),
            },
          };
        }),
      removeMember: (id) =>
        set((s) => ({
          teamMembers: s.teamMembers.filter((m) => m.id !== id),
          subscription: {
            ...s.subscription,
            seatsUsed: Math.max(s.subscription.seatsUsed - 1, 0),
          },
        })),
      updateMemberRole: (id, roleId) =>
        set((s) => {
          const role = s.roles.find((r) => r.id === roleId);
          if (!role) return s;
          return {
            teamMembers: s.teamMembers.map((m) =>
              m.id === id
                ? { ...m, roleName: role.name, roleColor: role.color }
                : m,
            ),
          };
        }),

      // ---------- BILLING ----------
      upgradePlan: (slug) =>
        set((s) => {
          const plan = require_plan(slug);
          return {
            subscription: {
              ...s.subscription,
              planSlug: slug,
              planName: plan.name,
              seatsLimit: plan.seats,
              aiCreditsLimit: plan.aiCredits,
              status: "active",
            },
          };
        }),
      downgradePlan: (slug) =>
        set((s) => {
          const plan = require_plan(slug);
          return {
            subscription: {
              ...s.subscription,
              planSlug: slug,
              planName: plan.name,
              seatsLimit: plan.seats,
              aiCreditsLimit: plan.aiCredits,
            },
          };
        }),
      cancelSubscription: () =>
        set((s) => ({
          subscription: { ...s.subscription, status: "cancelled" },
        })),

      setStripeCheckout: (_customerId, _subscriptionId, _priceId) =>
        set((s) => ({
          subscription: {
            ...s.subscription,
            status: "active",
          } as Subscription,
          invoices: [
            {
              id: `inv-stripe-${Date.now()}`,
              amountCents: 0, // populated by webhook
              currency: "usd",
              status: "paid",
              issuedAt: new Date().toISOString(),
              description: `Stripe checkout · ${_priceId}`,
            },
            ...s.invoices,
          ],
        })),

      // ---------- MARKETING DOMAIN ----------
      accounts: seedAccounts,
      toggleAccount: (id) =>
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === id ? { ...a, connected: !a.connected } : a,
          ),
        })),

      scheduledPosts: seedScheduledPosts,
      addScheduledPost: (p) =>
        set((s) => ({ scheduledPosts: [p, ...s.scheduledPosts] })),
      updateScheduledPost: (id, patch) =>
        set((s) => ({
          scheduledPosts: s.scheduledPosts.map((p) =>
            p.id === id ? { ...p, ...patch } : p,
          ),
        })),
      deleteScheduledPost: (id) =>
        set((s) => ({
          scheduledPosts: s.scheduledPosts.filter((p) => p.id !== id),
        })),

      images: seedImages,
      addImage: (i) => set((s) => ({ images: [i, ...s.images] })),
      updateImage: (id, patch) =>
        set((s) => ({
          images: s.images.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),

      videos: seedVideos,
      addVideo: (v) => set((s) => ({ videos: [v, ...s.videos] })),
      updateVideo: (id, patch) =>
        set((s) => ({
          videos: s.videos.map((v) => (v.id === id ? { ...v, ...patch } : v)),
        })),

      emailCampaigns: seedEmailCampaigns,
      addEmailCampaign: (c) =>
        set((s) => ({ emailCampaigns: [c, ...s.emailCampaigns] })),
      updateEmailCampaign: (id, patch) =>
        set((s) => ({
          emailCampaigns: s.emailCampaigns.map((c) =>
            c.id === id ? { ...c, ...patch } : c,
          ),
        })),
      deleteEmailCampaign: (id) =>
        set((s) => ({
          emailCampaigns: s.emailCampaigns.filter((c) => c.id !== id),
        })),
      emailAutomations: seedEmailAutomations,
      toggleAutomation: (id) =>
        set((s) => ({
          emailAutomations: s.emailAutomations.map((a) =>
            a.id === id ? { ...a, active: !a.active } : a,
          ),
        })),

      seoReports: [],
      addSeoReport: (r) => set((s) => ({ seoReports: [r, ...s.seoReports] })),

      websiteReports: [],
      addWebsiteReport: (r) =>
        set((s) => ({ websiteReports: [r, ...s.websiteReports] })),

      aiTestReports: seedAiTestReports,
      addAiTestReport: (r) =>
        set((s) => ({ aiTestReports: [r, ...s.aiTestReports] })),

      // ---------- LOGO BUILDER ----------
      logos: [],
      addLogo: (l) => set((s) => ({ logos: [l, ...s.logos] })),
      deleteLogo: (id) =>
        set((s) => ({ logos: s.logos.filter((x) => x.id !== id) })),

      // ---------- WEBSITE BUILDER ----------
      websites: [],
      addWebsite: (w) => set((s) => ({ websites: [w, ...s.websites] })),
      deleteWebsite: (id) =>
        set((s) => ({ websites: s.websites.filter((x) => x.id !== id) })),

      // ---------- LEADS GENERATOR ----------
      leadLists: [],
      addLeadList: (ll) => set((s) => ({ leadLists: [ll, ...s.leadLists] })),
      deleteLeadList: (id) =>
        set((s) => ({ leadLists: s.leadLists.filter((x) => x.id !== id) })),
      updateLeadStatus: (listId, leadId, status) =>
        set((s) => ({
          leadLists: s.leadLists.map((ll) =>
            ll.id === listId
              ? {
                  ...ll,
                  leads: ll.leads.map((l) =>
                    l.id === leadId ? { ...l, status } : l,
                  ),
                }
              : ll,
          ),
        })),
    }),
    {
      name: "marqai-session-v2",
      partialize: (s) => ({
        principal: s.principal,
        activeModule: s.activeModule,
        brand: s.brand,
        roles: s.roles,
        teamMembers: s.teamMembers,
        subscription: s.subscription,
        logos: s.logos,
        websites: s.websites,
        leadLists: s.leadLists,
      }),
    },
  ),
);

// Helper to resolve plan from slug (avoids circular import)
function require_plan(slug: PlanSlug) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("./saas");
  return mod.PLANS.find((p: { slug: PlanSlug }) => p.slug === slug)!;
}

// Re-export for convenience
export { seedBuiltInRoles, DEMO_USERS };
