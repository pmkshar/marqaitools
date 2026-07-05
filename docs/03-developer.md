# Marqai — Developer Documentation

> Audience: Frontend / backend / full-stack engineers joining the project.

This document covers local setup, repo layout, conventions, the RBAC integration pattern, and a step-by-step "add a new module" guide.

---

## 1. Prerequisites

| Tool       | Version    |
| ---------- | ---------- |
| Node.js    | 20+        |
| Bun        | 1.1+       |
| Git        | 2.40+      |

Recommended VS Code extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma

---

## 2. Local Setup

```bash
# 1. Clone
git clone https://github.com/pmkshar/marqaitools.git
cd marqaitools

# 2. Install dependencies
bun install

# 3. Create .env.local
cp .env.example .env.local
# fill in ZAI_API_KEY (get from z.ai dashboard)
# DATABASE_URL defaults to file:./db/custom.db

# 4. (optional) Push Prisma schema
bun run db:push

# 5. Start dev server
bun run dev
# → http://localhost:3000
```

### 2.1 Demo credentials

Use any of the following to sign in:

| Email                            | Password   | Role                  |
| -------------------------------- | ---------- | --------------------- |
| `superadmin@marqai.app`          | `super1234`| Super Admin           |
| `priya@acme-marketing.com`       | `demo1234` | Org Owner             |
| `arjun@acme-marketing.com`       | `demo1234` | Marketing Manager     |
| `kavya@acme-marketing.com`       | `demo1234` | SEO Specialist        |
| `rohan@acme-marketing.com`       | `demo1234` | Social Media Manager  |
| `meera@acme-marketing.com`       | `demo1234` | Email Marketer        |
| `vikram@acme-marketing.com`      | `demo1234` | AI QA Analyst         |
| `isha@acme-marketing.com`        | `demo1234` | Viewer                |

---

## 3. Repository Layout

```
marqaitools/
├── docs/                       # ← you are here
├── prisma/
│   └── schema.prisma           # multi-tenant SaaS schema
├── public/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/           # NextAuth routes (TODO)
│   │   │   └── marqai/         # AI + analysis routes
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx            # renders <AppShell />
│   ├── components/
│   │   ├── ui/                 # shadcn/ui (do not edit unless necessary)
│   │   └── marqai/
│   │       ├── app-shell.tsx
│   │       ├── auth-screen.tsx
│   │       ├── sidebar.tsx
│   │       ├── topbar.tsx
│   │       ├── kpi-card.tsx
│   │       ├── score-ring.tsx
│   │       ├── loading-states.tsx
│   │       └── modules/
│   │           ├── dashboard.tsx
│   │           ├── seo-module.tsx
│   │           ├── social-module.tsx
│   │           ├── scheduler-module.tsx
│   │           ├── image-module.tsx
│   │           ├── video-module.tsx
│   │           ├── email-module.tsx
│   │           ├── analyzer-module.tsx
│   │           ├── ai-testing-module.tsx
│   │           ├── roles-module.tsx       # NEW
│   │           ├── team-module.tsx        # NEW
│   │           ├── billing-module.tsx     # NEW
│   │           ├── wiki-module.tsx        # NEW
│   │           └── settings-module.tsx
│   ├── hooks/
│   │   ├── use-mobile.ts
│   │   └── use-toast.ts
│   └── lib/
│       ├── db.ts               # Prisma client
│       ├── utils.ts            # cn() helper
│       └── marqai/
│           ├── types.ts        # all shared TS types
│           ├── store.ts        # Zustand store (app + auth + rbac)
│           ├── rbac.ts         # permission engine
│           ├── saas.ts         # plan catalog + module catalog + built-in roles
│           ├── saas-seed.ts    # demo data (org, users, roles, subscription)
│           ├── mock-data.ts    # marketing seed data
│           └── utils.ts        # formatNumber, scoreColor, etc.
├── .env.example
├── .gitignore
├── components.json             # shadcn config
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json
└── README.md
```

---

## 4. Conventions

### 4.1 TypeScript

- Strict mode.
- No `any` — use `unknown` and narrow.
- All shared types live in `src/lib/marqai/types.ts`.
- Prefer `interface` for object shapes, `type` for unions.

