"use client";

export function UserSopDoc() {
  const sops = [
    {
      title: "SOP 1 — First-time login & setup",
      who: "Org Owner",
      steps: [
        "Open https://marqaitools.vercel.app",
        "Click Sign in. Enter work email and password.",
        "Land on the Dashboard.",
        "Go to Settings → Brand identity. Set brand name, color, tagline.",
        "Go to Settings → Integrations. Paste ZAI_API_KEY. Connect social tokens (optional).",
        "Click Save.",
      ],
    },
    {
      title: "SOP 2 — Inviting your first team member",
      who: "Org Owner or anyone with team: manage",
      steps: [
        "Click Team Management in sidebar.",
        "Click Invite member (top-right).",
        "Fill in: name, email, role, job title, team position.",
        "Click Send invitation.",
        "Invitee receives email with magic link. They click, set password, land in workspace.",
        "Seat count increments by 1.",
      ],
      note: "Seat budget: Starter=3, Growth=10, Scale=25, Enterprise=unlimited. Invitations expire after 7 days.",
    },
    {
      title: "SOP 3 — Creating a custom role",
      who: "Org Owner or Super Admin",
      steps: [
        "Click Role Master in sidebar.",
        "Click New role (top-right).",
        "Fill in name (must be unique), description, color.",
        "For each module pick: None / View / Execute / Manage.",
        "Click Create role.",
      ],
      note: "Start by cloning a built-in role and modifying it. Don't grant manage on billing or roles to specialists.",
    },
    {
      title: "SOP 4 — Running an SEO audit",
      who: "Anyone with seo: execute+",
      steps: [
        "Click SEO Analyzer in sidebar.",
        "Enter URL (e.g. https://example.com/blog/post-1).",
        "Click Run audit. Wait 20-30s.",
        "Review: overall score, category scores, meta, headings, keyword density, findings, missing analytics.",
        "Save to history or Export PDF.",
      ],
      note: "Cost: 5 AI credits per audit.",
    },
    {
      title: "SOP 5 — Composing & scheduling a social post",
      who: "Anyone with social: execute+",
      steps: [
        "Click Social Marketing. Pick platform.",
        "Enter brief or topic.",
        "Click Generate. AI returns 3 variations.",
        "Pick one, edit. Click Generate hashtags.",
        "Click Schedule → pick date/time → pick additional platforms → Confirm.",
      ],
      note: "Cost: 2 AI credits per generation.",
    },
    {
      title: "SOP 6 — Using the Scheduler",
      who: "Anyone with scheduler: view+",
      steps: [
        "Click Scheduler. Default is Week view.",
        "Filter by platform or status (dropdowns at top).",
        "Drag-and-drop to move posts. Click to edit. Delete via the modal.",
        "Switch to List view via tabs at top.",
      ],
      note: "Statuses: draft, scheduled, published, failed.",
    },
    {
      title: "SOP 7 — Generating marketing images",
      who: "Anyone with images: execute+",
      steps: [
        "Click Image Studio. Enter prompt.",
        "Pick style preset (Photorealistic / Illustration / 3D / Watercolor / Logo / Icon).",
        "Pick aspect ratio (1:1, 16:9, 9:16, 4:5).",
        "Click Generate. Wait 10-15s.",
        "Download or Copy prompt to regenerate.",
      ],
      note: "Cost: 8 AI credits per image.",
    },
    {
      title: "SOP 8 — Creating a marketing video",
      who: "Anyone with videos: execute+",
      steps: [
        "Click Video Studio. Click New project.",
        "Enter title, script (or brief), style, aspect ratio.",
        "Click Generate storyboard. AI returns 3-5 scenes.",
        "Edit scenes. Click Render video. Wait for completion.",
        "Preview. Download or push to Scheduler.",
      ],
      note: "Cost: 25 AI credits per video.",
    },
    {
      title: "SOP 9 — Sending an email campaign",
      who: "Anyone with email: execute+",
      steps: [
        "Click Email Automation. Click New campaign.",
        "Fill in name, subject (or AI generate), preview, from name, body (or AI generate), audience.",
        "Save draft. Preview.",
        "Schedule or Send now.",
        "After sending: open rate, click rate, unsubscribe rate appear.",
      ],
      note: "Cost: 2 AI credits per AI generation. Sending is free.",
    },
    {
      title: "SOP 10 — Analyzing a competitor website",
      who: "Anyone with analyzer: execute+",
      steps: [
        "Click Website Analyzer. Enter competitor URL.",
        "Click Analyze.",
        "Review: tech stack, performance, traffic, sources, top pages, keywords, competitors, missing features, recommendations.",
        "Save to history.",
      ],
      note: "Cost: 10 AI credits per analysis.",
    },
    {
      title: "SOP 11 — Testing an AI tool",
      who: "Anyone with ai-testing: execute+ (Scale plan+)",
      steps: [
        "Click AI Tool Testing. Click New test.",
        "Enter tool name, URL, type (chatbot / image-gen / video-gen / agent / rag / code-assistant / voice / other).",
        "Click Run test suite. Wait 2-5 min.",
        "Review: overall score, grade, per-category, per-test-case, strengths/weaknesses, recommendations, benchmark.",
        "Save. Export PDF for stakeholders.",
      ],
      note: "Cost: 50 AI credits per test suite.",
    },
    {
      title: "SOP 12 — Upgrading or downgrading your plan",
      who: "Org Owner or anyone with billing: manage",
      steps: [
        "Click Subscription in sidebar. Review current usage.",
        "Scroll to plan catalog.",
        "Upgrade: click Upgrade → confirm proration → done (immediate).",
        "Downgrade: click Downgrade → confirm → takes effect at end of cycle.",
        "Cancel: click Cancel subscription → confirm → read-only at end of cycle.",
      ],
      note: "Proration: upgrades charged immediately, prorated. Downgrades take effect at end of cycle.",
    },
    {
      title: "SOP 13 — Switching role (Super Admin only)",
      who: "Super Admin",
      steps: [
        "Sign in as superadmin@marqai.app.",
        "Click user menu (top-right) → Switch role.",
        "Pick any role from any organization.",
        "App reloads with that role's permissions.",
        "Switch back: user menu → Exit impersonation.",
      ],
      note: "Every impersonation is audit-logged.",
    },
    {
      title: "SOP 14 — Reading the Wiki / Docs",
      who: "Anyone with wiki: view",
      steps: [
        "Click Wiki / Docs in sidebar.",
        "Pick a document from the left nav.",
        "Use search bar to find specific terms.",
        "Click Print for printable version.",
      ],
    },
    {
      title: "SOP 15 — Logging out",
      who: "Anyone",
      steps: [
        "Click avatar (top-right).",
        "Click Sign out.",
        "Return to login screen.",
      ],
      note: "Sessions expire after 30 days of inactivity.",
    },
  ];

  return (
    <div className="space-y-4 text-sm leading-relaxed">
      {sops.map((sop, idx) => (
        <section key={idx} className="rounded-lg border p-4">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-base font-bold text-amber-700">{sop.title}</h4>
            <span className="text-[10px] bg-muted px-2 py-0.5 rounded">Who: {sop.who}</span>
          </div>
          <ol className="list-decimal pl-5 space-y-1 text-xs">
            {sop.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          {sop.note && (
            <div className="mt-3 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              <strong>Note:</strong> {sop.note}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
