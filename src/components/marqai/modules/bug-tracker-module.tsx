"use client";

import { useState, useMemo } from "react";
import { useMarqai } from "@/lib/marqai/store";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Bug, Plus, Search, AlertTriangle, CheckCircle2,
  User, MessageSquare, Activity, FileBarChart,
  Boxes, Layers, Bot, Target, Workflow, Shield, Trash2,
} from "lucide-react";
import type {
  Bug as BugType, BugSeverity, BugPriority, BugStatus, BugResolution,
  BugProductType, BugComment,
} from "@/lib/marqai/types";
// Note: `BugType` is the type alias imported above. We do not declare a
// local `BugType` symbol here — it would shadow the import. The lucide
// `Bug` icon is the only value-level `Bug` in this file.
import { uid, formatDateTime } from "@/lib/marqai/utils";
import { KpiCard } from "../kpi-card";
import {
  TESTING_STRATEGIES, TESTING_METHODOLOGIES, AI_TEST_SCENARIOS,
  NON_AI_TESTING_STRATEGIES, NON_AI_TESTING_METHODOLOGIES,
  QA_REPORTS_ARTIFACTS,
} from "@/lib/marqai/testing-taxonomy";

// ============================================================
// BUG TRACKER MODULE — Bugzilla-style defect tracker
// ============================================================
// A complete issue tracker for BOTH AI and non-AI product testing.
// Every bug is linked to:
//   - a product type (AI or non-AI)
//   - a specific testing methodology that surfaced it
//   - (optionally) a specific test case id from the taxonomy
//
// Developers get RBAC-gated access for debugging. Reports break
// down bugs methodology-wise so QA leads can see exactly which
// methodologies are catching the most defects.

// ---------- Constants ----------

