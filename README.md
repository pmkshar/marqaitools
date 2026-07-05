# Marqai — AI Marketing & AI Tool Testing Suite

Marqai is an all-in-one AI marketing platform inspired by [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills). It bundles SEO analytics, multi-platform social marketing, daily content scheduling, AI image & video generation, automated email campaigns, deep website analysis, and a **dedicated AI tool testing module** into a single Next.js application.

> Built with Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui · Recharts · z-ai-web-dev-sdk · Zustand · Prisma.

---

## ✨ Modules

| Module              | What it does                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| **Dashboard**       | KPIs across all modules — reach, scheduled posts, open rate, AI tools tested.                      |
| **SEO Analyzer**    | Run a full SEO audit on any URL — meta, headings, keyword density, backlinks, missing analytics.   |
| **Social Marketing**| AI composer for 7 platforms (X, LinkedIn, FB, IG, YT, TikTok, Pinterest). Hashtag suggestion.      |
| **Scheduler**       | Week-view content calendar + list view. Per-platform scheduling, draft/scheduled/published.        |
| **Image Studio**    | AI image generation with style presets and aspect ratios. Persistent gallery with previews.        |
| **Video Studio**    | Script → 3-5 scene storyboard → rendered marketing video. 5 styles, 4 aspect ratios.               |
| **Email Automation**| Campaigns + triggered automations. AI subject/body generation. Simulated send with metrics.        |
| **Website Analyzer**| Deep portal analysis — tech stack, traffic, sources, keywords, competitors, missing features.      |
| **AI Tool Testing** | **Dedicated module.** Run 40+ objective test cases against any AI tool. Full report card.          |
| **Settings**        | Brand identity, team accounts, integrations, deploy (GitHub + Vercel).                             |

---

## 🚀 Quick start (local)

```bash
# install
bun install

# run dev server
bun run dev
# → http://localhost:3000

# lint
bun run lint

# database (optional — only if you extend the Prisma schema)
bun run db:push
```

### Environment variables

Create a `.env` file:

```bash
# Required for AI features (image gen, content gen, SEO/website analysis, AI tool testing)
ZAI_API_KEY=your_zai_api_key

# Optional — only if you wire up NextAuth or Prisma
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

> Without `ZAI_API_KEY`, the AI-powered modules (SEO audit, Website Analyzer, AI Tool Testing, image generation, content generation) will return error toasts. The rest of the app (Dashboard, Scheduler, Email campaign UI, etc.) works without it.

---

## 🧪 The AI Tool Testing module (separate, dedicated)

This is Marqai's differentiator. Use it to objectively grade any AI tool — chatbots, image generators, video generators, autonomous agents, RAG systems, code assistants, and voice tools.

**What it evaluates:**

- Accuracy & hallucination rate
- Latency (median, P95, P99)
- Safety & refusal behavior
- Reasoning (multi-step math, logic, planning)
- Code generation
- Cost efficiency (token cost per task)
- Output diversity
- Context handling

**What you get:**

- Overall score (0-100) and grade (A+ to F)
- Per-category scores with findings
- Per-test-case pass/partial/fail with prompt, expected vs. actual behavior, latency
- Strengths & weaknesses lists
- Prioritized recommendations (high/medium/low)
- Benchmark comparison vs. industry averages
- Score profile radar chart

Try it with: ChatGPT 4o, Claude Sonnet, Gemini Pro, Midjourney, DALL·E 3, Runway Gen-3, GitHub Copilot, Cursor — or any custom AI tool URL.

---

## 🔌 API routes

| Route                              | Method | Purpose                                                   |
| ---------------------------------- | ------ | --------------------------------------------------------- |
| `/api/marqai/analyze`              | POST   | SEO (`mode: "seo"`) or website (`mode: "website"`) audit  |
| `/api/marqai/generate-image`       | POST   | AI image generation via z-ai-web-dev-sdk                  |
| `/api/marqai/generate-content`     | POST   | AI copywriting (social posts, email, scripts, hashtags)   |
| `/api/marqai/generate-video`       | POST   | Video script → scenes → thumbnail (simulated render)      |
| `/api/marqai/send-email`           | POST   | Simulated email send with realistic open/click metrics    |
| `/api/marqai/test-ai-tool`         | POST   | Run the AI Tool Testing module against any tool URL       |

All AI routes use `z-ai-web-dev-sdk` server-side. Never expose the SDK client-side.

---

## 🗂 Project structure

```
src/
├── app/
│   ├── api/marqai/         # Server routes (AI / analyze / send)
│   ├── globals.css         # Marqai theme (emerald accent, dark mode)
│   ├── layout.tsx          # Root layout + metadata
│   └── page.tsx            # Renders <AppShell />
├── components/
│   ├── ui/                 # shadcn/ui (preinstalled)
│   └── marqai/
│       ├── app-shell.tsx   # Top-level layout + module router
│       ├── sidebar.tsx     # Module navigation
│       ├── topbar.tsx      # Header with search + user menu
│       ├── kpi-card.tsx
│       ├── score-ring.tsx
│       ├── loading-states.tsx
│       └── modules/
│           ├── dashboard.tsx
│           ├── seo-module.tsx
│           ├── social-module.tsx
│           ├── scheduler-module.tsx
│           ├── image-module.tsx
│           ├── video-module.tsx
│           ├── email-module.tsx
│           ├── analyzer-module.tsx
│           ├── ai-testing-module.tsx
│           └── settings-module.tsx
└── lib/
    └── marqai/
        ├── types.ts        # All shared TypeScript interfaces
        ├── store.ts        # Zustand store
        ├── mock-data.ts    # Seed data + simulated APIs
        └── utils.ts        # Helpers (formatNumber, scoreColor, etc.)
```

---

## ☁️ Deploy to Vercel

1. Push this repo to GitHub (see below).
2. Go to <https://vercel.com/new>.
3. Import the GitHub repo — Vercel auto-detects Next.js.
4. Add env var `ZAI_API_KEY` (and `DATABASE_URL` / `NEXTAUTH_SECRET` if you wire them up).
5. Click **Deploy**. Vercel will build with `next build` and give you a `*.vercel.app` URL.

### Push to GitHub

```bash
# from your local clone
git remote add origin https://github.com/pmkshar/marqaitools.git
git branch -M main
git add .
git commit -m "feat: Marqai marketing & AI tool testing suite"
git push -u origin main
```

Then enable the Vercel GitHub integration for auto-deploys on every push to `main`.

---

## 🎨 Design

- **Primary accent:** emerald/teal (`oklch(0.62 0.14 165)`) — avoid blue/indigo per Marqai brand guidelines.
- **Dark sidebar** with light main content; full dark mode support via CSS variables.
- **Charts:** Recharts (area, bar, pie, radar).
- **Icons:** lucide-react.
- **Type:** Geist Sans / Mono.

---

## 📝 License

MIT — built for the Marqai project. Reference inspiration: [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills).
