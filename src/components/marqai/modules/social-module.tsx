"use client";

import { useState } from "react";
import { useMarqai } from "@/lib/marqai/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Share2,
  Sparkles,
  Wand2,
  Send,
  CalendarPlus,
  Hash,
  Loader2,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { platformMeta } from "@/lib/marqai/mock-data";
import { formatNumber, formatPercent, uid } from "@/lib/marqai/utils";
import type { Platform, ScheduledPost } from "@/lib/marqai/types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { KpiCard } from "../kpi-card";
import { Users, Heart, Eye, MessageCircle } from "lucide-react";

const platformOptions: Platform[] = [
  "twitter",
  "linkedin",
  "facebook",
  "instagram",
  "youtube",
  "tiktok",
  "pinterest",
];

const toneOptions = ["Confident", "Friendly", "Witty", "Authoritative", "Casual", "Urgent"];

export function SocialModule() {
  const accounts = useMarqai((s) => s.accounts);
  const toggleAccount = useMarqai((s) => s.toggleAccount);
  const addScheduledPost = useMarqai((s) => s.addScheduledPost);

  const [brief, setBrief] = useState("");
  const [platform, setPlatform] = useState<Platform>("twitter");
  const [tone, setTone] = useState("Confident");
  const [audience, setAudience] = useState("B2B marketers & founders");
  const [generating, setGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["twitter", "linkedin"]);
  const [posting, setPosting] = useState(false);

  const connectedAccounts = accounts.filter((a) => a.connected);

  async function generatePost() {
    if (!brief.trim()) {
      toast.error("Add a brief first");
      return;
    }
    setGenerating(true);
    setGeneratedPost("");
    try {
      const res = await fetch("/api/marqai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "social-post",
          prompt: brief,
          platform: platformMeta[platform].name,
          tone,
          audience,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setGeneratedPost(data.text);
      toast.success("Post generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function generateHashtags() {
    if (!brief.trim() && !generatedPost) {
      toast.error("Add a brief or generate a post first");
      return;
    }
    try {
      const res = await fetch("/api/marqai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "hashtags", prompt: brief || generatedPost }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      const tags = (data.text as string)
        .split("\n")
        .map((t) => t.trim().replace(/^#+/, "#"))
        .filter(Boolean)
        .slice(0, 12);
      setHashtags(tags);
      toast.success(`${tags.length} hashtags suggested`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  function togglePlatform(p: Platform) {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }

  async function schedulePost() {
    if (!generatedPost.trim()) {
      toast.error("Generate a post first");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Pick at least one platform");
      return;
    }
    setPosting(true);
    try {
      // simulate scheduling latency
      await new Promise((r) => setTimeout(r, 600));
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const post: ScheduledPost = {
        id: uid("post"),
        title: brief.slice(0, 60) || "Generated post",
        content: generatedPost,
        platforms: selectedPlatforms,
        scheduledAt: tomorrow.toISOString(),
        status: "scheduled",
        hashtags,
        mediaType: "text",
        author: "Priya M.",
      };
      addScheduledPost(post);
      toast.success(`Scheduled to ${selectedPlatforms.length} platform${selectedPlatforms.length > 1 ? "s" : ""}`);
      setGeneratedPost("");
      setBrief("");
      setHashtags([]);
    } finally {
      setPosting(false);
    }
  }

  const platformEngagement = connectedAccounts.map((a) => ({
    platform: platformMeta[a.platform].name,
    engagement: a.engagementRate,
    followers: a.followers,
  }));

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Connected accounts" value={`${connectedAccounts.length}/${accounts.length}`} icon={Share2} accent="emerald" hint="7 platforms supported" />
        <KpiCard label="Total followers" value={formatNumber(connectedAccounts.reduce((s, a) => s + a.followers, 0))} icon={Users} accent="violet" delta={4.2} />
        <KpiCard label="Avg engagement" value={formatPercent(connectedAccounts.reduce((s, a) => s + a.engagementRate, 0) / Math.max(1, connectedAccounts.length))} icon={Heart} accent="amber" delta={1.8} />
        <KpiCard label="Est. monthly reach" value={formatNumber(connectedAccounts.reduce((s, a) => s + a.followers, 0) * 4.2)} icon={Eye} accent="rose" delta={6.4} />
      </div>

      <Tabs defaultValue="compose">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-fit">
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Compose */}
        <TabsContent value="compose" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-primary" /> AI Composer
                </CardTitle>
                <CardDescription>Generate scroll-stopping posts for any platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="brief">Content brief</Label>
                  <Textarea
                    id="brief"
                    placeholder="e.g. Announce Marqai's new AI Tool Testing module — emphasize objective QA, 40+ test cases, and grade cards."
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Target platform</Label>
                    <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {platformOptions.map((p) => (
                          <SelectItem key={p} value={p}>{platformMeta[p].name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Tone</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {toneOptions.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Audience</Label>
                    <Input value={audience} onChange={(e) => setAudience(e.target.value)} className="mt-1" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={generatePost} disabled={generating}>
                    {generating ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
                    {generating ? "Generating..." : "Generate post"}
                  </Button>
                  <Button variant="outline" onClick={generateHashtags}>
                    <Hash className="h-4 w-4 mr-1.5" /> Suggest hashtags
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Publish to</CardTitle>
                <CardDescription>Select target platforms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {accounts.map((a) => {
                  const meta = platformMeta[a.platform];
                  const selected = selectedPlatforms.includes(a.platform);
                  return (
                    <button
                      key={a.id}
                      onClick={() => a.connected && togglePlatform(a.platform)}
                      disabled={!a.connected}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left ${
                        !a.connected
                          ? "opacity-50 cursor-not-allowed border-border"
                          : selected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: meta.color }}
                      >
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{meta.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {a.connected ? `${formatNumber(a.followers)} followers` : "Not connected"}
                        </div>
                      </div>
                      {a.connected && selected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Generated post preview */}
          {generatedPost && (
            <Card className="animate-slide-up">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Generated post preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-border p-4 bg-muted/20">
                  <p className="text-sm whitespace-pre-wrap">{generatedPost}</p>
                  {hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
                      {hashtags.map((h, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{h}</Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  <Button variant="outline" onClick={() => navigator.clipboard.writeText(generatedPost)}>
                    Copy text
                  </Button>
                  <Button onClick={schedulePost} disabled={posting}>
                    {posting ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <CalendarPlus className="h-4 w-4 mr-1.5" />}
                    Schedule to {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? "s" : ""}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Accounts */}
        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Connected accounts</CardTitle>
              <CardDescription>Manage social platform connections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {accounts.map((a) => {
                  const meta = platformMeta[a.platform];
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border"
                    >
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ background: meta.color }}
                      >
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{meta.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {a.connected ? a.handle : "Not connected"} · {a.connected ? `${formatNumber(a.followers)} followers` : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {a.connected && (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                            {formatPercent(a.engagementRate)} ER
                          </Badge>
                        )}
                        <Switch checked={a.connected} onCheckedChange={() => toggleAccount(a.id)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Engagement by platform</CardTitle>
              <CardDescription>Average engagement rate per platform</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={platformEngagement}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                  <XAxis dataKey="platform" stroke="currentColor" strokeOpacity={0.4} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="currentColor" strokeOpacity={0.4} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value: number) => `${value}%`}
                    contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="engagement" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {connectedAccounts.slice(0, 6).map((a) => {
              const meta = platformMeta[a.platform];
              return (
                <Card key={a.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: meta.color }}>
                        {meta.icon}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{meta.name}</div>
                        <div className="text-[11px] text-muted-foreground">{a.handle}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-base font-bold">{formatNumber(a.followers)}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">Followers</div>
                      </div>
                      <div>
                        <div className="text-base font-bold">{formatPercent(a.engagementRate)}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">ER</div>
                      </div>
                      <div>
                        <div className="text-base font-bold">{formatNumber(Math.floor(a.followers * a.engagementRate / 100))}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">Engagements</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick-start templates</CardTitle>
              <CardDescription>Pre-built content briefs — click to load into composer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { title: "Product launch", brief: "Announce our new product feature — emphasize the user problem it solves and the unique approach.", platform: "twitter" as Platform },
                  { title: "Customer story", brief: "Share a customer success story — focus on measurable results and a quote.", platform: "linkedin" as Platform },
                  { title: "Behind the scenes", brief: "Behind-the-scenes look at our team and process — show personality.", platform: "instagram" as Platform },
                  { title: "Industry insight", brief: "Hot take on a current industry trend — data-backed, opinionated.", platform: "linkedin" as Platform },
                  { title: "Tutorial teaser", brief: "Tease a new tutorial — promise a specific outcome.", platform: "youtube" as Platform },
                  { title: "Poll / question", brief: "Ask the audience a question that sparks debate.", platform: "twitter" as Platform },
                ].map((t) => (
                  <button
                    key={t.title}
                    onClick={() => {
                      setBrief(t.brief);
                      setPlatform(t.platform);
                      document.querySelector('[value="compose"]')?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/40 transition-all text-left"
                  >
                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                      <Plus className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{t.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{t.brief}</div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
