"use client";

import { useState } from "react";
import { useMarqai } from "@/lib/marqai/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
  DialogClose,
} from "@/components/ui/dialog";
import { ScoreRing } from "../score-ring";
import { LoadingState, EmptyState } from "../loading-states";
import { toast } from "sonner";
import {
  FlaskConical,
  Globe,
  Play,
  Loader2,
  Download,
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Lightbulb,
  Zap,
  Clock,
  Shield,
  Brain,
  Code2,
} from "lucide-react";
import type { AiToolTestReport } from "@/lib/marqai/types";
import { formatDateTime, scoreColor, uid } from "@/lib/marqai/utils";
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
} from "recharts";
import { KpiCard } from "../kpi-card";

const toolTypes = [
  { id: "chatbot", label: "Chatbot / LLM", icon: Brain },
  { id: "image-gen", label: "Image generator", icon: Zap },
  { id: "video-gen", label: "Video generator", icon: Play },
  { id: "agent", label: "Autonomous agent", icon: FlaskConical },
  { id: "rag", label: "RAG system", icon: Code2 },
  { id: "code-assistant", label: "Code assistant", icon: Code2 },
  { id: "voice", label: "Voice / TTS / ASR", icon: Zap },
  { id: "other", label: "Other AI tool", icon: FlaskConical },
];

const focusOptions = [
  "All categories",
  "Accuracy & hallucination",
  "Latency & cost",
  "Safety & refusal",
  "Reasoning",
  "Multilingual",
  "Context handling",
  "Output diversity",
];

const sampleTools = [
  { name: "ChatGPT 4o", url: "https://chat.openai.com", type: "chatbot" as const },
  { name: "Claude Sonnet", url: "https://claude.ai", type: "chatbot" as const },
  { name: "Gemini Pro", url: "https://gemini.google.com", type: "chatbot" as const },
  { name: "Midjourney", url: "https://midjourney.com", type: "image-gen" as const },
  { name: "DALL·E 3", url: "https://openai.com/dall-e-3", type: "image-gen" as const },
  { name: "Runway Gen-3", url: "https://runwayml.com", type: "video-gen" as const },
  { name: "GitHub Copilot", url: "https://github.com/features/copilot", type: "code-assistant" as const },
  { name: "Cursor", url: "https://cursor.sh", type: "code-assistant" as const },
];

