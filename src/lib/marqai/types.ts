// Marqai — Shared Types (SaaS + RBAC edition)

// ============================================================
// MODULE IDENTIFIERS
// ============================================================

export type ModuleId =
  | "dashboard"
  | "seo"
  | "social"
  | "scheduler"
  | "images"
  | "videos"
  | "email"
  | "analyzer"
  | "ai-testing"
  | "ai-testing-methodologies"
  | "logo-builder"
  | "website-builder"
  | "leads-generator"
  | "whatsapp"
  | "reports"
  | "roles"
  | "team"
  | "billing"
  | "wiki"
  | "settings";

// ============================================================
// RBAC
// ============================================================

export type PermissionLevel = "none" | "view" | "execute" | "manage";

export type RoleScope = "platform" | "organization";

export interface Role {
  id: string;
  name: string;
  description?: string;
  scope: RoleScope;
  /** Map of moduleId -> permission level. Missing = "none". */
  permissions: Partial<Record<ModuleId, PermissionLevel>>;
  isSystem: boolean;
  isLocked: boolean;
  color: string;
  createdAt: string;
}

export interface PermissionMatrix {
  [moduleId: string]: PermissionLevel;
}

// ============================================================
// AUTH / SESSION
// ============================================================

export type AuthPrincipalKind = "super_admin" | "org_user";

export interface AuthPrincipal {
  kind: AuthPrincipalKind;
  userId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  /** Set when kind === "org_user". */
  organizationId?: string;
  organizationName?: string;
  organizationSlug?: string;
  roleId?: string;
  roleName?: string;
  roleColor?: string;
  permissions?: PermissionMatrix;
  planSlug?: PlanSlug;
  planName?: string;
  trialEndsAt?: string;
}

// ============================================================
// SaaS — PLANS
// ============================================================

export type PlanSlug = "starter" | "growth" | "scale" | "enterprise";

export interface Plan {
  slug: PlanSlug;
  name: string;
  pricePerMonth: number; // USD
  seats: number;
  aiCredits: number;
  trialDays: number;
  modules: ModuleId[];
  popular?: boolean;
  description: string;
  features: string[];
}

export interface Subscription {
  id: string;
  organizationId: string;
  planSlug: PlanSlug;
  planName: string;
  status: "trialing" | "active" | "past_due" | "suspended" | "cancelled";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt?: string;
  seatsUsed: number;
  seatsLimit: number;
  aiCreditsUsed: number;
  aiCreditsLimit: number;
}

export interface Invoice {
  id: string;
  amountCents: number;
  currency: string;
  status: "draft" | "paid" | "void" | "refunded";
  issuedAt: string;
  description?: string;
  pdfUrl?: string;
}

// ============================================================
// ORGANIZATION & TEAM
// ============================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logoUrl?: string;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
}

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  roleName: string;
  roleColor: string;
  teamRole: "Member" | "Lead" | "Viewer";
  status: "active" | "invited" | "suspended";
  lastLoginAt?: string;
  jobTitle?: string;
}

// ============================================================
// MARKETING DOMAIN (unchanged)
// ============================================================

export type Platform =
  | "twitter"
  | "linkedin"
  | "facebook"
  | "instagram"
  | "youtube"
  | "tiktok"
  | "pinterest";

export interface SocialAccount {
  id: string;
  platform: Platform;
  handle: string;
  followers: number;
  engagementRate: number;
  connected: boolean;
}

export interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  platforms: Platform[];
  scheduledAt: string;
  status: "draft" | "scheduled" | "published" | "failed";
  hashtags: string[];
  mediaType: "text" | "image" | "video";
  author: string;
}

export interface SeoFinding {
  id: string;
  category: "critical" | "warning" | "info" | "passed";
  title: string;
  description: string;
  recommendation: string;
}

export interface SeoReport {
  id?: string;
  url: string;
  analyzedAt: string;
  overallScore: number;
  scores: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
    content: number;
    mobile: number;
  };
  meta: {
    title: string;
    titleLength: number;
    description: string;
    descriptionLength: number;
    canonical?: string;
    robots?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  };
  headings: { h1: string[]; h2: string[]; h3: string[] };
  keywords: { keyword: string; density: number; count: number }[];
  backlinks: number;
  domainAuthority: number;
  pageAuthority: number;
  loadTimeMs: number;
  pageSizeKb: number;
  findings: SeoFinding[];
  missingAnalytics: string[];
  topPages: { url: string; traffic: number; change: number }[];
  competitors: { domain: string; overlap: number; traffic: number }[];
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  url: string;
  size: string;
  style: string;
  createdAt: string;
  status: "queued" | "generating" | "done" | "failed";
}

