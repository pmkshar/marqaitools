"use client";

import { useState, useMemo } from "react";
import { useMarqai } from "@/lib/marqai/store";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Search, FileText, ExternalLink, Printer } from "lucide-react";

// ============================================================
// DOC CATALOG
// ============================================================

interface DocMeta {
  slug: string;
  title: string;
  audience: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  // Body is rendered as JSX (we keep it in-app to avoid runtime markdown deps).
  body: React.ReactNode;
}

import { FunctionalDoc } from "./wiki-docs/functional";
import { TechnicalDoc } from "./wiki-docs/technical";
import { DeveloperDoc } from "./wiki-docs/developer";
import { UserSopDoc } from "./wiki-docs/user-sop";
import { RolesDoc } from "./wiki-docs/roles";
import { BillingDoc } from "./wiki-docs/billing";
import { ApiReferenceDoc } from "./wiki-docs/api-reference";
import { SalesAgentsManualDoc } from "./wiki-docs/sales-agents-manual";

const DOCS: DocMeta[] = [
  {
    slug: "functional",
    title: "Functional Documentation",
    audience: "Product · Founders · QA · CS",
    description: "What Marqai does — modules, journeys, business rules, acceptance criteria.",
    icon: FileText,
    color: "emerald",
    body: <FunctionalDoc />,
  },
  {
    slug: "technical",
    title: "Technical Documentation",
    audience: "Engineering · DevOps · SRE · Security",
    description: "Architecture, data model, security, deployment topology, observability.",
    icon: FileText,
    color: "teal",
    body: <TechnicalDoc />,
  },
  {
    slug: "developer",
    title: "Developer Documentation",
    audience: "Engineers joining the project",
    description: "Setup, repo layout, conventions, RBAC integration, adding a new module.",
    icon: FileText,
    color: "cyan",
    body: <DeveloperDoc />,
  },
  {
    slug: "user-sop",
    title: "User SOPs",
    audience: "End users · Marketing teams",
    description: "Step-by-step playbooks for every workflow in Marqai.",
    icon: FileText,
    color: "amber",
    body: <UserSopDoc />,
  },
  {
    slug: "roles",
    title: "Role-wise Documentation",
    audience: "Every Marqai user",
    description: "What each role can and cannot do, plus a typical day in the role.",
    icon: FileText,
    color: "violet",
    body: <RolesDoc />,
  },
  {
    slug: "billing",
    title: "Billing & Subscription Guide",
    audience: "Org Owners · Finance · CS",
    description: "Plans, trials, upgrades, downgrades, refunds, overages, taxes.",
    icon: FileText,
    color: "rose",
    body: <BillingDoc />,
  },
  {
    slug: "api-reference",
    title: "API Reference",
    audience: "Backend engineers",
    description: "Endpoints, request/response shapes, error codes, webhooks.",
    icon: FileText,
    color: "slate",
    body: <ApiReferenceDoc />,
  },
  {
    slug: "sales-agents-manual",
    title: "AI Sales Agents — Manual",
    audience: "Sales · RevOps · Founders · AEs",
    description:
      "How to use the AI Sales Agents module — six agents, five methodologies, automation, advantages, and a full lead-to-close worked example.",
    icon: FileText,
    color: "violet",
    body: <SalesAgentsManualDoc />,
  },
];

const COLOR_MAP: Record<string, string> = {
  emerald: "bg-emerald-500",
  teal: "bg-teal-500",
  cyan: "bg-cyan-500",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
  rose: "bg-rose-500",
  slate: "bg-slate-500",
};

export function WikiModule() {
  const [activeSlug, setActiveSlug] = useState<string>("functional");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return DOCS;
    const q = search.toLowerCase();
    return DOCS.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.audience.toLowerCase().includes(q),
    );
  }, [search]);

  const active = DOCS.find((d) => d.slug === activeSlug) ?? DOCS[0];

  return (
    <div className="space-y-6">
      {/* ---------- HEADER ---------- */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="h-5 w-5 text-emerald-600" />
          <h2 className="text-2xl font-bold">Wiki / Documentation</h2>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Functional, technical, developer, user SOP, role-wise, billing, and API documentation — all in one place.
        </p>
      </div>

      {/* ---------- LAYOUT ---------- */}
      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* ---------- LEFT NAV ---------- */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search docs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          <nav className="space-y-1">
            {filtered.map((doc) => {
              const isActive = doc.slug === activeSlug;
              const Icon = doc.icon;
              return (
                <button
                  key={doc.slug}
                  onClick={() => setActiveSlug(doc.slug)}
                  className={`w-full flex items-start gap-3 rounded-lg p-2.5 text-left transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className={`h-7 w-7 rounded-md ${COLOR_MAP[doc.color]} text-white flex items-center justify-center shrink-0`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{doc.title}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{doc.audience}</div>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-4">No docs match your search.</div>
            )}
          </nav>

          <Card className="bg-muted/40">
            <CardContent className="p-3 text-xs">
              <div className="font-medium mb-1">External links</div>
              <a
                href="https://github.com/pmkshar/marqaitools"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-emerald-600 hover:underline"
              >
                <ExternalLink className="h-3 w-3" /> GitHub repo
              </a>
            </CardContent>
          </Card>
        </div>

        {/* ---------- RIGHT CONTENT ---------- */}
        <Card className="min-h-[60vh]">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start justify-between mb-6 pb-4 border-b">
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-lg ${COLOR_MAP[active.color]} text-white flex items-center justify-center shrink-0`}>
                  <active.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{active.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{active.description}</p>
                  <Badge variant="outline" className="mt-2 text-[10px]">Audience: {active.audience}</Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-3.5 w-3.5 mr-1.5" /> Print
              </Button>
            </div>

            <div className="prose prose-sm max-w-none dark:prose-invert">{active.body}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Local Button import (avoids hoisting issues)
import { Button } from "@/components/ui/button";
