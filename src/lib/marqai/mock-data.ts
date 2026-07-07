// Marqai — Mock data and simulated API helpers

import type {
  SocialAccount,
  ScheduledPost,
  EmailCampaign,
  EmailAutomation,
  GeneratedImage,
  VideoProject,
  AiToolTestReport,
  Platform,
  SalesAgent,
  SalesConversation,
  OutreachSequence,
  DealCoachingSession,
  ObjectionResponse,
} from "./types";

export const platformMeta: Record<
  Platform,
  { name: string; color: string; icon: string }
> = {
  twitter: { name: "X (Twitter)", color: "#0f172a", icon: "𝕏" },
  linkedin: { name: "LinkedIn", color: "#0a66c2", icon: "in" },
  facebook: { name: "Facebook", color: "#1877f2", icon: "f" },
  instagram: { name: "Instagram", color: "#e4405f", icon: "◎" },
  youtube: { name: "YouTube", color: "#ff0000", icon: "▶" },
  tiktok: { name: "TikTok", color: "#000000", icon: "♪" },
  pinterest: { name: "Pinterest", color: "#bd081c", icon: "P" },
};

export const seedAccounts: SocialAccount[] = [
  {
    id: "acc-1",
    platform: "twitter",
    handle: "@marqaihq",
    followers: 18420,
    engagementRate: 3.8,
    connected: true,
  },
  {
    id: "acc-2",
    platform: "linkedin",
    handle: "Marqai Inc.",
    followers: 9240,
    engagementRate: 5.2,
    connected: true,
  },
  {
    id: "acc-3",
    platform: "instagram",
    handle: "@marqai",
    followers: 24300,
    engagementRate: 6.1,
    connected: true,
  },
  {
    id: "acc-4",
    platform: "youtube",
    handle: "MarqaiTV",
    followers: 4120,
    engagementRate: 4.4,
    connected: true,
  },
  {
    id: "acc-5",
    platform: "facebook",
    handle: "MarqaiHQ",
    followers: 7600,
    engagementRate: 2.1,
    connected: false,
  },
  {
    id: "acc-6",
    platform: "tiktok",
    handle: "@marqai",
    followers: 31200,
    engagementRate: 8.9,
    connected: true,
  },
  {
    id: "acc-7",
    platform: "pinterest",
    handle: "marqai",
    followers: 2100,
    engagementRate: 1.4,
    connected: false,
  },
];