export function AiTestingModule() {
  const reports = useMarqai((s) => s.aiTestReports);
  const addReport = useMarqai((s) => s.addAiTestReport);

  const [toolName, setToolName] = useState("");
  const [toolUrl, setToolUrl] = useState("");
  const [toolType, setToolType] = useState<AiToolTestReport["toolType"]>("chatbot");
  const [focusAreas, setFocusAreas] = useState("All categories");
  const [customTestCases, setCustomTestCases] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<AiToolTestReport | null>(null);

  async function runTest() {
    if (!toolName.trim() || !toolUrl.trim()) {
      toast.error("Tool name and URL are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/marqai/test-ai-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: toolName.trim(),
          toolUrl: toolUrl.trim(),
          toolType,
          focusAreas,
          customTestCases,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const r: AiToolTestReport = normalizeReport(data.report, toolUrl.trim());
      addReport(r);
      setPreview(r);
      toast.success(`Test complete — grade ${r.grade}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Test failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <Card className="relative overflow-hidden border-0">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600 via-violet-600 to-emerald-600 opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_60%)]" />
        <CardContent className="relative p-6 md:p-8 text-white">
          <Badge className="bg-white/20 text-white border-0 mb-3 backdrop-blur-sm">
            <FlaskConical className="h-3 w-3 mr-1" /> Dedicated QA module
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
            Test any AI tool. Get a report card.
          </h2>
          <p className="text-white/85 text-sm md:text-base max-w-2xl">
            Marqai runs 40+ objective test cases against chatbots, image generators, video generators,
            autonomous agents, RAG systems, code assistants, and voice tools. You get category scores,
            per-test pass/fail, benchmark comparison, and prioritized recommendations.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Tools tested" value={reports.length} icon={FlaskConical} accent="violet" hint="all time" />
        <KpiCard label="Avg score" value={reports.length ? Math.round(reports.reduce((s, r) => s + r.overallScore, 0) / reports.length) : "—"} icon={Brain} accent="emerald" />
        <KpiCard label="Best grade" value={reports.length ? reports.reduce((b, r) => (r.overallScore > b.overallScore ? r : b)).grade : "—"} icon={CheckCircle2} accent="amber" />
        <KpiCard label="Test cases run" value={reports.reduce((s, r) => s + r.testCases.length, 0)} icon={Zap} accent="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Play className="h-4 w-4 text-primary" /> Configure test run
            </CardTitle>
            <CardDescription>Set up an objective QA run against any AI tool</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="tn">Tool name</Label>
                <Input id="tn" placeholder="e.g. ChatGPT 4o" value={toolName} onChange={(e) => setToolName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="tu">Tool URL</Label>
                <div className="relative mt-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="tu" placeholder="https://chat.openai.com" value={toolUrl} onChange={(e) => setToolUrl(e.target.value)} className="pl-9" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tool type</Label>
                <Select value={toolType} onValueChange={(v) => setToolType(v as AiToolTestReport["toolType"])}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {toolTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Focus areas</Label>
                <Select value={focusAreas} onValueChange={setFocusAreas}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {focusOptions.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="ctc">Custom test cases (optional)</Label>
              <Textarea
                id="ctc"
                placeholder="One test case per line. e.g.&#10;Ask a multi-step math word problem&#10;Refuse a harmful request&#10;Summarize a 5k-token document"
                value={customTestCases}
                onChange={(e) => setCustomTestCases(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>

            <Button onClick={runTest} disabled={loading} size="lg" className="w-full">
              {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <FlaskConical className="h-4 w-4 mr-1.5" />}
              {loading ? "Running test suite..." : "Run test suite"}
            </Button>

            <div>
              <div className="text-xs text-muted-foreground mb-2">Sample tools:</div>
              <div className="flex flex-wrap gap-2">
                {sampleTools.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => {
                      setToolName(t.name);
                      setToolUrl(t.url);
                      setToolType(t.type);
                    }}
                    className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-muted/70 transition-colors"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Test coverage</CardTitle>
            <CardDescription>What Marqai evaluates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <CoverageRow icon={Brain} title="Accuracy & hallucination" desc="Factual prompts, citation checks, source grounding." />
            <CoverageRow icon={Clock} title="Latency" desc="Median, P95, P99 response times across prompt types." />
            <CoverageRow icon={Shield} title="Safety & refusal" desc="Harmful prompts, jailbreak attempts, over-refusal rate." />
            <CoverageRow icon={FlaskConical} title="Reasoning" desc="Multi-step math, logic puzzles, planning tasks." />
            <CoverageRow icon={Code2} title="Code generation" desc="Bug detection, refactor, multi-language support." />
            <CoverageRow icon={Zap} title="Cost efficiency" desc="Token cost per task vs. industry benchmark." />
            <CoverageRow icon={TrendingUp} title="Output diversity" desc="Repeated sampling for variance & creativity." />
          </CardContent>
        </Card>
      </div>

      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent>
            <LoadingState message="Running 40+ test cases across accuracy, latency, safety, reasoning, cost..." />
          </CardContent>
        </Card>
      )}

      {/* History */}
      {!loading && reports.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" /> Test reports ({reports.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reports.map((r) => (
              <button
                key={r.id}
                onClick={() => setPreview(r)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors text-left"
              >
                <ScoreRing score={r.overallScore} size={48} label={r.grade} showValue />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.toolName}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {r.toolUrl} · {r.toolType} · {r.testCases.length} test cases
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] text-muted-foreground">{formatDateTime(r.testedAt)}</div>
                  <Badge variant="outline" className="text-[10px] mt-0.5">
                    {r.testCases.filter((t) => t.status === "pass").length}/{r.testCases.length} pass
                  </Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {!loading && reports.length === 0 && (
        <Card>
          <CardContent>
            <EmptyState
              icon={FlaskConical}
              title="No tests run yet"
              description="Configure a test run above to grade any AI tool. Marqai will return category scores, per-test results, benchmark comparison, and prioritized recommendations."
            />
          </CardContent>
        </Card>
      )}

      {/* Preview modal */}
      {preview && <ReportPreview report={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function ReportPreview({ report, onClose }: { report: AiToolTestReport; onClose: () => void }) {
  const radarData = report.categories.map((c) => ({
    category: c.category,
    score: c.score,
    full: c.maxScore,
  }));
  const benchmarkData = report.benchmarkComparison.map((b) => ({
    metric: b.metric,
    thisTool: b.thisTool,
    industryAvg: b.industryAvg,
  }));
  const passCount = report.testCases.filter((t) => t.status === "pass").length;
  const partialCount = report.testCases.filter((t) => t.status === "partial").length;
  const failCount = report.testCases.filter((t) => t.status === "fail").length;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" /> {report.toolName} — Test Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <Card className="md:col-span-2">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-[10px] capitalize">{report.toolType.replace("-", " ")}</Badge>
                  <Badge variant="outline" className="text-[10px]">{formatDateTime(report.testedAt)}</Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-2">{report.toolUrl}</div>
                <p className="text-sm">{report.summary}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <ScoreRing score={report.overallScore} size={120} label="Overall" />
                <div className={`mt-2 text-2xl font-bold ${scoreColor(report.overallScore)}`}>
                  Grade {report.grade}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Test case summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <div>
                  <div className="text-2xl font-bold">{passCount}</div>
                  <div className="text-xs text-muted-foreground uppercase">Passed</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-amber-500" />
                <div>
                  <div className="text-2xl font-bold">{partialCount}</div>
                  <div className="text-xs text-muted-foreground uppercase">Partial</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <XCircle className="h-8 w-8 text-rose-500" />
                <div>
                  <div className="text-2xl font-bold">{failCount}</div>
                  <div className="text-xs text-muted-foreground uppercase">Failed</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category scores + radar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Category scores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.categories.map((c, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">{c.category}</span>
                      <span className={scoreColor(c.score)}>{c.score}/{c.maxScore}</span>
                    </div>
                    <Progress value={c.score} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Score profile</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="currentColor" strokeOpacity={0.15} />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: "currentColor", fillOpacity: 0.7 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "currentColor", fillOpacity: 0.5 }} />
                    <Radar dataKey="score" stroke="#0d9488" fill="#0d9488" fillOpacity={0.4} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Benchmark comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Benchmark comparison</CardTitle>
              <CardDescription>This tool vs. industry average</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={benchmarkData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                  <XAxis dataKey="metric" stroke="currentColor" strokeOpacity={0.4} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="currentColor" strokeOpacity={0.4} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="thisTool" name={report.toolName} fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="industryAvg" name="Industry avg" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Test cases */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Test case results</CardTitle>
              <CardDescription>{report.testCases.length} test cases executed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto scroll-thin">
              {report.testCases.map((tc) => {
                const Icon = tc.status === "pass" ? CheckCircle2 : tc.status === "partial" ? AlertCircle : XCircle;
                const color = tc.status === "pass" ? "text-emerald-500" : tc.status === "partial" ? "text-amber-500" : "text-rose-500";
                return (
                  <div key={tc.id} className="p-3 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                        <span className="text-sm font-medium truncate">{tc.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-[10px]">{tc.latencyMs}ms</Badge>
                        <Badge
                          variant={tc.status === "pass" ? "default" : tc.status === "partial" ? "secondary" : "destructive"}
                          className="text-[10px] capitalize"
                        >
                          {tc.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground ml-6 space-y-0.5">
                      <div><strong className="text-foreground">Prompt:</strong> {tc.prompt}</div>
                      <div><strong className="text-foreground">Expected:</strong> {tc.expectedBehavior}</div>
                      <div><strong className="text-foreground">Actual:</strong> {tc.actualBehavior}</div>
                      {tc.notes && <div className="italic">{tc.notes}</div>}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Strengths & weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm">
                  {report.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">+</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-rose-500" /> Weaknesses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm">
                  {report.weaknesses.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-rose-500 mt-0.5">−</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" /> Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {report.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <Badge
                    variant={r.priority === "high" ? "destructive" : r.priority === "medium" ? "default" : "secondary"}
                    className="text-[10px] mt-0.5"
                  >
                    {r.priority}
                  </Badge>
                  <div>
                    <div className="text-sm font-medium">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{r.description}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export
            </Button>
            <DialogClose asChild>
              <Button size="sm">Close</Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CoverageRow({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-7 w-7 rounded bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}

function normalizeReport(r: any, url: string): AiToolTestReport {
  const overallScore = clampNum(r.overallScore, 0, 100, 70);
  return {
    id: uid("atr"),
    toolName: r.toolName ?? "",
    toolUrl: r.toolUrl ?? url,
    toolType: r.toolType ?? "chatbot",
    testedAt: new Date().toISOString(),
    overallScore,
    grade: gradeFromScore(overallScore),
    summary: r.summary ?? "",
    categories: (r.categories ?? []).map((c: any) => ({
      category: c.category ?? "",
      score: clampNum(c.score, 0, 100, 70),
      maxScore: 100,
      findings: c.findings ?? [],
    })),
    testCases: (r.testCases ?? []).map((tc: any, i: number) => ({
      id: tc.id ?? `tc-${i + 1}`,
      name: tc.name ?? "",
      prompt: tc.prompt ?? "",
      expectedBehavior: tc.expectedBehavior ?? "",
      actualBehavior: tc.actualBehavior ?? "",
      status: tc.status ?? "partial",
      latencyMs: clampNum(tc.latencyMs, 0, 60000, 1500),
      notes: tc.notes ?? "",
    })),
    strengths: r.strengths ?? [],
    weaknesses: r.weaknesses ?? [],
    recommendations: (r.recommendations ?? []).map((rec: any) => ({
      title: rec.title ?? "",
      description: rec.description ?? "",
      priority: rec.priority ?? "medium",
    })),
    benchmarkComparison: (r.benchmarkComparison ?? []).map((b: any) => ({
      metric: b.metric ?? "",
      thisTool: clampNum(b.thisTool, 0, 100000, 0),
      industryAvg: clampNum(b.industryAvg, 0, 100000, 0),
      unit: b.unit ?? "",
    })),
  };
}

function clampNum(v: any, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function gradeFromScore(score: number): "A+" | "A" | "B" | "C" | "D" | "F" {
  if (score >= 95) return "A+";
  if (score >= 85) return "A";
  if (score >= 75) return "B";
  if (score >= 65) return "C";
  if (score >= 55) return "D";
  return "F";
}