### 4.2 File naming

- React components: `kebab-case.tsx` (e.g. `roles-module.tsx`).
- Non-component modules: `kebab-case.ts` (e.g. `saas-seed.ts`).
- Types/interfaces: PascalCase (e.g. `AuthPrincipal`).

### 4.3 State management

| State                            | Where                          |
| -------------------------------- | ------------------------------ |
| Auth principal, active module    | Zustand (`useMarqai`)          |
| Server data (reports, posts)     | TanStack Query (TODO)          |
| Form state                       | react-hook-form                |
| UI state (modals, dropdowns)     | Component-local `useState`     |

### 4.4 Styling

- Tailwind CSS 4 utility classes.
- shadcn/ui for all primitive components.
- No `@apply` — keep styles inline.
- Use `cn()` from `src/lib/utils.ts` to merge classes.
- **Never use indigo or blue** as primary brand color — Marqai brand is emerald/teal.

### 4.5 Server vs client

- `"use client"` directive at top of any component that uses hooks or browser APIs.
- `"use server"` directive at top of any server action file.
- `z-ai-web-dev-sdk` is **server-side only** — never import in client components.

---

## 5. RBAC Integration Pattern

### 5.1 The principal

Every authenticated request has an `AuthPrincipal` in scope:

```typescript
interface AuthPrincipal {
  kind: "super_admin" | "org_user";
  userId: string;
  email: string;
  name: string;
  organizationId?: string;
  roleId?: string;
  roleName?: string;
  permissions?: PermissionMatrix;
  planSlug?: PlanSlug;
}
```

In the demo build, this lives in the Zustand store. In production, it would be resolved from the NextAuth JWT in middleware.

### 5.2 Permission check

Always use `canAccess()` from `src/lib/marqai/rbac.ts`:

```typescript
import { canAccess } from "@/lib/marqai/rbac";
import { useMarqai } from "@/lib/marqai/store";

function MyComponent() {
  const principal = useMarqai((s) => s.principal);
  const canEdit = canAccess(principal, "seo", "manage");

  return (
    <div>
      {canEdit && <button>Edit</button>}
    </div>
  );
}
```

### 5.3 In an API route

```typescript
import { NextRequest, NextResponse } from "next/server";
import { canAccess } from "@/lib/marqai/rbac";
import { getPrincipalFromRequest } from "@/lib/marqai/auth"; // TODO

export async function POST(req: NextRequest) {
  const principal = await getPrincipalFromRequest(req);
  if (!canAccess(principal, "seo", "execute")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  // ... do the work
}
```

### 5.4 Plan gating

Modules are also gated by plan. Use `isModuleInPlan()` from `saas.ts`:

```typescript
import { isModuleInPlan } from "@/lib/marqai/saas";

if (!isModuleInPlan("ai-testing", principal.planSlug ?? "starter")) {
  return <UpgradePrompt />;
}
```

---

## 6. Adding a New Module

Step-by-step:

### Step 1 — Add the module to the catalog

Edit `src/lib/marqai/saas.ts` → `MODULE_CATALOG`:

```typescript
{
  id: "my-module",
  label: "My Module",
  group: "Analysis", // or Marketing / Creative / Outreach / System / Administration
  description: "What it does",
  minPlan: "growth", // starter / growth / scale / enterprise
}
```

### Step 2 — Add the ModuleId type

Edit `src/lib/marqai/types.ts`:

```typescript
export type ModuleId =
  | "dashboard"
  | ...
  | "my-module";  // ← add
```

### Step 3 — Create the module component

Create `src/components/marqai/modules/my-module.tsx`:

```typescript
"use client";

import { useMarqai } from "@/lib/marqai/store";
import { canAccess } from "@/lib/marqai/rbac";

export function MyModule() {
  const principal = useMarqai((s) => s.principal);
  const canEdit = canAccess(principal, "my-module", "manage");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Module</h2>
      {/* ... */}
    </div>
  );
}
```

### Step 4 — Wire it into the AppShell

Edit `src/components/marqai/app-shell.tsx` → `renderModule()`:

