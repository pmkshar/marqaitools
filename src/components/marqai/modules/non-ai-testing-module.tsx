"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ClipboardList,
  Search,
  Boxes,
  Layers,
  FileBarChart,
  CheckCircle2,
  Clock,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Bug,
} from "lucide-react";
import { useMarqai } from "@/lib/marqai/store";
import {
  NON_AI_TESTING_STRATEGIES,
  NON_AI_TESTING_METHODOLOGIES,
  QA_REPORTS_ARTIFACTS,
  type TestingCategory,
  type TestingItem,
} from "@/lib/marqai/testing-taxonomy";

// ============================================================
// NON-AI TESTING METHODOLOGIES MODULE
// ============================================================
// Separate QA playbook for any NON-AI software product — web apps,
// mobile apps, desktop apps, APIs, e-commerce sites, ERP/CRM,
// billing platforms, games, IoT firmware, etc. Three pillars:
//
//   1. Non-AI Testing Strategies    — WHAT to test (coverage types)
//   2. Non-AI Testing Methodologies — HOW to test (process models)
//   3. QA Reports & Artifacts       — deliverables produced by QA
//
// Kept intentionally SEPARATE from the AI Testing Methodologies
// module so users testing traditional software aren't drowned in
// AI-specific items. Bugs found via these methodologies are logged
// in the Bug Tracker module.

const WHEN_LABELS: Record<TestingItem["when"], string> = {
  "pre-deploy": "Pre-Deploy",
  "post-deploy": "Post-Deploy",
  "per-release": "Per-Release",
  "continuous": "Continuous",
  "per-sprint": "Per-Sprint",
};

const WHEN_COLORS: Record<TestingItem["when"], string> = {
  "pre-deploy": "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  "post-deploy": "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  "per-release": "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
  "continuous": "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  "per-sprint": "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800",
};

function totalItems(): number {
  return (
    NON_AI_TESTING_STRATEGIES.items.length +
    NON_AI_TESTING_METHODOLOGIES.items.length +
    QA_REPORTS_ARTIFACTS.items.length
  );
}

