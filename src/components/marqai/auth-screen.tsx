"use client";

import { useState } from "react";
import { useMarqai } from "@/lib/marqai/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Building2, ShieldCheck, ArrowRight, Eye, EyeOff } from "lucide-react";
import { PLANS } from "@/lib/marqai/saas";
import { DEMO_USERS, DEMO_SUPER_ADMIN } from "@/lib/marqai/saas-seed";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";

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
            SEO audits, multi-platform social, AI image & video, email campaigns, website analysis, and a dedicated AI tool testing module — all in one multi-tenant SaaS workspace.
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            {[
              { icon: Building2, label: "Multi-tenant" },
              { icon: ShieldCheck, label: "Role-based access" },
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
        <div className="w-full max-w-md space-y-6">
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
                      { description: "In production this would create your Organization and email a magic link." })}
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
              <CardTitle className="text-sm">Try a demo account</CardTitle>
              <CardDescription className="text-xs">
                One-click sign-in as any role to explore Marqai.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                onClick={() => quickLogin(DEMO_SUPER_ADMIN.email, DEMO_SUPER_ADMIN.password)}
                className="w-full flex items-center justify-between rounded-md border bg-background p-2.5 text-left hover:border-emerald-400 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold">
                    SA
                  </div>
                  <div>
                    <div className="text-sm font-medium">{DEMO_SUPER_ADMIN.name}</div>
                    <div className="text-[11px] text-muted-foreground">Super Admin · Platform-level</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>

              {DEMO_USERS.slice(0, 4).map((u) => (
                <button
                  key={u.id}
                  onClick={() => quickLogin(u.email, u.password)}
                  className="w-full flex items-center justify-between rounded-md border bg-background p-2.5 text-left hover:border-emerald-400 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full marqai-gradient flex items-center justify-center text-white text-xs font-bold">
                      {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{u.name}</div>
                      <div className="text-[11px] text-muted-foreground">{u.roleName}</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