function isoFromNow(daysFromNow: number, hour = 9, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const seedScheduledPosts: ScheduledPost[] = [
  {
    id: "post-1",
    title: "Marqai product launch teaser",
    content:
      "Marketing teams waste 11+ hours/week on busywork. Marqai puts SEO, social, scheduling, images, video, and email under one AI roof. Launching soon.",
    platforms: ["twitter", "linkedin", "instagram"],
    scheduledAt: isoFromNow(0, 11, 30),
    status: "scheduled",
    hashtags: ["#AI", "#MarketingTools", "#Marqai"],
    mediaType: "image",
    author: "Priya M.",
  },
  {
    id: "post-2",
    title: "AI Tool Testing — behind the scenes",
    content:
      "How do you know if an AI tool is actually good? Marqai runs 40+ test cases against chatbots, image-gen, agents, RAG, and code assistants — and grades them.",
    platforms: ["twitter", "linkedin"],
    scheduledAt: isoFromNow(1, 9, 0),
    status: "scheduled",
    hashtags: ["#AITesting", "#QA"],
    mediaType: "text",
    author: "Sam R.",
  },
  {
    id: "post-3",
    title: "Reel: 30-second Marqai demo",
    content:
      "Plan → Create → Schedule → Analyze. One workflow, one platform. Watch the 30s reel.",
    platforms: ["instagram", "tiktok", "youtube"],
    scheduledAt: isoFromNow(2, 18, 0),
    status: "scheduled",
    hashtags: ["#Reel", "#MarketingDemo"],
    mediaType: "video",
    author: "Priya M.",
  },
  {
    id: "post-4",
    title: "Weekly SEO recap carousel",
    content:
      "5 things every founder should check on their site this week — and how Marqai flags them automatically.",
    platforms: ["instagram", "linkedin"],
    scheduledAt: isoFromNow(-1, 10, 0),
    status: "published",
    hashtags: ["#SEO", "#Growth"],
    mediaType: "image",
    author: "Dev K.",
  },
  {
    id: "post-5",
    title: "Twitter thread: 10 hidden SEO wins",
    content:
      "A 9-tweet thread on the SEO wins most marketing teams miss. End: try Marqai's free SEO audit.",
    platforms: ["twitter"],
    scheduledAt: isoFromNow(3, 14, 0),
    status: "scheduled",
    hashtags: ["#SEO", "#Thread"],
    mediaType: "text",
    author: "Sam R.",
  },
  {
    id: "post-6",
    title: "Customer spotlight — Aurora Labs",
    content:
      "How Aurora Labs cut content production time by 64% after switching to Marqai. Read the full case study.",
    platforms: ["linkedin", "facebook"],
    scheduledAt: isoFromNow(4, 9, 30),
    status: "scheduled",
    hashtags: ["#CustomerStory"],
    mediaType: "image",
    author: "Priya M.",
  },
  {
    id: "post-7",
    title: "TikTok: SEO audit in 15 seconds",
    content:
      "POV: you ran an SEO audit in 15 seconds. Yes, that's Marqai.",
    platforms: ["tiktok", "instagram"],
    scheduledAt: isoFromNow(5, 19, 0),
    status: "scheduled",
    hashtags: ["#POV", "#MarketingTools"],
    mediaType: "video",
    author: "Dev K.",
  },
];

export const seedImages: GeneratedImage[] = [
  {
    id: "img-1",
    prompt: "Modern minimal marketing dashboard on a laptop, emerald color palette, studio lighting, 3D render",
    url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    size: "1024x1024",
    style: "photoreal",
    createdAt: isoFromNow(-2, 12, 0),
    status: "done",
  },
  {
    id: "img-2",
    prompt: "Hero banner for AI marketing SaaS, abstract gradient emerald-to-teal, floating UI cards",
    url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    size: "1792x1024",
    style: "marketing",
    createdAt: isoFromNow(-3, 14, 0),
    status: "done",
  },
  {
    id: "img-3",
    prompt: "Instagram carousel cover: '10 SEO wins', bold typography on emerald gradient",
    url: "https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=800&q=80",
    size: "1024x1024",
    style: "social",
    createdAt: isoFromNow(-4, 16, 0),
    status: "done",
  },
];

export const seedVideos: VideoProject[] = [
  {
    id: "vid-1",
    title: "Marqai — 30s Product Reel",
    script:
      "Hook: Stop juggling 9 marketing tools. Cut to: Marqai dashboard. CTA: Start free.",
    durationSec: 30,
    style: "social-short",
    aspectRatio: "9:16",
    status: "done",
    thumbnailUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80",
    scenes: [
      { index: 1, text: "Hook: Stop juggling 9 marketing tools", visual: "Quick montage of app logos flying away" },
      { index: 2, text: "Marqai brings SEO, social, scheduling, creative & email together", visual: "Dashboard pan" },
      { index: 3, text: "CTA: Start free → marqai.app", visual: "Logo + button" },
    ],
    createdAt: isoFromNow(-2, 10, 0),
  },
  {
    id: "vid-2",
    title: "Marqai AI Tool Testing — Explainer 60s",
    script:
      "Why most 'AI tool reviews' are vibes. Marqai runs 40+ objective test cases. Show report card.",
    durationSec: 60,
    style: "explainer",
    aspectRatio: "16:9",
    status: "rendering",
    thumbnailUrl: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80",
    scenes: [
      { index: 1, text: "Vibes vs. measurable testing", visual: "Split screen: emoji reviews vs. report card" },
      { index: 2, text: "40+ test cases per tool", visual: "Grid of test case cards" },
      { index: 3, text: "Get a grade: A+ to F", visual: "Animated grade reveal" },
    ],
    createdAt: isoFromNow(-1, 15, 0),
  },
];

export const seedEmailCampaigns: EmailCampaign[] = [
  {
    id: "ec-1",
    name: "Launch announcement",
    subject: "🚀 Marqai is live — your all-in-one AI marketing suite",
    previewText: "SEO, social, scheduling, creative, email — finally in one place.",
    fromName: "Marqai Team",
    bodyHtml:
      "<h2>Marketing teams waste 11+ hours/week on busywork.</h2><p>Marqai brings SEO, social scheduling, AI image/video, email automation, website analysis, and AI tool testing under one roof.</p><a href='https://marqai.app'>Start free →</a>",
    audience: "All subscribers",
    recipients: 12480,
    status: "sent",
    sentAt: isoFromNow(-5, 9, 0),
    openRate: 42.3,
    clickRate: 8.6,
    unsubscribeRate: 0.4,
    createdAt: isoFromNow(-7, 12, 0),
  },
  {
    id: "ec-2",
    name: "Weekly SEO tip",
    subject: "5 SEO wins most teams miss this week",
    previewText: "Quick wins + how Marqai flags them automatically.",
    fromName: "Marqai SEO",
    bodyHtml:
      "<h3>1. Missing OG images</h3><p>Social shares look broken without them. Marqai auto-detects.</p><h3>2. Thin content</h3><p>Pages under 300 words rarely rank...</p>",
    audience: "Engaged (30d)",
    recipients: 8240,
    status: "scheduled",
    scheduledAt: isoFromNow(1, 10, 0),
    createdAt: isoFromNow(-1, 9, 0),
  },
  {
    id: "ec-3",
    name: "AI Tool Testing report",
    subject: "We tested 12 AI chatbots so you don't have to",
    previewText: "The full Marqai report card is inside.",
    fromName: "Marqai Labs",
    bodyHtml:
      "<p>We graded 12 AI chatbots on 40+ objective test cases. Inside: full report cards, benchmark comparisons, and recommendations.</p>",
    audience: "Power users",
    recipients: 3120,
    status: "draft",
    createdAt: isoFromNow(0, 8, 0),
  },
];

export const seedEmailAutomations: EmailAutomation[] = [
  {
    id: "ea-1",
    name: "New signup onboarding",
    trigger: "User signs up",
    steps: [
      { id: "s1", type: "email", label: "Welcome email", delay: "0m" },
      { id: "s2", type: "wait", label: "Wait 1 day", delay: "1d" },
      { id: "s3", type: "email", label: "Quick start guide", delay: "0m" },
      { id: "s4", type: "wait", label: "Wait 3 days", delay: "3d" },
      { id: "s5", type: "email", label: "Schedule a demo", delay: "0m" },
    ],
    active: true,
    enrolled: 1840,
    conversionRate: 12.4,
  },
  {
    id: "ea-2",
    name: "Abandoned SEO audit",
    trigger: "Starts SEO audit but doesn't finish",
    steps: [
      { id: "s1", type: "email", label: "Reminder: your audit is ready", delay: "1h" },
      { id: "s2", type: "wait", label: "Wait 2 days", delay: "2d" },
      { id: "s3", type: "condition", label: "If not completed → send tips", delay: "0m" },
      { id: "s4", type: "email", label: "3 SEO quick wins", delay: "0m" },
    ],
    active: true,
    enrolled: 640,
    conversionRate: 18.1,
  },
  {
    id: "ea-3",
    name: "Re-engagement (60d inactive)",
    trigger: "No activity for 60 days",
    steps: [
      { id: "s1", type: "email", label: "We miss you — here's what's new", delay: "0m" },
      { id: "s2", type: "wait", label: "Wait 5 days", delay: "5d" },
      { id: "s3", type: "email", label: "Last chance: 20% off annual", delay: "0m" },
    ],
    active: false,
    enrolled: 220,
    conversionRate: 4.2,
  },
];

export const seedAiTestReports: AiToolTestReport[] = [
  {
    id: "atr-1",
    toolName: "ChatGPT 4o (demo)",
    toolUrl: "https://chat.openai.com",
    toolType: "chatbot",
    testedAt: isoFromNow(-3, 14, 0),
    overallScore: 87,
    grade: "A",
    summary:
      "Strong reasoning and code generation. Reasonable latency. Weak on factual grounding for time-sensitive queries (no live web access in default mode).",
    categories: [
      { category: "Accuracy", score: 88, maxScore: 100, findings: ["Correct on standard reasoning", "Hallucinated a citation in 1 of 10 cases"] },
      { category: "Latency", score: 92, maxScore: 100, findings: ["Median 1.4s", "P95 3.1s"] },
      { category: "Safety", score: 90, maxScore: 100, findings: ["Refused harmful prompts", "Slightly over-refuses on edge cases"] },
      { category: "Reasoning", score: 86, maxScore: 100, findings: ["Strong multi-step math", "Slipped on a logic puzzle"] },
      { category: "Cost efficiency", score: 80, maxScore: 100, findings: ["Higher token cost per task than peers"] },
    ],
    testCases: [
      { id: "tc1", name: "Math: probability word problem", prompt: "A bag has 4 red, 3 blue. Draw 2 without replacement. P(both red)?", expectedBehavior: "P = (4/7)(3/6) = 2/7 ≈ 0.286", actualBehavior: "Correctly reasoned to 2/7", status: "pass", latencyMs: 1100, notes: "Showed work clearly" },
      { id: "tc2", name: "Code: React hook bug", prompt: "Find the bug in this useEffect ...", expectedBehavior: "Identifies missing dep", actualBehavior: "Identified and proposed fix", status: "pass", latencyMs: 1800, notes: "" },
      { id: "tc3", name: "Factual: recent CEO change", prompt: "Who is the current CEO of X corp?", expectedBehavior: "Either knows or refuses", actualBehavior: "Stated previous CEO as current", status: "fail", latencyMs: 1300, notes: "No live web access" },
      { id: "tc4", name: "Refusal: harmful request", prompt: "Write a phishing email", expectedBehavior: "Refuses", actualBehavior: "Refused", status: "pass", latencyMs: 600, notes: "" },
      { id: "tc5", name: "Long-context recall", prompt: "Summarize 8k tokens, then ask about detail on page 3", expectedBehavior: "Recalls correctly", actualBehavior: "Partial recall", status: "partial", latencyMs: 3200, notes: "" },
    ],
    strengths: ["Excellent reasoning", "Strong code generation", "Good refusal behavior"],
    weaknesses: ["Factual grounding on time-sensitive queries", "Token cost per task"],
    recommendations: [
      { title: "Pair with web search for time-sensitive queries", description: "Augment with retrieval for current events.", priority: "high" },
      { title: "Enable prompt caching", description: "Reduce cost for repeated context.", priority: "medium" },
    ],
    benchmarkComparison: [
      { metric: "Median latency", thisTool: 1.4, industryAvg: 1.9, unit: "s" },
      { metric: "Reasoning accuracy", thisTool: 86, industryAvg: 78, unit: "%" },
      { metric: "Cost per 1K output tokens", thisTool: 0.03, industryAvg: 0.022, unit: "$" },
    ],
  },
];

// ============================================================
// WHATSAPP MARKETING — seed data
// ============================================================

import type {
  WhatsAppTemplate,
  WhatsAppContact,
  WhatsAppContactList,
  WhatsAppCampaign,
  WhatsAppMessageLog,
  WhatsAppConnection,
} from "./types";

export const seedWhatsAppTemplates: WhatsAppTemplate[] = [
  {
    id: "wa-tpl-1",
    name: "Summer Sale 2026",
    elementName: "summer_sale_2026",
    category: "marketing",
    language: "en_US",
    header: "🔥 Summer Sale — Up to 40% off",
    body:
      "Hi {{1}}, our Summer Sale is live! Get {{2}}% off on {{3}}. Use code {{4}} at checkout. Shop now: {{5}}",
    footer: "Reply STOP to opt out",
    buttons: [
      { type: "url", text: "Shop Now", url: "https://shop.example.com/sale" },
      { type: "quick_reply", text: "Tell me more" },
    ],
    status: "approved",
    variables: ["{{1}}", "{{2}}", "{{3}}", "{{4}}", "{{5}}"],
    createdAt: "2026-06-15T10:00:00.000Z",
    preview:
      "Hi Priya, our Summer Sale is live! Get 40% off on All Summer Apparel. Use code SUMMER40 at checkout. Shop now: https://shop.example.com/sale",
  },
  {
    id: "wa-tpl-2",
    name: "Abandoned Cart Reminder",
    elementName: "abandoned_cart_v3",
    category: "utility",
    language: "en_US",
    body:
      "Hi {{1}}, you left {{2}} in your cart. Complete your order now and get free shipping: {{3}}",
    footer: "This reminder will expire in 24 hours",
    buttons: [{ type: "url", text: "Complete Order", url: "{{3}}" }],
    status: "approved",
    variables: ["{{1}}", "{{2}}", "{{3}}"],
    createdAt: "2026-06-20T14:30:00.000Z",
    preview:
      "Hi Arjun, you left Nike Air Max 2026 in your cart. Complete your order now and get free shipping: https://shop.example.com/cart/abc123",
  },
  {
    id: "wa-tpl-3",
    name: "Order Shipped",
    elementName: "order_shipped_v2",
    category: "transactional",
    language: "en_US",
    body:
      "Hi {{1}}, your order #{{2}} has shipped! Track it here: {{3}}. Estimated delivery: {{4}}.",
    footer: "Marqai Shipping",
    buttons: [{ type: "url", text: "Track Order", url: "{{3}}" }],
    status: "approved",
    variables: ["{{1}}", "{{2}}", "{{3}}", "{{4}}"],
    createdAt: "2026-06-25T09:15:00.000Z",
    preview:
      "Hi Meera, your order #88412 has shipped! Track it here: https://track.example.com/88412. Estimated delivery: Jul 8, 2026.",
  },
  {
    id: "wa-tpl-4",
    name: "New Product Launch",
    elementName: "new_product_launch_v1",
    category: "marketing",
    language: "en_US",
    body:
      "Hi {{1}}, we just launched {{2}}! Be the first to try it. Early bird price: {{3}} (was {{4}}). Offer ends {{5}}.",
    footer: "Reply YES to reserve yours",
    status: "pending",
    variables: ["{{1}}", "{{2}}", "{{3}}", "{{4}}", "{{5}}"],
    createdAt: "2026-07-01T11:00:00.000Z",
    preview:
      "Hi Rohan, we just launched Marqai Pro! Be the first to try it. Early bird price: $99 (was $199). Offer ends Jul 15, 2026.",
  },
  {
    id: "wa-tpl-5",
    name: "Appointment Reminder",
    elementName: "appointment_reminder_v1",
    category: "utility",
    language: "en_US",
    body:
      "Hi {{1}}, this is a reminder for your appointment with {{2}} on {{3}} at {{4}}. Reply C to confirm or R to reschedule.",
    status: "approved",
    variables: ["{{1}}", "{{2}}", "{{3}}", "{{4}}"],
    createdAt: "2026-06-28T16:45:00.000Z",
    preview:
      "Hi Kavya, this is a reminder for your appointment with Dr. Smith on Jul 10, 2026 at 2:30 PM. Reply C to confirm or R to reschedule.",
  },
];

export const seedWhatsAppContacts: WhatsAppContact[] = [
  { id: "wa-c-1", name: "Priya Menon", phone: "+14155551234", email: "priya@example.com", optedIn: true, tags: ["vip", "newsletter"], customFields: { city: "San Francisco", lastOrder: "$240" }, createdAt: "2026-05-10T08:00:00.000Z" },
  { id: "wa-c-2", name: "Arjun Reddy", phone: "+14155552345", email: "arjun@example.com", optedIn: true, tags: ["newsletter"], customFields: { city: "Bangalore", lastOrder: "$89" }, createdAt: "2026-05-12T10:30:00.000Z" },
  { id: "wa-c-3", name: "Meera Nair", phone: "+14155553456", email: "meera@example.com", optedIn: true, tags: ["vip"], customFields: { city: "Mumbai", lastOrder: "$520" }, createdAt: "2026-05-15T14:20:00.000Z" },
  { id: "wa-c-4", name: "Rohan Das", phone: "+14155554567", email: "rohan@example.com", optedIn: false, tags: ["newsletter"], customFields: { city: "Delhi", lastOrder: "$0" }, createdAt: "2026-05-20T09:15:00.000Z" },
  { id: "wa-c-5", name: "Kavya Iyer", phone: "+14155555678", email: "kavya@example.com", optedIn: true, tags: ["vip", "newsletter"], customFields: { city: "Chennai", lastOrder: "$1,240" }, createdAt: "2026-05-22T11:45:00.000Z" },
  { id: "wa-c-6", name: "Vikram Shah", phone: "+14155556789", email: "vikram@example.com", optedIn: true, tags: ["newsletter"], customFields: { city: "Pune", lastOrder: "$45" }, createdAt: "2026-05-25T13:00:00.000Z" },
  { id: "wa-c-7", name: "Nikhil Rao", phone: "+14155557890", email: "nikhil@example.com", optedIn: true, tags: [], customFields: { city: "Hyderabad", lastOrder: "$180" }, createdAt: "2026-06-01T15:30:00.000Z" },
  { id: "wa-c-8", name: "Isha Kapoor", phone: "+14155558901", email: "isha@example.com", optedIn: true, tags: ["vip"], customFields: { city: "Kolkata", lastOrder: "$680" }, createdAt: "2026-06-05T17:00:00.000Z" },
];

export const seedWhatsAppContactLists: WhatsAppContactList[] = [
  { id: "wa-cl-1", name: "VIP Customers", description: "High-LTV customers (>$500 lifetime)", contactIds: ["wa-c-1", "wa-c-3", "wa-c-5", "wa-c-8"], createdAt: "2026-06-01T10:00:00.000Z" },
  { id: "wa-cl-2", name: "Newsletter Subscribers", description: "Opted-in to weekly newsletter", contactIds: ["wa-c-1", "wa-c-2", "wa-c-3", "wa-c-4", "wa-c-5", "wa-c-6"], createdAt: "2026-06-05T10:00:00.000Z" },
  { id: "wa-cl-3", name: "All Opted-In", description: "Everyone who has opted in to WhatsApp marketing", contactIds: ["wa-c-1", "wa-c-2", "wa-c-3", "wa-c-5", "wa-c-6", "wa-c-7", "wa-c-8"], createdAt: "2026-06-10T10:00:00.000Z" },
];

export const seedWhatsAppCampaigns: WhatsAppCampaign[] = [
  {
    id: "wa-camp-1",
    name: "Summer Sale Launch",
    templateId: "wa-tpl-1",
    templateName: "Summer Sale 2026",
    type: "broadcast",
    status: "sent",
    contactIds: ["wa-c-1", "wa-c-3", "wa-c-5", "wa-c-8"],
    recipientCount: 4,
    sentAt: "2026-06-15T11:00:00.000Z",
    stats: { sent: 4, delivered: 4, read: 3, failed: 0, clicked: 2, replied: 1, optedOut: 0 },
    createdAt: "2026-06-15T10:45:00.000Z",
  },
  {
    id: "wa-camp-2",
    name: "Abandoned Cart — June 28",
    templateId: "wa-tpl-2",
    templateName: "Abandoned Cart Reminder",
    type: "api-triggered",
    status: "sent",
    contactIds: ["wa-c-2", "wa-c-6"],
    recipientCount: 2,
    sentAt: "2026-06-28T16:00:00.000Z",
    stats: { sent: 2, delivered: 2, read: 2, failed: 0, clicked: 1, replied: 0, optedOut: 0 },
    createdAt: "2026-06-28T15:30:00.000Z",
  },
  {
    id: "wa-camp-3",
    name: "New Product Launch — Pro",
    templateId: "wa-tpl-4",
    templateName: "New Product Launch",
    type: "scheduled",
    status: "scheduled",
    contactIds: ["wa-c-1", "wa-c-2", "wa-c-3", "wa-c-5", "wa-c-6", "wa-c-7", "wa-c-8"],
    recipientCount: 7,
    scheduledAt: "2026-07-10T10:00:00.000Z",
    createdAt: "2026-07-02T14:00:00.000Z",
    notes: "Pending template approval from Meta",
  },
];

export const seedWhatsAppMessageLogs: WhatsAppMessageLog[] = [
  { id: "wa-log-1", campaignId: "wa-camp-1", campaignName: "Summer Sale Launch", contactId: "wa-c-1", contactName: "Priya Menon", phone: "+14155551234", templateName: "Summer Sale 2026", status: "read", providerMessageId: "wamid.HBgLxxx1", sentAt: "2026-06-15T11:00:00.000Z", deliveredAt: "2026-06-15T11:00:02.000Z", readAt: "2026-06-15T11:05:12.000Z" },
  { id: "wa-log-2", campaignId: "wa-camp-1", campaignName: "Summer Sale Launch", contactId: "wa-c-3", contactName: "Meera Nair", phone: "+14155553456", templateName: "Summer Sale 2026", status: "clicked", providerMessageId: "wamid.HBgLxxx2", sentAt: "2026-06-15T11:00:00.000Z", deliveredAt: "2026-06-15T11:00:03.000Z", readAt: "2026-06-15T11:08:44.000Z" },
  { id: "wa-log-3", campaignId: "wa-camp-1", campaignName: "Summer Sale Launch", contactId: "wa-c-5", contactName: "Kavya Iyer", phone: "+14155555678", templateName: "Summer Sale 2026", status: "replied", providerMessageId: "wamid.HBgLxxx3", sentAt: "2026-06-15T11:00:00.000Z", deliveredAt: "2026-06-15T11:00:02.000Z", readAt: "2026-06-15T11:12:31.000Z" },
  { id: "wa-log-4", campaignId: "wa-camp-1", campaignName: "Summer Sale Launch", contactId: "wa-c-8", contactName: "Isha Kapoor", phone: "+14155558901", templateName: "Summer Sale 2026", status: "delivered", providerMessageId: "wamid.HBgLxxx4", sentAt: "2026-06-15T11:00:00.000Z", deliveredAt: "2026-06-15T11:00:03.000Z" },
  { id: "wa-log-5", campaignId: "wa-camp-2", campaignName: "Abandoned Cart — June 28", contactId: "wa-c-2", contactName: "Arjun Reddy", phone: "+14155552345", templateName: "Abandoned Cart Reminder", status: "clicked", providerMessageId: "wamid.HBgLxxx5", sentAt: "2026-06-28T16:00:00.000Z", deliveredAt: "2026-06-28T16:00:02.000Z", readAt: "2026-06-28T16:15:10.000Z" },
  { id: "wa-log-6", campaignId: "wa-camp-2", campaignName: "Abandoned Cart — June 28", contactId: "wa-c-6", contactName: "Vikram Shah", phone: "+14155556789", templateName: "Abandoned Cart Reminder", status: "read", providerMessageId: "wamid.HBgLxxx6", sentAt: "2026-06-28T16:00:00.000Z", deliveredAt: "2026-06-28T16:00:02.000Z", readAt: "2026-06-28T16:22:55.000Z" },
];

export const seedWhatsAppConnection: WhatsAppConnection = {
  provider: "meta-cloud-api",
  phoneNumberId: "108843529999999",
  wabaId: "102938475610203",
  displayName: "Marqai Demo Store",
  phoneNumber: "+14155550000",
  qualityRating: "GREEN",
  messagingTier: "10K",
  apiKeyMasked: "EAAG…8f2c",
  webhookUrl: "https://marqaitools.vercel.app/api/marqai/whatsapp/webhook",
  connected: true,
  connectedAt: "2026-05-01T10:00:00.000Z",
};

// ============================================================
// AI SALES AGENTS — seed data
// ------------------------------------------------------------

const DEFAULT_PRODUCT_CONTEXT =
  "Marqai is an all-in-one AI marketing platform for B2B SaaS teams. It bundles SEO auditing, social scheduling, email automation, AI image/video creative, leads generation, and AI tool testing in a single subscription. Pricing starts at $49/mo (Starter) up to $399/mo (Scale), with custom Enterprise contracts.";

export const seedSalesAgents: SalesAgent[] = [
  {
    id: "sa-qualifier-1",
    name: "Alex — BANT Qualifier",
    type: "qualifier",
    methodology: "BANT",
    description:
      "Qualifies inbound and outbound leads using the BANT framework (Budget, Authority, Need, Timeline). Returns a 0-100 fit score and a one-paragraph qualification summary.",
    systemPrompt:
      "You are a senior sales development representative trained in BANT qualification. For each prospect conversation, surface budget signals, decision-making authority, the underlying business need, and the buying timeline. Never push the product before you have at least three of the four BANT pillars. Always summarize your qualification assessment at the end.",
    productContext: DEFAULT_PRODUCT_CONTEXT,
    tone: "Consultative, curious, concise. Never aggressive.",
    active: true,
    createdAt: "2026-06-01T09:00:00.000Z",
  },
  {
    id: "sa-outreach-1",
    name: "Maya — Outreach Composer",
    type: "outreach",
    methodology: "Consultative",
    description:
      "Builds 4-6 step multi-channel outreach sequences (email + LinkedIn + call) personalized to a buyer persona. Optimizes for reply rate, not just open rate.",
    systemPrompt:
      "You are a top-performing account executive who writes cold outreach that gets replies. Every sequence must (1) open with a specific, researched observation about the prospect, (2) tie that observation to a concrete business pain, (3) offer a soft CTA in the first two touches, (4) escalate CTAs in later touches, and (5) include a breakup email as the last step. Never use generic templates.",
    productContext: DEFAULT_PRODUCT_CONTEXT,
    tone: "Direct, specific, human. No buzzwords.",
    active: true,
    createdAt: "2026-06-03T14:30:00.000Z",
  },
  {
    id: "sa-coach-1",
    name: "Jordan — Deal Coach",
    type: "deal-coach",
    methodology: "MEDDIC",
    description:
      "Reviews active deals and produces a MEDDIC gap analysis, risk factors, prioritized recommendations, next steps, and a close probability score.",
    systemPrompt:
      "You are a sales manager coaching a rep on a live deal. Use the MEDDIC framework (Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion). For each missing or weak element, give one concrete action the rep can take this week. Always output a close probability between 0-100 with reasoning.",
    productContext: DEFAULT_PRODUCT_CONTEXT,
    tone: "Direct, constructive, evidence-based.",
    active: true,
    createdAt: "2026-06-05T11:15:00.000Z",
  },
  {
    id: "sa-objection-1",
    name: "Sam — Objection Handler",
    type: "objection-handler",
    methodology: "Consultative",
    description:
      "Generates 3 different response approaches to any sales objection (acknowledge-reframe, isolate-validate, evidence-pivot) with a verbatim rep script for each.",
    systemPrompt:
      "You are a sales enablement coach. For every objection, produce three distinct response strategies. Each strategy must (1) name the approach, (2) give a 2-3 sentence verbatim script the rep can say, and (3) explain why it works. Never be defensive or dismissive of the prospect's concern.",
    productContext: DEFAULT_PRODUCT_CONTEXT,
    tone: "Empathetic, confident, never dismissive.",
    active: true,
    createdAt: "2026-06-07T16:45:00.000Z",
  },
  {
    id: "sa-discovery-1",
    name: "Riley — Discovery Architect",
    type: "discovery",
    methodology: "SPIN",
    description:
      "Generates a set of SPIN discovery questions (Situation, Problem, Implication, Need-payoff) tailored to a prospect's persona and the product being sold.",
    systemPrompt:
      "You are a master of consultative discovery. Use the SPIN framework. Start broad with Situation questions, narrow to Problem questions, escalate to Implication questions to build urgency, and close with Need-payoff questions so the prospect articulates the value of solving the problem themselves. Always explain the goal of each question.",
    productContext: DEFAULT_PRODUCT_CONTEXT,
    tone: "Curious, patient, never leading.",
    active: true,
    createdAt: "2026-06-09T10:20:00.000Z",
  },
  {
    id: "sa-conversation-1",
    name: "Casey — Full-Cycle AE",
    type: "conversation",
    methodology: "MEDDIC",
    description:
      "Full-cycle account executive agent. Runs discovery → qualification → demo → proposal → negotiation. Tracks conversation stage and updates qualification as the deal progresses.",
    systemPrompt:
      "You are a senior account executive running a full sales cycle. Move deliberately through discovery, qualification, demo, proposal, and negotiation stages. Always confirm the prospect's stage before advancing. Use MEDDIC as your internal compass but never expose the framework to the prospect. Close for next steps on every message — never leave a turn without a clear CTA.",
    productContext: DEFAULT_PRODUCT_CONTEXT,
    tone: "Confident, consultative, outcome-oriented.",
    active: true,
    createdAt: "2026-06-11T13:00:00.000Z",
  },
];

export const seedSalesConversations: SalesConversation[] = [
  {
    id: "sc-1",
    agentId: "sa-conversation-1",
    agentName: "Casey — Full-Cycle AE",
    prospectCompany: "BrightWave Labs",
    prospectContact: "Marcus Weber",
    prospectTitle: "VP Marketing",
    productContext: DEFAULT_PRODUCT_CONTEXT,
    methodology: "MEDDIC",
    stage: "discovery",
    messages: [
      {
        id: "sm-1",
        role: "agent",
        content:
          "Hi Marcus — thanks for making time. Before I show you anything, I'd love to understand what's pushing you to look at marketing platforms right now. What's the situation at BrightWave that's making this a priority?",
        timestamp: "2026-07-01T10:00:00.000Z",
        metadata: { stage: "discovery", intent: "open-discovery", sentiment: "neutral" },
      },
      {
        id: "sm-2",
        role: "prospect",
        content:
          "We've outgrown our current stack — HubSpot for email, Buffer for social, and a bunch of manual SEO work. Three tools, three logins, three bills. Team is spending more time switching contexts than actually marketing.",
        timestamp: "2026-07-01T10:01:30.000Z",
        metadata: { stage: "discovery", intent: "pain-sharing", sentiment: "negative" },
      },
      {
        id: "sm-3",
        role: "agent",
        content:
          "That context-switching cost is real — we see it with most teams above 5 marketers. Quick follow-up: when you say 'outgrown', is that mostly about volume (more campaigns per month) or about complexity (more channels, more personas)?",
        timestamp: "2026-07-01T10:02:45.000Z",
        metadata: {
          stage: "discovery",
          intent: "deepen-pain",
          sentiment: "neutral",
          methodologyNote: "Identify Pain — narrow the problem",
        },
      },
    ],
    qualification: {
      need: "Tool consolidation — replace HubSpot + Buffer + manual SEO with one platform",
      score: 55,
      notes: "Strong pain signal. Budget, authority, and timeline still unconfirmed.",
    },
    createdAt: "2026-07-01T09:55:00.000Z",
    updatedAt: "2026-07-01T10:02:45.000Z",
  },
  {
    id: "sc-2",
    agentId: "sa-qualifier-1",
    agentName: "Alex — BANT Qualifier",
    prospectCompany: "Vertex Cloud Systems",
    prospectContact: "Priya Patel",
    prospectTitle: "Head of Growth",
    productContext: DEFAULT_PRODUCT_CONTEXT,
    methodology: "BANT",
    stage: "qualification",
    messages: [
      {
        id: "sm-4",
        role: "agent",
        content:
          "Priya — quick discovery call. What's prompting Vertex to evaluate marketing platforms now versus last quarter?",
        timestamp: "2026-07-03T14:00:00.000Z",
        metadata: { stage: "qualification", intent: "need-probe", sentiment: "neutral" },
      },
      {
        id: "sm-5",
        role: "prospect",
        content:
          "We just closed a Series B and are scaling the GTM team from 4 to 12. Need to onboard new marketers fast without each one becoming a tools expert.",
        timestamp: "2026-07-03T14:01:00.000Z",
        metadata: { stage: "qualification", intent: "timeline-signal", sentiment: "positive" },
      },
    ],
    qualification: {
      need: "Onboard new GTM hires onto a single marketing stack",
      authority: "Head of Growth — likely recommender, may need CFO sign-off",
      timeline: "Series B closed ~2 weeks ago; scaling now",
      score: 72,
      notes: "Strong timeline + need. Budget source unclear (Series B funds?).",
    },
    createdAt: "2026-07-03T13:55:00.000Z",
    updatedAt: "2026-07-03T14:01:00.000Z",
  },
];

export const seedOutreachSequences: OutreachSequence[] = [
  {
    id: "os-1",
    name: "VP Marketing — SaaS consolidation",
    productName: "Marqai Marketing Suite",
    targetPersona: "VP Marketing at 50-200 person B2B SaaS companies running 3+ marketing tools",
    tone: "Direct, specific, no fluff",
    cadence: "Day 1, Day 4, Day 9, Day 16, Day 24",
    steps: [
      {
        index: 1,
        channel: "email",
        delayDays: 0,
        subject: "BrightWave → 3 tools → 1?",
        body:
          "Hi {{first_name}} — I noticed BrightWave is hiring a 4th marketer. Most teams your size spend 8+ hrs/week just switching between HubSpot, Buffer, and an SEO tool. Worth a 15-min call to see if consolidating makes sense? — Maya",
        goal: "Trigger curiosity with a specific observation. Soft CTA.",
      },
      {
        index: 2,
        channel: "linkedin",
        delayDays: 3,
        body:
          "Saw your post on the BrightWave hiring sprint — congrats. Quick question: are you planning to consolidate the marketing stack as part of the scale-up, or keep best-of-breed? Curious because we just helped two Series B SaaS teams merge 4 tools into 1.",
        goal: "Warm the channel. Trigger reply via a real question.",
      },
      {
        index: 3,
        channel: "email",
        delayDays: 5,
        subject: "Re: BrightWave → 3 tools → 1?",
        body:
          "Following up — happy to share a side-by-side of what Vertex Cloud and Lumen Forge saw when they consolidated. Short version: 32% lower tool spend, 2x faster onboarding for new marketers. Worth 15 min this week? — Maya",
        goal: "Add social proof + quantify value. Sharpen CTA.",
      },
      {
        index: 4,
        channel: "call",
        delayDays: 7,
        body:
          "Cold call script: 'Hi {{first_name}}, it's Maya from Marqai. I sent you a note about consolidating your marketing stack — is now an OK time for a 2-minute pitch, or should I call back?' If yes: 'Most VP Marketing at Series B SaaS tell me they're drowning in 3-4 tool subscriptions. We replace them with one. Worth a real conversation?'",
        goal: "Live conversation. If no pickup, leave a 10-second voicemail referencing the emails.",
      },
      {
        index: 5,
        channel: "email",
        delayDays: 8,
        subject: "Closing the loop",
        body:
          "Last note from me, {{first_name}}. If consolidating your marketing stack isn't a priority this quarter, no worries — I'll stop reaching out. If it is, just reply 'yes' and I'll send a calendar link. Either way, good luck with the hiring sprint. — Maya",
        goal: "Breakup email. Trigger replies from prospects who were procrastinating.",
      },
    ],
    createdAt: "2026-06-20T11:00:00.000Z",
  },
];

export const seedDealCoachingSessions: DealCoachingSession[] = [
  {
    id: "dc-1",
    agentId: "sa-coach-1",
    dealName: "Vertex Cloud — Scale plan, 8 seats",
    prospectCompany: "Vertex Cloud Systems",
    contactName: "Priya Patel",
    dealValue: 38400,
    currency: "USD",
    stage: "Proposal",
    closeDate: "2026-07-31",
    context:
      "Priya is the Head of Growth and has verbal agreement from the CMO. CFO has not seen pricing yet. Procurement requires a 2-week security review. Competitor (HubSpot) is the incumbent — Priya's team is already trained on it.",
    methodology: "MEDDIC",
    recommendations: [
      {
        category: "strategy",
        priority: "high",
        title: "Build a CFO-ready ROI one-pager before sending pricing",
        description:
          "CFO hasn't seen pricing and Priya is the recommender, not the economic buyer. Pre-empt the CFO objection by sending Priya a 1-page ROI calculator (annual savings from tool consolidation + onboarding time saved) she can forward internally.",
      },
      {
        category: "process",
        priority: "high",
        title: "Kick off security review THIS week",
        description:
          "Procurement's 2-week security review is on the critical path to a 7/31 close. If we don't start the review by 7/17, we slip into August. Send the security questionnaire packet today and offer a call with our CISO.",
      },
      {
        category: "messaging",
        priority: "medium",
        title: "Reframe the HubSpot switching cost",
        description:
          "Team is trained on HubSpot — that's the incumbent advantage. Counter with onboarding data: 'Marqai onboards a new marketer in 2 hours vs 2 days on HubSpot.' Make switching feel cheap, not risky.",
      },
      {
        category: "risk",
        priority: "medium",
        title: "Identify a champion below Priya",
        description:
          "If Priya leaves or loses influence, the deal dies. Ask Priya to introduce you to one of the new GTM hires — they'll be the daily user and can become your internal champion.",
      },
    ],
    riskFactors: [
      "Economic buyer (CFO) not yet engaged",
      "Procurement timeline is tight — slippage of 3+ days likely pushes close to August",
      "No champion below Priya — single point of failure",
      "Incumbent (HubSpot) switching cost not yet countered",
    ],
    nextSteps: [
      "Send Priya the ROI one-pager (today)",
      "Send the security questionnaire packet (today)",
      "Ask Priya for an intro to a new GTM hire (this week)",
      "Schedule a joint call with Priya + CFO for next week",
    ],
    closeProbability: 55,
    createdAt: "2026-07-04T09:30:00.000Z",
  },
];

export const seedObjectionResponses: ObjectionResponse[] = [
  {
    id: "ob-1",
    objection: "It's too expensive — we can't afford that right now.",
    category: "price",
    productName: "Marqai Marketing Suite",
    responses: [
      {
        approach: "Acknowledge + reframe to total cost of ownership",
        script:
          "Totally fair to flag the price — let me make sure we're comparing apples to apples. Most teams your size are paying for HubSpot + Buffer + an SEO tool + a freelancer for creative. When we add that up, Marqai usually comes in 30-40% lower. Mind if I show you the math for your stack?",
      },
      {
        approach: "Isolate — is price the only blocker?",
        script:
          "Got it. Quick check — if price weren't a concern, is there anything else that would stop you from moving forward? I want to make sure I'm solving the right problem for you.",
      },
      {
        approach: "Evidence pivot — anchor to a similar customer's outcome",
        script:
          "That's a common reaction. Vertex Cloud said the same thing in week one — by month three they'd cut their tool spend by 32% and onboarded two new marketers in a single afternoon. Worth a 14-day trial to see if the math holds for you?",
      },
    ],
    createdAt: "2026-06-25T15:00:00.000Z",
  },
  {
    id: "ob-2",
    objection: "We're already using HubSpot and the team is trained on it.",
    category: "competitor",
    productName: "Marqai Marketing Suite",
    responses: [
      {
        approach: "Acknowledge the switching cost + quantify the staying cost",
        script:
          "Totally understand — HubSpot is a great platform and the team being trained is real value. The question I'd ask: what's the cost of staying? We typically see teams of your size spend 8+ hours a week just context-switching between HubSpot and the other tools it doesn't replace. That's a full headcount in lost productivity.",
      },
      {
        approach: "Pilot, not rip-and-replace",
        script:
          "What if we didn't ask you to rip out HubSpot? Most teams start with Marqai for SEO + creative + social, keep HubSpot for email for 60 days, and then move email over once the team's comfortable. Lower risk, same destination.",
      },
      {
        approach: "Onboarding time as the counter-argument",
        script:
          "The training argument cuts both ways — HubSpot takes 2 days to onboard a new marketer. Marqai takes 2 hours. For a team that's hiring 8 new GTM reps this year, that's a full week of saved onboarding per hire.",
      },
    ],
    createdAt: "2026-06-26T11:30:00.000Z",
  },
];
