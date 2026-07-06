"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Bot,
  Activity,
  Target,
  Workflow,
  Clock,
  TrendingUp,
  Database,
} from "lucide-react";
import { useMarqai } from "@/lib/marqai/store";
import { canAccess } from "@/lib/marqai/rbac";

// ============================================================
// REPORTS MODULE
// ============================================================
// Surfaces QA coverage + AI health for every module built in the
// Marqai platform. Pulls data from /api/marqai/module-reports,
// which live-pings Z.AI to verify each AI-powered module is
// reachable and computes a per-module QA snapshot.
//
// Designed for QA analysts, eng leads, and admins to quickly
// answer: "What's the coverage? What's broken? What's at risk?"

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

interface ReportsData {
  ok: boolean;
  generatedAt: string;
  summary: {
    totalModules: number;
    aiPowered: number;
    aiWorking: number;
    aiFallback: number;
    avgFunctionalCoverage: number;
    totalOpenIssues: number;
    smokePassing: number;
    strategiesApplied: number;
    scenariosApplied: number;
  };
  reports: ModuleReport[];
  taxonomy: {
    strategies: { id: string; name: string; summary: string; when: string }[];
    methodologies: { id: string; name: string; summary: string; when: string }[];
    scenarios: { id: string; name: string; summary: string; when: string }[];
  };
}

