"use client";

import { useMarqai } from "@/lib/marqai/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Settings, Building2, Plug, Github, Rocket, User, Bell } from "lucide-react";
import { platformMeta } from "@/lib/marqai/mock-data";

const integrations = [
  { name: "OpenAI", category: "AI / LLM", connected: true, desc: "GPT-4o, o1-mini for content generation" },
  { name: "Anthropic Claude", category: "AI / LLM", connected: true, desc: "Claude Sonnet for long-context tasks" },
  { name: "Z.ai", category: "AI / LLM", connected: true, desc: "Image + chat via z-ai-web-dev-sdk" },
  { name: "SendGrid", category: "Email", connected: false, desc: "Transactional + marketing email delivery" },
  { name: "Postmark", category: "Email", connected: false, desc: "Fast, reliable email API" },
  { name: "Buffer / Hootsuite", category: "Social", connected: false, desc: "Schedule social posts to 7+ platforms" },
  { name: "Google Analytics 4", category: "Analytics", connected: true, desc: "Real-time web analytics" },
  { name: "Google Search Console", category: "SEO", connected: false, desc: "Search performance & indexing" },
  { name: "Ahrefs", category: "SEO", connected: false, desc: "Backlinks, keywords, competitor data" },
  { name: "Vercel", category: "Hosting", connected: true, desc: "Deploy Marqai in one click" },
  { name: "GitHub", category: "Source control", connected: true, desc: "Push to marqaitools repo" },
  { name: "Slack", category: "Notifications", connected: false, desc: "Get alerts when posts publish" },
];

export function SettingsModule() {
  const brand = useMarqai((s) => s.brand);
  const setBrand = useMarqai((s) => s.setBrand);
  const accounts = useMarqai((s) => s.accounts);
  const toggleAccount = useMarqai((s) => s.toggleAccount);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="brand">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-fit">
          <TabsTrigger value="brand"><Building2 className="h-3.5 w-3.5 mr-1.5" /> Brand</TabsTrigger>
          <TabsTrigger value="accounts"><User className="h-3.5 w-3.5 mr-1.5" /> Accounts</TabsTrigger>
          <TabsTrigger value="integrations"><Plug className="h-3.5 w-3.5 mr-1.5" /> Integrations</TabsTrigger>
          <TabsTrigger value="deploy"><Rocket className="h-3.5 w-3.5 mr-1.5" /> Deploy</TabsTrigger>
        </TabsList>

        {/* Brand */}
        <TabsContent value="brand" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Brand identity</CardTitle>
              <CardDescription>Used across all generated assets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <div>
                <Label htmlFor="bn">Brand name</Label>
                <Input id="bn" value={brand.name} onChange={(e) => setBrand({ name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="bt">Tagline</Label>
                <Input id="bt" value={brand.tagline} onChange={(e) => setBrand({ tagline: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="bc">Brand color</Label>
                <div className="flex items-center gap-3 mt-1">
                  <Input id="bc" value={brand.color} onChange={(e) => setBrand({ color: e.target.value })} className="flex-1" />
                  <div className="h-10 w-10 rounded-md border border-border" style={{ background: brand.color }} />
                </div>
              </div>
              <Button onClick={() => toast.success("Brand settings saved")}>Save changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accounts */}
        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Team accounts</CardTitle>
              <CardDescription>Manage workspace members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { name: "Priya Menon", email: "priya@marqai.app", role: "Admin" },
                { name: "Sam Rivera", email: "sam@marqai.app", role: "Editor" },
                { name: "Dev Krishnan", email: "dev@marqai.app", role: "Editor" },
                { name: "Asha Patel", email: "asha@marqai.app", role: "Viewer" },
              ].map((m) => (
                <div key={m.email} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full marqai-gradient flex items-center justify-center text-white text-xs font-bold">
                      {m.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                    </div>
                  </div>
                  <Badge variant={m.role === "Admin" ? "default" : m.role === "Editor" ? "secondary" : "outline"} className="text-[10px]">
                    {m.role}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Social platform connections</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {accounts.map((a) => {
                const meta = platformMeta[a.platform];
                return (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: meta.color }}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{meta.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{a.connected ? a.handle : "Not connected"}</div>
                    </div>
                    <Switch checked={a.connected} onCheckedChange={() => toggleAccount(a.id)} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Integrations</CardTitle>
              <CardDescription>Connect Marqai to your stack</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {integrations.map((i) => (
                  <div key={i.name} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                    <div className="h-9 w-9 rounded bg-muted flex items-center justify-center shrink-0">
                      <Plug className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{i.name}</span>
                        <Badge variant="outline" className="text-[9px]">{i.category}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{i.desc}</div>
                    </div>
                    <Button
                      size="sm"
                      variant={i.connected ? "outline" : "default"}
                      onClick={() => toast.info(i.connected ? `Disconnecting ${i.name}...` : `Connecting ${i.name}...`)}
                    >
                      {i.connected ? "Connected" : "Connect"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deploy */}
        <TabsContent value="deploy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Github className="h-4 w-4" /> Repository
              </CardTitle>
              <CardDescription>This Marqai build is ready to push to your repo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <Github className="h-5 w-5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">github.com/pmkshar/marqaitools</div>
                  <div className="text-xs text-muted-foreground">Target repository for this build</div>
                </div>
                <Badge variant="default" className="text-[10px]">Ready to push</Badge>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 text-xs font-mono space-y-1 overflow-x-auto scroll-thin">
                <div className="text-muted-foreground"># From your local clone:</div>
                <div><span className="text-emerald-600">$</span> git remote add origin https://github.com/pmkshar/marqaitools.git</div>
                <div><span className="text-emerald-600">$</span> git branch -M main</div>
                <div><span className="text-emerald-600">$</span> git push -u origin main</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Rocket className="h-4 w-4" /> Vercel deployment
              </CardTitle>
              <CardDescription>One-click deploy to Vercel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <Rocket className="h-5 w-5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">Import project in Vercel</div>
                  <div className="text-xs text-muted-foreground">Connect the GitHub repo and Vercel auto-detects Next.js</div>
                </div>
                <Button
                  size="sm"
                  onClick={() => window.open("https://vercel.com/new", "_blank")}
                >
                  Open Vercel
                </Button>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-2">
                <div className="font-semibold text-foreground">Required environment variables:</div>
                <ul className="space-y-1 font-mono text-[11px]">
                  <li><code className="text-emerald-600">ZAI_API_KEY</code> — for AI features (image gen, content, analysis)</li>
                  <li><code className="text-emerald-600">DATABASE_URL</code> — file:./prisma/dev.db (default SQLite)</li>
                  <li><code className="text-emerald-600">NEXTAUTH_SECRET</code> — random 32-char string</li>
                </ul>
              </div>
              <div className="text-xs text-muted-foreground">
                Build command: <code className="bg-muted px-1 rounded">next build</code> · Output: auto-detected · Node 20+
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
