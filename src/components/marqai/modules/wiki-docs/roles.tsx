"use client";

export function RolesDoc() {
  const roles = [
    {
      name: "Super Admin",
      color: "from-amber-400 to-rose-500",
      who: "Marqai platform staff. 1–3 total. NOT bound to any Organization.",
      canDo: [
        "Bypass all permission checks across all Organizations.",
        "Create new Organizations (provision new customers).",
        "Provision, suspend, or revoke any Organization's subscription.",
        "Create, edit, or delete any role in any Organization.",
        "View cross-tenant analytics (platform-wide KPIs).",
        "Impersonate any user in any Organization (audit-logged).",
        "Manage the global plan catalog (pricing, features, trial length).",
        "View all audit logs across all Organizations.",
      ],
      cannotDo: [
        "Be blocked by any module permission (always full access).",
        "Be deleted from the platform (only by another Super Admin).",
      ],
      typicalDay: [
        "Open the platform dashboard — see total MRR, active orgs, churn, AI credit consumption.",
        "Review new signups from yesterday.",
        "Reach out to trial customers at day 12 to offer upgrade help.",
        "Investigate a support ticket → impersonate the customer's Org Owner → debug.",
        "Exit impersonation. Reply to the ticket.",
        "Review audit logs for any suspicious activity.",
      ],
    },
    {
      name: "Org Owner",
      color: "from-emerald-400 to-teal-500",
      who: "The customer who owns the subscription. Created with the Organization.",
      canDo: [
        "Everything any other role can do, plus:",
        "Manage billing (upgrade, downgrade, cancel, view invoices).",
        "Create, edit, delete custom roles (Role Master).",
        "Invite, remove, reassign team members.",
        "Configure brand identity and integrations.",
        "View the org's audit log.",
      ],
      cannotDo: [
        "Create or delete other Organizations.",
        "View cross-org data.",
        "Delete the Org Owner role (locked).",
        "Remove themselves if they are the only Org Owner.",
      ],
      typicalDay: [
        "Check the Dashboard for yesterday's KPIs.",
        "Review scheduled posts for the day in Scheduler.",
        "Reply to a thread from the Social Media Manager.",
        "Invite a new contractor (SEO Specialist role).",
        "Review this month's AI credit usage — decide whether to upgrade.",
        "Run an AI Tool Testing report on a vendor they're considering.",
      ],
    },
    {
      name: "Marketing Manager",
      color: "from-teal-400 to-cyan-500",
      who: "Day-to-day head of marketing. Reports to the Org Owner.",
      canDo: [
        "All marketing modules with manage: Dashboard, SEO, Social, Scheduler, Image, Video, Email, Analyzer.",
        "AI Tool Testing: view only (cannot run new tests).",
        "Team Management: view only.",
        "Subscription: view only.",
        "Wiki: view. Settings: view only.",
      ],
      cannotDo: [
        "Create or edit roles (Role Master hidden).",
        "Upgrade or cancel the subscription.",
        "Change brand identity or integrations.",
        "Delete other team members.",
      ],
      typicalDay: [
        "Open Dashboard — review week-over-week KPIs.",
        "Run a quick SEO audit on a competitor's landing page.",
        "Review the content calendar — drag posts to better slots.",
        "Generate a new image for the launch campaign.",
        "Approve the email campaign draft from the Email Marketer.",
        "Brief the Social Media Manager on next week's content themes.",
      ],
    },
    {
      name: "SEO Specialist",
      color: "from-amber-400 to-orange-500",
      who: "In-house or contractor SEO expert.",
      canDo: [
        "SEO Analyzer: manage (run, save, export).",
        "Website Analyzer: manage.",
        "Dashboard: view. Scheduler: view. Wiki: view. Settings: view.",
      ],
      cannotDo: [
        "Social Marketing, Email, Image, Video — hidden.",
        "AI Tool Testing — hidden.",
        "Team / Role / Billing — hidden.",
      ],
      typicalDay: [
        "Open SEO Analyzer. Run audits on 5 target URLs.",
        "Review findings, prioritize by impact.",
        "Open Website Analyzer on top competitor.",
        "Pull keyword gap analysis.",
        "Write a brief for the content team.",
        "Save all reports to history for the weekly sync.",
      ],
    },
    {
      name: "Social Media Manager",
      color: "from-rose-400 to-pink-500",
      who: "Owns social posting end-to-end.",
      canDo: [
        "Social Marketing: manage.",
        "Scheduler: manage (drag, edit, delete posts).",
        "Image Studio: manage (generate images for posts).",
        "Video Studio: manage (generate social-shorts).",
        "Dashboard: view. SEO: view. Analyzer: view. Wiki: view. Settings: view.",
      ],
      cannotDo: [
        "Email Automation — hidden.",
        "AI Tool Testing — hidden.",
        "Team / Role / Billing — hidden.",
      ],
      typicalDay: [
        "Open Scheduler — week view. See what's queued for today.",
        "Open Social Marketing → generate 3 posts for the morning slots.",
        "Generate images for each post in Image Studio.",
        "Schedule them.",
        "Reply to comments / DMs (in the social platform).",
        "Generate a 15-second social-short video for an upcoming launch.",
      ],
    },
    {
      name: "Email Marketer",
      color: "from-violet-400 to-purple-500",
      who: "Owns email campaigns and lifecycle automations.",
      canDo: [
        "Email Automation: manage (campaigns + flows).",
        "Scheduler: manage (email schedule is part of content calendar).",
        "Image Studio: view (use existing images, not generate new).",
        "Dashboard: view. Social: view. Wiki: view. Settings: view.",
      ],
      cannotDo: [
        "SEO, Video, Analyzer, AI Testing — hidden.",
        "Team / Role / Billing — hidden.",
      ],
      typicalDay: [
        "Open Email Automation.",
        "Draft this week's newsletter — use AI for subject + body.",
        "Pick an image from the existing gallery.",
        "Send a test to yourself.",
        "Schedule for Tuesday 10am.",
        "Review last week's campaign metrics.",
        "Tweak the welcome automation flow.",
      ],
    },
    {
      name: "AI QA Analyst",
      color: "from-cyan-400 to-blue-500",
      who: "Tests AI tools for agency clients or internal procurement.",
      canDo: [
        "AI Tool Testing: manage (run tests, save, export).",
        "Dashboard: view. Website Analyzer: view. Wiki: view. Settings: view.",
      ],
      cannotDo: [
        "All marketing modules (SEO, Social, Email, Image, Video) — hidden.",
        "Scheduler — hidden.",
        "Team / Role / Billing — hidden.",
      ],
      typicalDay: [
        "Open AI Tool Testing.",
        "A client asked you to evaluate 3 AI tools (ChatGPT 4o, Claude Sonnet, Gemini Pro).",
        "Run the test suite on all three (~3 min each).",
        "Compare the report cards side by side.",
        "Export a combined PDF for the client.",
        "Write a recommendation memo based on strengths/weaknesses.",
      ],
    },
    {
      name: "Viewer",
      color: "from-slate-400 to-slate-500",
      who: "CMO, founder, investor, or client — read-only stakeholder.",
      canDo: [
        "All unlocked modules with view permission:",
        "Dashboard, SEO, Social, Scheduler, Image, Video, Email, Analyzer, AI Testing.",
        "Wiki: view. Settings: view.",
      ],
      cannotDo: [
        "Run any AI operation (no execute permission).",
        "Edit, create, or delete anything.",
        "See Team, Role, or Billing modules.",
      ],
      typicalDay: [
        "Open Dashboard. Glance at the KPIs.",
        "Open Scheduler to see what's publishing this week.",
        "Open Email Automation → review last campaign's metrics.",
        "Open the latest AI Tool Testing report.",
        "Close the tab. Done.",
      ],
    },
  ];

  return (
    <div className="space-y-6 text-sm leading-relaxed">
      {roles.map((role) => (
        <section key={role.name} className="rounded-lg border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center text-white font-bold text-sm`}>
              {role.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h4 className="text-base font-bold">{role.name}</h4>
              <p className="text-xs text-muted-foreground">{role.who}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-3">
            <div>
              <div className="text-xs font-semibold text-emerald-700 mb-1">✓ Can do</div>
              <ul className="list-disc pl-5 text-xs space-y-0.5">
                {role.canDo.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-rose-700 mb-1">✗ Cannot do</div>
              <ul className="list-disc pl-5 text-xs space-y-0.5">
                {role.cannotDo.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t">
            <div className="text-xs font-semibold text-muted-foreground mb-1">Typical day in the role</div>
            <ol className="list-decimal pl-5 text-xs space-y-0.5">
              {role.typicalDay.map((t, i) => <li key={i}>{t}</li>)}
            </ol>
          </div>
        </section>
      ))}

      <section className="rounded-lg border p-4 bg-muted/30">
        <h4 className="text-base font-bold mb-3">Permission Quick Reference</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] border">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-1.5 border">Module</th>
                <th className="p-1.5 border text-center">SA</th>
                <th className="p-1.5 border text-center">OO</th>
                <th className="p-1.5 border text-center">MM</th>
                <th className="p-1.5 border text-center">SEO</th>
                <th className="p-1.5 border text-center">SOC</th>
                <th className="p-1.5 border text-center">EM</th>
                <th className="p-1.5 border text-center">QA</th>
                <th className="p-1.5 border text-center">V</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Dashboard",       "M", "M", "M", "V", "V", "V", "V", "V"],
                ["SEO Analyzer",    "M", "M", "M", "M", "V", "-", "-", "V"],
                ["Social Marketing","M", "M", "M", "-", "M", "V", "-", "V"],
                ["Scheduler",       "M", "M", "M", "V", "M", "M", "-", "V"],
                ["Image Studio",    "M", "M", "M", "-", "M", "V", "-", "V"],
                ["Video Studio",    "M", "M", "M", "-", "M", "-", "-", "V"],
                ["Email Automation","M", "M", "M", "-", "-", "M", "-", "V"],
                ["Website Analyzer","M", "M", "M", "M", "V", "-", "V", "V"],
                ["AI Tool Testing", "M", "M", "V", "-", "-", "-", "M", "V"],
                ["Team Management", "M", "M", "V", "-", "-", "-", "-", "-"],
                ["Role Master",     "M", "M", "-", "-", "-", "-", "-", "-"],
                ["Subscription",    "M", "M", "V", "-", "-", "-", "-", "-"],
                ["Wiki / Docs",     "M", "M", "V", "V", "V", "V", "V", "V"],
                ["Settings",        "M", "M", "V", "V", "V", "V", "V", "V"],
              ].map((row) => (
                <tr key={row[0]}>
                  <td className="p-1.5 border font-medium">{row[0]}</td>
                  {row.slice(1).map((c, i) => (
                    <td key={i} className={`p-1.5 border text-center font-mono ${
                      c === "M" ? "text-emerald-600 font-bold" :
                      c === "V" ? "text-sky-600" :
                      c === "-" ? "text-muted-foreground" : ""
                    }`}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-[10px] text-muted-foreground mt-2">
          Legend: <strong>M</strong> = Manage · <strong>V</strong> = View · <strong>-</strong> = None (hidden). SA=Super Admin, OO=Org Owner, MM=Marketing Mgr, SOC=Social Mgr, EM=Email Mgr, QA=AI QA, V=Viewer.
        </div>
      </section>
    </div>
  );
}
