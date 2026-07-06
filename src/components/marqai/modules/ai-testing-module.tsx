"use client";

import { useState, useEffect } from "react";
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
import { ShoppingCart } from "lucide-react";
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
  BookOpen,
  ClipboardList,
  RefreshCw,
} from "lucide-react";
import type { AiToolTestReport } from "@/lib/marqai/types";
import { formatDateTime, scoreColor, uid } from "@/lib/marqai/utils";
import {
  TESTING_TAXONOMY,
  TOTAL_TESTING_ITEMS,
  type TestingCategory,
} from "@/lib/marqai/testing-taxonomy";
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
  { id: "ecommerce", label: "AI e-commerce tool", icon: ShoppingCart },
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
  { name: "Shopify Magic", url: "https://www.shopify.com/magic", type: "ecommerce" as const },
  { name: "Amazon Rufus", url: "https://www.amazon.com/rufus", type: "ecommerce" as const },
  { name: "Klarna Shopping", url: "https://www.klarna.com", type: "ecommerce" as const },
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
  const [activeReport, setActiveReport] = useState<AiToolTestReport | null>(null);

  async function runTest(overrides?: {
    toolName?: string;
    toolUrl?: string;
    toolType?: AiToolTestReport["toolType"];
  }) {
    const tn = overrides?.toolName ?? toolName;
    const tu = overrides?.toolUrl ?? toolUrl;
    const tt = overrides?.toolType ?? toolType;
    if (!tn.trim() || !tu.trim()) {
      toast.error("Tool name and URL are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/marqai/test-ai-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: tn.trim(),
          toolUrl: tu.trim(),
          toolType: tt,
          focusAreas,
          customTestCases,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const r: AiToolTestReport = normalizeReport(data.report, tu.trim());
      addReport(r);
      setActiveReport(r);
      toast.success(`Test complete — grade ${r.grade}`);
      setTimeout(() => {
        document
          .getElementById("active-report-panel")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Test failed");
    } finally {
      setLoading(false);
    }
  }

  async function retestFromReport(r: AiToolTestReport) {
    setToolName(r.toolName);
    setToolUrl(r.toolUrl);
    setToolType(r.toolType);
    await runTest({
      toolName: r.toolName,
      toolUrl: r.toolUrl,
      toolType: r.toolType,
    });
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

      <Tabs defaultValue="runner" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="runner" className="text-xs">
            <Play className="h-3.5 w-3.5 mr-1.5" /> Test Runner
          </TabsTrigger>
          <TabsTrigger value="playbook" className="text-xs">
            <BookOpen className="h-3.5 w-3.5 mr-1.5" /> Playbook
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs">
            <ClipboardList className="h-3.5 w-3.5 mr-1.5" /> Module Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="runner" className="space-y-6 mt-4">
          <TestRunnerTab
            reports={reports}
            addReport={addReport}
            toolName={toolName}
            setToolName={setToolName}
            toolUrl={toolUrl}
            setToolUrl={setToolUrl}
            toolType={toolType}
            setToolType={setToolType}
            focusAreas={focusAreas}
            setFocusAreas={setFocusAreas}
            customTestCases={customTestCases}
            setCustomTestCases={setCustomTestCases}
            loading={loading}
            setLoading={setLoading}
            activeReport={activeReport}
            setActiveReport={setActiveReport}
            runTest={runTest}
            retestFromReport={retestFromReport}
          />
        </TabsContent>

        <TabsContent value="playbook" className="mt-4">
          <TestingPlaybook />
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <ModuleReportsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// TAB 1: TEST RUNNER (existing tool testing UI, refactored)
// ============================================================
interface TestRunnerTabProps {
  reports: AiToolTestReport[];
  addReport: (r: AiToolTestReport) => void;
  toolName: string;
  setToolName: (v: string) => void;
  toolUrl: string;
  setToolUrl: (v: string) => void;
  toolType: AiToolTestReport["toolType"];
  setToolType: (v: AiToolTestReport["toolType"]) => void;
  focusAreas: string;
  setFocusAreas: (v: string) => void;
  customTestCases: string;
  setCustomTestCases: (v: string) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  activeReport: AiToolTestReport | null;
  setActiveReport: (r: AiToolTestReport | null) => void;
  runTest: (overrides?: {
    toolName?: string;
    toolUrl?: string;
    toolType?: AiToolTestReport["toolType"];
  }) => Promise<void>;
  retestFromReport: (r: AiToolTestReport) => Promise<void>;
}

function TestRunnerTab(props: TestRunnerTabProps) {
  const {
    reports, toolName, setToolName, toolUrl, setToolUrl,
    toolType, setToolType, focusAreas, setFocusAreas,
    customTestCases, setCustomTestCases, loading, runTest,
    activeReport, setActiveReport, retestFromReport,
  } = props;

  return (
    <>
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

            <Button onClick={() => runTest()} disabled={loading} size="lg" className="w-full">
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

      {/* Inline detailed report panel (replaces the old popup modal) */}
      {!loading && activeReport && (
        <div id="active-report-panel" className="scroll-mt-20">
          <InlineReport
            report={activeReport}
            onClose={() => setActiveReport(null)}
            onRetest={() => retestFromReport(activeReport)}
            retesting={loading}
          />
        </div>
      )}

      {/* History */}
      {!loading && reports.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" /> Test reports ({reports.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Click any past report to expand it inline above. Use “Re-test” to re-run the same tool anytime in the future.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {reports.map((r) => {
              const isActive = activeReport?.id === r.id;
              return (
                <div
                  key={r.id}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                    isActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                  }`}
                >
                  <button
                    onClick={() => setActiveReport(isActive ? null : r)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
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
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant={isActive ? "default" : "outline"}
                      className="h-7 px-2 text-[11px]"
                      onClick={() => setActiveReport(isActive ? null : r)}
                    >
                      {isActive ? "Showing" : "View"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => retestFromReport(r)}
                      disabled={loading}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" /> Re-test
                    </Button>
                  </div>
                </div>
              );
            })}
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
    </>
  );
}

// ============================================================
// TAB 2: TESTING PLAYBOOK — the 3-category taxonomy
// ============================================================
function TestingPlaybook() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Marqai AI Testing Playbook</h3>
              <p className="text-sm text-muted-foreground mt-1">
                A complete QA playbook for any AI platform, AI tool, or AI-powered software.
                {TOTAL_TESTING_ITEMS} items across 3 categories — apply these to test thoroughly
                and get the desired output reports.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {TESTING_TAXONOMY.map((cat) => (
              <div key={cat.id} className="rounded-lg border border-border p-3">
                <div className="text-2xl font-bold text-primary">{cat.items.length}</div>
                <div className="text-xs text-muted-foreground mt-1">{cat.name}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {TESTING_TAXONOMY.map((category) => (
        <TestingCategorySection key={category.id} category={category} />
      ))}
    </div>
  );
}

function TestingCategorySection({ category }: { category: TestingCategory }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const whenColors: Record<string, string> = {
    "pre-deploy": "bg-blue-100 text-blue-700",
    "post-deploy": "bg-emerald-100 text-emerald-700",
    "per-release": "bg-violet-100 text-violet-700",
    "per-sprint": "bg-amber-100 text-amber-700",
    "continuous": "bg-rose-100 text-rose-700",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {category.name}
          <Badge variant="secondary" className="text-[10px]">{category.items.length} items</Badge>
        </CardTitle>
        <CardDescription className="text-xs">{category.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {category.items.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div key={item.id} className="rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="w-full flex items-start gap-3 p-3 hover:bg-muted/40 transition-colors text-left"
              >
                <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{item.name}</span>
                    <Badge variant="outline" className={`text-[10px] ${whenColors[item.when] || ""}`}>
                      {item.when}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{item.summary}</div>
                </div>
              </button>
              {isOpen && (
                <div className="px-3 pb-3 pt-1 ml-9 space-y-3 text-xs">
                  <div>
                    <div className="font-medium text-foreground mb-1">Description</div>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                  <div>
                    <div className="font-medium text-foreground mb-1">Examples</div>
                    <ul className="space-y-1">
                      {item.examples.map((ex, i) => (
                        <li key={i} className="text-muted-foreground flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">→</span>
                          <span>{ex}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-md bg-emerald-50 border border-emerald-200 p-2">
                    <div className="font-medium text-emerald-900 mb-0.5">Pass criteria</div>
                    <p className="text-emerald-800">{item.passCriteria}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ============================================================
// TAB 3: MODULE REPORTS — per-module QA status
// ============================================================
interface ModuleReport {
  moduleId: string;
  moduleName: string;
  category: "AI-powered" | "Integration" | "CRUD" | "Informational";
  functionalCoverage: number;
  aiIntegrationStatus: "works" | "fallback" | "broken" | "n/a";
  smokeTestStatus: "pass" | "fail" | "n/a";
  lastTestedAt: string;
  openIssues: number;
  applicableStrategies: string[];
  applicableScenarios: string[];
  notes: string;
}

function ModuleReportsSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/marqai/module-reports");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load module reports");
    } finally {
      setLoading(false);
    }
  }

  // Auto-load on mount
  useEffect(() => {
    load();
  }, []);

  if (loading && !data) {
    return (
      <Card>
        <CardContent>
          <LoadingState message="Probing all 18 modules — running AI ping for each AI-powered module..." />
        </CardContent>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={AlertCircle}
            title="Failed to load module reports"
            description={error}
          />
          <Button onClick={load} variant="outline" size="sm" className="mt-2">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const summary = data.summary;
  const reports: ModuleReport[] = data.reports;

  const categoryColors: Record<string, string> = {
    "AI-powered": "bg-violet-100 text-violet-700",
    "Integration": "bg-blue-100 text-blue-700",
    "CRUD": "bg-emerald-100 text-emerald-700",
    "Informational": "bg-slate-100 text-slate-700",
  };

  const aiStatusColors: Record<string, string> = {
    "works": "bg-emerald-100 text-emerald-700",
    "fallback": "bg-amber-100 text-amber-700",
    "broken": "bg-rose-100 text-rose-700",
    "n/a": "bg-slate-100 text-slate-500",
  };

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total modules" value={summary.totalModules} icon={ClipboardList} accent="violet" />
        <KpiCard label="AI working" value={`${summary.aiWorking}/${summary.aiPowered}`} icon={CheckCircle2} accent="emerald" hint="live probe" />
        <KpiCard label="Avg functional coverage" value={`${summary.avgFunctionalCoverage}%`} icon={TrendingUp} accent="amber" />
        <KpiCard label="Open issues" value={summary.totalOpenIssues} icon={AlertCircle} accent="rose" />
      </div>

      {/* Taxonomy summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Testing taxonomy applied
          </CardTitle>
          <CardDescription className="text-xs">
            Every module is tested against this taxonomy. {TOTAL_TESTING_ITEMS} total items across 3 categories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-border p-3">
              <div className="text-2xl font-bold text-primary">{summary.strategiesApplied}</div>
              <div className="text-xs text-muted-foreground mt-1">Testing Strategies</div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="text-2xl font-bold text-primary">10</div>
              <div className="text-xs text-muted-foreground mt-1">Testing Methodologies</div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="text-2xl font-bold text-primary">{summary.scenariosApplied}</div>
              <div className="text-xs text-muted-foreground mt-1">AI Test Scenarios</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module report table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Per-module QA status ({reports.length})
            </CardTitle>
            <Button onClick={load} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Re-probing..." : "Re-probe"}
            </Button>
          </div>
          <CardDescription className="text-xs">
            Last probe: {data.generatedAt ? formatDateTime(data.generatedAt) : "—"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {reports.map((r) => (
            <div key={r.moduleId} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{r.moduleName}</span>
                    <Badge variant="outline" className={`text-[10px] ${categoryColors[r.category]}`}>
                      {r.category}
                    </Badge>
                    {r.smokeTestStatus === "pass" && (
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> smoke pass
                      </Badge>
                    )}
                    {r.openIssues > 0 && (
                      <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700">
                        {r.openIssues} open
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{r.notes}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.category === "AI-powered" && (
                    <Badge variant="outline" className={`text-[10px] ${aiStatusColors[r.aiIntegrationStatus]}`}>
                      AI: {r.aiIntegrationStatus}
                    </Badge>
                  )}
                  <div className="text-right">
                    <div className="text-sm font-semibold">{r.functionalCoverage}%</div>
                    <div className="text-[10px] text-muted-foreground">coverage</div>
                  </div>
                </div>
              </div>
              <div className="ml-0">
                <div className="flex items-center gap-2 mb-1">
                  <Progress value={r.functionalCoverage} className="h-1.5 flex-1" />
                </div>
                {(r.applicableStrategies.length > 0 || r.applicableScenarios.length > 0) && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {r.applicableStrategies.slice(0, 4).map((s) => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                        {s}
                      </span>
                    ))}
                    {r.applicableStrategies.length > 4 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-500">
                        +{r.applicableStrategies.length - 4} more
                      </span>
                    )}
                    {r.applicableScenarios.slice(0, 3).map((s) => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700">
                        {s}
                      </span>
                    ))}
                    {r.applicableScenarios.length > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-500">
                        +{r.applicableScenarios.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function InlineReport({
  report,
  onClose,
  onRetest,
  retesting,
}: {
  report: AiToolTestReport;
  onClose: () => void;
  onRetest: () => void;
  retesting: boolean;
}) {
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
    <Card className="border-primary/40 shadow-sm">
      <CardHeader className="pb-3 border-b border-border bg-muted/30">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FlaskConical className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                {report.toolName}
                <Badge variant="outline" className="text-[10px] capitalize">{report.toolType.replace("-", " ")}</Badge>
                <Badge variant="outline" className="text-[10px]">Grade {report.grade}</Badge>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5 truncate">
                {report.toolUrl} · Tested {formatDateTime(report.testedAt)}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="default" size="sm" onClick={onRetest} disabled={retesting}>
              {retesting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
              Re-test this tool
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 space-y-5">
        {/* Top summary row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <Card className="md:col-span-2">
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Summary</div>
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
            <CardDescription>
              {report.testCases.length} test cases executed
              {report.scenariosCovered && report.scenariosCovered.length > 0 && (
                <> · {report.scenariosCovered.length} AI scenarios covered</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[480px] overflow-y-auto scroll-thin">
            {report.testCases.map((tc) => {
              const Icon = tc.status === "pass" ? CheckCircle2 : tc.status === "partial" ? AlertCircle : XCircle;
              const color = tc.status === "pass" ? "text-emerald-500" : tc.status === "partial" ? "text-amber-500" : "text-rose-500";
              return (
                <div key={tc.id} className="p-3 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                      <span className="text-sm font-medium truncate">{tc.name}</span>
                      {tc.scenario && (
                        <Badge variant="outline" className="text-[10px] bg-violet-50 text-violet-700 shrink-0">
                          {tc.scenario}
                        </Badge>
                      )}
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

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Report persisted in your session history. Use “Re-test this tool” to re-run this exact configuration anytime.
          </p>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close report
          </Button>
        </div>
      </CardContent>
    </Card>
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
      scenario: tc.scenario ?? undefined,
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
    scenariosCovered: Array.isArray(r.scenariosCovered) ? r.scenariosCovered : [],
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