const SEVERITY_META: Record<BugSeverity, { label: string; color: string; bg: string }> = {
  blocker:   { label: "Blocker",   color: "text-rose-700 dark:text-rose-300",     bg: "bg-rose-100 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800" },
  critical:  { label: "Critical",  color: "text-rose-700 dark:text-rose-300",     bg: "bg-rose-100 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800" },
  major:     { label: "Major",     color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-100 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800" },
  normal:    { label: "Normal",    color: "text-amber-700 dark:text-amber-300",   bg: "bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800" },
  minor:     { label: "Minor",     color: "text-blue-700 dark:text-blue-300",     bg: "bg-blue-100 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800" },
  trivial:   { label: "Trivial",   color: "text-slate-700 dark:text-slate-300",   bg: "bg-slate-100 dark:bg-slate-900/40 border-slate-300 dark:border-slate-700" },
};

const PRIORITY_META: Record<BugPriority, { label: string; color: string }> = {
  P0: { label: "P0", color: "text-rose-600" },
  P1: { label: "P1", color: "text-orange-600" },
  P2: { label: "P2", color: "text-amber-600" },
  P3: { label: "P3", color: "text-blue-600" },
  P4: { label: "P4", color: "text-slate-600" },
};

const STATUS_META: Record<BugStatus, { label: string; color: string; bg: string }> = {
  unconfirmed:  { label: "Unconfirmed",  color: "text-slate-700 dark:text-slate-300",   bg: "bg-slate-100 dark:bg-slate-900/40 border-slate-300 dark:border-slate-700" },
  new:          { label: "New",          color: "text-blue-700 dark:text-blue-300",     bg: "bg-blue-100 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800" },
  assigned:     { label: "Assigned",     color: "text-violet-700 dark:text-violet-300", bg: "bg-violet-100 dark:bg-violet-950/40 border-violet-300 dark:border-violet-800" },
  in_progress:  { label: "In Progress",  color: "text-amber-700 dark:text-amber-300",   bg: "bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800" },
  fixed:        { label: "Fixed",        color: "text-teal-700 dark:text-teal-300",     bg: "bg-teal-100 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800" },
  verified:     { label: "Verified",     color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800" },
  reopened:     { label: "Reopened",     color: "text-rose-700 dark:text-rose-300",     bg: "bg-rose-100 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800" },
  closed:       { label: "Closed",       color: "text-slate-700 dark:text-slate-300",   bg: "bg-slate-100 dark:bg-slate-900/40 border-slate-300 dark:border-slate-700" },
  wont_fix:     { label: "Wont Fix",     color: "text-slate-700 dark:text-slate-300",   bg: "bg-slate-100 dark:bg-slate-900/40 border-slate-300 dark:border-slate-700" },
  duplicate:    { label: "Duplicate",    color: "text-slate-700 dark:text-slate-300",   bg: "bg-slate-100 dark:bg-slate-900/40 border-slate-300 dark:border-slate-700" },
};

const RESOLUTION_LABELS: Record<BugResolution, string> = {
  open: "Open",
  fixed: "Fixed",
  duplicate: "Duplicate",
  wont_fix: "Won't Fix",
  works_as_designed: "Works as Designed",
  cannot_reproduce: "Cannot Reproduce",
  invalid: "Invalid",
};

// Local type alias for the 6-pillar methodology categories used in bug-tracker.
type NonAiCat = "ai-strategies" | "ai-methodologies" | "ai-scenarios" | "non-ai-strategies" | "non-ai-methodologies" | "qa-reports";

// All methodologies flattened for the methodology picker.
const ALL_METHODOLOGIES: { id: string; name: string; category: NonAiCat; categoryName: string }[] = [
  ...TESTING_STRATEGIES.items.map((i) => ({ id: i.id, name: i.name, category: "ai-strategies" as const, categoryName: "AI Strategies" })),
  ...TESTING_METHODOLOGIES.items.map((i) => ({ id: i.id, name: i.name, category: "ai-methodologies" as const, categoryName: "AI Methodologies" })),
  ...AI_TEST_SCENARIOS.items.map((i) => ({ id: i.id, name: i.name, category: "ai-scenarios" as const, categoryName: "AI Scenarios" })),
  ...NON_AI_TESTING_STRATEGIES.items.map((i) => ({ id: i.id, name: i.name, category: "non-ai-strategies" as const, categoryName: "Non-AI Strategies" })),
  ...NON_AI_TESTING_METHODOLOGIES.items.map((i) => ({ id: i.id, name: i.name, category: "non-ai-methodologies" as const, categoryName: "Non-AI Methods" })),
  ...QA_REPORTS_ARTIFACTS.items.map((i) => ({ id: i.id, name: i.name, category: "qa-reports" as const, categoryName: "QA Reports" })),
];

// ============================================================
// Main module
// ============================================================

export function BugTrackerModule() {
  const bugs = useMarqai((s) => s.bugs);
  const principal = useMarqai((s) => s.principal);
  const [tab, setTab] = useState<string>("list");
  const [search, setSearch] = useState("");
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // ----- derived stats -----
  const openBugs = bugs.filter((b) => !["closed", "wont_fix", "duplicate"].includes(b.status));
  const criticalBugs = bugs.filter((b) => b.severity === "blocker" || b.severity === "critical").filter((b) => !["closed", "wont_fix", "duplicate"].includes(b.status));
  const fixedThisMonth = bugs.filter((b) => b.status === "closed" || b.status === "verified").filter((b) => b.closedAt && new Date(b.closedAt).getMonth() === new Date().getMonth());
  const unassignedBugs = openBugs.filter((b) => !b.assigneeUserId);

  // ----- filtered list -----
  const filteredBugs = useMemo(() => {
    if (!search.trim()) return bugs;
    const q = search.toLowerCase();
    return bugs.filter((b) =>
      b.displayId.toLowerCase().includes(q) ||
      b.title.toLowerCase().includes(q) ||
      b.module.toLowerCase().includes(q) ||
      b.tags.some((t) => t.toLowerCase().includes(q)) ||
      (b.assigneeName ?? "").toLowerCase().includes(q)
    );
  }, [bugs, search]);

  const selectedBug = bugs.find((b) => b.id === selectedBugId) ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bug className="h-7 w-7 text-rose-600" />
            Bug Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bugzilla-style defect tracker for <strong>both AI and non-AI</strong> tool testing.
            Every bug is linked to the testing methodology that surfaced it — reports break
            down methodology-wise so QA leads can see coverage at a glance.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Bug
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Open Bugs" value={openBugs.length} icon={Bug} accent="rose" />
        <KpiCard label="Critical / Blocker" value={criticalBugs.length} icon={AlertTriangle} accent="amber" />
        <KpiCard label="Unassigned" value={unassignedBugs.length} icon={User} accent="violet" />
        <KpiCard label="Closed This Month" value={fixedThisMonth.length} icon={CheckCircle2} accent="emerald" />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="list" className="flex items-center gap-1.5 py-2">
            <Bug className="h-3.5 w-3.5" /> Bug List
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-1.5 py-2">
            <FileBarChart className="h-3.5 w-3.5" /> Methodology Reports
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-1.5 py-2">
            <Activity className="h-3.5 w-3.5" /> Activity Log
          </TabsTrigger>
          <TabsTrigger value="triage" className="flex items-center gap-1.5 py-2">
            <Shield className="h-3.5 w-3.5" /> Triage Board
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <BugListTab
            bugs={filteredBugs}
            search={search}
            onSearch={setSearch}
            onSelect={(id) => { setSelectedBugId(id); }}
            canManage={!!principal && (principal.kind === "super_admin" || !!principal.permissions?.["bug-tracker"] && principal.permissions["bug-tracker"] !== "none" && principal.permissions["bug-tracker"] !== "view")}
          />
        </TabsContent>

        <TabsContent value="reports">
          <MethodologyReportsTab bugs={bugs} />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityLogTab bugs={bugs} />
        </TabsContent>

        <TabsContent value="triage">
          <TriageBoardTab bugs={bugs} onSelect={(id) => setSelectedBugId(id)} />
        </TabsContent>
      </Tabs>

      {/* Bug detail dialog */}
      {selectedBug && (
        <BugDetailDialog
          bug={selectedBug}
          onClose={() => setSelectedBugId(null)}
          canManage={!!principal && (principal.kind === "super_admin" || !!principal.permissions?.["bug-tracker"] && principal.permissions["bug-tracker"] !== "none" && principal.permissions["bug-tracker"] !== "view")}
          actorName={principal?.name ?? "Unknown"}
          actorRole={principal?.roleName}
        />
      )}

      {/* Create dialog */}
      {showCreate && (
        <CreateBugDialog
          onClose={() => setShowCreate(false)}
          reporterName={principal?.name ?? "Unknown"}
          reporterUserId={principal?.userId ?? "anonymous"}
          nextDisplayId={`BUG-${1000 + bugs.length + 1}`}
        />
      )}
    </div>
  );
}

// ============================================================
// Tab 1: Bug List
// ============================================================

function BugListTab({
  bugs, search, onSearch, onSelect, canManage,
}: {
  bugs: BugType[];
  search: string;
  onSearch: (s: string) => void;
  onSelect: (id: string) => void;
  canManage: boolean;
}) {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterProduct, setFilterProduct] = useState<string>("all");

  const filtered = useMemo(() => {
    return bugs
      .filter((b) => filterStatus === "all" || b.status === filterStatus)
      .filter((b) => filterSeverity === "all" || b.severity === filterSeverity)
      .filter((b) => filterProduct === "all" || b.productType === filterProduct)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [bugs, filterStatus, filterSeverity, filterProduct]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, title, module, tag, assignee…"
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select value={filterProduct} onValueChange={setFilterProduct}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Product" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="ai">AI Tools</SelectItem>
                <SelectItem value="non-ai">Non-AI Tools</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {(Object.keys(STATUS_META) as BugStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Severity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {(Object.keys(SEVERITY_META) as BugSeverity[]).map((s) => (
                  <SelectItem key={s} value={s}>{SEVERITY_META[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Bug className="h-10 w-10 mx-auto mb-2 opacity-30" />
              No bugs match your filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">ID</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead className="w-24">Product</TableHead>
                  <TableHead className="w-24">Severity</TableHead>
                  <TableHead className="w-16">Priority</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-40">Assignee</TableHead>
                  <TableHead className="w-32">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => {
                  const sev = SEVERITY_META[b.severity];
                  const pri = PRIORITY_META[b.priority];
                  const st = STATUS_META[b.status];
                  return (
                    <TableRow
                      key={b.id}
                      onClick={() => onSelect(b.id)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell className="font-mono text-xs font-medium">{b.displayId}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm line-clamp-1">{b.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                          <span>{b.module}</span>
                          {b.tags.slice(0, 2).map((t) => (
                            <Badge key={t} variant="outline" className="text-[10px] py-0 px-1.5">{t}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={b.productType === "ai" ? "text-cyan-700 dark:text-cyan-300 border-cyan-300" : "text-amber-700 dark:text-amber-300 border-amber-300"}>
                          {b.productType === "ai" ? "AI" : "Non-AI"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded border ${sev.bg} ${sev.color}`}>
                          {sev.label}
                        </span>
                      </TableCell>
                      <TableCell className={`text-xs font-bold ${pri.color}`}>{pri.label}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded border ${st.bg} ${st.color}`}>{st.label}</span>
                      </TableCell>
                      <TableCell className="text-xs">{b.assigneeName ?? <span className="text-muted-foreground italic">Unassigned</span>}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDateTime(b.updatedAt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {!canManage && (
        <p className="text-xs text-muted-foreground text-center">
          Read-only access. Ask an admin to grant execute permission to log or update bugs.
        </p>
      )}
    </div>
  );
}

// ============================================================
// Tab 2: Methodology Reports — bugs broken down methodology-wise
// ============================================================

function MethodologyReportsTab({ bugs }: { bugs: BugType[] }) {
  // Group bugs by methodology category
  const categoryBuckets: { category: NonAiCat; label: string; icon: React.ComponentType<{ className?: string }>; accent: string; bugs: BugType[] }[] = [
    { category: "ai-strategies",        label: "AI Testing Strategies",      icon: Target,      accent: "teal",    bugs: bugs.filter((b) => b.methodologyCategory === "ai-strategies") },
    { category: "ai-methodologies",     label: "AI Testing Methodologies",   icon: Workflow,    accent: "violet",  bugs: bugs.filter((b) => b.methodologyCategory === "ai-methodologies") },
    { category: "ai-scenarios",         label: "AI Specific Scenarios",      icon: Bot,         accent: "cyan",    bugs: bugs.filter((b) => b.methodologyCategory === "ai-scenarios") },
    { category: "non-ai-strategies",    label: "Non-AI Testing Strategies",  icon: Boxes,       accent: "amber",   bugs: bugs.filter((b) => b.methodologyCategory === "non-ai-strategies") },
    { category: "non-ai-methodologies", label: "Non-AI Testing Methods",     icon: Layers,      accent: "rose",    bugs: bugs.filter((b) => b.methodologyCategory === "non-ai-methodologies") },
    { category: "qa-reports",           label: "QA Reports & Artifacts",     icon: FileBarChart, accent: "emerald", bugs: bugs.filter((b) => b.methodologyCategory === "qa-reports") },
  ];

  // Detailed methodology-id breakdown within each category
  const methodBreakdown = (cat: NonAiCat) => {
    const source = (
      cat === "ai-strategies" ? TESTING_STRATEGIES :
      cat === "ai-methodologies" ? TESTING_METHODOLOGIES :
      cat === "ai-scenarios" ? AI_TEST_SCENARIOS :
      cat === "non-ai-strategies" ? NON_AI_TESTING_STRATEGIES :
      cat === "non-ai-methodologies" ? NON_AI_TESTING_METHODOLOGIES :
      QA_REPORTS_ARTIFACTS
    );
    return source.items.map((m) => {
      const linked = bugs.filter((b) => b.methodologyId === m.id);
      return {
        id: m.id,
        name: m.name,
        total: linked.length,
        open: linked.filter((b) => !["closed", "wont_fix", "duplicate"].includes(b.status)).length,
        closed: linked.filter((b) => ["closed", "verified"].includes(b.status)).length,
        critical: linked.filter((b) => b.severity === "blocker" || b.severity === "critical").length,
        bugs: linked,
      };
    }).filter((m) => m.total > 0);
  };

  const accentBg: Record<string, string> = {
    teal: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  };

  // Summary stats
  const totalBugs = bugs.length;
  const totalOpen = bugs.filter((b) => !["closed", "wont_fix", "duplicate"].includes(b.status)).length;
  const totalClosed = bugs.filter((b) => ["closed", "verified"].includes(b.status)).length;
  const aiBugs = bugs.filter((b) => b.productType === "ai").length;
  const nonAiBugs = bugs.filter((b) => b.productType === "non-ai").length;

  return (
    <div className="space-y-4">
      {/* Summary KPIs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-rose-600" />
            Methodology-Wise Bug Reports
          </CardTitle>
          <CardDescription>
            Every bug is linked to the testing methodology that surfaced it. The report below
            shows — for each of the 6 methodology pillars — how many bugs were found, how many
            are still open, how many are critical, and a per-methodology drill-down. Use this
            to identify which methodologies are catching the most defects (high signal) and
            which are catching none (coverage gap).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <SummaryStat label="Total Bugs" value={totalBugs} color="text-rose-600" />
            <SummaryStat label="Open" value={totalOpen} color="text-amber-600" />
            <SummaryStat label="Closed / Verified" value={totalClosed} color="text-emerald-600" />
            <SummaryStat label="AI Tool Bugs" value={aiBugs} color="text-cyan-600" />
            <SummaryStat label="Non-AI Tool Bugs" value={nonAiBugs} color="text-violet-600" />
          </div>
        </CardContent>
      </Card>

      {/* Per-category breakdown */}
      {categoryBuckets.map((bucket) => {
        const Icon = bucket.icon;
        const breakdown = methodBreakdown(bucket.category);
        return (
          <Card key={bucket.category}>
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${accentBg[bucket.accent]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {bucket.label}
                    <Badge variant="secondary">{bucket.bugs.length} bugs</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {bucket.bugs.filter((b) => !["closed", "wont_fix", "duplicate"].includes(b.status)).length} open ·{" "}
                    {bucket.bugs.filter((b) => b.severity === "blocker" || b.severity === "critical").length} critical/blocker ·{" "}
                    {bucket.bugs.filter((b) => ["closed", "verified"].includes(b.status)).length} closed
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {breakdown.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No bugs logged against any methodology in this pillar yet. Run tests using
                  these methodologies to start surfacing defects.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-2/3">Methodology</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Open</TableHead>
                      <TableHead className="text-center">Closed</TableHead>
                      <TableHead className="text-center">Critical</TableHead>
                      <TableHead className="w-24 text-center">% Closed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {breakdown.map((m) => {
                      const pctClosed = m.total ? Math.round((m.closed / m.total) * 100) : 0;
                      return (
                        <TableRow key={m.id}>
                          <TableCell>
                            <div className="font-medium text-sm">{m.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{m.id}</div>
                          </TableCell>
                          <TableCell className="text-center font-semibold">{m.total}</TableCell>
                          <TableCell className="text-center">
                            <span className={m.open > 0 ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                              {m.open}
                            </span>
                          </TableCell>
                          <TableCell className="text-center text-emerald-600 font-medium">{m.closed}</TableCell>
                          <TableCell className="text-center">
                            <span className={m.critical > 0 ? "text-rose-600 font-bold" : "text-muted-foreground"}>
                              {m.critical}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={pctClosed} className="h-2" />
                              <span className="text-xs w-8 text-right">{pctClosed}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function SummaryStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

// ============================================================
// Tab 3: Activity Log — full audit trail
// ============================================================

function ActivityLogTab({ bugs }: { bugs: BugType[] }) {
  const events = useMemo(() => {
    const all: { bugId: string; displayId: string; title: string; action: string; actor: string; timestamp: string; changeKind?: string }[] = [];
    for (const b of bugs) {
      for (const c of b.comments) {
        all.push({
          bugId: b.id,
          displayId: b.displayId,
          title: b.title,
          action: c.changeKind ? c.body : `Comment: ${c.body.slice(0, 80)}${c.body.length > 80 ? "…" : ""}`,
          actor: c.authorName,
          timestamp: c.createdAt,
          changeKind: c.changeKind,
        });
      }
    }
    return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [bugs]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-violet-600" />
          Activity Log
        </CardTitle>
        <CardDescription>
          Full audit trail of every bug change (status, severity, priority, assignee, resolution)
          and comment across all bugs — newest first. Useful for compliance, retrospectives,
          and SLA tracking.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">No activity yet.</div>
        ) : (
          <ol className="space-y-3">
            {events.slice(0, 100).map((e, idx) => (
              <li key={idx} className="flex items-start gap-3 pb-3 border-b last:border-0">
                <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
                  <Activity className="h-4 w-4 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    <span className="font-mono text-xs font-medium text-violet-700 dark:text-violet-300">{e.displayId}</span>
                    {" — "}
                    <span className="font-medium">{e.actor}</span>
                    {" "}
                    <span className="text-muted-foreground">{e.action}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{formatDateTime(e.timestamp)}</div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Tab 4: Triage Board — Kanban by status
// ============================================================

function TriageBoardTab({
  bugs, onSelect,
}: {
  bugs: BugType[];
  onSelect: (id: string) => void;
}) {
  const columns: { status: BugStatus; label: string; accent: string }[] = [
    { status: "new",         label: "New",          accent: "border-blue-300" },
    { status: "assigned",    label: "Assigned",     accent: "border-violet-300" },
    { status: "in_progress", label: "In Progress",  accent: "border-amber-300" },
    { status: "fixed",       label: "Fixed",        accent: "border-teal-300" },
    { status: "verified",    label: "Verified",     accent: "border-emerald-300" },
    { status: "closed",      label: "Closed",       accent: "border-slate-300" },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            Triage Board
          </CardTitle>
          <CardDescription>
            Kanban-style view of bugs by status. Click any card to open the bug detail.
            Use this in your daily standup to walk the board and triage.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {columns.map((col) => {
          const colBugs = bugs.filter((b) => b.status === col.status);
          return (
            <div key={col.status} className={`rounded-lg border-t-4 ${col.accent} bg-card overflow-hidden`}>
              <div className="p-3 border-b bg-muted/40">
                <div className="font-semibold text-sm flex items-center justify-between">
                  {col.label}
                  <Badge variant="secondary" className="text-[10px]">{colBugs.length}</Badge>
                </div>
              </div>
              <div className="p-2 space-y-2 max-h-96 overflow-y-auto scroll-thin">
                {colBugs.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-6">No bugs</p>
                ) : colBugs.map((b) => {
                  const sev = SEVERITY_META[b.severity];
                  return (
                    <button
                      key={b.id}
                      onClick={() => onSelect(b.id)}
                      className="w-full text-left rounded-md border bg-background p-2 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] font-medium text-muted-foreground">{b.displayId}</span>
                        <span className={`text-[10px] px-1.5 py-0 rounded ${sev.bg} ${sev.color}`}>{sev.label}</span>
                      </div>
                      <div className="text-xs font-medium line-clamp-2">{b.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-1 flex items-center justify-between">
                        <span>{b.module}</span>
                        <span className={PRIORITY_META[b.priority].color}>{PRIORITY_META[b.priority].label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Bug Detail Dialog
// ============================================================

function BugDetailDialog({
  bug, onClose, canManage, actorName, actorRole,
}: {
  bug: BugType;
  onClose: () => void;
  canManage: boolean;
  actorName: string;
  actorRole?: string;
}) {
  const updateBug = useMarqai((s) => s.updateBug);
  const deleteBug = useMarqai((s) => s.deleteBug);
  const setBugStatus = useMarqai((s) => s.setBugStatus);
  const setBugSeverity = useMarqai((s) => s.setBugSeverity);
  const setBugPriority = useMarqai((s) => s.setBugPriority);
  const setBugResolution = useMarqai((s) => s.setBugResolution);
  const assignBug = useMarqai((s) => s.assignBug);
  const addBugComment = useMarqai((s) => s.addBugComment);
  const teamMembers = useMarqai((s) => s.teamMembers);

  const [newComment, setNewComment] = useState("");

  const methodology = bug.methodologyId
    ? ALL_METHODOLOGIES.find((m) => m.id === bug.methodologyId)
    : null;

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const c: BugComment = {
      id: uid("c"),
      authorName: actorName,
      authorRole: actorRole,
      body: newComment.trim(),
      createdAt: new Date().toISOString(),
    };
    addBugComment(bug.id, c);
    setNewComment("");
    toast.success("Comment added");
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-violet-700 dark:text-violet-300">{bug.displayId}</span>
            <DialogTitle className="text-lg">{bug.title}</DialogTitle>
          </div>
          <DialogDescription>
            Reported by <strong>{bug.reporterName}</strong> on {formatDateTime(bug.createdAt)} ·
            Last updated {formatDateTime(bug.updatedAt)}
          </DialogDescription>
        </DialogHeader>

        {/* Meta row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 border-y">
          <MetaField label="Product">
            <Badge variant="outline" className={bug.productType === "ai" ? "text-cyan-700 dark:text-cyan-300 border-cyan-300" : "text-amber-700 dark:text-amber-300 border-amber-300"}>
              {bug.productType === "ai" ? "AI Tool" : "Non-AI Tool"}
            </Badge>
          </MetaField>
          <MetaField label="Module">
            <span className="text-sm font-medium">{bug.module}</span>
          </MetaField>
          <MetaField label="Environment">
            <span className="text-sm">{bug.environment}{bug.environmentDetails ? ` · ${bug.environmentDetails}` : ""}</span>
          </MetaField>
          <MetaField label="Methodology">
            {methodology ? (
              <Badge variant="outline" className="text-[10px]">
                {methodology.categoryName} · {methodology.name}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground italic">Not linked</span>
            )}
          </MetaField>

          <MetaField label="Severity">
            {canManage ? (
              <Select value={bug.severity} onValueChange={(v) => setBugSeverity(bug.id, v as BugSeverity, actorName, actorRole)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(SEVERITY_META) as BugSeverity[]).map((s) => (
                    <SelectItem key={s} value={s}>{SEVERITY_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className={`text-xs px-2 py-0.5 rounded border ${SEVERITY_META[bug.severity].bg} ${SEVERITY_META[bug.severity].color}`}>
                {SEVERITY_META[bug.severity].label}
              </span>
            )}
          </MetaField>
          <MetaField label="Priority">
            {canManage ? (
              <Select value={bug.priority} onValueChange={(v) => setBugPriority(bug.id, v as BugPriority, actorName, actorRole)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_META) as BugPriority[]).map((p) => (
                    <SelectItem key={p} value={p}>{PRIORITY_META[p].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className={`text-sm font-bold ${PRIORITY_META[bug.priority].color}`}>{PRIORITY_META[bug.priority].label}</span>
            )}
          </MetaField>
          <MetaField label="Status">
            {canManage ? (
              <Select value={bug.status} onValueChange={(v) => setBugStatus(bug.id, v as BugStatus, actorName, actorRole)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_META) as BugStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_META[bug.status].bg} ${STATUS_META[bug.status].color}`}>
                {STATUS_META[bug.status].label}
              </span>
            )}
          </MetaField>
          <MetaField label="Resolution">
            {canManage ? (
              <Select value={bug.resolution} onValueChange={(v) => setBugResolution(bug.id, v as BugResolution, actorName, actorRole)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(RESOLUTION_LABELS) as BugResolution[]).map((r) => (
                    <SelectItem key={r} value={r}>{RESOLUTION_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm">{RESOLUTION_LABELS[bug.resolution]}</span>
            )}
          </MetaField>

          <MetaField label="Assignee">
            {canManage ? (
              <Select
                value={bug.assigneeUserId ?? "unassigned"}
                onValueChange={(v) => {
                  const tm = teamMembers.find((m) => m.userId === v);
                  if (tm) assignBug(bug.id, tm.userId, tm.name, actorName, actorRole);
                }}
              >
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>{m.name} · {m.roleName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm">{bug.assigneeName ?? <span className="text-muted-foreground italic">Unassigned</span>}</span>
            )}
          </MetaField>
          <MetaField label="Tags">
            <div className="flex flex-wrap gap-1">
              {bug.tags.map((t) => (
                <Badge key={t} variant="outline" className="text-[10px] py-0 px-1.5">{t}</Badge>
              ))}
            </div>
          </MetaField>
          {bug.externalIssueUrl && (
            <MetaField label="External">
              <a href={bug.externalIssueUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                {bug.externalIssueUrl}
              </a>
            </MetaField>
          )}
        </div>

        {/* Description + repro */}
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Description</h4>
            <p className="text-sm leading-relaxed">{bug.description}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Repro Steps</h4>
              <ol className="list-decimal pl-5 space-y-1 text-sm">
                {bug.reproSteps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-1.5">Expected</h4>
                <p className="text-sm leading-relaxed">{bug.expectedBehavior}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300 mb-1.5">Actual</h4>
                <p className="text-sm leading-relaxed">{bug.actualBehavior}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Comments &amp; History ({bug.comments.length})
          </h4>
          <div className="space-y-2 max-h-72 overflow-y-auto scroll-thin pr-1">
            {bug.comments.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No comments yet.</p>
            ) : bug.comments.map((c) => (
              <div key={c.id} className="rounded-md border p-2.5 bg-muted/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{c.authorName}{c.authorRole ? <span className="text-muted-foreground font-normal"> · {c.authorRole}</span> : null}</span>
                  <span className="text-[10px] text-muted-foreground">{formatDateTime(c.createdAt)}</span>
                </div>
                <p className={`text-sm ${c.changeKind ? "italic text-muted-foreground" : ""}`}>{c.body}</p>
              </div>
            ))}
          </div>

          {canManage && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Add a comment…"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Add Comment
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex items-center justify-between">
          {canManage ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              onClick={() => {
                if (confirm(`Delete ${bug.displayId}? This cannot be undone.`)) {
                  deleteBug(bug.id);
                  toast.success("Bug deleted");
                  onClose();
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
            </Button>
          ) : <span />}
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

// ============================================================
// Create Bug Dialog
// ============================================================

function CreateBugDialog({
  onClose, reporterName, reporterUserId, nextDisplayId,
}: {
  onClose: () => void;
  reporterName: string;
  reporterUserId: string;
  nextDisplayId: string;
}) {
  const addBug = useMarqai((s) => s.addBug);
  const teamMembers = useMarqai((s) => s.teamMembers);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reproStepsRaw, setReproStepsRaw] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [actualBehavior, setActualBehavior] = useState("");
  const [productType, setProductType] = useState<BugProductType>("ai");
  const [module, setModule] = useState("");
  const [environment, setEnvironment] = useState<BugType["environment"]>("production");
  const [environmentDetails, setEnvironmentDetails] = useState("");
  const [methodologyId, setMethodologyId] = useState<string>("");
  const [severity, setSeverity] = useState<BugSeverity>("normal");
  const [priority, setPriority] = useState<BugPriority>("P2");
  const [assigneeUserId, setAssigneeUserId] = useState<string>("");
  const [tagsRaw, setTagsRaw] = useState("");

  const handleCreate = () => {
    if (!title.trim() || !description.trim() || !module.trim()) {
      toast.error("Title, description, and module are required");
      return;
    }
    const methodology = methodologyId ? ALL_METHODOLOGIES.find((m) => m.id === methodologyId) : null;
    const assignee = assigneeUserId ? teamMembers.find((m) => m.userId === assigneeUserId) : null;
    const now = new Date().toISOString();
    const newBug: BugType = {
      id: uid("bug"),
      displayId: nextDisplayId,
      title: title.trim(),
      description: description.trim(),
      reproSteps: reproStepsRaw.split("\n").map((s) => s.trim()).filter(Boolean),
      expectedBehavior: expectedBehavior.trim(),
      actualBehavior: actualBehavior.trim(),
      productType,
      module: module.trim(),
      environment,
      environmentDetails: environmentDetails.trim() || undefined,
      methodologyId: methodology?.id,
      methodologyCategory: methodology?.category,
      severity,
      priority,
      status: assignee ? "assigned" : "new",
      resolution: "open",
      assigneeUserId: assignee?.userId,
      assigneeName: assignee?.name,
      reporterUserId,
      reporterName,
      tags: tagsRaw.split(",").map((t) => t.trim()).filter(Boolean),
      comments: [],
      attachments: [],
      createdAt: now,
      updatedAt: now,
    };
    addBug(newBug);
    toast.success(`Bug ${nextDisplayId} created`);
    onClose();
  };

  // Filter methodologies by product type
  const visibleMethodologies = ALL_METHODOLOGIES.filter((m) => {
    if (productType === "ai") return m.category.startsWith("ai-") || m.category === "qa-reports";
    return m.category.startsWith("non-ai-") || m.category === "qa-reports";
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-rose-600" />
            New Bug · <span className="font-mono text-sm text-violet-700 dark:text-violet-300">{nextDisplayId}</span>
          </DialogTitle>
          <DialogDescription>
            Report a defect found via AI or non-AI testing. Link it to the methodology that surfaced it
            so QA coverage reports stay accurate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short, specific summary of the defect" />
          </div>

          {/* Description */}
          <div>
            <Label>Description *</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What's wrong? Include any context that helps reproduction." />
          </div>

          {/* Repro + Expected + Actual */}
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Repro Steps (one per line)</Label>
              <Textarea value={reproStepsRaw} onChange={(e) => setReproStepsRaw(e.target.value)} rows={5} placeholder={"Step 1…\nStep 2…\nStep 3…"} />
            </div>
            <div className="space-y-3">
              <div>
                <Label>Expected Behavior</Label>
                <Textarea value={expectedBehavior} onChange={(e) => setExpectedBehavior(e.target.value)} rows={2} />
              </div>
              <div>
                <Label>Actual Behavior</Label>
                <Textarea value={actualBehavior} onChange={(e) => setActualBehavior(e.target.value)} rows={2} />
              </div>
            </div>
          </div>

          {/* Product + module + environment */}
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <Label>Product Type *</Label>
              <Select value={productType} onValueChange={(v) => { setProductType(v as BugProductType); setMethodologyId(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai">AI Tool</SelectItem>
                  <SelectItem value="non-ai">Non-AI Tool</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Module / Product Name *</Label>
              <Input value={module} onChange={(e) => setModule(e.target.value)} placeholder="e.g. AI Sales Agents" />
            </div>
            <div>
              <Label>Environment</Label>
              <Select value={environment} onValueChange={(v) => setEnvironment(v as BugType["environment"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dev">Dev</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="uat">UAT</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Environment Details (browser / OS / device)</Label>
            <Input value={environmentDetails} onChange={(e) => setEnvironmentDetails(e.target.value)} placeholder="e.g. Chrome 126 / macOS 14" />
          </div>

          {/* Methodology link */}
          <div>
            <Label>Methodology that surfaced this bug</Label>
            <Select value={methodologyId} onValueChange={setMethodologyId}>
              <SelectTrigger><SelectValue placeholder="Link to a methodology from the QA playbook…" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {visibleMethodologies.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="text-xs text-muted-foreground mr-1">[{m.categoryName}]</span> {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Severity + Priority + Assignee */}
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <Label>Severity</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as BugSeverity)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(SEVERITY_META) as BugSeverity[]).map((s) => (
                    <SelectItem key={s} value={s}>{SEVERITY_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as BugPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_META) as BugPriority[]).map((p) => (
                    <SelectItem key={p} value={p}>{PRIORITY_META[p].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assignee</Label>
              <Select value={assigneeUserId} onValueChange={setAssigneeUserId}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>{m.name} · {m.roleName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags (comma-separated)</Label>
            <Input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="e.g. ai-output-validation, qualifier, json-parse" />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1.5" /> Create Bug
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
