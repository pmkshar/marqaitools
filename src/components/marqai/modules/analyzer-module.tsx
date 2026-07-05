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
  Globe,
  Gauge,
  Shield,
  Smartphone,
  TrendingUp,
  Code2,
  MapPin,
  Link2,
  Lightbulb,
  Share2,
  Download,
  History,
  AlertTriangle,
} from "lucide-react";
import type { WebsiteAnalysisReport } from "@/lib/marqai/types";
import { formatNumber, formatPercent, formatDateTime, scoreColor, uid } from "@/lib/marqai/utils";
import { platformMeta } from "@/lib/marqai/mock-data";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export function AnalyzerModule() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<WebsiteAnalysisReport | null>(null);
  const websiteReports = useMarqai((s) => s.websiteReports);
  const addWebsiteReport = useMarqai((s) => s.addWebsiteReport);

  async function analyze() {
    if (!url.trim()) {
      toast.error("Enter a URL");
      return;
    }
    setLoading(true);
    setReport(null);
    try {
      const res = await fetch("/api/marqai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), mode: "website" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const r = normalizeReport(data.report, url.trim(), data.analyzedAt);
      setReport(r);
      addWebsiteReport(r);
      toast.success("Analysis complete");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" /> Website Analyzer
          </CardTitle>
          <CardDescription>
            Deep analysis of any website or portal — tech stack, traffic estimates, traffic sources,
            top pages, ranking keywords, competitors, performance, security, mobile readiness, and missing features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Label htmlFor="wa-url" className="sr-only">URL</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="wa-url"
                  placeholder="example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && analyze()}
                  className="pl-9 h-11"
                />
              </div>
            </div>
            <Button onClick={analyze} disabled={loading} size="lg" className="h-11">
              {loading ? "Analyzing..." : "Analyze website"}
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">Try:</span>
            {["stripe.com", "linear.app", "notion.so", "figma.com"].map((u) => (
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
            <LoadingState message="Detecting tech stack, estimating traffic, scanning keywords & competitors..." />
          </CardContent>
        </Card>
      )}

      {!loading && !report && websiteReports.length === 0 && (
        <Card>
          <CardContent>
            <EmptyState
              icon={Globe}
              title="No analyses yet"
              description="Enter any website URL above to get a full breakdown — tech stack, traffic, sources, keywords, competitors, performance, security, and missing features."
            />
          </CardContent>
        </Card>
      )}

      {!loading && report && <ReportView report={report} />}

      {!loading && !report && websiteReports.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" /> Recent analyses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {websiteReports.slice(0, 5).map((r) => (
              <button
                key={r.id}
                onClick={() => setReport(r)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{r.url}</div>
                    <div className="text-xs text-muted-foreground">{formatDateTime(r.analyzedAt)} · {formatNumber(r.traffic.monthlyVisits)} visits/mo</div>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReportView({ report }: { report: WebsiteAnalysisReport }) {
  const perfData = [
    { name: "LCP", value: report.performance.lcp, unit: "s", target: 2.5, good: "below" },
    { name: "FCP", value: report.performance.fcp, unit: "s", target: 1.8, good: "below" },
    { name: "TTFB", value: report.performance.ttfb, unit: "s", target: 0.8, good: "below" },
    { name: "Speed Index", value: report.performance.speedIndex, unit: "s", target: 3.4, good: "below" },
    { name: "TBT", value: report.performance.tbt, unit: "ms", target: 200, good: "below" },
    { name: "CLS", value: report.performance.cls, unit: "", target: 0.1, good: "below" },
  ];

  const sourceData = report.trafficSources.map((s, i) => ({
    name: s.source,
    value: s.share,
    visits: s.visits,
    color: ["#0d9488", "#0891b2", "#f59e0b", "#8b5cf6", "#f43f5e", "#06b6d4"][i % 6],
  }));

  const overallScore = Math.round(
    (report.securityScore + report.mobileScore + Math.min(100, 100 - report.performance.lcp * 20) + Math.min(100, 100 - report.traffic.bounceRate)) / 4,
  );

  return (
    <div className="space-y-4 animate-slide-up">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" /> {report.url}
            </CardTitle>
            <CardDescription className="text-xs">
              Analyzed {formatDateTime(report.analyzedAt)}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="flex flex-col items-center">
              <ScoreRing score={overallScore} size={110} label="Overall" />
            </div>
            <ScorePill icon={Shield} label="Security" value={report.securityScore} />
            <ScorePill icon={Smartphone} label="Mobile" value={report.mobileScore} />
            <ScorePill icon={TrendingUp} label="Traffic trend" value={Math.max(0, Math.min(100, 50 + report.traffic.visitsChange * 5))} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="traffic">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:w-fit">
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="tech">Tech stack</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="recommendations">Gaps</TabsTrigger>
        </TabsList>

        {/* Traffic */}
        <TabsContent value="traffic" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MiniStat label="Monthly visits" value={formatNumber(report.traffic.monthlyVisits)} delta={report.traffic.visitsChange} />
            <MiniStat label="Avg visit duration" value={report.traffic.avgVisitDuration} />
            <MiniStat label="Bounce rate" value={formatPercent(report.traffic.bounceRate)} invert />
            <MiniStat label="Pages per visit" value={report.traffic.pagesPerVisit.toFixed(1)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Traffic sources</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                      {sourceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip
                      formatter={(v: number, _n, p: any) => [`${v}% · ${formatNumber(p.payload.visits)} visits`, p.payload.name]}
                      contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Traffic by country</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.trafficByCountry.map((c) => (
                  <div key={c.code}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">{c.country} <span className="text-muted-foreground">({c.code})</span></span>
                      <span>{formatPercent(c.share)}</span>
                    </div>
                    <Progress value={c.share} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Link2 className="h-4 w-4" /> Top pages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {report.topPages.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <span className="truncate mr-2">{p.url}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-medium">{formatNumber(p.visits)}</span>
                    <span className="text-xs text-muted-foreground">{formatPercent(p.share)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tech */}
        <TabsContent value="tech" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Code2 className="h-4 w-4" /> Tech stack</CardTitle>
              <CardDescription>Detected technologies with confidence score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.techStack.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                    <div className="h-9 w-9 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {t.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.category}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{formatPercent(t.confidence)} match</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Gauge className="h-4 w-4" /> Core Web Vitals</CardTitle>
              <CardDescription>Lab data from a simulated Lighthouse run</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={perfData.map((p) => ({ ...p, displayValue: p.unit === "ms" ? p.value : p.value }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                  <XAxis dataKey="name" stroke="currentColor" strokeOpacity={0.4} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="currentColor" strokeOpacity={0.4} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(v: number, _n, p: any) => [`${v}${p.payload.unit}`, p.payload.name]}
                    contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="displayValue" radius={[4, 4, 0, 0]}>
                    {perfData.map((p, i) => (
                      <Cell key={i} fill={p.value <= p.target ? "#10b981" : p.value <= p.target * 1.5 ? "#f59e0b" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="text-xs text-muted-foreground mt-2 text-center">
                Green = good · Amber = needs improvement · Red = poor
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keywords */}
        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ranking keywords</CardTitle>
              <CardDescription>Top organic keywords this site ranks for</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto scroll-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="text-left py-2 px-2">Keyword</th>
                      <th className="text-right py-2 px-2">Position</th>
                      <th className="text-right py-2 px-2">Volume</th>
                      <th className="text-right py-2 px-2">Intent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.keywords.map((k, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="py-2 px-2 font-medium">{k.keyword}</td>
                        <td className="py-2 px-2 text-right">
                          <Badge variant={k.position <= 3 ? "default" : k.position <= 10 ? "secondary" : "outline"} className="text-[10px]">
                            #{k.position}
                          </Badge>
                        </td>
                        <td className="py-2 px-2 text-right">{formatNumber(k.volume)}</td>
                        <td className="py-2 px-2 text-right text-xs text-muted-foreground">{k.intent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Competitors</CardTitle>
              <CardDescription>Sites competing for the same audience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {report.competitors.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <span className="font-medium">{c.domain}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{c.overlap}% overlap</span>
                    <span className="font-medium">{formatNumber(c.visits)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gaps / recommendations */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Missing features
              </CardTitle>
              <CardDescription>Things this site should add or fix</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {report.missingFeatures.map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <Badge
                    variant={f.severity === "high" ? "destructive" : f.severity === "medium" ? "default" : "secondary"}
                    className="text-[10px] mt-0.5"
                  >
                    {f.severity}
                  </Badge>
                  <div>
                    <div className="text-sm font-medium">{f.feature}</div>
                    <div className="text-xs text-muted-foreground">{f.impact}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Lightbulb className="h-4 w-4" /> Recommendations</CardTitle>
              <CardDescription>Prioritized action items</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {report.recommendations
                .sort((a, b) => b.priority - a.priority)
                .map((r, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {r.priority}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{r.title}</div>
                      <div className="text-xs text-muted-foreground">{r.description}</div>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Share2 className="h-4 w-4" /> Social presence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.socialPresence.map((s, i) => {
                  const meta = platformMeta[s.platform];
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: meta.color }}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{meta.name}</div>
                        <div className="text-xs text-muted-foreground">{s.handle} · {s.activity}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{formatNumber(s.followers)}</div>
                        <div className="text-[10px] text-muted-foreground">followers</div>
                      </div>
                    </div>
                  );
                })}
                {report.socialPresence.length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-2 py-4 text-center">No social presence detected</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ScorePill({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className={`text-xl font-bold ${scoreColor(value)}`}>{value}/100</div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, delta, invert }: { label: string; value: string; delta?: number; invert?: boolean }) {
  const isGood = delta === undefined ? true : invert ? delta < 0 : delta > 0;
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="text-lg font-bold mt-0.5">{value}</div>
        {delta !== undefined && (
          <div className={`text-xs ${isGood ? "text-emerald-600" : "text-rose-600"}`}>
            {delta > 0 ? "+" : ""}{delta}% {invert ? (isGood ? "↓ good" : "↑ bad") : ""}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function normalizeReport(r: any, url: string, analyzedAt: string): WebsiteAnalysisReport {
  return {
    id: uid("wa"),
    url,
    analyzedAt,
    techStack: (r.techStack ?? []).map((t: any) => ({
      name: t.name ?? "",
      category: t.category ?? "",
      confidence: clampNum(t.confidence, 0, 100, 80),
    })),
    performance: {
      lcp: clampNum(r.performance?.lcp, 0, 20, 2.5),
      cls: clampNum(r.performance?.cls, 0, 5, 0.1),
      fcp: clampNum(r.performance?.fcp, 0, 20, 1.8),
      ttfb: clampNum(r.performance?.ttfb, 0, 20, 0.8),
      speedIndex: clampNum(r.performance?.speedIndex, 0, 30, 3.4),
      tbt: clampNum(r.performance?.tbt, 0, 5000, 200),
    },
    traffic: {
      monthlyVisits: r.traffic?.monthlyVisits ?? 0,
      visitsChange: r.traffic?.visitsChange ?? 0,
      avgVisitDuration: r.traffic?.avgVisitDuration ?? "0:00",
      bounceRate: clampNum(r.traffic?.bounceRate, 0, 100, 50),
      pagesPerVisit: clampNum(r.traffic?.pagesPerVisit, 0, 50, 2),
    },
    trafficByCountry: (r.trafficByCountry ?? []).map((c: any) => ({
      country: c.country ?? "",
      code: c.code ?? "",
      share: clampNum(c.share, 0, 100, 0),
    })),
    trafficSources: (r.trafficSources ?? []).map((s: any) => ({
      source: s.source ?? "",
      share: clampNum(s.share, 0, 100, 0),
      visits: s.visits ?? 0,
    })),
    topPages: (r.topPages ?? []).map((p: any) => ({
      url: p.url ?? "",
      visits: p.visits ?? 0,
      share: clampNum(p.share, 0, 100, 0),
    })),
    keywords: (r.keywords ?? []).map((k: any) => ({
      keyword: k.keyword ?? "",
      position: k.position ?? 0,
      volume: k.volume ?? 0,
      intent: k.intent ?? "",
    })),
    competitors: (r.competitors ?? []).map((c: any) => ({
      domain: c.domain ?? "",
      overlap: clampNum(c.overlap, 0, 100, 0),
      visits: c.visits ?? 0,
    })),
    missingFeatures: (r.missingFeatures ?? []).map((f: any) => ({
      feature: f.feature ?? "",
      severity: f.severity ?? "medium",
      impact: f.impact ?? "",
    })),
    recommendations: (r.recommendations ?? []).map((rec: any) => ({
      title: rec.title ?? "",
      description: rec.description ?? "",
      priority: clampNum(rec.priority, 1, 10, 5),
    })),
    socialPresence: (r.socialPresence ?? []).map((s: any) => ({
      platform: s.platform ?? "twitter",
      handle: s.handle ?? "",
      followers: s.followers ?? 0,
      activity: s.activity ?? "",
    })),
    securityScore: clampNum(r.securityScore, 0, 100, 70),
    mobileScore: clampNum(r.mobileScore, 0, 100, 70),
  };
}

function clampNum(v: any, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
