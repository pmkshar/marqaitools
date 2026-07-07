"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ClipboardList,
  Search,
  Target,
  Workflow,
  Bot,
  CheckCircle2,
  Clock,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Boxes,
  FileBarChart,
  Layers,
} from "lucide-react";
import {
  TESTING_STRATEGIES,
  TESTING_METHODOLOGIES,
  AI_TEST_SCENARIOS,
  NON_AI_TESTING_STRATEGIES,
  NON_AI_TESTING_METHODOLOGIES,
  QA_REPORTS_ARTIFACTS,
  TESTING_TAXONOMY,
  type TestingCategory,
  type TestingItem,
} from "@/lib/marqai/testing-taxonomy";

// ============================================================
// QA PLAYBOOK MODULE — AI + NON-AI TESTING METHODOLOGIES
// ============================================================
// A comprehensive QA playbook that documents HOW to test ANY software
// product — AI-powered or not — plus the deliverables a QA team
// produces. Six pillars:
//   1. AI Testing Strategies       — WHAT to test (AI coverage types)
//   2. AI Testing Methodologies    — HOW to test (AI process models)
//   3. AI Specific Test Scenarios  — Concrete AI-focused test cases
//   4. Non-AI Testing Strategies   — WHAT to test (non-AI coverage)
//   5. Non-AI Testing Methodologies — HOW to test (non-AI process models)
//   6. QA Reports & Artifacts      — Deliverables produced by testing
//
// Use this playbook to thoroughly test any AI OR non-AI feature and
// produce the desired output reports. Sourced from the
// single-source-of-truth at src/lib/marqai/testing-taxonomy.ts.

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
  return TESTING_TAXONOMY.reduce((sum, c) => sum + c.items.length, 0);
}

export function AiTestingMethodologiesModule() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ai-strategies");

  const filteredAiStrategies = useMemo(() => filterItems(TESTING_STRATEGIES, query), [query]);
  const filteredAiMethodologies = useMemo(() => filterItems(TESTING_METHODOLOGIES, query), [query]);
  const filteredAiScenarios = useMemo(() => filterItems(AI_TEST_SCENARIOS, query), [query]);
  const filteredNaStrategies = useMemo(() => filterItems(NON_AI_TESTING_STRATEGIES, query), [query]);
  const filteredNaMethodologies = useMemo(() => filterItems(NON_AI_TESTING_METHODOLOGIES, query), [query]);
  const filteredQaReports = useMemo(() => filterItems(QA_REPORTS_ARTIFACTS, query), [query]);

  return (
    <div className="space-y-6">
      {/* HERO */}
      <Card className="border-teal-200 bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:border-teal-900 dark:from-teal-950/40 dark:via-background dark:to-cyan-950/40">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl marqai-gradient flex items-center justify-center shadow-md shrink-0">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">Testing Methodologies</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                A complete QA playbook for testing <strong>any software product</strong> —
                AI-powered or not. Six pillars — <strong>AI Strategies</strong> (what to test for AI),
                <strong> AI Methodologies</strong> (how to test AI),{" "}
                <strong>AI Scenarios</strong> (concrete AI test cases),{" "}
                <strong>Non-AI Strategies</strong> (what to test for traditional software),{" "}
                <strong>Non-AI Methodologies</strong> (how to test traditional software), and{" "}
                <strong>QA Reports &amp; Artifacts</strong> (deliverables produced) — together let
                you thoroughly test every feature and produce the desired output reports.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard icon={Target} label="AI Strategies" value={TESTING_STRATEGIES.items.length} color="text-teal-600" />
            <StatCard icon={Workflow} label="AI Methodologies" value={TESTING_METHODOLOGIES.items.length} color="text-violet-600" />
            <StatCard icon={Bot} label="AI Scenarios" value={AI_TEST_SCENARIOS.items.length} color="text-cyan-600" />
            <StatCard icon={Boxes} label="Non-AI Strategies" value={NON_AI_TESTING_STRATEGIES.items.length} color="text-amber-600" />
            <StatCard icon={Layers} label="Non-AI Methods" value={NON_AI_TESTING_METHODOLOGIES.items.length} color="text-rose-600" />
            <StatCard icon={FileBarChart} label="QA Reports" value={QA_REPORTS_ARTIFACTS.items.length} color="text-emerald-600" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>
              <strong>{totalItems()}</strong> total tests across all six pillars — the most
              comprehensive QA playbook in any Marqai module.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search all tests, examples, or pass criteria across AI + non-AI + QA reports…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-11"
        />
      </div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto">
          <TabsTrigger value="ai-strategies" className="flex items-center gap-1.5 py-2 text-xs">
            <Target className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">AI Strategies</span>
            <Badge variant="secondary" className="ml-1">{filteredAiStrategies.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="ai-methodologies" className="flex items-center gap-1.5 py-2 text-xs">
            <Workflow className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">AI Methods</span>
            <Badge variant="secondary" className="ml-1">{filteredAiMethodologies.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="ai-scenarios" className="flex items-center gap-1.5 py-2 text-xs">
            <Bot className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">AI Scenarios</span>
            <Badge variant="secondary" className="ml-1">{filteredAiScenarios.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="non-ai-strategies" className="flex items-center gap-1.5 py-2 text-xs">
            <Boxes className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Non-AI Strategies</span>
            <Badge variant="secondary" className="ml-1">{filteredNaStrategies.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="non-ai-methodologies" className="flex items-center gap-1.5 py-2 text-xs">
            <Layers className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Non-AI Methods</span>
            <Badge variant="secondary" className="ml-1">{filteredNaMethodologies.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="qa-reports" className="flex items-center gap-1.5 py-2 text-xs">
            <FileBarChart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">QA Reports</span>
            <Badge variant="secondary" className="ml-1">{filteredQaReports.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-strategies" className="mt-4">
          <CategoryBlock
            category={TESTING_STRATEGIES}
            filteredItems={filteredAiStrategies}
            icon={Target}
            accent="teal"
          />
        </TabsContent>

        <TabsContent value="ai-methodologies" className="mt-4">
          <CategoryBlock
            category={TESTING_METHODOLOGIES}
            filteredItems={filteredAiMethodologies}
            icon={Workflow}
            accent="violet"
          />
        </TabsContent>

        <TabsContent value="ai-scenarios" className="mt-4">
          <CategoryBlock
            category={AI_TEST_SCENARIOS}
            filteredItems={filteredAiScenarios}
            icon={Bot}
            accent="cyan"
          />
        </TabsContent>

        <TabsContent value="non-ai-strategies" className="mt-4">
          <CategoryBlock
            category={NON_AI_TESTING_STRATEGIES}
            filteredItems={filteredNaStrategies}
            icon={Boxes}
            accent="amber"
          />
        </TabsContent>

        <TabsContent value="non-ai-methodologies" className="mt-4">
          <CategoryBlock
            category={NON_AI_TESTING_METHODOLOGIES}
            filteredItems={filteredNaMethodologies}
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
    <div className="rounded-lg border bg-card p-3 text-center">
      <Icon className={`h-5 w-5 mx-auto mb-1.5 ${color}`} />
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</div>
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
  accent: "teal" | "violet" | "cyan" | "amber" | "rose" | "emerald";
}) {
  const accentClasses = {
    teal: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
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
                      <li key={idx} className="text-sm pl-4 border-l-2 border-teal-200 dark:border-teal-800 leading-relaxed">
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
