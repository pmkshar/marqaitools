"use client";

// ============================================================
// AI Sales Workflow — 4-stage outbound pipeline
// ------------------------------------------------------------
// Stage 1: scrape  → AI builds contact database from company
//                       website + LinkedIn URL (client confirms)
// Stage 2: intro   → AI drafts intro email; client approves;
//                       email "sent"
// Stage 3: followup→ AI drafts follow-up email + proposes
//                       meeting slots (online/offline); client
//                       picks a slot; meeting scheduled
// Stage 4: call    → AI simulates an automated confirmation
//                       call (script + prospect response);
//                       client updated with confirmation
// ============================================================

import { useState } from "react";
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2, Plus, Search, Trash2, Globe, Linkedin,
  Mail, Calendar, Phone, CheckCircle2, AlertTriangle,
  Database, Send, Clock, PhoneCall, RefreshCw,
  ChevronRight, User as UserIcon, Workflow,
} from "lucide-react";
import type {
  SalesWorkflowLead, SalesWorkflowStage, ScrapedContact,
  IntroEmailPayload, FollowupSchedulePayload, CallConfirmPayload,
  SalesAgent,
} from "@/lib/marqai/types";
import { uid, formatDateTime } from "@/lib/marqai/utils";
import { KpiCard } from "../kpi-card";

// ---------- Stage metadata ----------

const STAGE_ORDER: SalesWorkflowStage[] = [
  "scrape", "intro_email", "followup_schedule", "call_confirm", "done",
];

const STAGE_META: Record<SalesWorkflowStage, {
  label: string;
  short: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  description: string;
}> = {
  scrape: {
    label: "Build Contact Database",
    short: "Scrape",
    icon: Database,
    accent: "cyan",
    description: "AI scrapes the client's website + LinkedIn to build a list of decision-makers with emails and phone numbers.",
  },
  intro_email: {
    label: "Send Introductory Email",
    short: "Intro",
    icon: Mail,
    accent: "violet",
    description: "AI drafts a personalized intro email. After your confirmation, the email is sent to the selected contact.",
  },
  followup_schedule: {
    label: "Follow-up + Schedule Meeting",
    short: "Schedule",
    icon: Calendar,
    accent: "amber",
    description: "AI follows up on the intro email and proposes 3 meeting slots (online or offline). You pick one to lock it in.",
  },
  call_confirm: {
    label: "Automated Confirmation Call",
    short: "Call",
    icon: PhoneCall,
    accent: "rose",
    description: "AI places an automated call to confirm the meeting. The prospect's response is simulated and the client is updated with the outcome.",
  },
  done: {
    label: "Workflow Complete",
    short: "Done",
    icon: CheckCircle2,
    accent: "emerald",
    description: "All four stages complete. Meeting is confirmed and the client has been notified.",
  },
};

const ACCENT_CLASSES: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  cyan:    { bg: "bg-cyan-100 dark:bg-cyan-950/40",    text: "text-cyan-700 dark:text-cyan-300",    border: "border-cyan-300 dark:border-cyan-800",    gradient: "from-cyan-400 to-sky-600" },
  violet:  { bg: "bg-violet-100 dark:bg-violet-950/40", text: "text-violet-700 dark:text-violet-300", border: "border-violet-300 dark:border-violet-800", gradient: "from-violet-400 to-purple-600" },
  amber:   { bg: "bg-amber-100 dark:bg-amber-950/40",  text: "text-amber-700 dark:text-amber-300",  border: "border-amber-300 dark:border-amber-800",  gradient: "from-amber-400 to-orange-600" },
  rose:    { bg: "bg-rose-100 dark:bg-rose-950/40",    text: "text-rose-700 dark:text-rose-300",    border: "border-rose-300 dark:border-rose-800",    gradient: "from-rose-400 to-pink-600" },
  emerald: { bg: "bg-emerald-100 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-300 dark:border-emerald-800", gradient: "from-emerald-400 to-teal-600" },
};

function stageIndex(stage: SalesWorkflowStage): number {
  return STAGE_ORDER.indexOf(stage);
}

function progressPct(lead: SalesWorkflowLead): number {
  return Math.round((stageIndex(lead.stage) / (STAGE_ORDER.length - 1)) * 100);
}

// ============================================================
// Main tab component
// ============================================================

