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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Mail,
  Send,
  Sparkles,
  Wand2,
  Loader2,
  Users,
  MousePointerClick,
  Eye,
  UserX,
  Plus,
  Trash2,
  Play,
  Pause,
  Clock,
  Zap,
  Filter,
} from "lucide-react";
import type { EmailCampaign } from "@/lib/marqai/types";
import { formatNumber, formatPercent, formatDateTime, uid } from "@/lib/marqai/utils";
import { KpiCard } from "../kpi-card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const audienceOptions = [
  "All subscribers",
  "Engaged (30d)",
  "Engaged (90d)",
  "Power users",
  "Trial users",
  "Churned (60d)",
  "Newsletter only",
];

const openRateData = [
  { date: "Wk 1", rate: 32 },
  { date: "Wk 2", rate: 38 },
  { date: "Wk 3", rate: 41 },
  { date: "Wk 4", rate: 39 },
  { date: "Wk 5", rate: 44 },
  { date: "Wk 6", rate: 42 },
];

export function EmailModule() {
  const campaigns = useMarqai((s) => s.emailCampaigns);
  const automations = useMarqai((s) => s.emailAutomations);
  const addEmailCampaign = useMarqai((s) => s.addEmailCampaign);
  const updateEmailCampaign = useMarqai((s) => s.updateEmailCampaign);
  const deleteEmailCampaign = useMarqai((s) => s.deleteEmailCampaign);
  const toggleAutomation = useMarqai((s) => s.toggleAutomation);

  const [open, setOpen] = useState(false);
  const [generatingSubject, setGeneratingSubject] = useState(false);
  const [generatingBody, setGeneratingBody] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [previewCampaign, setPreviewCampaign] = useState<EmailCampaign | null>(null);

  // Form
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [fromName, setFromName] = useState("Marqai Team");
  const [bodyHtml, setBodyHtml] = useState("");
  const [audience, setAudience] = useState("All subscribers");
  const [brief, setBrief] = useState("");

  function openNew() {
    setName("");
    setSubject("");
    setPreviewText("");
    setFromName("Marqai Team");
    setBodyHtml("");
    setAudience("All subscribers");
    setBrief("");
    setOpen(true);
  }

  async function generateSubject() {
    if (!brief.trim()) {
      toast.error("Add a brief first");
      return;
    }
    setGeneratingSubject(true);
    try {
      const res = await fetch("/api/marqai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "email-subject", prompt: brief }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const lines = (data.text as string).split("\n").filter(Boolean);
      if (lines.length) setSubject(lines[0]);
      toast.success(`${lines.length} subject lines generated — using first`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setGeneratingSubject(false);
    }
  }

  async function generateBody() {
    if (!brief.trim()) {
      toast.error("Add a brief first");
      return;
    }
    setGeneratingBody(true);
    try {
      const res = await fetch("/api/marqai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "email-body", prompt: brief }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBodyHtml(data.text);
      toast.success("Email body generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setGeneratingBody(false);
    }
  }

  function save() {
    if (!name.trim() || !subject.trim()) {
      toast.error("Name and subject are required");
      return;
    }
    const c: EmailCampaign = {
      id: uid("ec"),
      name,
      subject,
      previewText,
      fromName,
      bodyHtml,
      audience,
      recipients: Math.floor(2000 + Math.random() * 12000),
      status: "draft",
      createdAt: new Date().toISOString(),
    };
    addEmailCampaign(c);
    setOpen(false);
    toast.success("Campaign saved as draft");
  }

  async function send(id: string) {
    setSending(id);
    try {
      const c = campaigns.find((x) => x.id === id);
      if (!c) return;
      const res = await fetch("/api/marqai/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: id,
          subject: c.subject,
          bodyHtml: c.bodyHtml,
          recipientCount: c.recipients,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      updateEmailCampaign(id, {
        status: "sent",
        sentAt: data.sentAt,
        openRate: data.stats.openRate,
        clickRate: data.stats.clickRate,
        unsubscribeRate: data.stats.unsubscribeRate,
      });
      toast.success(`Sent to ${formatNumber(data.stats.delivered)} recipients · ${formatPercent(data.stats.openRate)} open rate`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(null);
    }
  }

  const totalRecipients = campaigns.reduce((s, c) => s + c.recipients, 0);
  const sentCampaigns = campaigns.filter((c) => c.status === "sent");
  const avgOpen = sentCampaigns.length ? sentCampaigns.reduce((s, c) => s + (c.openRate ?? 0), 0) / sentCampaigns.length : 0;
  const avgClick = sentCampaigns.length ? sentCampaigns.reduce((s, c) => s + (c.clickRate ?? 0), 0) / sentCampaigns.length : 0;
  const activeAutomations = automations.filter((a) => a.active).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total recipients" value={formatNumber(totalRecipients)} icon={Users} accent="emerald" hint="across all audiences" />
        <KpiCard label="Avg open rate" value={formatPercent(avgOpen)} icon={Eye} accent="violet" delta={2.1} />
        <KpiCard label="Avg click rate" value={formatPercent(avgClick)} icon={MousePointerClick} accent="amber" delta={0.8} />
        <KpiCard label="Active automations" value={`${activeAutomations}/${automations.length}`} icon={Zap} accent="rose" hint="triggered flows" />
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-fit">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="audiences">Audiences</TabsTrigger>
        </TabsList>

        {/* Campaigns */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Campaigns
                </CardTitle>
                <CardDescription>Blast, scheduled, and sent campaigns</CardDescription>
              </div>
              <Button onClick={openNew} size="sm">
                <Plus className="h-4 w-4 mr-1.5" /> New campaign
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {campaigns.length === 0 && (
                <p className="text-sm text-muted-foreground py-8 text-center">No campaigns yet</p>
              )}
              {campaigns.map((c) => (
                <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="text-sm font-medium truncate">{c.name}</div>
                      <Badge
                        variant={
                          c.status === "sent"
                            ? "default"
                            : c.status === "sending"
                              ? "secondary"
                              : c.status === "scheduled"
                                ? "outline"
                                : c.status === "aborted"
                                  ? "destructive"
                                  : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {c.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{c.subject}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {c.audience} · {formatNumber(c.recipients)} recipients
                      {c.sentAt && ` · sent ${formatDateTime(c.sentAt)}`}
                      {c.scheduledAt && ` · scheduled ${formatDateTime(c.scheduledAt)}`}
                    </div>
                    {c.status === "sent" && (
                      <div className="flex flex-wrap gap-3 mt-1.5 text-[11px]">
                        <span className="text-emerald-600 flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {formatPercent(c.openRate ?? 0)} open
                        </span>
                        <span className="text-violet-600 flex items-center gap-1">
                          <MousePointerClick className="h-3 w-3" /> {formatPercent(c.clickRate ?? 0)} click
                        </span>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <UserX className="h-3 w-3" /> {formatPercent(c.unsubscribeRate ?? 0, 2)} unsub
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setPreviewCampaign(c)}>
                      Preview
                    </Button>
                    {c.status === "draft" && (
                      <Button size="sm" onClick={() => send(c.id)} disabled={sending === c.id}>
                        {sending === c.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                        Send
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        deleteEmailCampaign(c.id);
                        toast.success("Campaign deleted");
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automations */}
        <TabsContent value="automations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4" /> Email automations
              </CardTitle>
              <CardDescription>Triggered flows that send automatically based on user behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {automations.map((a) => (
                <div key={a.id} className="p-4 rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold">{a.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Trigger: <span className="font-medium text-foreground">{a.trigger}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={a.active ? "default" : "secondary"} className="text-[10px]">
                        {a.active ? "Active" : "Paused"}
                      </Badge>
                      <Switch checked={a.active} onCheckedChange={() => toggleAutomation(a.id)} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scroll-thin">
                    {a.steps.map((s, i) => (
                      <div key={s.id} className="flex items-center gap-2 shrink-0">
                        <div className={`px-3 py-1.5 rounded-lg border text-xs ${s.type === "email" ? "border-primary/30 bg-primary/5" : s.type === "wait" ? "border-amber-300 bg-amber-50 dark:bg-amber-950/30" : "border-cyan-300 bg-cyan-50 dark:bg-cyan-950/30"}`}>
                          <div className="font-medium">{s.label}</div>
                          {s.delay && <div className="text-[10px] text-muted-foreground">{s.delay} delay</div>}
                        </div>
                        {i < a.steps.length - 1 && <div className="text-muted-foreground">→</div>}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span><strong className="text-foreground">{formatNumber(a.enrolled)}</strong> enrolled</span>
                    <span><strong className="text-emerald-600">{formatPercent(a.conversionRate)}</strong> conversion</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Open rate trend</CardTitle>
              <CardDescription>Last 6 weeks · all campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={openRateData}>
                  <defs>
                    <linearGradient id="gOpen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#0d9488" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                  <XAxis dataKey="date" stroke="currentColor" strokeOpacity={0.4} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="currentColor" strokeOpacity={0.4} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(v: number) => `${v}%`}
                    contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="rate" stroke="#0d9488" strokeWidth={2} fill="url(#gOpen)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top performing campaigns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sentCampaigns
                  .sort((a, b) => (b.openRate ?? 0) - (a.openRate ?? 0))
                  .slice(0, 5)
                  .map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{c.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{c.subject}</div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="font-semibold text-emerald-600">{formatPercent(c.openRate ?? 0)}</div>
                        <div className="text-[10px] text-muted-foreground">open rate</div>
                      </div>
                    </div>
                  ))}
                {sentCampaigns.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No sent campaigns yet</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Engagement benchmarks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <BenchmarkRow label="Open rate" value={avgOpen} benchmark={38} unit="%" />
                <BenchmarkRow label="Click rate" value={avgClick} benchmark={5.2} unit="%" />
                <BenchmarkRow label="UserX rate" value={0.4} benchmark={0.5} unit="%" invert />
                <BenchmarkRow label="Bounce rate" value={1.2} benchmark={2.0} unit="%" invert />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audiences */}
        <TabsContent value="audiences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" /> Audience segments
              </CardTitle>
              <CardDescription>Pre-built audiences you can target</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { name: "All subscribers", count: 24680, growth: 4.2 },
                  { name: "Engaged (30d)", count: 14200, growth: 6.1 },
                  { name: "Engaged (90d)", count: 18900, growth: 3.4 },
                  { name: "Power users", count: 3120, growth: 8.4 },
                  { name: "Trial users", count: 1840, growth: -2.1 },
                  { name: "Churned (60d)", count: 760, growth: -1.4 },
                  { name: "Newsletter only", count: 12400, growth: 2.8 },
                ].map((a) => (
                  <div key={a.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <div className="text-sm font-medium">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{formatNumber(a.count)} contacts</div>
                    </div>
                    <Badge variant={a.growth >= 0 ? "default" : "destructive"} className="text-[10px]">
                      {a.growth >= 0 ? "+" : ""}{a.growth}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New campaign dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New email campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto scroll-thin pr-1">
            <div>
              <Label htmlFor="brief">AI brief</Label>
              <Textarea
                id="brief"
                placeholder="e.g. Announce Marqai's new AI Tool Testing module. CTA: read the first report card."
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                rows={2}
                className="mt-1"
              />
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={generateSubject} disabled={generatingSubject}>
                  {generatingSubject ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Wand2 className="h-3.5 w-3.5 mr-1" />}
                  Generate subject
                </Button>
                <Button size="sm" variant="outline" onClick={generateBody} disabled={generatingBody}>
                  {generatingBody ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                  Generate body
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="name">Campaign name (internal)</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="subject">Subject line</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="preview">Preview text</Label>
              <Input id="preview" value={previewText} onChange={(e) => setPreviewText(e.target.value)} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="from">From name</Label>
                <Input id="from" value={fromName} onChange={(e) => setFromName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Audience</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {audienceOptions.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="body">Email HTML body</Label>
              <Textarea
                id="body"
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                rows={6}
                className="mt-1 font-mono text-xs"
                placeholder="<h2>Hello</h2><p>Welcome to Marqai</p>"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={save}>Save draft</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      {previewCampaign && (
        <Dialog open onOpenChange={() => setPreviewCampaign(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> {previewCampaign.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="bg-muted p-3 text-xs space-y-1 border-b border-border">
                  <div><strong>From:</strong> {previewCampaign.fromName} &lt;team@marqai.app&gt;</div>
                  <div><strong>Subject:</strong> {previewCampaign.subject}</div>
                  {previewCampaign.previewText && <div><strong>Preview:</strong> {previewCampaign.previewText}</div>}
                </div>
                <div
                  className="p-4 bg-white text-black max-h-[400px] overflow-y-auto scroll-thin"
                  dangerouslySetInnerHTML={{ __html: previewCampaign.bodyHtml || "<p class='text-gray-400 italic'>No body content</p>" }}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button>Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function BenchmarkRow({ label, value, benchmark, unit, invert }: { label: string; value: number; benchmark: number; unit: string; invert?: boolean }) {
  const isGood = invert ? value <= benchmark : value >= benchmark;
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <div className="flex items-center gap-2">
        <span className={`font-semibold ${isGood ? "text-emerald-600" : "text-amber-600"}`}>{value.toFixed(1)}{unit}</span>
        <span className="text-xs text-muted-foreground">vs {benchmark}{unit} avg</span>
      </div>
    </div>
  );
}
