"use client";

import { useState } from "react";
import { useMarqai } from "@/lib/marqai/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScoreRing } from "../score-ring";
import { LoadingState, EmptyState } from "../loading-states";
import { toast } from "sonner";
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Globe,
  Gauge,
  TrendingUp,
  Link2,
  AlertCircle,
  Download,
  History,
} from "lucide-react";
import type { SeoReport } from "@/lib/marqai/types";
import { formatNumber, formatPercent, formatDateTime, scoreColor, uid } from "@/lib/marqai/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export function SeoModule() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<SeoReport | null>(null);
  const seoReports = useMarqai((s) => s.seoReports);
  const addSeoReport = useMarqai((s) => s.addSeoReport);

  async function runAudit() {
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }
    setLoading(true);
    setReport(null);
    try {
      const res = await fetch("/api/marqai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), mode: "seo" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit failed");
      const r: SeoReport = normalizeSeo(data.report, url.trim(), data.analyzedAt);
      setReport(r);
      addSeoReport(r);
      toast.success(`Audit complete — overall score ${r.overallScore}/100`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Audit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" /> SEO Analyzer
          </CardTitle>
          <CardDescription>
            Run a full SEO audit on any URL. Marqai checks meta tags, headings, keyword density,
            backlinks, page performance, mobile friendliness, and detects missing analytics & tracking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Label htmlFor="seo-url" className="sr-only">URL</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="seo-url"
                  placeholder="example.com or https://example.com/page"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runAudit()}
                  className="pl-9 h-11"
                />
              </div>
            </div>
            <Button onClick={runAudit} disabled={loading} size="lg" className="h-11">
              {loading ? "Auditing..." : "Run SEO audit"}
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">Try:</span>
            {["stripe.com", "notion.so", "vercel.com", "shopify.com"].map((u) => (
              <button
                key={u}
                onClick={() => setUrl(u)}
                className="text-xs px-2 py-0.5 rounded-full bg-muted hover:bg-muted/70 transition-colors"
              >
                {u}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent>
            <LoadingState message="Crawling pages, analyzing meta tags, counting backlinks..." />
          </CardContent>
        </Card>
      )}

      {!loading && !report && seoReports.length === 0 && (
        <Card>
          <CardContent>
            <EmptyState
              icon={Search}
              title="No audits yet"
              description="Enter a URL above to run your first SEO audit. Marqai will return scores, findings, and missing analytics in seconds."
            />
          </CardContent>
        </Card>
      )}

      {!loading && report && <ReportView report={report} />}

      {!loading && !report && seoReports.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" /> Recent audits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {seoReports.slice(0, 5).map((r) => (
              <button
                key={r.id}
                onClick={() => setReport(r)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ScoreRing score={r.overallScore} size={36} showValue label="" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{r.url}</div>
                    <div className="text-xs text-muted-foreground">{formatDateTime(r.analyzedAt)}</div>
                  </div>
                </div>
                <Badge variant={r.overallScore >= 80 ? "default" : r.overallScore >= 60 ? "secondary" : "destructive"}>
                  {r.findings.length} findings
                </Badge>
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReportView({ report }: { report: SeoReport }) {
  const scoreData = [
    { name: "Performance", value: report.scores.performance, fill: "#0d9488" },
    { name: "SEO", value: report.scores.seo, fill: "#0891b2" },
    { name: "Accessibility", value: report.scores.accessibility, fill: "#f59e0b" },
    { name: "Best Practices", value: report.scores.bestPractices, fill: "#8b5cf6" },
    { name: "Content", value: report.scores.content, fill: "#f43f5e" },
    { name: "Mobile", value: report.scores.mobile, fill: "#06b6d4" },
  ];

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Summary */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" /> {report.url}
            </CardTitle>
            <CardDescription className="text-xs">
              Audited {formatDateTime(report.analyzedAt)} · {report.findings.length} findings · {report.missingAnalytics.length} missing analytics
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="flex flex-col items-center">
              <ScoreRing score={report.overallScore} size={120} label="Overall" />
              <div className={`mt-2 text-sm font-medium ${scoreColor(report.overallScore)}`}>
                {report.overallScore >= 85 ? "Excellent" : report.overallScore >= 70 ? "Good" : report.overallScore >= 50 ? "Needs work" : "Critical"}
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Metric label="Domain authority" value={`${report.domainAuthority}/100`} />
                <Metric label="Page authority" value={`${report.pageAuthority}/100`} />
                <Metric label="Backlinks" value={formatNumber(report.backlinks)} />
                <Metric label="Page size" value={`${report.pageSizeKb} KB`} />
                <Metric label="Load time" value={`${(report.loadTimeMs / 1000).toFixed(2)}s`} />
                <Metric label="Keywords found" value={String(report.keywords.length)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="scores">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:w-fit">
          <TabsTrigger value="scores">Scores</TabsTrigger>
          <TabsTrigger value="findings">Findings ({report.findings.length})</TabsTrigger>
          <TabsTrigger value="analytics">Missing Analytics</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="competition">Competition</TabsTrigger>
        </TabsList>

        {/* Scores */}
        <TabsContent value="scores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit scores</CardTitle>
              <CardDescription>Per-category scores (0-100)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={scoreData} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} stroke="currentColor" strokeOpacity={0.4} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" stroke="currentColor" strokeOpacity={0.4} fontSize={11} tickLine={false} axisLine={false} width={100} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--background)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {scoreData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {scoreData.map((s) => (
                    <div key={s.name}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium">{s.name}</span>
                        <span className={scoreColor(s.value)}>{s.value}/100</span>
                      </div>
                      <Progress value={s.value} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Findings */}
        <TabsContent value="findings" className="space-y-3">
          {report.findings.length === 0 && (
            <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No findings</CardContent></Card>
          )}
          {report.findings.map((f) => {
            const cfg = findingConfig(f.category);
            const Icon = cfg.icon;
            return (
              <Card key={f.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${cfg.bg}`}>
                      <Icon className={`h-4 w-4 ${cfg.fg}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold">{f.title}</h4>
                        <Badge variant="outline" className={cfg.badge}>{f.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{f.description}</p>
                      <div className="text-xs bg-muted/40 rounded p-2 border-l-2 border-primary">
                        <span className="font-medium text-foreground">Recommendation: </span>
                        {f.recommendation}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Missing analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" /> Missing analytics & tracking
              </CardTitle>
              <CardDescription>
                Marqai scanned the page for analytics tags, tag managers, schema, and SEO infrastructure.
                These are missing or misconfigured:
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report.missingAnalytics.length === 0 ? (
                <div className="flex items-center gap-2 text-emerald-600 text-sm py-4">
                  <CheckCircle2 className="h-4 w-4" /> All key analytics and tracking are detected.
                </div>
              ) : (
                <ul className="space-y-2">
                  {report.missingAnalytics.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <span className="text-sm">{m}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Meta tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <MetaRow label="Title" value={report.meta.title} length={report.meta.titleLength} max={60} />
              <MetaRow label="Description" value={report.meta.description} length={report.meta.descriptionLength} max={155} />
              {report.meta.canonical && <MetaRow label="Canonical" value={report.meta.canonical} />}
              {report.meta.robots && <MetaRow label="Robots" value={report.meta.robots} />}
              {report.meta.ogTitle && <MetaRow label="OG Title" value={report.meta.ogTitle} />}
              {report.meta.ogDescription && <MetaRow label="OG Description" value={report.meta.ogDescription} />}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Headings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <HeadingList label="H1" items={report.headings.h1} />
                <HeadingList label="H2" items={report.headings.h2} />
                <HeadingList label="H3" items={report.headings.h3} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.keywords.slice(0, 8).map((k, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{k.keyword}</span>
                      <span className="text-muted-foreground">
                        {k.count}× · {formatPercent(k.density * 100, 2)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Competition */}
        <TabsContent value="competition" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Link2 className="h-4 w-4" /> Top pages by traffic
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.topPages.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                    <span className="truncate mr-2">{p.url}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-medium">{formatNumber(p.traffic)}</span>
                      <Badge variant={p.change >= 0 ? "default" : "destructive"} className="text-[10px]">
                        {p.change >= 0 ? "+" : ""}{p.change}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Competitors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.competitors.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                    <span className="font-medium">{c.domain}</span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{c.overlap}% overlap</span>
                      <span className="font-medium text-foreground">{formatNumber(c.traffic)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/40">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function MetaRow({ label, value, length, max }: { label: string; value: string; length?: number; max?: number }) {
  const over = length !== undefined && max !== undefined && length > max;
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        {length !== undefined && max !== undefined && (
          <Badge variant={over ? "destructive" : "secondary"} className="text-[10px]">
            {length}/{max}
          </Badge>
        )}
      </div>
      <div className="text-sm bg-muted/30 rounded p-2 border border-border">{value || <span className="text-muted-foreground italic">Not set</span>}</div>
    </div>
  );
}

function HeadingList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label} ({items.length})</div>
      <ul className="space-y-1 text-sm">
        {items.length === 0 && <li className="text-muted-foreground italic text-xs">None found</li>}
        {items.map((h, i) => (
          <li key={i} className="truncate">• {h}</li>
        ))}
      </ul>
    </div>
  );
}

function findingConfig(category: string) {
  switch (category) {
    case "critical":
      return { icon: XCircle, bg: "bg-rose-100 dark:bg-rose-950", fg: "text-rose-600", badge: "text-rose-600 border-rose-200" };
    case "warning":
      return { icon: AlertTriangle, bg: "bg-amber-100 dark:bg-amber-950", fg: "text-amber-600", badge: "text-amber-600 border-amber-200" };
    case "info":
      return { icon: Info, bg: "bg-cyan-100 dark:bg-cyan-950", fg: "text-cyan-600", badge: "text-cyan-600 border-cyan-200" };
    default:
      return { icon: CheckCircle2, bg: "bg-emerald-100 dark:bg-emerald-950", fg: "text-emerald-600", badge: "text-emerald-600 border-emerald-200" };
  }
}

function normalizeSeo(r: any, url: string, analyzedAt: string): SeoReport {
  return {
    id: uid("seo"),
    url,
    analyzedAt,
    overallScore: clampNum(r.overallScore, 0, 100, 70),
    scores: {
      performance: clampNum(r.scores?.performance, 0, 100, 70),
      seo: clampNum(r.scores?.seo, 0, 100, 70),
      accessibility: clampNum(r.scores?.accessibility, 0, 100, 70),
      bestPractices: clampNum(r.scores?.bestPractices, 0, 100, 70),
      content: clampNum(r.scores?.content, 0, 100, 70),
      mobile: clampNum(r.scores?.mobile, 0, 100, 70),
    },
    meta: {
      title: r.meta?.title ?? "",
      titleLength: r.meta?.titleLength ?? 0,
      description: r.meta?.description ?? "",
      descriptionLength: r.meta?.descriptionLength ?? 0,
      canonical: r.meta?.canonical,
      robots: r.meta?.robots,
      ogTitle: r.meta?.ogTitle,
      ogDescription: r.meta?.ogDescription,
      ogImage: r.meta?.ogImage,
    },
    headings: {
      h1: r.headnings?.h1 ?? r.headings?.h1 ?? [],
      h2: r.headnings?.h2 ?? r.headings?.h2 ?? [],
      h3: r.headnings?.h3 ?? r.headings?.h3 ?? [],
    },
    keywords: (r.keywords ?? []).map((k: any) => ({
      keyword: k.keyword,
      density: k.density ?? 0,
      count: k.count ?? 0,
    })),
    backlinks: r.backlinks ?? 0,
    domainAuthority: r.domainAuthority ?? 0,
    pageAuthority: r.pageAuthority ?? 0,
    loadTimeMs: r.loadTimeMs ?? 0,
    pageSizeKb: r.pageSizeKb ?? 0,
    findings: (r.findings ?? []).map((f: any, i: number) => ({
      id: f.id ?? `f-${i}`,
      category: f.category ?? "info",
      title: f.title ?? "",
      description: f.description ?? "",
      recommendation: f.recommendation ?? "",
    })),
    missingAnalytics: r.missingAnalytics ?? [],
    topPages: (r.topPages ?? []).map((p: any) => ({
      url: p.url,
      traffic: p.traffic ?? 0,
      change: p.change ?? 0,
    })),
    competitors: (r.competitors ?? []).map((c: any) => ({
      domain: c.domain,
      overlap: c.overlap ?? 0,
      traffic: c.traffic ?? 0,
    })),
  };
}

function clampNum(v: any, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
