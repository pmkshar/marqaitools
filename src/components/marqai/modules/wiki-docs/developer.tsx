"use client";

export function DeveloperDoc() {
  return (
    <div className="space-y-6 text-sm leading-relaxed">
      <section>
        <h4 className="text-base font-bold mb-2 text-cyan-700">1. Prerequisites</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Node.js 20+</li>
          <li>Bun 1.1+</li>
          <li>Git 2.40+</li>
          <li>VS Code extensions: ESLint, Prettier, Tailwind IntelliSense, Prisma</li>
        </ul>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-cyan-700">2. Local Setup</h4>
        <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto"><code>{`# Clone
git clone https://github.com/pmkshar/marqaitools.git
cd marqaitools

# Install
bun install

# Create env
cp .env.example .env.local
# fill in ZAI_API_KEY

# (optional) Push Prisma schema
bun run db:push

# Start dev server
bun run dev
# → http://localhost:3000`}</code></pre>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-cyan-700">3. Demo Credentials</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2 border">Email</th>
                <th className="text-left p-2 border">Password</th>
                <th className="text-left p-2 border">Role</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["superadmin@marqai.app", "super1234", "Super Admin"],
                ["priya@acme-marketing.com", "demo1234", "Org Owner"],
                ["arjun@acme-marketing.com", "demo1234", "Marketing Manager"],
                ["kavya@acme-marketing.com", "demo1234", "SEO Specialist"],
                ["rohan@acme-marketing.com", "demo1234", "Social Media Manager"],
                ["meera@acme-marketing.com", "demo1234", "Email Marketer"],
                ["vikram@acme-marketing.com", "demo1234", "AI QA Analyst"],
                ["isha@acme-marketing.com", "demo1234", "Viewer"],
              ].map(([e, p, r]) => (
                <tr key={e}>
                  <td className="p-2 border font-mono text-[10px]">{e}</td>
                  <td className="p-2 border font-mono text-[10px]">{p}</td>
                  <td className="p-2 border">{r}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-cyan-700">4. Repository Layout</h4>
        <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto"><code>{`marqaitools/
├── docs/                       # 7 markdown docs (functional, technical, etc.)
├── prisma/
│   └── schema.prisma           # multi-tenant SaaS schema
├── src/
│   ├── app/
│   │   ├── api/marqai/         # AI + analysis routes
│   │   ├── layout.tsx
│   │   └── page.tsx            # renders <AppShell />
│   ├── components/
│   │   ├── ui/                 # shadcn/ui
│   │   └── marqai/
│   │       ├── app-shell.tsx
│   │       ├── auth-screen.tsx
│   │       ├── sidebar.tsx
│   │       ├── topbar.tsx
│   │       └── modules/        # 14 module components
│   └── lib/
│       ├── db.ts               # Prisma client
│       └── marqai/
│           ├── types.ts        # all shared TS types
│           ├── store.ts        # Zustand store
│           ├── rbac.ts         # permission engine
│           ├── saas.ts         # plan + module catalog
│           ├── saas-seed.ts    # demo data
│           └── mock-data.ts    # marketing seed
├── .env.example
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── vercel.json
└── README.md`}</code></pre>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-cyan-700">5. RBAC Integration Pattern</h4>
        <p className="mb-2">Always use <code className="bg-muted px-1 rounded">canAccess()</code> from <code className="bg-muted px-1 rounded">@/lib/marqai/rbac</code>:</p>
        <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto"><code>{`import { canAccess } from "@/lib/marqai/rbac";
import { useMarqai } from "@/lib/marqai/store";

function MyComponent() {
  const principal = useMarqai((s) => s.principal);
  const canEdit = canAccess(principal, "seo", "manage");
  return <div>{canEdit && <button>Edit</button>}</div>;
}`}</code></pre>
        <p className="mt-2">In an API route:</p>
        <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto"><code>{`import { NextRequest, NextResponse } from "next/server";
import { canAccess } from "@/lib/marqai/rbac";

export async function POST(req: NextRequest) {
  const principal = await getPrincipalFromRequest(req);
  if (!canAccess(principal, "seo", "execute")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  // ... do the work
}`}</code></pre>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-cyan-700">6. Adding a New Module (Step-by-Step)</h4>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Add the module to <code className="bg-muted px-1 rounded">MODULE_CATALOG</code> in <code className="bg-muted px-1 rounded">src/lib/marqai/saas.ts</code>.</li>
          <li>Add the <code className="bg-muted px-1 rounded">ModuleId</code> to <code className="bg-muted px-1 rounded">src/lib/marqai/types.ts</code>.</li>
          <li>Create <code className="bg-muted px-1 rounded">src/components/marqai/modules/my-module.tsx</code>.</li>
          <li>Wire it into <code className="bg-muted px-1 rounded">renderModule()</code> in <code className="bg-muted px-1 rounded">app-shell.tsx</code>.</li>
          <li>Optionally add to <code className="bg-muted px-1 rounded">BUILT_IN_ROLES</code> in <code className="bg-muted px-1 rounded">saas.ts</code>.</li>
          <li>Add the title to <code className="bg-muted px-1 rounded">moduleTitles</code> in <code className="bg-muted px-1 rounded">topbar.tsx</code>.</li>
          <li>Run <code className="bg-muted px-1 rounded">bun run lint</code> and test.</li>
        </ol>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-cyan-700">7. Conventions</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>TypeScript:</strong> strict mode, no <code className="bg-muted px-1 rounded">any</code>.</li>
          <li><strong>File naming:</strong> <code className="bg-muted px-1 rounded">kebab-case.tsx</code> for components.</li>
          <li><strong>State:</strong> Zustand for client, TanStack Query for server, react-hook-form for forms.</li>
          <li><strong>Styling:</strong> Tailwind 4 + shadcn/ui. No <code className="bg-muted px-1 rounded">@apply</code>. No indigo/blue.</li>
          <li><strong>Server vs client:</strong> <code className="bg-muted px-1 rounded">"use client"</code> for hooks, <code className="bg-muted px-1 rounded">"use server"</code> for actions. <code className="bg-muted px-1 rounded">z-ai-web-dev-sdk</code> is server-only.</li>
        </ul>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-cyan-700">8. Deployment Checklist</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li><code className="bg-muted px-1 rounded">bun run lint</code> passes.</li>
          <li>Demo login works for all 8 accounts.</li>
          <li>New modules added to <code className="bg-muted px-1 rounded">MODULE_CATALOG</code>.</li>
          <li>New modules gated by <code className="bg-muted px-1 rounded">canAccess()</code>.</li>
          <li>API routes validate input with zod.</li>
          <li>No secrets committed.</li>
          <li>README and docs updated.</li>
          <li>Prisma migration created (if schema changed).</li>
          <li>Vercel preview deployment builds.</li>
        </ul>
      </section>

      <section>
        <h4 className="text-base font-bold mb-2 text-cyan-700">9. Common Pitfalls</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Forgetting <code className="bg-muted px-1 rounded">organizationId</code> filter in a Prisma query → data leak.</li>
          <li>Using <code className="bg-muted px-1 rounded">z-ai-web-dev-sdk</code> in a client component → bundle bloat + leaked key.</li>
          <li>Forgetting <code className="bg-muted px-1 rounded">canAccess()</code> in an API route → privilege escalation.</li>
          <li>Hardcoding <code className="bg-muted px-1 rounded">minPlan: "starter"</code> for a module that should be Growth+ → revenue leak.</li>
          <li>Editing shadcn/ui components in place → upgrade pain. Wrap instead.</li>
        </ul>
      </section>
    </div>
  );
}
