"use client";

import { create } from "zustand";
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

interface MarqaiState {
  // navigation
  activeModule: ModuleId;
  setActiveModule: (m: ModuleId) => void;

  // global
  brand: { name: string; color: string; tagline: string };
  setBrand: (b: Partial<MarqaiState["brand"]>) => void;

  // social
  accounts: SocialAccount[];
  toggleAccount: (id: string) => void;

  // scheduler
  scheduledPosts: ScheduledPost[];
  addScheduledPost: (p: ScheduledPost) => void;
  updateScheduledPost: (id: string, patch: Partial<ScheduledPost>) => void;
  deleteScheduledPost: (id: string) => void;

  // images
  images: GeneratedImage[];
  addImage: (i: GeneratedImage) => void;
  updateImage: (id: string, patch: Partial<GeneratedImage>) => void;

  // videos
  videos: VideoProject[];
  addVideo: (v: VideoProject) => void;
  updateVideo: (id: string, patch: Partial<VideoProject>) => void;

  // email
  emailCampaigns: EmailCampaign[];
  addEmailCampaign: (c: EmailCampaign) => void;
  updateEmailCampaign: (id: string, patch: Partial<EmailCampaign>) => void;
  deleteEmailCampaign: (id: string) => void;
  emailAutomations: EmailAutomation[];
  toggleAutomation: (id: string) => void;

  // seo reports (history)
  seoReports: SeoReport[];
  addSeoReport: (r: SeoReport) => void;

  // website analysis reports (history)
  websiteReports: WebsiteAnalysisReport[];
  addWebsiteReport: (r: WebsiteAnalysisReport) => void;

  // ai test reports (history)
  aiTestReports: AiToolTestReport[];
  addAiTestReport: (r: AiToolTestReport) => void;
}

export const useMarqai = create<MarqaiState>((set) => ({
  activeModule: "dashboard",
  setActiveModule: (m) => set({ activeModule: m }),

  brand: {
    name: "Marqai",
    color: "#0d9488",
    tagline: "All-in-one AI marketing & AI tool testing suite",
  },
  setBrand: (b) => set((s) => ({ brand: { ...s.brand, ...b } })),

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
}));