export function WorkflowTab() {
  const leads = useMarqai((s) => s.salesWorkflowLeads);
  const addSalesWorkflowLead = useMarqai((s) => s.addSalesWorkflowLead);
  const deleteSalesWorkflowLead = useMarqai((s) => s.deleteSalesWorkflowLead);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const filteredLeads = leads.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.displayId.toLowerCase().includes(q) ||
      l.companyName.toLowerCase().includes(q) ||
      l.agentName?.toLowerCase().includes(q) ||
      l.scrapedContacts.some((c) => c.contactName.toLowerCase().includes(q))
    );
  });

  const inProgress = leads.filter((l) => l.stage !== "done").length;
  const completed = leads.filter((l) => l.stage === "done").length;
  const meetingsScheduled = leads.filter((l) => l.followup?.selectedSlotId).length;
  const callsCompleted = leads.filter((l) => l.callStatus === "completed").length;

  const selectedLead = leads.find((l) => l.id === selectedLeadId) ?? null;

  return (
    <div className="space-y-4">
      {/* 4-step flow intro banner */}
      <Card className="border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50/80 via-white to-fuchsia-50/60 dark:from-violet-950/20 dark:via-background dark:to-fuchsia-950/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shrink-0">
              <Workflow className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-violet-900 dark:text-violet-200 flex items-center gap-2">
                AI Sales Agent — 4-Step Outbound Workflow
                <Badge variant="outline" className="text-[9px] uppercase tracking-wider border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300">New</Badge>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                The AI agent builds its own contact database, sends an intro email after your approval, follows up to schedule a meeting (online or offline), then places an automated confirmation call and updates you with the outcome.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-3">
                <FlowStep number={1} icon={Database} title="Build Database" desc="AI scrapes client website + LinkedIn for emails & phone numbers." accent="cyan" />
                <FlowStep number={2} icon={Mail} title="Intro Email" desc="AI drafts a personalized intro email — sent only after your approval." accent="violet" />
                <FlowStep number={3} icon={Calendar} title="Follow-up & Schedule" desc="AI follows up and proposes meeting slots (online or in-person)." accent="amber" />
                <FlowStep number={4} icon={PhoneCall} title="Call & Confirm" desc="AI places an automated call to confirm and updates you on the outcome." accent="rose" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="In Progress" value={inProgress} icon={RefreshCw} accent="amber" />
        <KpiCard label="Completed" value={completed} icon={CheckCircle2} accent="emerald" />
        <KpiCard label="Meetings Scheduled" value={meetingsScheduled} icon={Calendar} accent="violet" />
        <KpiCard label="Calls Completed" value={callsCompleted} icon={PhoneCall} accent="rose" />
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, company, agent, or contact name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button onClick={() => setShowCreate(true)} className="h-9 shrink-0">
            <Plus className="h-4 w-4 mr-1.5" /> New Workflow
          </Button>
        </CardContent>
      </Card>

      {/* Pipeline list */}
      {filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Database className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">
              No workflow runs yet. Click <strong>New Workflow</strong> to start the 4-stage outbound pipeline.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => (
            <PipelineLeadCard
              key={lead.id}
              lead={lead}
              onSelect={() => setSelectedLeadId(lead.id)}
              onDelete={() => {
                if (confirm(`Delete ${lead.displayId}? This cannot be undone.`)) {
                  deleteSalesWorkflowLead(lead.id);
                  toast.success("Workflow deleted");
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      {showCreate && (
        <CreateWorkflowDialog
          onClose={() => setShowCreate(false)}
          onCreate={(lead) => {
            addSalesWorkflowLead(lead);
            setSelectedLeadId(lead.id);
            setShowCreate(false);
            toast.success(`Workflow ${lead.displayId} created`);
          }}
          nextDisplayId={`WF-${1000 + leads.length + 1}`}
        />
      )}

      {/* Detail dialog */}
      {selectedLead && (
        <WorkflowDetailDialog
          lead={selectedLead}
          onClose={() => setSelectedLeadId(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// Pipeline card — one row in the workflow list
// ============================================================

function PipelineLeadCard({
  lead, onSelect, onDelete,
}: {
  lead: SalesWorkflowLead;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const pct = progressPct(lead);
  const currentMeta = STAGE_META[lead.stage];
  const CurrentIcon = currentMeta.icon;
  const selectedContact = lead.scrapedContacts.find((c) => c.id === lead.selectedContactId);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <button onClick={onSelect} className="flex-1 text-left min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-xs font-semibold text-violet-700 dark:text-violet-300">{lead.displayId}</span>
              <span className="font-medium text-sm">{lead.companyName}</span>
              <Badge variant="outline" className={`text-[10px] ${ACCENT_CLASSES[currentMeta.accent].text} ${ACCENT_CLASSES[currentMeta.accent].border}`}>
                <CurrentIcon className="h-3 w-3 mr-1" /> {currentMeta.short}
              </Badge>
              {lead.agentName && (
                <Badge variant="secondary" className="text-[10px]">
                  <UserIcon className="h-3 w-3 mr-1" /> {lead.agentName}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {selectedContact
                ? <>Contact: <strong>{selectedContact.contactName}</strong> ({selectedContact.contactTitle}) · {selectedContact.email}</>
                : lead.scrapedContacts.length > 0
                  ? `${lead.scrapedContacts.length} contacts scraped — awaiting selection`
                  : "Stage 1 pending — run scrape to build contact database"}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Progress value={pct} className="h-1.5 flex-1" />
              <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
            </div>
          </button>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={onSelect} className="h-8">
              Open <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Create Workflow dialog — stage 1 inputs
// ============================================================

function CreateWorkflowDialog({
  onClose, onCreate, nextDisplayId,
}: {
  onClose: () => void;
  onCreate: (lead: SalesWorkflowLead) => void;
  nextDisplayId: string;
}) {
  const salesAgents = useMarqai((s) => s.salesAgents);

  const [agentId, setAgentId] = useState<string>("");
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [productContext, setProductContext] = useState("");
  const [tone, setTone] = useState("Direct, specific, no fluff");

  const handleCreate = () => {
    if (!companyName.trim()) {
      toast.error("Company name is required");
      return;
    }
    const agent = salesAgents.find((a) => a.id === agentId);
    const now = new Date().toISOString();
    const lead: SalesWorkflowLead = {
      id: uid("wf"),
      displayId: nextDisplayId,
      agentId: agent?.id,
      agentName: agent?.name,
      companyName: companyName.trim(),
      website: website.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
      productContext: productContext.trim() || "(not specified)",
      tone: tone.trim() || "Direct, specific, no fluff",
      stage: "scrape",
      scrapeStatus: "pending",
      introEmailStatus: "pending",
      followupStatus: "pending",
      callStatus: "pending",
      scrapedContacts: [],
      stageHistory: [
        { stage: "scrape", status: "pending", timestamp: now, note: "Workflow created — awaiting scrape." },
      ],
      createdAt: now,
      updatedAt: now,
    };
    onCreate(lead);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl sm:max-w-2xl w-[96vw] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-violet-600" />
            New Sales Workflow · <span className="font-mono text-sm text-violet-700 dark:text-violet-300">{nextDisplayId}</span>
          </DialogTitle>
          <DialogDescription>
            Start the 4-stage outbound pipeline: scrape contacts → intro email → follow-up + schedule → confirmation call.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Agent picker (optional) */}
          <div>
            <Label>Sales Agent (optional)</Label>
            <Select value={agentId || "none"} onValueChange={setAgentId}>
              <SelectTrigger><SelectValue placeholder="Pick an agent to own this workflow…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No agent — manual</SelectItem>
                {salesAgents.filter((a) => a.active).map((a: SalesAgent) => (
                  <SelectItem key={a.id} value={a.id}>{a.name} · {a.type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Company + website + linkedin */}
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <Label>Company Name *</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Inc" />
            </div>
            <div>
              <Label>Website</Label>
              <div className="relative">
                <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="acme.com" className="pl-8" />
              </div>
            </div>
            <div>
              <Label>LinkedIn URL</Label>
              <div className="relative">
                <Linkedin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="linkedin.com/company/acme" className="pl-8" />
              </div>
            </div>
          </div>

          {/* Product context */}
          <div>
            <Label>What are we selling? (product context)</Label>
            <Textarea
              value={productContext}
              onChange={(e) => setProductContext(e.target.value)}
              rows={3}
              placeholder="e.g. Marqai — an AI marketing SaaS that helps B2B SaaS teams ship SEO + social + email campaigns 5x faster."
            />
          </div>

          {/* Tone */}
          <div>
            <Label>Tone</Label>
            <Input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="Direct, specific, no fluff" />
          </div>

          <div className="rounded-md border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 p-3 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5 inline mr-1.5" />
            <strong>Stage 1 — Live web scraping:</strong> The AI agent will actually fetch the company's website (homepage + /contact, /about, /team, /leadership pages) and run web searches for the company's leadership team, then extract real email addresses, phone numbers, and LinkedIn profiles from the live HTML. Each contact will show the source URL so you can verify it. If a company hides its team page, you'll see "no contacts found" — never invented data.
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleCreate}>
            <Database className="h-4 w-4 mr-1.5" /> Create & Start Scrape
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Workflow Detail Dialog — the big horizontal popup
// ============================================================

function WorkflowDetailDialog({
  lead, onClose,
}: {
  lead: SalesWorkflowLead;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-7xl sm:max-w-7xl w-[98vw] max-h-[94vh] gap-0 p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-3 border-b shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-semibold text-violet-700 dark:text-violet-300">{lead.displayId}</span>
            <DialogTitle className="text-lg leading-tight">{lead.companyName}</DialogTitle>
            <Badge variant="outline" className={ACCENT_CLASSES[STAGE_META[lead.stage].accent].text + " " + ACCENT_CLASSES[STAGE_META[lead.stage].accent].border}>
              {STAGE_META[lead.stage].label}
            </Badge>
          </div>
          <DialogDescription>
            Created {formatDateTime(lead.createdAt)} · Last updated {formatDateTime(lead.updatedAt)}
            {lead.agentName && <> · Agent: <strong>{lead.agentName}</strong></>}
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto scroll-thin p-5 space-y-5">
          {/* Stage progress strip */}
          <StageProgressStrip lead={lead} />

          {/* Stage 1: Scrape */}
          <ScrapeStageCard lead={lead} />

          {/* Stage 2: Intro Email */}
          <IntroEmailStageCard lead={lead} />

          {/* Stage 3: Follow-up + Schedule */}
          <FollowupScheduleStageCard lead={lead} />

          {/* Stage 4: Call Confirm */}
          <CallConfirmStageCard lead={lead} />

          {/* Audit trail */}
          <AuditTrailCard lead={lead} />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-muted/20 shrink-0 flex justify-end">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Stage progress strip — 5-step visual pipeline
// ============================================================

function StageProgressStrip({ lead }: { lead: SalesWorkflowLead }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {STAGE_ORDER.map((stage, idx) => {
        const meta = STAGE_META[stage];
        const Icon = meta.icon;
        const accent = ACCENT_CLASSES[meta.accent];
        const currentIdx = stageIndex(lead.stage);
        const isComplete = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isFuture = idx > currentIdx;
        return (
          <div key={stage} className="flex items-center shrink-0">
            <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${isComplete ? accent.bg + " " + accent.border : isCurrent ? "bg-background " + accent.border + " border-2" : "bg-muted/30 border-muted opacity-60"}`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center ${isComplete || isCurrent ? "bg-gradient-to-br " + accent.gradient + " text-white" : "bg-muted text-muted-foreground"}`}>
                {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <div className="hidden sm:block min-w-0">
                <div className={`text-xs font-semibold ${isComplete || isCurrent ? accent.text : "text-muted-foreground"}`}>
                  Stage {idx + 1}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">{meta.short}</div>
              </div>
            </div>
            {idx < STAGE_ORDER.length - 1 && (
              <ChevronRight className={`h-3.5 w-3.5 mx-0.5 ${isFuture ? "text-muted-foreground/40" : "text-muted-foreground"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Stage 1: Scrape
// ============================================================

function ScrapeStageCard({ lead }: { lead: SalesWorkflowLead }) {
  const setWorkflowScrapedContacts = useMarqai((s) => s.setWorkflowScrapedContacts);
  const toggleWorkflowContactConfirmed = useMarqai((s) => s.toggleWorkflowContactConfirmed);
  const selectWorkflowContact = useMarqai((s) => s.selectWorkflowContact);
  const [loading, setLoading] = useState(false);
  const [maxContacts, setMaxContacts] = useState("5");

  const meta = STAGE_META.scrape;
  const Icon = meta.icon;
  const accent = ACCENT_CLASSES[meta.accent];

  const runScrape = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/marqai/sales/scrape-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: lead.companyName,
          website: lead.website,
          linkedinUrl: lead.linkedinUrl,
          productContext: lead.productContext,
          maxContacts: parseInt(maxContacts, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Scrape failed");
      setWorkflowScrapedContacts(lead.id, data.contacts as ScrapedContact[]);
      const foundCount = data.contacts.length;
      const sourceCount = data.sources?.length ?? 0;
      toast.success(
        foundCount > 0
          ? `Live-scraped ${foundCount} contact${foundCount === 1 ? "" : "s"} from ${sourceCount} source${sourceCount === 1 ? "" : "s"}`
          : "Scrape complete — no contacts found",
        {
          description: data.evidenceSummary ?? data.warning,
        },
      );
    } catch (e) {
      toast.error("Scrape failed", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setLoading(false);
    }
  };

  const confirmedContacts = lead.scrapedContacts.filter((c) => c.clientConfirmed);

  return (
    <Card className={`border-l-4 ${accent.border}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${accent.bg}`}>
              <Icon className={`h-5 w-5 ${accent.text}`} />
            </div>
            <div>
              <CardTitle className="text-base">Stage 1 — {meta.label}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{meta.description}</CardDescription>
            </div>
          </div>
          <StageStatusBadge status={lead.scrapeStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Inputs summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <Field label="Company" value={lead.companyName} />
          <Field label="Website" value={lead.website ?? "—"} />
          <Field label="LinkedIn" value={lead.linkedinUrl ?? "—"} />
          <Field label="Product" value={lead.productContext.length > 40 ? lead.productContext.slice(0, 40) + "…" : lead.productContext} />
        </div>

        {/* Run scrape */}
        {lead.scrapeStatus === "pending" && (
          <div className="flex items-center gap-2 pt-1">
            <Select value={maxContacts} onValueChange={setMaxContacts}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[3, 4, 5, 6, 8].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} contacts</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={runScrape} disabled={loading} size="sm">
              {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Database className="h-3.5 w-3.5 mr-1.5" />}
              {loading ? "Scraping…" : "Scrape Contacts"}
            </Button>
          </div>
        )}

        {/* Scraped contacts list */}
        {lead.scrapedContacts.length > 0 && (
          <div className="rounded-md border">
            <div className="p-2 bg-muted/40 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Scraped Contacts ({lead.scrapedContacts.length})</span>
              <span className="text-[10px] font-normal normal-case text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3 inline mr-1" />
                Live-scraped from real web pages
              </span>
            </div>
            <div className="divide-y">
              {lead.scrapedContacts.map((c) => (
                <div key={c.id} className="p-3 flex items-start gap-3">
                  <button
                    onClick={() => toggleWorkflowContactConfirmed(lead.id, c.id)}
                    className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${c.clientConfirmed ? "bg-emerald-500 border-emerald-500 text-white" : "border-muted-foreground/30 hover:border-emerald-400"}`}
                    aria-label={c.clientConfirmed ? "Unconfirm" : "Confirm"}
                  >
                    {c.clientConfirmed && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{c.contactName}</span>
                      <Badge variant="outline" className="text-[10px]">{c.contactTitle}</Badge>
                      <ConfidenceBadge confidence={c.confidence} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email}</span>
                      {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</span>}
                      {c.linkedin && <span className="flex items-center gap-1"><Linkedin className="h-3 w-3" /> <a href={c.linkedin} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Profile</a></span>}
                    </div>
                    {c.relevanceNote && (
                      <p className="text-[11px] text-muted-foreground italic mt-1">{c.relevanceNote}</p>
                    )}
                    {c.sourceUrl && (
                      <p className="text-[10px] mt-1">
                        <Globe className="h-3 w-3 inline mr-1 text-muted-foreground" />
                        <span className="text-muted-foreground">Source: </span>
                        <a href={c.sourceUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate inline-block max-w-full align-bottom">
                          {c.sourceUrl.length > 70 ? c.sourceUrl.slice(0, 67) + "…" : c.sourceUrl}
                        </a>
                      </p>
                    )}
                  </div>
                  {lead.scrapeStatus === "awaiting_client" && c.clientConfirmed && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 shrink-0"
                      onClick={() => selectWorkflowContact(lead.id, c.id)}
                    >
                      Use this contact <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                  {lead.selectedContactId === c.id && (
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Selected
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hint when awaiting client */}
        {lead.scrapeStatus === "awaiting_client" && (
          <p className="text-xs text-amber-700 dark:text-amber-300 italic">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            Confirm at least one contact, then click <strong>Use this contact</strong> to advance to Stage 2 (Intro Email).
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Stage 2: Intro Email
// ============================================================

function IntroEmailStageCard({ lead }: { lead: SalesWorkflowLead }) {
  const setWorkflowIntroEmail = useMarqai((s) => s.setWorkflowIntroEmail);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<IntroEmailPayload | null>(null);

  const meta = STAGE_META.intro_email;
  const Icon = meta.icon;
  const accent = ACCENT_CLASSES[meta.accent];
  const contact = lead.scrapedContacts.find((c) => c.id === lead.selectedContactId);
  const isUnlocked = !!contact && stageIndex(lead.stage) >= 1;

  if (!contact) {
    return <LockedStageCard stage="intro_email" reason="Select a scraped contact in Stage 1 to unlock." />;
  }

  const generateAndSend = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/marqai/sales/intro-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: lead.companyName,
          contactName: contact.contactName,
          contactTitle: contact.contactTitle,
          productName: lead.productContext.split("—")[0].trim() || lead.companyName,
          productContext: lead.productContext,
          tone: lead.tone,
          agentName: lead.agentName,
          senderName: lead.agentName,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Intro email generation failed");
      setDraft({ subject: data.subject, body: data.body });
      toast.success("Intro email drafted", {
        description: data.source === "fallback" ? data.warning : "Review and approve to send.",
      });
    } catch (e) {
      toast.error("Failed to draft intro email", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setLoading(false);
    }
  };

  const approveAndSend = () => {
    if (!draft) return;
    setWorkflowIntroEmail(lead.id, draft);
    toast.success("Intro email sent", {
      description: `To: ${contact.email} · Subject: ${draft.subject}`,
    });
  };

  return (
    <Card className={`border-l-4 ${isUnlocked ? accent.border : "border-muted opacity-60"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${accent.bg}`}>
              <Icon className={`h-5 w-5 ${accent.text}`} />
            </div>
            <div>
              <CardTitle className="text-base">Stage 2 — {meta.label}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{meta.description}</CardDescription>
            </div>
          </div>
          <StageStatusBadge status={lead.introEmailStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Contact summary */}
        <div className="rounded-md border bg-muted/20 p-2.5 text-xs">
          <span className="text-muted-foreground">To:</span>{" "}
          <strong>{contact.contactName}</strong> ({contact.contactTitle}) ·{" "}
          <span className="font-mono">{contact.email}</span>
        </div>

        {/* Generate button */}
        {!lead.introEmail && !draft && (
          <Button onClick={generateAndSend} disabled={loading || !isUnlocked} size="sm">
            {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Mail className="h-3.5 w-3.5 mr-1.5" />}
            {loading ? "Drafting…" : "Draft Intro Email"}
          </Button>
        )}

        {/* Draft preview */}
        {draft && !lead.introEmail && (
          <div className="rounded-md border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[10px] text-violet-700 dark:text-violet-300 border-violet-300">DRAFT — awaiting your approval</Badge>
              <div className="flex gap-1.5">
                <Button variant="ghost" size="sm" className="h-7" onClick={generateAndSend} disabled={loading}>
                  <RefreshCw className="h-3 w-3 mr-1" /> Redraft
                </Button>
                <Button size="sm" className="h-7" onClick={approveAndSend}>
                  <Send className="h-3 w-3 mr-1" /> Approve & Send
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Subject</Label>
              <p className="text-sm font-medium">{draft.subject}</p>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Body</Label>
              <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed mt-1">{draft.body}</pre>
            </div>
          </div>
        )}

        {/* Sent email */}
        {lead.introEmail && (
          <div className="rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <Badge variant="outline" className="text-[10px] text-emerald-700 dark:text-emerald-300 border-emerald-300">
                Sent {lead.introEmail.sentAt ? formatDateTime(lead.introEmail.sentAt) : ""}
              </Badge>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Subject</Label>
              <p className="text-sm font-medium">{lead.introEmail.subject}</p>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Body</Label>
              <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed mt-1">{lead.introEmail.body}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Stage 3: Follow-up + Schedule
// ============================================================

function FollowupScheduleStageCard({ lead: leadProp }: { lead: SalesWorkflowLead }) {
  const setWorkflowFollowup = useMarqai((s) => s.setWorkflowFollowup);
  const selectWorkflowMeetingSlot = useMarqai((s) => s.selectWorkflowMeetingSlot);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"online" | "offline">("online");

  const lead = leadProp;
  const meta = STAGE_META.followup_schedule;
  const Icon = meta.icon;
  const accent = ACCENT_CLASSES[meta.accent];
  const contact = lead.scrapedContacts.find((c) => c.id === lead.selectedContactId);
  const introEmail = lead.introEmail;
  const isUnlocked = stageIndex(lead.stage) >= 2 || lead.introEmailStatus === "completed";

  if (!contact || !introEmail) {
    return <LockedStageCard stage="followup_schedule" reason="Send the intro email in Stage 2 to unlock." />;
  }

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/marqai/sales/followup-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: lead.companyName,
          contactName: contact.contactName,
          contactTitle: contact.contactTitle,
          productName: lead.productContext.split("—")[0].trim() || lead.companyName,
          productContext: lead.productContext,
          introEmailSubject: introEmail.subject,
          tone: lead.tone,
          mode,
          timezone: "Asia/Kolkata",
          senderName: lead.agentName,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Follow-up generation failed");
      const payload: FollowupSchedulePayload = {
        followupSubject: data.followupSubject,
        followupBody: data.followupBody,
        proposedSlots: data.proposedSlots,
      };
      setWorkflowFollowup(lead.id, payload);
      toast.success("Follow-up drafted + slots proposed", {
        description: data.source === "fallback" ? data.warning : `${data.proposedSlots.length} meeting slots generated.`,
      });
    } catch (e) {
      toast.error("Failed to draft follow-up", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setLoading(false);
    }
  };

  const selectedSlot = lead.followup?.proposedSlots.find((s) => s.id === lead.followup?.selectedSlotId);

  return (
    <Card className={`border-l-4 ${isUnlocked ? accent.border : "border-muted opacity-60"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${accent.bg}`}>
              <Icon className={`h-5 w-5 ${accent.text}`} />
            </div>
            <div>
              <CardTitle className="text-base">Stage 3 — {meta.label}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{meta.description}</CardDescription>
            </div>
          </div>
          <StageStatusBadge status={lead.followupStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Generate */}
        {!lead.followup && (
          <div className="flex items-center gap-2">
            <Select value={mode} onValueChange={(v) => setMode(v as "online" | "offline")}>
              <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online (video call)</SelectItem>
                <SelectItem value="offline">Offline (in-person)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generate} disabled={loading || !isUnlocked} size="sm">
              {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Calendar className="h-3.5 w-3.5 mr-1.5" />}
              {loading ? "Drafting…" : "Draft Follow-up + Propose Slots"}
            </Button>
          </div>
        )}

        {/* Follow-up preview + slot picker */}
        {lead.followup && (
          <div className="space-y-3">
            <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] text-amber-700 dark:text-amber-300 border-amber-300">
                  {lead.followup.selectedSlotId ? "Sent — slot booked" : "Awaiting slot selection"}
                </Badge>
                {!lead.followup.selectedSlotId && (
                  <Button variant="ghost" size="sm" className="h-7" onClick={generate} disabled={loading}>
                    <RefreshCw className="h-3 w-3 mr-1" /> Regenerate
                  </Button>
                )}
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Follow-up Subject</Label>
                <p className="text-sm font-medium">{lead.followup.followupSubject}</p>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Follow-up Body</Label>
                <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed mt-1">{lead.followup.followupBody}</pre>
              </div>
            </div>

            {/* Slot picker */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Proposed Meeting Slots</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1.5">
                {lead.followup.proposedSlots.map((slot) => {
                  const isSelected = lead.followup?.selectedSlotId === slot.id;
                  return (
                    <button
                      key={slot.id}
                      disabled={!!lead.followup?.selectedSlotId}
                      onClick={() => selectWorkflowMeetingSlot(lead.id, slot.id)}
                      className={`text-left rounded-md border p-2.5 transition-colors ${isSelected ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" : "hover:border-amber-400 disabled:opacity-60 disabled:cursor-not-allowed"}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Calendar className="h-3.5 w-3.5 text-amber-600" />
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                      </div>
                      <div className="text-xs font-medium">{slot.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {slot.mode === "online" ? "Video call" : "In-person"}
                        {slot.mode === "online" && slot.meetingLink && <> · {slot.meetingLink}</>}
                        {slot.mode === "offline" && slot.location && <> · {slot.location}</>}
                      </div>
                    </button>
                  );
                })}
              </div>
              {!lead.followup.selectedSlotId && (
                <p className="text-xs text-amber-700 dark:text-amber-300 italic mt-1.5">
                  <Clock className="h-3 w-3 inline mr-1" />
                  Pick a slot to lock in the meeting and advance to Stage 4 (confirmation call).
                </p>
              )}
              {selectedSlot && (
                <div className="mt-2 rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 inline mr-1.5 text-emerald-600" />
                  Meeting scheduled: <strong>{selectedSlot.label}</strong>
                  {selectedSlot.mode === "online" && selectedSlot.meetingLink && <> · <a href={selectedSlot.meetingLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{selectedSlot.meetingLink}</a></>}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Stage 4: Call Confirm
// ============================================================

function CallConfirmStageCard({ lead }: { lead: SalesWorkflowLead }) {
  const setWorkflowCall = useMarqai((s) => s.setWorkflowCall);
  const [loading, setLoading] = useState(false);

  const meta = STAGE_META.call_confirm;
  const Icon = meta.icon;
  const accent = ACCENT_CLASSES[meta.accent];
  const contact = lead.scrapedContacts.find((c) => c.id === lead.selectedContactId);
  const selectedSlot = lead.followup?.proposedSlots.find((s) => s.id === lead.followup?.selectedSlotId);
  const isUnlocked = stageIndex(lead.stage) >= 3 || lead.followupStatus === "completed";

  if (!contact || !selectedSlot) {
    return <LockedStageCard stage="call_confirm" reason="Pick a meeting slot in Stage 3 to unlock." />;
  }

  const runCall = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/marqai/sales/call-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: lead.companyName,
          contactName: contact.contactName,
          contactTitle: contact.contactTitle,
          meetingLabel: selectedSlot.label,
          meetingMode: selectedSlot.mode,
          productName: lead.productContext.split("—")[0].trim() || lead.companyName,
          productContext: lead.productContext,
          senderName: lead.agentName,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Call simulation failed");
      const payload: CallConfirmPayload = {
        callScript: data.callScript,
        prospectResponse: data.prospectResponse,
        outcome: data.outcome,
        clientUpdateMessage: data.clientUpdateMessage,
      };
      setWorkflowCall(lead.id, payload);
      toast.success("Confirmation call completed", {
        description: `Outcome: ${data.outcome}`,
      });
    } catch (e) {
      toast.error("Call failed", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setLoading(false);
    }
  };

  const outcomeMeta: Record<CallConfirmPayload["outcome"], { label: string; color: string }> = {
    confirmed:  { label: "Confirmed",  color: "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800" },
    reschedule: { label: "Reschedule", color: "text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800" },
    voicemail:  { label: "Voicemail",  color: "text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800" },
    declined:   { label: "Declined",   color: "text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800" },
  };

  return (
    <Card className={`border-l-4 ${isUnlocked ? accent.border : "border-muted opacity-60"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${accent.bg}`}>
              <Icon className={`h-5 w-5 ${accent.text}`} />
            </div>
            <div>
              <CardTitle className="text-base">Stage 4 — {meta.label}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{meta.description}</CardDescription>
            </div>
          </div>
          <StageStatusBadge status={lead.callStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Meeting summary */}
        <div className="rounded-md border bg-muted/20 p-2.5 text-xs">
          <span className="text-muted-foreground">Calling:</span>{" "}
          <strong>{contact.contactName}</strong> ({contact.contactTitle}) ·{" "}
          {contact.phone ?? "no phone on file"} ·{" "}
          <span className="text-muted-foreground">Re:</span> <strong>{selectedSlot.label}</strong>
        </div>

        {/* Run call */}
        {!lead.call && (
          <Button onClick={runCall} disabled={loading || !isUnlocked} size="sm">
            {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <PhoneCall className="h-3.5 w-3.5 mr-1.5" />}
            {loading ? "Placing call…" : "Place Confirmation Call"}
          </Button>
        )}

        {/* Call result */}
        {lead.call && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className={`text-[10px] ${outcomeMeta[lead.call.outcome].color}`}>
                {lead.call.outcome === "confirmed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                Outcome: {outcomeMeta[lead.call.outcome].label}
              </Badge>
              {lead.call.callEndedAt && (
                <span className="text-[10px] text-muted-foreground">Call ended {formatDateTime(lead.call.callEndedAt)}</span>
              )}
            </div>

            {/* Call script */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Agent Call Script</Label>
              <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed mt-1 rounded-md border bg-muted/20 p-2.5">{lead.call.callScript}</pre>
            </div>

            {/* Prospect response */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prospect Response (simulated)</Label>
              <div className="mt-1 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-2.5">
                <div className="flex items-start gap-2">
                  <UserIcon className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs italic">{lead.call.prospectResponse}</p>
                </div>
              </div>
            </div>

            {/* Client update message */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Final Client Update Message</Label>
              <div className="mt-1 rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5">
                <p className="text-xs">{lead.call.clientUpdateMessage}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Audit Trail
// ============================================================

function AuditTrailCard({ lead }: { lead: SalesWorkflowLead }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> Audit Trail
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lead.stageHistory.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No activity yet.</p>
        ) : (
          <ol className="space-y-2">
            {[...lead.stageHistory].reverse().map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <div className="h-1.5 w-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <span className="font-medium">{STAGE_META[h.stage].short}</span>
                  <span className="text-muted-foreground"> · {h.status.replace("_", " ")}</span>
                  {h.note && <p className="text-muted-foreground mt-0.5">{h.note}</p>}
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">{formatDateTime(h.timestamp)}</p>
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
// Locked stage placeholder
// ============================================================

function LockedStageCard({ stage, reason }: { stage: SalesWorkflowStage; reason: string }) {
  const meta = STAGE_META[stage];
  const Icon = meta.icon;
  return (
    <Card className="border-l-4 border-muted opacity-60">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-base">Stage — {meta.label}</CardTitle>
            <CardDescription className="text-xs mt-0.5 flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3" /> {reason}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

// ============================================================
// Small helpers
// ============================================================

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xs font-medium truncate">{value}</div>
    </div>
  );
}

function StageStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    pending:          { label: "Pending",          color: "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/40 border-slate-300 dark:border-slate-700" },
    in_progress:      { label: "In Progress",      color: "text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800" },
    awaiting_client:  { label: "Awaiting Client",  color: "text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800" },
    completed:        { label: "Completed",        color: "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800" },
    failed:           { label: "Failed",           color: "text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800" },
  };
  const m = map[status] ?? map.pending;
  return <Badge className={`text-[10px] ${m.color}`}>{m.label}</Badge>;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const color = confidence >= 70 ? "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800"
    : confidence >= 40 ? "text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800"
    : "text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800";
  return <Badge className={`text-[10px] ${color}`}>{confidence}% conf.</Badge>;
}

// ============================================================
// FlowStep — small numbered step card used in the intro banner
// ============================================================

function FlowStep({
  number, icon: Icon, title, desc, accent,
}: {
  number: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  accent: keyof typeof ACCENT_CLASSES;
}) {
  const a = ACCENT_CLASSES[accent];
  return (
    <div className={`rounded-md border ${a.border} ${a.bg} p-2.5 flex items-start gap-2`}>
      <div className={`h-7 w-7 rounded-md bg-gradient-to-br ${a.gradient} text-white flex items-center justify-center shrink-0 text-[11px] font-bold`}>
        {number}
      </div>
      <div className="min-w-0 flex-1">
        <div className={`text-xs font-semibold ${a.text} flex items-center gap-1`}>
          <Icon className="h-3 w-3" /> {title}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{desc}</p>
      </div>
    </div>
  );
}