export interface VideoProject {
  id: string;
  title: string;
  script: string;
  durationSec: number;
  style: "promo" | "explainer" | "social-short" | "tutorial" | "testimonial";
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:5";
  status: "queued" | "rendering" | "done" | "failed";
  thumbnailUrl?: string;
  scenes: { index: number; text: string; visual: string }[];
  createdAt: string;
}

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  previewText: string;
  fromName: string;
  bodyHtml: string;
  audience: string;
  recipients: number;
  status: "draft" | "scheduled" | "sending" | "sent" | "aborted";
  scheduledAt?: string;
  sentAt?: string;
  openRate?: number;
  clickRate?: number;
  unsubscribeRate?: number;
  createdAt: string;
}

export interface EmailAutomation {
  id: string;
  name: string;
  trigger: string;
  steps: { id: string; type: "email" | "wait" | "condition"; label: string; delay?: string }[];
  active: boolean;
  enrolled: number;
  conversionRate: number;
}

export interface WebsiteAnalysisReport {
  id?: string;
  url: string;
  analyzedAt: string;
  techStack: { name: string; category: string; confidence: number }[];
  performance: {
    lcp: number;
    cls: number;
    fcp: number;
    ttfb: number;
    speedIndex: number;
    tbt: number;
  };
  traffic: {
    monthlyVisits: number;
    visitsChange: number;
    avgVisitDuration: string;
    bounceRate: number;
    pagesPerVisit: number;
  };
  trafficByCountry: { country: string; code: string; share: number }[];
  trafficSources: { source: string; share: number; visits: number }[];
  topPages: { url: string; visits: number; share: number }[];
  keywords: { keyword: string; position: number; volume: number; intent: string }[];
  competitors: { domain: string; overlap: number; visits: number }[];
  missingFeatures: { feature: string; severity: "high" | "medium" | "low"; impact: string }[];
  recommendations: { title: string; description: string; priority: number }[];
  socialPresence: { platform: Platform; handle: string; followers: number; activity: string }[];
  securityScore: number;
  mobileScore: number;
}

export interface AiTestResult {
  category: string;
  score: number;
  maxScore: number;
  findings: string[];
}

export interface AiToolTestReport {
  id: string;
  toolName: string;
  toolUrl: string;
  toolType:
    | "chatbot"
    | "image-gen"
    | "video-gen"
    | "agent"
    | "rag"
    | "code-assistant"
    | "voice"
    | "ecommerce"
    | "other";
  testedAt: string;
  overallScore: number;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  summary: string;
  categories: AiTestResult[];
  testCases: {
    id: string;
    name: string;
    prompt: string;
    expectedBehavior: string;
    actualBehavior: string;
    status: "pass" | "partial" | "fail";
    latencyMs: number;
    notes: string;
    /** Which AI test scenario this case maps to (from the testing taxonomy). */
    scenario?: string;
  }[];
  strengths: string[];
  weaknesses: string[];
  recommendations: { title: string; description: string; priority: "high" | "medium" | "low" }[];
  benchmarkComparison: { metric: string; thisTool: number; industryAvg: number; unit: string }[];
  /** List of AI test scenarios covered by this report (from the testing taxonomy). */
  scenariosCovered?: string[];
}

// ============================================================
// LOGO BUILDER
// ============================================================

export type LogoStyle = "minimal" | "wordmark" | "emblem" | "mascot" | "abstract" | "monogram" | "gradient";

export interface LogoAsset {
  id: string;
  brandName: string;
  tagline?: string;
  industry?: string;
  style: LogoStyle;
  palette: string[]; // hex colors
  /** AI-generated PNG/JPG URL, or empty when using SVG template. */
  imageUrl?: string;
  /** Inline SVG string for template-based logos. */
  svgContent?: string;
  prompt: string;
  createdAt: string;
}

// ============================================================
// WEBSITE BUILDER
// ============================================================

export type WebsiteSectionType = "hero" | "features" | "pricing" | "testimonial" | "faq" | "cta" | "footer";

export interface WebsiteSection {
  type: WebsiteSectionType;
  html: string;
}

export interface WebsiteAsset {
  id: string;
  brandName: string;
  product: string;
  audience?: string;
  sections: WebsiteSection[];
  html: string; // full assembled document
  palette?: string[];
  publishedUrl?: string;
  createdAt: string;
}

// ============================================================
// LEADS GENERATOR
// ============================================================

export type LeadStatus = "new" | "contacted" | "qualified" | "won" | "lost";

export interface Lead {
  id: string;
  companyName: string;
  website?: string;
  industry?: string;
  size?: "1-10" | "11-50" | "51-200" | "201-1000" | "1000+";
  location?: string;
  linkedin?: string;
  contactName?: string;
  contactTitle?: string;
  fitReason?: string;
  score: number; // 0-100
  email?: string;
  status: LeadStatus;
  createdAt: string;
}

export interface LeadList {
  id: string;
  productName: string;
  productCategory?: string;
  targetMarket?: string;
  criteria?: string;
  totalLeads: number;
  leads: Lead[];
  createdAt: string;
}

// ============================================================
// WHATSAPP MARKETING
// ============================================================

