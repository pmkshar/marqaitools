"use client";

import { useState } from "react";
import { useMarqai } from "@/lib/marqai/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Building2, ShieldCheck, ArrowRight, Eye, EyeOff, CreditCard, Crown, Zap } from "lucide-react";
import { PLANS, isStripeConfigured } from "@/lib/marqai/saas";
import { DEMO_USERS, DEMO_SUPER_ADMIN, type DemoUser } from "@/lib/marqai/saas-seed";
import { toast as sonnerToast } from "sonner";

// Role-color lookup mirroring BUILT_IN_ROLES + the custom "Performance Marketer" role.
// Maps a roleName to a tailwind gradient + chip color for the avatar badge.
const ROLE_AVATAR: Record<string, { gradient: string; ring: string }> = {
  "Super Admin":              { gradient: "from-amber-400 to-rose-500",  ring: "ring-amber-300" },
  "Org Owner":                { gradient: "from-emerald-400 to-teal-600",  ring: "ring-emerald-300" },
  "Marketing Manager":        { gradient: "from-teal-400 to-cyan-600",     ring: "ring-teal-300" },
  "SEO Specialist":           { gradient: "from-amber-400 to-orange-600",  ring: "ring-amber-300" },
  "Social Media Manager":     { gradient: "from-rose-400 to-pink-600",     ring: "ring-rose-300" },
  "Email Marketer":           { gradient: "from-violet-400 to-purple-600", ring: "ring-violet-300" },
  "AI QA Analyst":            { gradient: "from-cyan-400 to-sky-600",      ring: "ring-cyan-300" },
  "Developer":                { gradient: "from-indigo-400 to-blue-700",   ring: "ring-indigo-300" },
  "Sales Development Rep":    { gradient: "from-amber-400 to-yellow-600",  ring: "ring-amber-300" },
  "Viewer":                   { gradient: "from-slate-400 to-slate-600",   ring: "ring-slate-300" },
  "Performance Marketer":     { gradient: "from-amber-400 to-rose-500",    ring: "ring-amber-300" },
};

