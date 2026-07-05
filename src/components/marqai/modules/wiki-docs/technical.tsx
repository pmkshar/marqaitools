"use client";

export function TechnicalDoc() {
  return (
    <div className="space-y-6 text-sm leading-relaxed">
      <section>
        <h4 className="text-base font-bold mb-2 text-teal-700">1. Technology Stack</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border">
            <tbody>
              {[
                ["Framework", "Next.js 16 (App Router) + React 19"],
                ["Language", "TypeScript 5 (strict)"],
                ["Styling", "Tailwind CSS 4 + shadcn/ui (New York variant)"],
                ["State", "Zustand (client) + TanStack Query (server)"],
                ["Forms", "react-hook-form + zod"],
                ["Charts", "Recharts"],
                ["Animations", "Framer Motion"],
                ["Database", "Prisma ORM + SQLite (dev) / PostgreSQL (prod)"],
                ["Auth", "NextAuth.js v4 (credentials + JWT)"],
                ["AI SDK", "z-ai-web-dev-sdk (server-side only)"],
                ["Package manager", "Bun"],
                ["Deployment", "Vercel (Next.js auto-detected)"],
                ["CI/CD", "GitHub → Vercel auto-deploy on main"],
              ].map(([k, v]) => (
                <tr key={k} className="border-b">
                  <td className="p-2 font-medium bg-muted/40 w-1/3">{k}</td>
                  <td className="p-2">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-teal-700">2. System Architecture</h4>
        <p className="mb-2">
          Marqai is a single Next.js 16 deployable that handles the frontend, API routes, auth, AI integration, and database access. It uses the <strong>shared-database, shared-schema</strong> multi-tenancy model:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>One database, one <code className="bg-muted px-1 rounded">Organizations</code> table.</li>
          <li>Every domain table has an <code className="bg-muted px-1 rounded">organizationId</code> column.</li>
          <li>Every Prisma query MUST filter by <code className="bg-muted px-1 rounded">organizationId</code>.</li>
          <li>Super Admin queries bypass the filter; all such queries are audit-logged.</li>
        </ul>
        <p className="mt-2">
          <strong>Trade-off:</strong> simpler ops (one DB to back up), but careful query discipline is required. A future migration to schema-per-tenant is possible without API changes.
        </p>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-teal-700">3. Data Model</h4>
        <p className="mb-2">Full Prisma schema in <code className="bg-muted px-1 rounded">prisma/schema.prisma</code>. Key models:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Platform:</strong> SuperAdmin, Plan</li>
          <li><strong>Organization:</strong> Organization, Subscription, Invoice, Role, User, Team, TeamMember, AuditLog</li>
        </ul>
        <p className="mt-2">
          Roles store their permissions as a JSON string in the <code className="bg-muted px-1 rounded">permissions</code> column, parsed at runtime into a <code className="bg-muted px-1 rounded">PermissionMatrix</code>.
        </p>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-teal-700">4. Security Model</h4>
        <div className="space-y-2">
          <div><strong>Auth:</strong> NextAuth.js v4 credentials provider, bcrypt (cost 12), JWT session (30-day expiry), refresh rotation every 24h.</div>
          <div><strong>RBAC:</strong> <code className="bg-muted px-1 rounded">canAccess(principal, moduleId, required)</code> — Super Admin bypasses, otherwise check rank: none &lt; view &lt; execute &lt; manage.</div>
          <div><strong>Multi-tenant isolation:</strong> Every Prisma query accepts <code className="bg-muted px-1 rounded">organizationId</code>. No function returns cross-org data without explicit Super Admin check.</div>
          <div><strong>Secrets:</strong> <code className="bg-muted px-1 rounded">.env.local</code> (dev), Vercel env vars (prod). Required: <code className="bg-muted px-1 rounded">ZAI_API_KEY</code>, <code className="bg-muted px-1 rounded">DATABASE_URL</code>, <code className="bg-muted px-1 rounded">NEXTAUTH_SECRET</code>.</div>
          <div><strong>Audit logging:</strong> Every privileged mutation emits an AuditLog entry with user, action, target, IP, metadata JSON.</div>
          <div><strong>Rate limiting:</strong> Public endpoints 10 req/min/IP, authenticated 100 req/min/user, AI endpoints limited by credits.</div>
          <div><strong>Input validation:</strong> Every API route uses zod schemas. Invalid input returns HTTP 400.</div>
        </div>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-teal-700">5. AI Integration</h4>
        <p className="mb-2">
          Marqai uses <code className="bg-muted px-1 rounded">z-ai-web-dev-sdk</code> for all AI features. The SDK is <strong>server-side only</strong> — never imported in client components.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2 border">Endpoint</th>
                <th className="text-left p-2 border">Operation</th>
                <th className="text-left p-2 border">Credits</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["/api/marqai/analyze", "SEO audit OR website analysis", "5 / 10"],
                ["/api/marqai/generate-image", "Image generation", "8"],
                ["/api/marqai/generate-content", "Social post / email / script / hashtag", "2"],
                ["/api/marqai/generate-video", "Video storyboard + thumbnail", "25"],
                ["/api/marqai/test-ai-tool", "40+ test cases against an AI tool", "50"],
                ["/api/marqai/send-email", "Simulated email send", "0"],
              ].map(([e, o, c]) => (
                <tr key={e}>
                  <td className="p-2 border font-mono text-[10px]">{e}</td>
                  <td className="p-2 border">{o}</td>
                  <td className="p-2 border">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-teal-700">6. Deployment Topology</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Framework:</strong> Next.js (auto-detected by Vercel).</li>
          <li><strong>Build:</strong> <code className="bg-muted px-1 rounded">next build</code> (output: standalone).</li>
          <li><strong>Install:</strong> <code className="bg-muted px-1 rounded">bun install</code>.</li>
          <li><strong>Postinstall:</strong> <code className="bg-muted px-1 rounded">prisma generate</code>.</li>
          <li><strong>Database:</strong> SQLite (dev) / PostgreSQL (prod). Set <code className="bg-muted px-1 rounded">DATABASE_URL</code>.</li>
          <li><strong>Env vars:</strong> <code className="bg-muted px-1 rounded">ZAI_API_KEY</code>, <code className="bg-muted px-1 rounded">DATABASE_URL</code>, <code className="bg-muted px-1 rounded">NEXTAUTH_SECRET</code>.</li>
          <li><strong>Auto-deploy:</strong> On every push to <code className="bg-muted px-1 rounded">main</code>.</li>
          <li><strong>Preview URLs:</strong> Generated for every PR.</li>
        </ul>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-teal-700">7. Observability</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>App logs:</strong> <code className="bg-muted px-1 rounded">console.log</code> / <code className="bg-muted px-1 rounded">console.error</code> → Vercel captures.</li>
          <li><strong>Audit logs:</strong> Stored in DB, viewable in-app, retained 2 years.</li>
          <li><strong>AI call logs:</strong> Stored in DB with prompt + response + latency.</li>
          <li><strong>Monitoring:</strong> Vercel Analytics for web vitals. Sentry (TODO).</li>
          <li><strong>Alerting (TODO):</strong> AI credit &gt; 90% → email. Failed payment → Slack. 5xx &gt; 1% → PagerDuty.</li>
        </ul>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-teal-700">8. Performance Targets</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            ["Dashboard initial load (P95)", "< 1.5s"],
            ["SEO audit (P95)", "< 30s"],
            ["Image generation (P95)", "< 15s"],
            ["AI tool test suite (P95)", "< 5min"],
            ["API route 99th percentile", "< 500ms (non-AI)"],
            ["Database query (P95)", "< 100ms"],
          ].map(([m, t]) => (
            <div key={m} className="flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-1.5 text-xs">
              <span>{m}</span>
              <span className="font-semibold text-emerald-700">{t}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-teal-700">9. Backup & Recovery</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Database: daily snapshot via Vercel Postgres / RDS, 30-day retention.</li>
          <li>Audit logs: exportable to S3 daily.</li>
          <li>User-uploaded assets: Vercel Blob (TODO), 90-day versioning.</li>
          <li>Disaster recovery: RPO 24h, RTO 4h.</li>
        </ul>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-teal-700">10. Known Limitations</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Auth: Demo uses Zustand-persisted session with hardcoded credentials. Production must wire NextAuth with bcrypt-hashed passwords.</li>
          <li>Database: Demo uses in-memory Zustand state. Production must persist to PostgreSQL via Prisma.</li>
          <li>Email send: Simulated. Production must integrate Postmark / SendGrid / SES.</li>
          <li>Social posting: Simulated. Production must integrate platform APIs.</li>
          <li>Payment: No real processor. Production must integrate Stripe Billing.</li>
          <li>Rate limiting: Not implemented in this build.</li>
        </ul>
      </section>
    </div>
  );
}