```typescript
case "my-module":
  return <MyModule />;
```

### Step 5 — Add to built-in roles (optional)

Edit `BUILT_IN_ROLES` in `saas.ts` to grant the new module to specific roles:

```typescript
{
  name: "Marketing Manager",
  permissions: {
    ...
    "my-module": "manage",
  },
}
```

### Step 6 — Add to topbar title map

Edit `src/components/marqai/topbar.tsx` → `moduleTitles`:

```typescript
"my-module": { title: "My Module", subtitle: "What it does" },
```

### Step 7 — Lint + test

```bash
bun run lint
bun run dev
```

Sign in as different roles to verify permissions.

---

## 7. API Route Pattern

```typescript
// src/app/api/marqai/my-action/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { canAccess } from "@/lib/marqai/rbac";

const Input = z.object({
  url: z.string().url(),
});

export async function POST(req: NextRequest) {
  // 1. Parse + validate
  const body = await req.json().catch(() => null);
  const parsed = Input.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  // 2. Auth + RBAC
  const principal = await getPrincipalFromRequest(req);  // TODO in production
  if (!principal) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canAccess(principal, "my-module", "execute")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // 3. Plan limit check
  if (principal.aiCreditsUsed + 5 > principal.aiCreditsLimit) {
    return NextResponse.json({ error: "credits_exhausted" }, { status: 402 });
  }

  // 4. Do the work (call SDK, query DB)
  const result = await doWork(parsed.data);

  // 5. Audit log
  await db.auditLog.create({ ... });

  // 6. Return
  return NextResponse.json(result);
}
```

---

## 8. Database Migrations

```bash
# After editing prisma/schema.prisma:
bun run db:push         # push schema to local SQLite (dev only)
bun run db:migrate      # create a migration (production)
bun run db:generate     # regenerate Prisma Client
```

On Vercel, `prisma generate` runs in `postinstall`. Migrations run as a separate Vercel Build Step (TODO — currently no auto-migrate on deploy).

---

## 9. Testing

### 9.1 Linting

```bash
bun run lint
```

ESLint catches: unused vars, type errors, Next.js best practices, Tailwind class typos.

### 9.2 Manual smoke test

Sign in as each demo role and verify:

| Role                  | Modules visible                                |
| --------------------- | ---------------------------------------------- |
| Super Admin           | All 14 modules                                 |
| Org Owner             | All 14 modules                                 |
| Marketing Manager     | All except Role Master (view only)             |
| SEO Specialist        | Dashboard, SEO, Analyzer, Scheduler, Wiki      |
| Social Media Manager  | Dashboard, Social, Scheduler, Image, Video     |
| Email Marketer        | Dashboard, Email, Scheduler, Wiki               |
| AI QA Analyst         | Dashboard, AI Testing, Analyzer, Wiki           |
| Viewer                | All unlocked modules (view only)               |

### 9.3 Automated tests (TODO)

- Vitest for unit tests (RBAC engine, plan catalog).
- Playwright for E2E (login → run module → verify result).

---

## 10. Deployment Checklist

Before merging to `main`:

- [ ] `bun run lint` passes with no errors.
- [ ] Demo login flow works for all 8 demo accounts.
- [ ] New modules are added to `MODULE_CATALOG`.
- [ ] New modules are gated by `canAccess()`.
- [ ] API routes validate input with zod.
- [ ] No secrets committed (check `.env*` is gitignored).
- [ ] README and docs updated if behavior changed.
- [ ] Prisma schema migration created (if schema changed).
- [ ] Vercel preview deployment builds successfully.

---

## 11. Common Pitfalls

1. **Forgetting `organizationId` filter** in a Prisma query → data leak. Always filter.
2. **Using `z-ai-web-dev-sdk` in a client component** → bundle bloat + leaked API key. Server-only.
3. **Forgetting to call `canAccess()`** in an API route → privilege escalation.
4. **Hardcoding `minPlan: "starter"`** for a module that should be Growth+ → revenue leak.
5. **Editing shadcn/ui components in place** → makes upgrades painful. Wrap instead.
6. **Forgetting to update `moduleTitles` in topbar** → blank title for new modules.