function getAvatarStyle(roleName: string) {
  return ROLE_AVATAR[roleName] ?? { gradient: "from-slate-400 to-slate-600", ring: "ring-slate-300" };
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function AuthScreen() {
  const login = useMarqai((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const ok = login(email.trim(), password);
      if (!ok) {
        sonnerToast.error("Invalid credentials", {
          description: "Use a demo account below or check your email and password.",
        });
      } else {
        sonnerToast.success("Welcome to Marqai", {
          description: "You are now signed in.",
        });
      }
      setLoading(false);
    }, 350);
  }

  function quickLogin(em: string, pw: string) {
    setEmail(em);
    setPassword(pw);
    setLoading(true);
    setTimeout(() => {
      const ok = login(em, pw);
      if (!ok) sonnerToast.error("Login failed");
      else sonnerToast.success("Signed in");
      setLoading(false);
    }, 200);
  }

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
      {/* ---------- LEFT: BRAND PANEL ---------- */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 bg-sidebar text-sidebar-foreground overflow-hidden">
        <div className="absolute inset-0 marqai-gradient opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight">Marqai</div>
              <div className="text-xs uppercase tracking-wider text-white/80">AI Marketing SaaS</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Marketing teams ship faster with Marqai.
          </h1>
          <p className="text-white/85 text-lg leading-relaxed max-w-md">
            SEO audits, multi-platform social, AI image & video, logo & website builders, AI leads generator, email campaigns, website analysis, and a dedicated AI tool testing module — all in one multi-tenant SaaS workspace.
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            {[
              { icon: Building2, label: "Multi-tenant" },
              { icon: ShieldCheck, label: "Role-based access" },
              { icon: CreditCard, label: isStripeConfigured() ? "Stripe billing" : "Subscription-ready" },
              { icon: Sparkles, label: "AI-powered" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur px-3 py-2">
                <f.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/70">
          © {new Date().getFullYear()} Marqai · v2.0 SaaS Edition
        </div>
      </div>

      {/* ---------- RIGHT: AUTH FORM ---------- */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-lg space-y-6">
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg marqai-gradient flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="text-xl font-bold">Marqai</div>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Start free trial</TabsTrigger>
            </TabsList>

            {/* ---------- LOGIN ---------- */}
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Welcome back</CardTitle>
                  <CardDescription>
                    Sign in to your Marqai workspace.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Work email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <button type="button" className="text-xs text-emerald-600 hover:underline">
                          Forgot?
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3">
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Signing in..." : "Sign in"}
                      {!loading && <ArrowRight className="h-4 w-4 ml-1.5" />}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            {/* ---------- SIGNUP ---------- */}
            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Start your 14-day trial</CardTitle>
                  <CardDescription>
                    No credit card required. Pick a plan after the trial.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {PLANS.map((p) => (
                    <div
                      key={p.slug}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <div className="font-medium text-sm flex items-center gap-2">
                          {p.name}
                          {p.popular && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">
                              POPULAR
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{p.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {p.pricePerMonth === 0 ? "Custom" : `$${p.pricePerMonth}/mo`}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{p.seats} seats</div>
                      </div>
                    </div>
                  ))}
                  <Button
                    className="w-full"
                    onClick={() => sonnerToast.info("Trial signup",
                      { description: isStripeConfigured()
                        ? "In production this creates your Organization, emails a magic link, and sends you to Stripe Checkout after the trial."
                        : "In production this creates your Organization and emails a magic link. Stripe checkout enables when you add STRIPE_* env vars." })}
                  >
                    Create workspace
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* ---------- DEMO ACCOUNTS ---------- */}
          <Card className="bg-muted/40">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Demo logins — try every role
              </CardTitle>
              <CardDescription className="text-xs">
                One-click sign-in as any role to explore Marqai. All demo passwords are <code className="px-1 py-0.5 rounded bg-background text-[10px] font-mono">demo1234</code> (super admin: <code className="px-1 py-0.5 rounded bg-background text-[10px] font-mono">super1234</code>).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto scroll-thin pr-1">
              {/* Super Admin — pinned at top with crown */}
              <button
                onClick={() => quickLogin(DEMO_SUPER_ADMIN.email, DEMO_SUPER_ADMIN.password)}
                className="w-full flex items-center justify-between rounded-md border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3 text-left hover:border-amber-500 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${getAvatarStyle(DEMO_SUPER_ADMIN.roleName).gradient} flex items-center justify-center text-white text-xs font-bold ring-2 ring-offset-1 ${getAvatarStyle(DEMO_SUPER_ADMIN.roleName).ring}`}>
                    {initials(DEMO_SUPER_ADMIN.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium flex items-center gap-1.5">
                      {DEMO_SUPER_ADMIN.name}
                      <Crown className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      <span className="font-medium text-amber-700 dark:text-amber-400">Super Admin</span> · Platform-level · {DEMO_SUPER_ADMIN.email}
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>

              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold pt-2 pb-1 px-1">
                Organization users · Acme Marketing
              </div>

              {/* All 9 org demo users */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEMO_USERS.map((u: DemoUser) => {
                  const style = getAvatarStyle(u.roleName);
                  return (
                    <button
                      key={u.id}
                      onClick={() => quickLogin(u.email, u.password)}
                      className="flex items-center justify-between rounded-md border bg-background p-2.5 text-left hover:border-emerald-400 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${style.gradient} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
                          {initials(u.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{u.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            <span className="font-medium">{u.roleName}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground/80 truncate font-mono">{u.email}</div>
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 text-[10px] text-muted-foreground/70 text-center border-t mt-2">
                Tip: Each role unlocks a different set of modules in the sidebar — try them all to verify RBAC.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