export function NonAiTestingModule() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("non-ai-strategies");
  const setActiveModule = useMarqai((s) => s.setActiveModule);

  const filteredStrategies = useMemo(() => filterItems(NON_AI_TESTING_STRATEGIES, query), [query]);
  const filteredMethodologies = useMemo(() => filterItems(NON_AI_TESTING_METHODOLOGIES, query), [query]);
  const filteredQaReports = useMemo(() => filterItems(QA_REPORTS_ARTIFACTS, query), [query]);

  return (
    <div className="space-y-6">
      {/* HERO */}
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 via-white to-rose-50 dark:border-amber-900 dark:from-amber-950/40 dark:via-background dark:to-rose-950/40">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center shadow-md shrink-0">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">Non-AI Testing Methodologies</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                A complete QA playbook for testing <strong>any non-AI software product</strong> —
                web apps, mobile apps, desktop apps, APIs, e-commerce sites, ERP/CRM systems,
                billing platforms, games, IoT firmware. Three pillars —{" "}
                <strong>Non-AI Testing Strategies</strong> (what to test),{" "}
                <strong>Non-AI Testing Methodologies</strong> (how to test), and{" "}
                <strong>QA Reports &amp; Artifacts</strong> (deliverables produced) — together let
                you thoroughly test any traditional software and produce audit-ready QA reports.
              </CardDescription>
              <p className="text-xs text-muted-foreground mt-3">
                Testing <strong>AI software</strong>? Use the separate{" "}
                <strong>&ldquo;AI Testing Methodologies&rdquo;</strong> module. Found a bug?{" "}
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs underline"
                  onClick={() => setActiveModule("bug-tracker")}
                >
                  Log it in the Bug Tracker →
                </Button>
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <StatCard icon={Boxes} label="Non-AI Strategies" value={NON_AI_TESTING_STRATEGIES.items.length} color="text-amber-600" />
            <StatCard icon={Layers} label="Non-AI Methods" value={NON_AI_TESTING_METHODOLOGIES.items.length} color="text-rose-600" />
            <StatCard icon={FileBarChart} label="QA Reports" value={QA_REPORTS_ARTIFACTS.items.length} color="text-emerald-600" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>
              <strong>{totalItems()}</strong> non-AI tests across three pillars — the most
              comprehensive non-AI QA playbook in Marqai.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search non-AI tests, examples, or pass criteria…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-11"
        />
      </div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="non-ai-strategies" className="flex items-center gap-1.5 py-2 text-xs">
            <Boxes className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Non-AI Strategies</span>
            <Badge variant="secondary" className="ml-1">{filteredStrategies.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="non-ai-methodologies" className="flex items-center gap-1.5 py-2 text-xs">
            <Layers className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Non-AI Methods</span>
            <Badge variant="secondary" className="ml-1">{filteredMethodologies.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="qa-reports" className="flex items-center gap-1.5 py-2 text-xs">
            <FileBarChart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">QA Reports</span>
            <Badge variant="secondary" className="ml-1">{filteredQaReports.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="non-ai-strategies" className="mt-4">
          <CategoryBlock
            category={NON_AI_TESTING_STRATEGIES}
            filteredItems={filteredStrategies}
            icon={Boxes}
            accent="amber"
          />
        </TabsContent>

        <TabsContent value="non-ai-methodologies" className="mt-4">
          <CategoryBlock
            category={NON_AI_TESTING_METHODOLOGIES}
            filteredItems={filteredMethodologies}
            icon={Layers}
            accent="rose"
          />
        </TabsContent>

        <TabsContent value="qa-reports" className="mt-4">
          <CategoryBlock
            category={QA_REPORTS_ARTIFACTS}
            filteredItems={filteredQaReports}
            icon={FileBarChart}
            accent="emerald"
          />
        </TabsContent>
      </Tabs>

      {/* FOOTER CTA — log a bug */}
      <Card className="border-dashed">
        <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center shrink-0">
              <Bug className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <h4 className="font-semibold">Found a defect using one of these methodologies?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Log it in the Bug Tracker — every bug is linked back to the methodology that
                surfaced it, so QA coverage reports stay accurate.
              </p>
            </div>
          </div>
          <Button onClick={() => setActiveModule("bug-tracker")}>
            <Bug className="h-4 w-4 mr-1.5" /> Open Bug Tracker
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <Icon className={`h-6 w-6 mx-auto mb-2 ${color}`} />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

function CategoryBlock({
  category,
  filteredItems,
  icon: Icon,
  accent,
}: {
  category: TestingCategory;
  filteredItems: TestingItem[];
  icon: React.ComponentType<{ className?: string }>;
  accent: "amber" | "rose" | "emerald";
}) {
  const accentClasses = {
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  }[accent];

  return (
    <div className="space-y-4">
      {/* Category overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${accentClasses}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{category.name}</CardTitle>
              <CardDescription className="text-sm leading-relaxed mt-1">{category.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Items as accordion */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No items match your search.
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-3">
          {filteredItems.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="border rounded-lg px-4 bg-card hover:bg-accent/30 transition-colors"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-start gap-3 text-left flex-1 pr-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-base">{item.name}</span>
                      <Badge variant="outline" className={`text-[10px] uppercase tracking-wider border ${WHEN_COLORS[item.when]}`}>
                        <Clock className="h-3 w-3 mr-1" />
                        {WHEN_LABELS[item.when]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-2 space-y-4">
                {/* Description */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5" />
                    Description
                  </h4>
                  <p className="text-sm leading-relaxed">{item.description}</p>
                </div>

                {/* Examples */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Examples
                  </h4>
                  <ul className="space-y-1.5">
                    {item.examples.map((ex, idx) => (
                      <li key={idx} className="text-sm pl-4 border-l-2 border-amber-200 dark:border-amber-800 leading-relaxed">
                        {ex}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pass criteria */}
                <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Pass Criteria
                  </h4>
                  <p className="text-sm leading-relaxed text-emerald-900 dark:text-emerald-100">{item.passCriteria}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function filterItems(category: TestingCategory, query: string): TestingItem[] {
  if (!query.trim()) return category.items;
  const q = query.toLowerCase();
  return category.items.filter((item) => {
    return (
      item.name.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.examples.some((ex) => ex.toLowerCase().includes(q)) ||
      item.passCriteria.toLowerCase().includes(q)
    );
  });
}