export function ReportsModule() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const principal = useMarqai((s) => s.principal);
  const canManage = canAccess(principal, "reports", "manage") || principal?.kind === "super_admin";

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/marqai/module-reports");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to load reports");
      setData(json);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  if (loading) return <ReportsSkeleton />;
  if (error) return <ReportsError error={error} onRetry={fetchReports} />;
  if (!data) return null;

  const { summary, reports, taxonomy, generatedAt } = data;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <Card className="border-teal-200 bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:border-teal-900 dark:from-teal-950/40 dark:via-background dark:to-cyan-950/40">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl marqai-gradient flex items-center justify-center shadow-md shrink-0">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl mb-2">Module Reports</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  QA coverage, AI health, and smoke-test status for every module built in Marqai.
                  Reports are generated on-demand by live-pinging each AI endpoint and aggregating
                  the testing taxonomy defined in the AI Testing Methodologies module.
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchReports} className="shrink-0 gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Last generated: {new Date(generatedAt).toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* KPI SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          icon={Database}
          label="Total Modules"
          value={summary.totalModules}
          color="text-foreground"
        />
        <KpiCard
          icon={Bot}
          label="AI-Powered"
          value={summary.aiPowered}
          sub={`${summary.aiWorking} working · ${summary.aiFallback} fallback`}
          color="text-cyan-600"
        />
        <KpiCard
          icon={TrendingUp}
          label="Avg Coverage"
          value={`${summary.avgFunctionalCoverage}%`}
          color="text-emerald-600"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Smoke Passing"
          value={`${summary.smokePassing}/${summary.totalModules}`}
          color="text-teal-600"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Open Issues"
          value={summary.totalOpenIssues}
          color={summary.totalOpenIssues > 0 ? "text-amber-600" : "text-emerald-600"}
        />
        <KpiCard
          icon={Target}
          label="Tests Available"
          value={summary.strategiesApplied + summary.scenariosApplied}
          sub={`${summary.strategiesApplied} strategies + ${summary.scenariosApplied} AI scenarios`}
          color="text-violet-600"
        />
      </div>

      {/* MODULE TABLE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-teal-600" />
            Per-Module QA Report
          </CardTitle>
          <CardDescription>
            Functional coverage, AI integration status, smoke-test status, and applicable tests
            for every module in the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Module</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="min-w-[160px]">Functional Coverage</TableHead>
                  <TableHead>AI Status</TableHead>
                  <TableHead>Smoke</TableHead>
                  <TableHead className="text-right">Open Issues</TableHead>
                  <TableHead className="text-right">Strategies</TableHead>
                  <TableHead className="text-right">AI Scenarios</TableHead>
                  <TableHead className="min-w-[160px]">Last Tested</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.moduleId}>
                    <TableCell>
                      <div className="font-medium">{r.moduleName}</div>
                      <div className="text-xs text-muted-foreground">{r.notes}</div>
                    </TableCell>
                    <TableCell>
                      <CategoryBadge category={r.category} />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={r.functionalCoverage} className="h-2" />
                        <div className="text-xs text-muted-foreground">{r.functionalCoverage}%</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AiStatusBadge status={r.aiIntegrationStatus} />
                    </TableCell>
                    <TableCell>
                      <SmokeBadge status={r.smokeTestStatus} />
                    </TableCell>
                    <TableCell className="text-right">
                      {r.openIssues > 0 ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800">
                          {r.openIssues}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">{r.applicableStrategies.length}</TableCell>
                    <TableCell className="text-right text-sm">
                      {r.applicableScenarios.length > 0 ? r.applicableScenarios.length : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatRelative(r.lastTestedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* TAXONOMY SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TaxonomyCard
          title="Testing Strategies"
          icon={Target}
          accent="teal"
          items={taxonomy.strategies}
        />
        <TaxonomyCard
          title="Testing Methodologies"
          icon={Workflow}
          accent="violet"
          items={taxonomy.methodologies}
        />
        <TaxonomyCard
          title="AI Specific Scenarios"
          icon={Bot}
          accent="cyan"
          items={taxonomy.scenarios}
        />
      </div>

      {/* FOOTER NOTE */}
      {!canManage && (
        <Card className="border-muted bg-muted/30">
          <CardContent className="py-4 text-sm text-muted-foreground">
            You have view-only access to these reports. Contact an Org Owner or AI QA Analyst for
            manage-level permissions to regenerate or export reports.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function CategoryBadge({ category }: { category: ModuleReport["category"] }) {
  const map: Record<ModuleReport["category"], { cls: string; label: string }> = {
    "AI-powered": { cls: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800", label: "AI-Powered" },
    "Integration": { cls: "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800", label: "Integration" },
    "CRUD": { cls: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800", label: "CRUD" },
    "Informational": { cls: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800", label: "Informational" },
  };
  const { cls, label } = map[category];
  return <Badge variant="outline" className={`text-xs ${cls}`}>{label}</Badge>;
}

function AiStatusBadge({ status }: { status: ModuleReport["aiIntegrationStatus"] }) {
  const map: Record<ModuleReport["aiIntegrationStatus"], { cls: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
    "works": { cls: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800", label: "Works", icon: CheckCircle2 },
    "fallback": { cls: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800", label: "Fallback", icon: AlertTriangle },
    "broken": { cls: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800", label: "Broken", icon: XCircle },
    "n/a": { cls: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800", label: "N/A", icon: Activity },
  };
  const { cls, label, icon: Icon } = map[status];
  return (
    <Badge variant="outline" className={`text-xs gap-1 ${cls}`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function SmokeBadge({ status }: { status: ModuleReport["smokeTestStatus"] }) {
  const map: Record<ModuleReport["smokeTestStatus"], { cls: string; label: string }> = {
    "pass": { cls: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800", label: "Pass" },
    "fail": { cls: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800", label: "Fail" },
    "n/a": { cls: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800", label: "N/A" },
  };
  const { cls, label } = map[status];
  return <Badge variant="outline" className={`text-xs ${cls}`}>{label}</Badge>;
}

function TaxonomyCard({
  title,
  icon: Icon,
  accent,
  items,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "teal" | "violet" | "cyan";
  items: { id: string; name: string; summary: string; when: string }[];
}) {
  const accentClasses = {
    teal: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  }[accent];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-md flex items-center justify-center ${accentClasses}`}>
            <Icon className="h-4 w-4" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant="secondary" className="ml-auto">{items.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No items defined.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="text-sm">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium">{item.name}</span>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                    {item.when.replace("-", " ")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
        </CardHeader>
      </Card>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-5 pb-4">
              <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2" />
              <div className="h-8 w-12 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-teal-600" />
          Loading reports…
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
      <CardContent className="py-12 text-center">
        <XCircle className="h-10 w-10 mx-auto mb-3 text-red-500" />
        <h3 className="text-lg font-semibold mb-1">Failed to load reports</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================
// HELPERS
// ============================================================

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}
