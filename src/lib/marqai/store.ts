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
  WhatsAppTemplate,
  WhatsAppContact,
  WhatsAppContactList,
  WhatsAppCampaign,
  WhatsAppMessageLog,
  WhatsAppConnection,
  SalesAgent,
  SalesConversation,
  SalesMessage,
  SalesConversationStage,
  BANTQualification,
  OutreachSequence,
  DealCoachingSession,
  ObjectionResponse,
  DiscoveryQuestionSet,
  Bug,
  BugComment,
  BugStatus,
  BugSeverity,
  BugPriority,
  BugResolution,
} from "./types";
import {
  seedAccounts,
  seedScheduledPosts,
  seedEmailCampaigns,
  seedEmailAutomations,
  seedImages,
  seedVideos,
  seedAiTestReports,
  seedWhatsAppTemplates,
  seedWhatsAppContacts,
  seedWhatsAppContactLists,
  seedWhatsAppCampaigns,
  seedWhatsAppMessageLogs,
  seedWhatsAppConnection,
  seedSalesAgents,
  seedSalesConversations,
  seedOutreachSequences,
  seedDealCoachingSessions,
  seedObjectionResponses,
  seedBugs,
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

  // ---------- WHATSAPP MARKETING ----------
  whatsappTemplates: WhatsAppTemplate[];
  addWhatsAppTemplate: (t: WhatsAppTemplate) => void;
  updateWhatsAppTemplate: (id: string, patch: Partial<WhatsAppTemplate>) => void;
  deleteWhatsAppTemplate: (id: string) => void;
  whatsappContacts: WhatsAppContact[];
  addWhatsAppContact: (c: WhatsAppContact) => void;
  updateWhatsAppContact: (id: string, patch: Partial<WhatsAppContact>) => void;
  deleteWhatsAppContact: (id: string) => void;
  whatsappContactLists: WhatsAppContactList[];
  addWhatsAppContactList: (cl: WhatsAppContactList) => void;
  deleteWhatsAppContactList: (id: string) => void;
  whatsappCampaigns: WhatsAppCampaign[];
  addWhatsAppCampaign: (c: WhatsAppCampaign) => void;
  updateWhatsAppCampaign: (id: string, patch: Partial<WhatsAppCampaign>) => void;
  deleteWhatsAppCampaign: (id: string) => void;
  whatsappMessageLogs: WhatsAppMessageLog[];
  addWhatsAppMessageLogs: (logs: WhatsAppMessageLog[]) => void;
  whatsappConnection: WhatsAppConnection;
  updateWhatsAppConnection: (patch: Partial<WhatsAppConnection>) => void;

  // ---------- AI SALES AGENTS ----------
  salesAgents: SalesAgent[];
  addSalesAgent: (a: SalesAgent) => void;
  updateSalesAgent: (id: string, patch: Partial<SalesAgent>) => void;
  deleteSalesAgent: (id: string) => void;

  salesConversations: SalesConversation[];
  addSalesConversation: (c: SalesConversation) => void;
  updateSalesConversation: (id: string, patch: Partial<SalesConversation>) => void;
  deleteSalesConversation: (id: string) => void;
  appendSalesMessage: (
    conversationId: string,
    message: SalesMessage,
  ) => void;
  setConversationStage: (
    conversationId: string,
    stage: SalesConversationStage,
  ) => void;
  setConversationQualification: (
    conversationId: string,
    qualification: BANTQualification,
  ) => void;

  outreachSequences: OutreachSequence[];
  addOutreachSequence: (s: OutreachSequence) => void;
  deleteOutreachSequence: (id: string) => void;

  dealCoachingSessions: DealCoachingSession[];
  addDealCoachingSession: (s: DealCoachingSession) => void;
  deleteDealCoachingSession: (id: string) => void;

  objectionResponses: ObjectionResponse[];
  addObjectionResponse: (o: ObjectionResponse) => void;
  deleteObjectionResponse: (id: string) => void;

  discoveryQuestionSets: DiscoveryQuestionSet[];
  addDiscoveryQuestionSet: (d: DiscoveryQuestionSet) => void;
  deleteDiscoveryQuestionSet: (id: string) => void;

  // ---------- BUG TRACKER ----------
  bugs: Bug[];
  addBug: (b: Bug) => void;
  updateBug: (id: string, patch: Partial<Bug>) => void;
  deleteBug: (id: string) => void;
  addBugComment: (bugId: string, comment: BugComment) => void;
  setBugStatus: (bugId: string, status: BugStatus, actorName: string, actorRole?: string) => void;
  setBugSeverity: (bugId: string, severity: BugSeverity, actorName: string, actorRole?: string) => void;
  setBugPriority: (bugId: string, priority: BugPriority, actorName: string, actorRole?: string) => void;
  setBugResolution: (bugId: string, resolution: BugResolution, actorName: string, actorRole?: string) => void;
  assignBug: (bugId: string, assigneeUserId: string, assigneeName: string, actorName: string, actorRole?: string) => void;
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

      // ---------- WHATSAPP MARKETING ----------
      whatsappTemplates: seedWhatsAppTemplates,
      addWhatsAppTemplate: (t) =>
        set((s) => ({ whatsappTemplates: [t, ...s.whatsappTemplates] })),
      updateWhatsAppTemplate: (id, patch) =>
        set((s) => ({
          whatsappTemplates: s.whatsappTemplates.map((t) =>
            t.id === id ? { ...t, ...patch } : t,
          ),
        })),
      deleteWhatsAppTemplate: (id) =>
        set((s) => ({
          whatsappTemplates: s.whatsappTemplates.filter((t) => t.id !== id),
        })),

      whatsappContacts: seedWhatsAppContacts,
      addWhatsAppContact: (c) =>
        set((s) => ({ whatsappContacts: [c, ...s.whatsappContacts] })),
      updateWhatsAppContact: (id, patch) =>
        set((s) => ({
          whatsappContacts: s.whatsappContacts.map((c) =>
            c.id === id ? { ...c, ...patch } : c,
          ),
        })),
      deleteWhatsAppContact: (id) =>
        set((s) => ({
          whatsappContacts: s.whatsappContacts.filter((c) => c.id !== id),
          whatsappContactLists: s.whatsappContactLists.map((cl) => ({
            ...cl,
            contactIds: cl.contactIds.filter((cid) => cid !== id),
          })),
        })),

      whatsappContactLists: seedWhatsAppContactLists,
      addWhatsAppContactList: (cl) =>
        set((s) => ({ whatsappContactLists: [cl, ...s.whatsappContactLists] })),
      deleteWhatsAppContactList: (id) =>
        set((s) => ({
          whatsappContactLists: s.whatsappContactLists.filter((cl) => cl.id !== id),
        })),

      whatsappCampaigns: seedWhatsAppCampaigns,
      addWhatsAppCampaign: (c) =>
        set((s) => ({ whatsappCampaigns: [c, ...s.whatsappCampaigns] })),
      updateWhatsAppCampaign: (id, patch) =>
        set((s) => ({
          whatsappCampaigns: s.whatsappCampaigns.map((c) =>
            c.id === id ? { ...c, ...patch } : c,
          ),
        })),
      deleteWhatsAppCampaign: (id) =>
        set((s) => ({
          whatsappCampaigns: s.whatsappCampaigns.filter((c) => c.id !== id),
        })),

      whatsappMessageLogs: seedWhatsAppMessageLogs,
      addWhatsAppMessageLogs: (logs) =>
        set((s) => ({ whatsappMessageLogs: [...logs, ...s.whatsappMessageLogs] })),

      whatsappConnection: seedWhatsAppConnection,
      updateWhatsAppConnection: (patch) =>
        set((s) => ({ whatsappConnection: { ...s.whatsappConnection, ...patch } })),

      // ---------- AI SALES AGENTS ----------
      salesAgents: seedSalesAgents,
      addSalesAgent: (a) => set((s) => ({ salesAgents: [a, ...s.salesAgents] })),
      updateSalesAgent: (id, patch) =>
        set((s) => ({
          salesAgents: s.salesAgents.map((a) =>
            a.id === id ? { ...a, ...patch } : a,
          ),
        })),
      deleteSalesAgent: (id) =>
        set((s) => ({ salesAgents: s.salesAgents.filter((a) => a.id !== id) })),

      salesConversations: seedSalesConversations,
      addSalesConversation: (c) =>
        set((s) => ({ salesConversations: [c, ...s.salesConversations] })),
      updateSalesConversation: (id, patch) =>
        set((s) => ({
          salesConversations: s.salesConversations.map((c) =>
            c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c,
          ),
        })),
      deleteSalesConversation: (id) =>
        set((s) => ({
          salesConversations: s.salesConversations.filter((c) => c.id !== id),
        })),
      appendSalesMessage: (conversationId, message) =>
        set((s) => ({
          salesConversations: s.salesConversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, message],
                  updatedAt: new Date().toISOString(),
                }
              : c,
          ),
        })),
      setConversationStage: (conversationId, stage) =>
        set((s) => ({
          salesConversations: s.salesConversations.map((c) =>
            c.id === conversationId
              ? { ...c, stage, updatedAt: new Date().toISOString() }
              : c,
          ),
        })),
      setConversationQualification: (conversationId, qualification) =>
        set((s) => ({
          salesConversations: s.salesConversations.map((c) =>
            c.id === conversationId
              ? { ...c, qualification, updatedAt: new Date().toISOString() }
              : c,
          ),
        })),

      outreachSequences: seedOutreachSequences,
      addOutreachSequence: (seq) =>
        set((s) => ({ outreachSequences: [seq, ...s.outreachSequences] })),
      deleteOutreachSequence: (id) =>
        set((s) => ({
          outreachSequences: s.outreachSequences.filter((x) => x.id !== id),
        })),

      dealCoachingSessions: seedDealCoachingSessions,
      addDealCoachingSession: (sess) =>
        set((s) => ({
          dealCoachingSessions: [sess, ...s.dealCoachingSessions],
        })),
      deleteDealCoachingSession: (id) =>
        set((s) => ({
          dealCoachingSessions: s.dealCoachingSessions.filter((x) => x.id !== id),
        })),

      objectionResponses: seedObjectionResponses,
      addObjectionResponse: (o) =>
        set((s) => ({ objectionResponses: [o, ...s.objectionResponses] })),
      deleteObjectionResponse: (id) =>
        set((s) => ({
          objectionResponses: s.objectionResponses.filter((x) => x.id !== id),
        })),

      discoveryQuestionSets: [],
      addDiscoveryQuestionSet: (d) =>
        set((s) => ({ discoveryQuestionSets: [d, ...s.discoveryQuestionSets] })),
      deleteDiscoveryQuestionSet: (id) =>
        set((s) => ({
          discoveryQuestionSets: s.discoveryQuestionSets.filter((x) => x.id !== id),
        })),

      // ---------- BUG TRACKER ----------
      bugs: seedBugs,
      addBug: (b) => set((s) => ({ bugs: [b, ...s.bugs] })),
      updateBug: (id, patch) =>
        set((s) => ({
          bugs: s.bugs.map((b) =>
            b.id === id ? { ...b, ...patch, updatedAt: new Date().toISOString() } : b,
          ),
        })),
      deleteBug: (id) =>
        set((s) => ({ bugs: s.bugs.filter((b) => b.id !== id) })),
      addBugComment: (bugId, comment) =>
        set((s) => ({
          bugs: s.bugs.map((b) =>
            b.id === bugId
              ? { ...b, comments: [...b.comments, comment], updatedAt: new Date().toISOString() }
              : b,
          ),
        })),
      setBugStatus: (bugId, status, actorName, actorRole) =>
        set((s) => {
          const bug = s.bugs.find((b) => b.id === bugId);
          if (!bug) return s;
          const fromStatus = bug.status;
          const now = new Date().toISOString();
          const comment: BugComment = {
            id: `c-${Date.now()}`,
            authorName: actorName,
            authorRole: actorRole,
            body: `Status changed from ${fromStatus} → ${status}`,
            changeKind: "status",
            changeFrom: fromStatus,
            changeTo: status,
            createdAt: now,
          };
          return {
            bugs: s.bugs.map((b) =>
              b.id === bugId
                ? {
                    ...b,
                    status,
                    closedAt:
                      status === "closed" || status === "wont_fix" || status === "duplicate"
                        ? now
                        : b.closedAt,
                    comments: [...b.comments, comment],
                    updatedAt: now,
                  }
                : b,
            ),
          };
        }),
      setBugSeverity: (bugId, severity, actorName, actorRole) =>
        set((s) => {
          const bug = s.bugs.find((b) => b.id === bugId);
          if (!bug) return s;
          const from = bug.severity;
          const now = new Date().toISOString();
          const comment: BugComment = {
            id: `c-${Date.now()}`,
            authorName: actorName,
            authorRole: actorRole,
            body: `Severity changed from ${from} → ${severity}`,
            changeKind: "severity",
            changeFrom: from,
            changeTo: severity,
            createdAt: now,
          };
          return {
            bugs: s.bugs.map((b) =>
              b.id === bugId
                ? { ...b, severity, comments: [...b.comments, comment], updatedAt: now }
                : b,
            ),
          };
        }),
      setBugPriority: (bugId, priority, actorName, actorRole) =>
        set((s) => {
          const bug = s.bugs.find((b) => b.id === bugId);
          if (!bug) return s;
          const from = bug.priority;
          const now = new Date().toISOString();
          const comment: BugComment = {
            id: `c-${Date.now()}`,
            authorName: actorName,
            authorRole: actorRole,
            body: `Priority changed from ${from} → ${priority}`,
            changeKind: "priority",
            changeFrom: from,
            changeTo: priority,
            createdAt: now,
          };
          return {
            bugs: s.bugs.map((b) =>
              b.id === bugId
                ? { ...b, priority, comments: [...b.comments, comment], updatedAt: now }
                : b,
            ),
          };
        }),
      setBugResolution: (bugId, resolution, actorName, actorRole) =>
        set((s) => {
          const bug = s.bugs.find((b) => b.id === bugId);
          if (!bug) return s;
          const from = bug.resolution;
          const now = new Date().toISOString();
          const comment: BugComment = {
            id: `c-${Date.now()}`,
            authorName: actorName,
            authorRole: actorRole,
            body: `Resolution changed from ${from} → ${resolution}`,
            changeKind: "resolution",
            changeFrom: from,
            changeTo: resolution,
            createdAt: now,
          };
          return {
            bugs: s.bugs.map((b) =>
              b.id === bugId
                ? { ...b, resolution, comments: [...b.comments, comment], updatedAt: now }
                : b,
            ),
          };
        }),
      assignBug: (bugId, assigneeUserId, assigneeName, actorName, actorRole) =>
        set((s) => {
          const bug = s.bugs.find((b) => b.id === bugId);
          if (!bug) return s;
          const fromName = bug.assigneeName ?? "Unassigned";
          const now = new Date().toISOString();
          const comment: BugComment = {
            id: `c-${Date.now()}`,
            authorName: actorName,
            authorRole: actorRole,
            body: `Assignee changed from ${fromName} → ${assigneeName}`,
            changeKind: "assignee",
            changeFrom: fromName,
            changeTo: assigneeName,
            createdAt: now,
          };
          const newStatus: BugStatus =
            bug.status === "new" || bug.status === "unconfirmed" ? "assigned" : bug.status;
          return {
            bugs: s.bugs.map((b) =>
              b.id === bugId
                ? {
                    ...b,
                    assigneeUserId,
                    assigneeName,
                    status: newStatus,
                    comments: [...b.comments, comment],
                    updatedAt: now,
                  }
                : b,
            ),
          };
        }),
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
        salesAgents: s.salesAgents,
        salesConversations: s.salesConversations,
        outreachSequences: s.outreachSequences,
        dealCoachingSessions: s.dealCoachingSessions,
        objectionResponses: s.objectionResponses,
        discoveryQuestionSets: s.discoveryQuestionSets,
        bugs: s.bugs,
        whatsappTemplates: s.whatsappTemplates,
        whatsappContacts: s.whatsappContacts,
        whatsappContactLists: s.whatsappContactLists,
        whatsappCampaigns: s.whatsappCampaigns,
        whatsappMessageLogs: s.whatsappMessageLogs,
        whatsappConnection: s.whatsappConnection,
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
