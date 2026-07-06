"use client";

export function FunctionalDoc() {
  return (
    <div className="space-y-6 text-sm leading-relaxed">
      <section>
        <h4 className="text-base font-bold mb-2 text-emerald-700">1. Product Overview</h4>
        <p className="mb-2">
          Marqai is a multi-tenant SaaS platform that bundles seven marketing workflows and an AI tool testing module into a single workspace. It is sold on a monthly subscription basis to marketing agencies and in-house marketing teams who onboard their sales and digital marketing teams onto the platform.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>One subscription, many modules</strong> — replaces 4–6 single-purpose SaaS tools.</li>
          <li><strong>Multi-tenant by design</strong> — every customer gets an isolated Organization with its own roles, team, and data.</li>
          <li><strong>Role-based access</strong> — Super Admin can create unlimited custom roles with per-module permissions.</li>
          <li><strong>AI-native</strong> — every creative module is powered by AI (image gen, video gen, content gen, AI tool testing).</li>
        </ul>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-emerald-700">2. Modules</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2 border">Module</th>
                <th className="text-left p-2 border">Min Plan</th>
                <th className="text-left p-2 border">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Dashboard", "Starter", "KPI overview across all modules"],
                ["SEO Analyzer", "Starter", "Audit any URL for SEO + missing analytics"],
                ["Social Marketing", "Starter", "Compose & post across 7 social platforms"],
                ["Scheduler", "Starter", "Daily/weekly content calendar"],
                ["Email Automation", "Starter", "Campaigns + automation flows"],
                ["Image Studio", "Growth", "AI image generation with style presets"],
                ["Video Studio", "Growth", "AI marketing video generation"],
                ["Website Analyzer", "Growth", "Deep portal analysis (tech, traffic, competitors)"],
                ["AI Tool Testing", "Scale", "Objective QA of any AI tool — full report card"],
                ["Team Management", "Starter", "Invite members, assign roles, track seats"],
                ["Role Master", "Starter", "Create unlimited custom roles"],
                ["Subscription", "Starter", "Plan, usage, invoices, upgrade/downgrade"],
                ["Wiki / Docs", "Starter", "Functional + technical docs in-app"],
                ["Settings", "Starter", "Brand identity, integrations, deploy"],
              ].map(([m, p, d]) => (
                <tr key={m}>
                  <td className="p-2 border font-medium">{m}</td>
                  <td className="p-2 border">{p}</td>
                  <td className="p-2 border text-muted-foreground">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-emerald-700">3. Permission Model</h4>
        <p className="mb-2">Every role is a collection of module-level permissions. Each permission can be one of:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><code className="bg-muted px-1 rounded">none</code> — Module hidden from sidebar; route blocked.</li>
          <li><code className="bg-muted px-1 rounded">view</code> — Module visible; read-only access.</li>
          <li><code className="bg-muted px-1 rounded">execute</code> — Can run analyses, generate content, schedule posts.</li>
          <li><code className="bg-muted px-1 rounded">manage</code> — Full CRUD — create, edit, delete, publish.</li>
        </ul>
        <p className="mt-2">
          <strong>Super Admin</strong> bypasses all permission checks. <strong>Org Owner</strong> is a locked role with all modules set to <code className="bg-muted px-1 rounded">manage</code>.
        </p>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-emerald-700">4. Subscription & Billing</h4>
        <p className="mb-2">Marqai offers 4 plans, all with a 14-day free trial (Enterprise: 30 days):</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { name: "Starter", price: "$49/mo", seats: "3 seats", credits: "1,000 AI credits" },
            { name: "Growth", price: "$149/mo", seats: "10 seats", credits: "5,000 AI credits", popular: true },
            { name: "Scale", price: "$399/mo", seats: "25 seats", credits: "20,000 AI credits" },
            { name: "Enterprise", price: "Custom", seats: "Unlimited", credits: "Custom credits" },
          ].map((p) => (
            <div key={p.name} className="rounded-lg border p-3">
              <div className="font-semibold flex items-center gap-2">
                {p.name}
                {p.popular && <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded">POPULAR</span>}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{p.price} · {p.seats} · {p.credits}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-emerald-700">5. Multi-Tenancy Rules</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Every record belongs to exactly one Organization.</li>
          <li>Cross-org data access is forbidden at the data layer.</li>
          <li>Super Admin can read cross-org for support/audit; all access is logged.</li>
          <li>When an Organization is deleted: all child records are cascade-deleted.</li>
        </ul>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-emerald-700">6. Audit Logging</h4>
        <p className="mb-2">Every privileged action emits an AuditLog entry:</p>
        <div className="flex flex-wrap gap-1.5">
          {["role.create", "role.update", "role.delete", "user.invite", "user.remove", "user.role.change", "subscription.upgrade", "subscription.cancel", "auth.login", "auth.logout", "super_admin.impersonate"].map((a) => (
            <code key={a} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{a}</code>
          ))}
        </div>
        <p className="mt-2">Logs are retained for 2 years. Org Owners can view their org's logs; Super Admins can view all logs.</p>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-emerald-700">7. AI Credit Costs</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            ["SEO audit", "5 credits"],
            ["Website analysis", "10 credits"],
            ["Image generation", "8 credits"],
            ["Video generation", "25 credits"],
            ["Content generation", "2 credits"],
            ["AI tool test suite", "50 credits"],
          ].map(([op, cost]) => (
            <div key={op} className="rounded-md bg-muted/40 px-2.5 py-1.5 text-xs">
              <div className="font-medium">{op}</div>
              <div className="text-muted-foreground">{cost}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-emerald-700">8. AI Testing Taxonomy</h4>
        <p className="mb-3 text-sm">
          The AI Testing module ships with a comprehensive QA playbook — 33 items across 3 categories.
          Use it to thoroughly test any AI platform, AI tool, or AI-powered software and get the
          desired output reports. The playbook is also exposed via{" "}
          <code className="bg-muted px-1 rounded text-xs">GET /api/marqai/module-reports</code> for
          programmatic access.
        </p>

        <div className="space-y-3">
          <div className="rounded-lg border p-3">
            <div className="font-semibold text-sm mb-1">A. Testing Strategies (14 items)</div>
            <p className="text-xs text-muted-foreground mb-2">
              Coverage types defining WHAT to test — from functional correctness to AI-specific
              behaviors and disaster recovery.
            </p>
            <div className="flex flex-wrap gap-1">
              {[
                "Requirement & Risk-Based",
                "Smoke (post-deploy)",
                "Functional (all modules)",
                "Regression (per release)",
                "Integration (Stripe/ZAI/SMTP)",
                "Performance & Load",
                "Security & Penetration",
                "Cross-Browser & Responsive",
                "Accessibility (WCAG 2.1 AA)",
                "AI Model Validation",
                "AI Prompt & Hallucination",
                "AI Bias/Fairness",
                "AI Search Relevance",
                "Disaster Recovery & Backup",
              ].map((s) => (
                <code key={s} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{s}</code>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="font-semibold text-sm mb-1">B. Testing Methodologies (10 items)</div>
            <p className="text-xs text-muted-foreground mb-2">
              Process models defining HOW testing is organized within the team and SDLC.
            </p>
            <div className="flex flex-wrap gap-1">
              {[
                "Agile Sprint Testing",
                "Shift-Left Testing",
                "Manual Testing",
                "API Testing",
                "Automation (UI/API)",
                "Exploratory Testing",
                "Data Validation Testing",
                "UAT",
                "Production Smoke Validation",
              ].map((s) => (
                <code key={s} className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">{s}</code>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="font-semibold text-sm mb-1">C. AI-Specific Test Scenarios (9 items)</div>
            <p className="text-xs text-muted-foreground mb-2">
              Concrete test scenarios targeting known AI failure modes — run against every AI feature.
            </p>
            <div className="flex flex-wrap gap-1">
              {[
                "Product recommendation relevance",
                "Semantic search accuracy",
                "Chatbot response correctness",
                "Prompt injection resistance",
                "Personalization validation",
                "Duplicate recommendation detection",
                "Recommendation latency",
                "Feedback learning verification",
                "AI fallback when model unavailable",
              ].map((s) => (
                <code key={s} className="text-[10px] bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded">{s}</code>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          The AI Testing module has 3 tabs: <strong>Test Runner</strong> (run a test suite against any AI tool),
          <strong> Playbook</strong> (browse all 33 items with examples + pass criteria), and
          <strong> Module Reports</strong> (live QA status for every Marqai module — probes each AI endpoint
          and shows functional coverage, AI integration status, applicable strategies + scenarios, and open issues).
        </p>
      </section>
    </div>
  );
}