export type WhatsAppTemplateCategory =
  | "marketing"
  | "utility"
  | "authentication"
  | "transactional";

export type WhatsAppTemplateStatus = "approved" | "pending" | "rejected" | "draft";

export type WhatsAppLanguage = "en" | "en_US" | "en_GB" | "hi" | "es" | "pt_BR" | "ar" | "fr" | "de" | "id" | "it" | "ja" | "ko" | "ms" | "ru" | "th" | "tr" | "vi" | "zh_CN" | "zh_TW";

export interface WhatsAppTemplate {
  id: string;
  name: string;
  /** Element name (lowercase, underscores). E.g. "summer_sale_2026". */
  elementName: string;
  category: WhatsAppTemplateCategory;
  language: WhatsAppLanguage;
  /** Body text. Use {{1}}, {{2}} for variable placeholders. */
  body: string;
  /** Optional header text (plain text only — image/video headers not supported in this version). */
  header?: string;
  /** Optional footer text. */
  footer?: string;
  /** Optional call-to-action buttons. */
  buttons?: WhatsAppTemplateButton[];
  status: WhatsAppTemplateStatus;
  /** Variables extracted from body — list of {{1}}, {{2}}... */
  variables: string[];
  createdAt: string;
  /** Quick preview rendered with sample values. */
  preview?: string;
}

export interface WhatsAppTemplateButton {
  type: "url" | "phone" | "quick_reply";
  text: string;
  /** For url buttons: the URL template (may contain {{1}}). */
  url?: string;
  /** For phone buttons: the phone number in E.164. */
  phone?: string;
}

export interface WhatsAppContact {
  id: string;
  name: string;
  /** Phone number in E.164 format, e.g. +14155551234. */
  phone: string;
  email?: string;
  /** Custom fields for personalization. */
  customFields?: Record<string, string>;
  /** Opted-in to marketing messages. */
  optedIn: boolean;
  /** Tags for segmentation. */
  tags: string[];
  createdAt: string;
}

export interface WhatsAppContactList {
  id: string;
  name: string;
  description?: string;
  contactIds: string[];
  createdAt: string;
}

export type WhatsAppCampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "partial"
  | "aborted";

export type WhatsAppCampaignType =
  | "broadcast"     // one-shot send to a list
  | "scheduled"     // future scheduled send
  | "api-triggered"; // triggered via API by external system

export interface WhatsAppCampaign {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  type: WhatsAppCampaignType;
  status: WhatsAppCampaignStatus;
  /** Recipient contact IDs. */
  contactIds: string[];
  /** Total recipients (denormalized for quick display). */
  recipientCount: number;
  /** Per-recipient variable values keyed by contactId. */
  variableOverrides?: Record<string, Record<string, string>>;
  scheduledAt?: string;
  sentAt?: string;
  /** Analytics — populated after send. */
  stats?: WhatsAppCampaignStats;
  notes?: string;
  createdAt: string;
}

export interface WhatsAppCampaignStats {
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  clicked: number;
  replied: number;
  optedOut: number;
}

export type WhatsAppMessageStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "clicked"
  | "replied";

export interface WhatsAppMessageLog {
  id: string;
  campaignId: string;
  campaignName: string;
  contactId: string;
  contactName: string;
  phone: string;
  templateName: string;
  status: WhatsAppMessageStatus;
  /** Provider message ID (e.g. wamid.HBgL...). */
  providerMessageId?: string;
  error?: string;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
}

export type WhatsAppProvider =
  | "meta-cloud-api"
  | "twilio"
  | "messagebird"
  | "gupshup"
  | "360dialog"
  | "manual";

export interface WhatsAppConnection {
  provider: WhatsAppProvider;
  /** Phone number ID from Meta Cloud API. */
  phoneNumberId?: string;
  /** WhatsApp Business Account ID. */
  wabaId?: string;
  /** Display name on the WhatsApp Business profile. */
  displayName?: string;
  /** Verified phone number in E.164. */
  phoneNumber?: string;
  /** Quality rating from Meta: HIGH / MEDIUM / LOW. */
  qualityRating?: "GREEN" | "YELLOW" | "RED" | "UNKNOWN";
  /** Messaging limit tier (1K / 10K / 100K / unlimited per 24h). */
  messagingTier?: "1K" | "10K" | "100K" | "UNLIMITED";
  /** API key / token for the chosen provider (masked in UI). */
  apiKeyMasked?: string;
  /** Webhook URL for inbound messages + status callbacks. */
  webhookUrl?: string;
  /** Whether the connection is live / verified. */
  connected: boolean;
  connectedAt?: string;
}

export interface WhatsAppWebhookEvent {
  id: string;
  receivedAt: string;
  type: "message_received" | "message_status" | "message_template_status";
  /** Raw payload from the provider (Meta / Twilio / etc.). */
  payload: Record<string, unknown>;
  /** Parsed summary for display. */
  summary: string;
}
