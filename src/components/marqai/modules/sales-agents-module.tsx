"use client";

import { useState, useRef, useEffect } from "react";
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
  Bot, Loader2, Trash2, Wand2, Plus, Send, MessageSquare,
  Trophy, Target, Zap, Shield, Brain, Sparkles, User, Copy,
  Download, AlertTriangle, TrendingUp, ListChecks, MessageCircle,
  Workflow,
} from "lucide-react";
import type {
  SalesAgent, SalesAgentType, SalesMethodology,
  SalesConversation, SalesMessage, SalesConversationStage,
  BANTQualification, OutreachSequence, OutreachStep,
  DealCoachingSession, ObjectionResponse, ObjectionCategory,
  DiscoveryQuestionSet, Lead,
} from "@/lib/marqai/types";
import { uid, formatDateTime } from "@/lib/marqai/utils";
import { KpiCard } from "../kpi-card";
import { WorkflowTab } from "./sales-workflow-tab";

// ============================================================
// Constants
// ============================================================

const AGENT_TYPE_META: Record<
  SalesAgentType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; description: string }
> = {
  qualifier: { label: "Qualifier", icon: Target, color: "text-amber-500", description: "BANT/MEDDIC lead qualification" },
  outreach: { label: "Outreach", icon: Send, color: "text-blue-500", description: "Multi-channel outreach sequences" },
  "deal-coach": { label: "Deal Coach", icon: Brain, color: "text-violet-500", description: "Coaches active deals to close" },
  "objection-handler": { label: "Objections", icon: Shield, color: "text-rose-500", description: "Scripts for any objection" },
  discovery: { label: "Discovery", icon: Sparkles, color: "text-cyan-500", description: "Tailored discovery questions" },
  conversation: { label: "Conversation", icon: MessageCircle, color: "text-emerald-500", description: "Full-cycle sales conversation" },
};

const METHODOLOGIES: SalesMethodology[] = ["BANT", "MEDDIC", "SPIN", "Challenger", "Consultative"];

const STAGE_LABELS: Record<SalesConversationStage, string> = {
  discovery: "Discovery",
  qualification: "Qualification",
  demo: "Demo",
  proposal: "Proposal",
  negotiation: "Negotiation",
  "closed-won": "Closed-Won",
  "closed-lost": "Closed-Lost",
};

const OBJECTION_CATEGORIES: { value: ObjectionCategory; label: string }[] = [
  { value: "price", label: "Price" },
  { value: "timing", label: "Timing" },
  { value: "competitor", label: "Competitor" },
  { value: "authority", label: "Authority" },
  { value: "need", label: "Need" },
  { value: "trust", label: "Trust" },
  { value: "complexity", label: "Complexity" },
  { value: "other", label: "Other" },
];

const SCORE_COLORS: Record<string, string> = {
  high: "text-emerald-600",
  medium: "text-amber-600",
  low: "text-rose-600",
};

// ============================================================
// Main module
// ============================================================

export function SalesAgentsModule() {
  const [tab, setTab] = useState<string>("workflow");

  const salesAgents = useMarqai((s) => s.salesAgents);
  const salesConversations = useMarqai((s) => s.salesConversations);
  const outreachSequences = useMarqai((s) => s.outreachSequences);
  const dealCoachingSessions = useMarqai((s) => s.dealCoachingSessions);
  const objectionResponses = useMarqai((s) => s.objectionResponses);

  const activeAgents = salesAgents.filter((a) => a.active).length;
  const openConversations = salesConversations.filter(
    (c) => c.stage !== "closed-won" && c.stage !== "closed-lost",
  ).length;
  const avgDealProb = dealCoachingSessions.length
    ? Math.round(
        dealCoachingSessions.reduce((sum, d) => sum + d.closeProbability, 0) /
          dealCoachingSessions.length,
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-7 w-7 text-primary" />
            AI Sales Agents
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            A multi-agent sales suite for qualification, outreach, deal coaching, objection handling, and discovery.
            Powered by BANT / MEDDIC / SPIN / Challenger methodologies.
          </p>
        </div>
        <Badge variant="outline" className="self-start">
          <Sparkles className="h-3 w-3 mr-1" />
          {activeAgents} active agents
        </Badge>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Active Agents"
          value={activeAgents}
          icon={Bot}
          accent="violet"
        />
        <KpiCard
          label="Open Conversations"
          value={openConversations}
          icon={MessageCircle}
          accent="emerald"
        />
        <KpiCard
          label="Outreach Sequences"
          value={outreachSequences.length}
          icon={Send}
          accent="amber"
        />
        <KpiCard
          label="Avg Deal Probability"
          value={`${avgDealProb}%`}
          icon={TrendingUp}
          accent="rose"
        />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 h-auto">
          <TabsTrigger value="workflow" className="flex items-center gap-1.5 py-2 relative">
            <Workflow className="h-3.5 w-3.5" /> Workflow
            <span className="ml-1 inline-flex items-center rounded-full bg-violet-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">New</span>
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-1.5 py-2">
            <Bot className="h-3.5 w-3.5" /> Agents
          </TabsTrigger>
          <TabsTrigger value="conversations" className="flex items-center gap-1.5 py-2">
            <MessageCircle className="h-3.5 w-3.5" /> Conversations
          </TabsTrigger>
          <TabsTrigger value="outreach" className="flex items-center gap-1.5 py-2">
            <Send className="h-3.5 w-3.5" /> Outreach
          </TabsTrigger>
          <TabsTrigger value="coach" className="flex items-center gap-1.5 py-2">
            <Brain className="h-3.5 w-3.5" /> Deal Coach
          </TabsTrigger>
          <TabsTrigger value="objections" className="flex items-center gap-1.5 py-2">
            <Shield className="h-3.5 w-3.5" /> Objections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflow">
          <WorkflowTab />
        </TabsContent>
        <TabsContent value="agents">
          <AgentsTab />
        </TabsContent>
        <TabsContent value="conversations">
          <ConversationsTab />
        </TabsContent>
        <TabsContent value="outreach">
          <OutreachTab />
        </TabsContent>
        <TabsContent value="coach">
          <DealCoachTab />
        </TabsContent>
        <TabsContent value="objections">
          <ObjectionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// Tab 1: Agents — manage sales agent roster
// ============================================================

function AgentsTab() {
  const salesAgents = useMarqai((s) => s.salesAgents);
  const addSalesAgent = useMarqai((s) => s.addSalesAgent);
  const updateSalesAgent = useMarqai((s) => s.updateSalesAgent);
  const deleteSalesAgent = useMarqai((s) => s.deleteSalesAgent);

  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Each agent is specialized for one stage of the revenue pipeline. Click an agent to view its prompt, edit, or clone it.
        </p>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Agent
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {salesAgents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onToggle={() => updateSalesAgent(agent.id, { active: !agent.active })}
            onDelete={() => {
              deleteSalesAgent(agent.id);
              toast.success("Agent deleted");
            }}
          />
        ))}
      </div>

      {showCreate && (
        <CreateAgentDialog
          onClose={() => setShowCreate(false)}
          onCreate={(agent) => {
            addSalesAgent(agent);
            setShowCreate(false);
            toast.success(`Agent "${agent.name}" created`);
          }}
        />
      )}
    </div>
  );
}

function AgentCard({
  agent, onToggle, onDelete,
}: {
  agent: SalesAgent;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const meta = AGENT_TYPE_META[agent.type];
  const Icon = meta.icon;
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-9 w-9 rounded-lg bg-muted flex items-center justify-center ${meta.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{agent.name}</CardTitle>
              <CardDescription className="text-xs">
                {meta.label} · {agent.methodology}
              </CardDescription>
            </div>
          </div>
          <Badge variant={agent.active ? "default" : "secondary"}>
            {agent.active ? "Active" : "Paused"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{agent.description}</p>

        {expanded && (
          <div className="space-y-2 pt-2 border-t">
            <div>
              <Label className="text-xs text-muted-foreground">System Prompt</Label>
              <pre className="text-xs bg-muted/50 p-2 rounded mt-1 whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                {agent.systemPrompt}
              </pre>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Product Context</Label>
              <p className="text-xs mt-1">{agent.productContext}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tone</Label>
              <p className="text-xs mt-1">{agent.tone}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={() => setExpanded((e) => !e)} className="flex-1">
            {expanded ? "Hide" : "View"} prompt
          </Button>
          <Button size="sm" variant="outline" onClick={onToggle}>
            {agent.active ? "Pause" : "Activate"}
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-rose-600 hover:text-rose-700">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateAgentDialog({
  onClose, onCreate,
}: {
  onClose: () => void;
  onCreate: (agent: SalesAgent) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<SalesAgentType>("qualifier");
  const [methodology, setMethodology] = useState<SalesMethodology>("BANT");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [productContext, setProductContext] = useState("");
  const [tone, setTone] = useState("Consultative, confident, never aggressive.");

  function handleCreate() {
    if (!name.trim() || !systemPrompt.trim()) {
      toast.error("Name and system prompt are required");
      return;
    }
    const agent: SalesAgent = {
      id: uid("sa"),
      name,
      type,
      methodology,
      description: description || `${AGENT_TYPE_META[type].label} agent using ${methodology}`,
      systemPrompt,
      productContext: productContext || "Generic B2B SaaS product.",
      tone,
      active: true,
      createdAt: new Date().toISOString(),
    };
    onCreate(agent);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Sales Agent</DialogTitle>
          <DialogDescription>
            Configure a specialized AI agent for one stage of the revenue pipeline.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Agent Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Riley — Discovery Pro" />
            </div>
            <div>
              <Label>Agent Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as SalesAgentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(AGENT_TYPE_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label} — {v.description}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Methodology</Label>
              <Select value={methodology} onValueChange={(v) => setMethodology(v as SalesMethodology)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METHODOLOGIES.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tone</Label>
              <Input value={tone} onChange={(e) => setTone(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What does this agent do? When should it be used?"
            />
          </div>
          <div>
            <Label>System Prompt</Label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={5}
              placeholder="You are a... [describe the agent's role, behavior, and constraints]"
            />
          </div>
          <div>
            <Label>Product Context</Label>
            <Textarea
              value={productContext}
              onChange={(e) => setProductContext(e.target.value)}
              rows={3}
              placeholder="What product does this agent sell? Pricing, ICP, key differentiators."
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1" /> Create Agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Tab 2: Conversations — chat with the AI sales agent
// ============================================================

function ConversationsTab() {
  const salesAgents = useMarqai((s) => s.salesAgents);
  const salesConversations = useMarqai((s) => s.salesConversations);
  const leadLists = useMarqai((s) => s.leadLists);

  const addSalesConversation = useMarqai((s) => s.addSalesConversation);
  const deleteSalesConversation = useMarqai((s) => s.deleteSalesConversation);

  const [activeId, setActiveId] = useState<string | null>(salesConversations[0]?.id ?? null);
  const [showNew, setShowNew] = useState(false);

  const active = salesConversations.find((c) => c.id === activeId) ?? null;

  // Flatten all leads for the lead-picker
  const allLeads: Lead[] = leadLists.flatMap((ll) => ll.leads);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Conversation list */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Conversations</CardTitle>
            <Button size="sm" onClick={() => setShowNew(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
          {salesConversations.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No conversations yet. Click <strong>New</strong> to start one.
            </p>
          )}
          {salesConversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                activeId === c.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-sm truncate">{c.prospectCompany}</div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {STAGE_LABELS[c.stage]}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground truncate mt-0.5">
                {c.prospectContact} · {c.agentName.split(" — ")[0]}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <Progress value={c.qualification.score} className="h-1 flex-1" />
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {c.qualification.score}
                </span>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Active conversation */}
      <div className="lg:col-span-2">
        {active ? (
          <ActiveConversation
            key={active.id}
            conversation={active}
            onDelete={() => {
              deleteSalesConversation(active.id);
              setActiveId(salesConversations.find((c) => c.id !== active.id)?.id ?? null);
            }}
          />
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Select a conversation or start a new one.
            </CardContent>
          </Card>
        )}
      </div>

      {showNew && (
        <NewConversationDialog
          agents={salesAgents}
          leads={allLeads}
          onClose={() => setShowNew(false)}
          onCreate={(conv) => {
            addSalesConversation(conv);
            setActiveId(conv.id);
            setShowNew(false);
            toast.success(`Started conversation with ${conv.prospectCompany}`);
          }}
        />
      )}
    </div>
  );
}

function NewConversationDialog({
  agents, leads, onClose, onCreate,
}: {
  agents: SalesAgent[];
  leads: Lead[];
  onClose: () => void;
  onCreate: (conv: SalesConversation) => void;
}) {
  const conversationAgents = agents.filter((a) => a.type === "conversation" || a.type === "qualifier");
  const [agentId, setAgentId] = useState(conversationAgents[0]?.id ?? agents[0]?.id ?? "");
  const [prospectCompany, setProspectCompany] = useState("");
  const [prospectContact, setProspectContact] = useState("");
  const [prospectTitle, setProspectTitle] = useState("");
  const [leadId, setLeadId] = useState<string>("");

  const selectedAgent = agents.find((a) => a.id === agentId);

  function pickLead(id: string) {
    setLeadId(id);
    const lead = leads.find((l) => l.id === id);
    if (lead) {
      setProspectCompany(lead.companyName);
      setProspectContact(lead.contactName ?? "");
      setProspectTitle(lead.contactTitle ?? "");
    }
  }

  function handleCreate() {
    if (!agentId || !prospectCompany.trim()) {
      toast.error("Select an agent and enter a prospect company");
      return;
    }
    const agent = agents.find((a) => a.id === agentId)!;
    const now = new Date().toISOString();
    const conv: SalesConversation = {
      id: uid("sc"),
      agentId,
      agentName: agent.name,
      prospectCompany,
      prospectContact: prospectContact || "Unknown contact",
      prospectTitle: prospectTitle || undefined,
      productContext: agent.productContext,
      methodology: agent.methodology,
      stage: "discovery",
      messages: [
        {
          id: uid("sm"),
          role: "agent",
          content: `Hi ${prospectContact || "there"} — thanks for making time. Before I show you anything, I'd love to understand what's pushing ${prospectCompany} to look at this kind of solution right now. What's the situation on your end?`,
          timestamp: now,
          metadata: { stage: "discovery", intent: "open-discovery", sentiment: "neutral" },
        },
      ],
      qualification: { score: 30, notes: "Just opened — no qualification signals yet." },
      createdAt: now,
      updatedAt: now,
    };
    onCreate(conv);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Start New Sales Conversation</DialogTitle>
          <DialogDescription>
            Pick an agent and a prospect. The agent will open the conversation; you can play the prospect or instruct the agent.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Agent</Label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger><SelectValue placeholder="Select an agent" /></SelectTrigger>
              <SelectContent>
                {conversationAgents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {leads.length > 0 && (
            <div>
              <Label>Pick from existing leads (optional)</Label>
              <Select value={leadId} onValueChange={pickLead}>
                <SelectTrigger><SelectValue placeholder="Select a lead — or type below" /></SelectTrigger>
                <SelectContent>
                  {leads.slice(0, 50).map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.companyName} — {l.contactName ?? "Unknown"} ({l.score})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prospect Company</Label>
              <Input value={prospectCompany} onChange={(e) => setProspectCompany(e.target.value)} />
            </div>
            <div>
              <Label>Prospect Contact</Label>
              <Input value={prospectContact} onChange={(e) => setProspectContact(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Contact Title</Label>
            <Input value={prospectTitle} onChange={(e) => setProspectTitle(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleCreate}>
            <MessageCircle className="h-4 w-4 mr-1" /> Start Conversation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ActiveConversation({
  conversation, onDelete,
}: {
  conversation: SalesConversation;
  onDelete: () => void;
}) {
  const salesAgents = useMarqai((s) => s.salesAgents);
  const appendSalesMessage = useMarqai((s) => s.appendSalesMessage);
  const setConversationStage = useMarqai((s) => s.setConversationStage);
  const setConversationQualification = useMarqai((s) => s.setConversationQualification);

  const [input, setInput] = useState("");
  const [role, setRole] = useState<"prospect" | "user">("prospect");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const agent = salesAgents.find((a) => a.id === conversation.agentId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.messages.length]);

  async function send() {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput("");
    setLoading(true);

    // Append the user/prospect message
    const userMsg: SalesMessage = {
      id: uid("sm"),
      role,
      content: userText,
      timestamp: new Date().toISOString(),
    };
    appendSalesMessage(conversation.id, userMsg);

    try {
      const res = await fetch("/api/marqai/sales/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: conversation.agentName,
          agentType: agent?.type ?? "conversation",
          methodology: conversation.methodology,
          systemPrompt: agent?.systemPrompt ?? "You are a senior sales representative.",
          productContext: conversation.productContext,
          tone: agent?.tone ?? "Consultative",
          prospectCompany: conversation.prospectCompany,
          prospectContact: conversation.prospectContact,
          prospectTitle: conversation.prospectTitle,
          stage: conversation.stage,
          messages: [...conversation.messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userInput: userText,
          userInputRole: role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Chat failed");

      const agentMsg: SalesMessage = {
        id: uid("sm"),
        role: "agent",
        content: data.reply,
        timestamp: new Date().toISOString(),
        metadata: {
          stage: data.stage ?? conversation.stage,
          intent: data.intent,
          sentiment: data.sentiment,
          methodologyNote: data.methodologyNote,
        },
      };
      appendSalesMessage(conversation.id, agentMsg);

      if (data.stage && data.stage !== conversation.stage) {
        setConversationStage(conversation.id, data.stage);
      }
      if (data.qualification) {
        setConversationQualification(conversation.id, data.qualification);
      }
      if (data.warning) {
        toast.warning("AI returned a warning", { description: data.warning.slice(0, 200) });
      }
    } catch (e) {
      toast.error("Agent response failed", {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      send();
    }
  }

  return (
    <Card className="flex flex-col h-[700px]">
      {/* Header */}
      <CardHeader className="pb-3 border-b">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {conversation.prospectCompany}
              <Badge variant="outline" className="text-[10px]">
                {STAGE_LABELS[conversation.stage]}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {conversation.prospectContact}
              {conversation.prospectTitle ? ` · ${conversation.prospectTitle}` : ""} ·
              {" "}{conversation.agentName} · {conversation.methodology}
            </CardDescription>
          </div>
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-rose-600 hover:text-rose-700">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Qualification mini-bar */}
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-14">Budget:</span>
            <span className="truncate">{conversation.qualification.budget ?? "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-14">Authority:</span>
            <span className="truncate">{conversation.qualification.authority ?? "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-14">Need:</span>
            <span className="truncate">{conversation.qualification.need ?? "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-14">Timeline:</span>
            <span className="truncate">{conversation.qualification.timeline ?? "—"}</span>
          </div>
          <div className="col-span-2 flex items-center gap-2 mt-1">
            <span className="text-muted-foreground w-14">Fit score:</span>
            <Progress value={conversation.qualification.score} className="h-2 flex-1" />
            <span className="tabular-nums font-medium">{conversation.qualification.score}/100</span>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto space-y-3 py-4">
        {conversation.messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pl-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Agent is thinking…
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input */}
      <div className="border-t p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Select value={role} onValueChange={(v) => setRole(v as "prospect" | "user")}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prospect">Prospect says</SelectItem>
              <SelectItem value="user">Rep instructs</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">
            Type what the prospect says OR instruct the agent (e.g. "ask about budget")
          </span>
        </div>
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={role === "prospect" ? "What does the prospect say?" : "What should the agent do next?"}
            rows={2}
            className="resize-none"
          />
          <Button onClick={send} disabled={loading || !input.trim()} className="self-end">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function MessageBubble({ message }: { message: SalesMessage }) {
  const isAgent = message.role === "agent";
  return (
    <div className={`flex gap-2 ${isAgent ? "justify-start" : "justify-end"}`}>
      {isAgent && (
        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="h-3.5 w-3.5" />
        </div>
      )}
      <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
        isAgent
          ? "bg-muted"
          : message.role === "prospect"
            ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900"
            : "bg-primary/10"
      }`}>
        <div className="whitespace-pre-wrap">{message.content}</div>
        {message.metadata?.methodologyNote && (
          <div className="text-[10px] text-muted-foreground mt-1.5 pt-1.5 border-t border-border/50 italic">
            ↳ {message.metadata.methodologyNote}
          </div>
        )}
        <div className="text-[10px] text-muted-foreground mt-1">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
      {!isAgent && (
        <div className="h-7 w-7 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
          <User className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
}

// ============================================================
// Tab 3: Outreach — generate multi-channel sequences
// ============================================================

function OutreachTab() {
  const outreachSequences = useMarqai((s) => s.outreachSequences);
  const addOutreachSequence = useMarqai((s) => s.addOutreachSequence);
  const deleteOutreachSequence = useMarqai((s) => s.deleteOutreachSequence);

  const [showGen, setShowGen] = useState(false);
  const [activeSeqId, setActiveSeqId] = useState<string | null>(outreachSequences[0]?.id ?? null);

  const activeSeq = outreachSequences.find((s) => s.id === activeSeqId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Generate personalized multi-channel outreach sequences (email + LinkedIn + call). AI writes every step — open, follow-ups, breakup email.
        </p>
        <Button size="sm" onClick={() => setShowGen(true)}>
          <Wand2 className="h-4 w-4 mr-1" /> Generate Sequence
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sequences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {outreachSequences.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No sequences yet. Generate your first one.
              </p>
            )}
            {outreachSequences.map((seq) => (
              <button
                key={seq.id}
                onClick={() => setActiveSeqId(seq.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  activeSeqId === seq.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <div className="font-medium text-sm truncate">{seq.name}</div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  {seq.targetPersona}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="outline" className="text-[10px]">{seq.steps.length} steps</Badge>
                  <span className="text-[10px] text-muted-foreground truncate">{seq.cadence}</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {activeSeq ? (
            <OutreachDetail
              key={activeSeq.id}
              sequence={activeSeq}
              onDelete={() => {
                deleteOutreachSequence(activeSeq.id);
                setActiveSeqId(outreachSequences.find((s) => s.id !== activeSeq.id)?.id ?? null);
              }}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Select a sequence or generate a new one.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showGen && (
        <GenerateOutreachDialog
          onClose={() => setShowGen(false)}
          onCreate={(seq) => {
            addOutreachSequence(seq);
            setActiveSeqId(seq.id);
            setShowGen(false);
            toast.success("Outreach sequence generated");
          }}
        />
      )}
    </div>
  );
}

function GenerateOutreachDialog({
  onClose, onCreate,
}: {
  onClose: () => void;
  onCreate: (seq: OutreachSequence) => void;
}) {
  const [productName, setProductName] = useState("Marqai Marketing Suite");
  const [targetPersona, setTargetPersona] = useState("VP Marketing at 50-200 person B2B SaaS");
  const [tone, setTone] = useState("Direct, specific, no fluff");
  const [stepCount, setStepCount] = useState(5);
  const [prospectCompany, setProspectCompany] = useState("");
  const [prospectContact, setProspectContact] = useState("");
  const [prospectContext, setProspectContext] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!productName.trim() || !targetPersona.trim()) {
      toast.error("Product name and target persona are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/marqai/sales/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName, targetPersona, tone, stepCount,
          prospectCompany: prospectCompany || undefined,
          prospectContact: prospectContact || undefined,
          prospectContext: prospectContext || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");

      const seq: OutreachSequence = {
        id: uid("os"),
        name: data.sequence.name,
        productName,
        targetPersona,
        tone,
        cadence: data.sequence.cadence,
        steps: data.sequence.steps,
        createdAt: new Date().toISOString(),
      };
      onCreate(seq);
      if (data.source === "fallback" && data.warning) {
        toast.warning("Used fallback template", { description: data.warning.slice(0, 200) });
      }
    } catch (e) {
      toast.error("Generation failed", {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Outreach Sequence</DialogTitle>
          <DialogDescription>
            AI will write a {stepCount}-step multi-channel sequence personalized to your buyer persona.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Product Name</Label>
              <Input value={productName} onChange={(e) => setProductName(e.target.value)} />
            </div>
            <div>
              <Label>Step Count</Label>
              <Select value={String(stepCount)} onValueChange={(v) => setStepCount(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[4, 5, 6].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n} steps</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Target Persona</Label>
            <Textarea
              value={targetPersona}
              onChange={(e) => setTargetPersona(e.target.value)}
              rows={2}
            />
          </div>
          <div>
            <Label>Tone</Label>
            <Input value={tone} onChange={(e) => setTone(e.target.value)} />
          </div>
          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground mb-2">
              Optional — fill in to personalize for a specific prospect:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prospect Company</Label>
                <Input value={prospectCompany} onChange={(e) => setProspectCompany(e.target.value)} />
              </div>
              <div>
                <Label>Prospect Contact</Label>
                <Input value={prospectContact} onChange={(e) => setProspectContact(e.target.value)} />
              </div>
            </div>
            <div className="mt-3">
              <Label>Research Notes</Label>
              <Textarea
                value={prospectContext}
                onChange={(e) => setProspectContext(e.target.value)}
                rows={2}
                placeholder="Recent funding round? Hiring sprint? Product launch? Anything specific you noticed."
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={generate} disabled={loading}>
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating…</>
            ) : (
              <><Wand2 className="h-4 w-4 mr-1" /> Generate</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OutreachDetail({
  sequence, onDelete,
}: {
  sequence: OutreachSequence;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState<number | null>(null);

  function copyStep(step: OutreachStep) {
    const text = step.subject
      ? `Subject: ${step.subject}\n\n${step.body}`
      : step.body;
    navigator.clipboard.writeText(text);
    setCopied(step.index);
    setTimeout(() => setCopied(null), 1500);
    toast.success("Copied to clipboard");
  }

  function exportSequence() {
    const lines = [
      `# ${sequence.name}`,
      `Product: ${sequence.productName}`,
      `Persona: ${sequence.targetPersona}`,
      `Tone: ${sequence.tone}`,
      `Cadence: ${sequence.cadence}`,
      "",
      "---",
      "",
    ];
    sequence.steps.forEach((s) => {
      lines.push(`## Step ${s.index} — ${s.channel.toUpperCase()} (Day +${s.delayDays})`);
      if (s.subject) lines.push(`**Subject:** ${s.subject}`);
      lines.push("");
      lines.push(s.body);
      lines.push("");
      lines.push(`*Goal: ${s.goal}*`);
      lines.push("");
      lines.push("---");
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sequence.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{sequence.name}</CardTitle>
            <CardDescription className="text-xs mt-1">
              {sequence.targetPersona}
            </CardDescription>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{sequence.cadence}</Badge>
              <Badge variant="outline">{sequence.steps.length} steps</Badge>
              <Badge variant="outline">{sequence.tone}</Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={exportSequence}>
              <Download className="h-3.5 w-3.5 mr-1" /> Export
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete} className="text-rose-600 hover:text-rose-700">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sequence.steps.map((s) => (
          <div key={s.index} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">{s.channel}</Badge>
                <span className="text-xs text-muted-foreground">
                  Day +{s.delayDays} · Step {s.index}
                </span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => copyStep(s)}>
                {copied === s.index ? (
                  <span className="text-xs">✓ Copied</span>
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            {s.subject && (
              <div className="text-xs font-medium mb-1">Subject: {s.subject}</div>
            )}
            <p className="text-sm whitespace-pre-wrap">{s.body}</p>
            <p className="text-[10px] text-muted-foreground italic mt-2 pt-2 border-t">
              Goal: {s.goal}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Tab 4: Deal Coach — coach active deals
// ============================================================

function DealCoachTab() {
  const dealCoachingSessions = useMarqai((s) => s.dealCoachingSessions);
  const addDealCoachingSession = useMarqai((s) => s.addDealCoachingSession);
  const deleteDealCoachingSession = useMarqai((s) => s.deleteDealCoachingSession);

  const [showCoach, setShowCoach] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(dealCoachingSessions[0]?.id ?? null);

  const active = dealCoachingSessions.find((s) => s.id === activeId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Get AI deal coaching using the MEDDIC framework. Identify gaps, risks, prioritized next steps, and a close probability.
        </p>
        <Button size="sm" onClick={() => setShowCoach(true)}>
          <Brain className="h-4 w-4 mr-1" /> Coach a Deal
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Coaching Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dealCoachingSessions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No coaching sessions yet.
              </p>
            )}
            {dealCoachingSessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  activeId === s.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <div className="font-medium text-sm truncate">{s.dealName}</div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  {s.prospectCompany} · {s.stage}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <Progress value={s.closeProbability} className="h-1 flex-1" />
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {s.closeProbability}%
                  </span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {active ? (
            <DealCoachDetail
              key={active.id}
              session={active}
              onDelete={() => {
                deleteDealCoachingSession(active.id);
                setActiveId(dealCoachingSessions.find((s) => s.id !== active.id)?.id ?? null);
              }}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No active coaching session. Click <strong>Coach a Deal</strong> to begin.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showCoach && (
        <CoachDealDialog
          onClose={() => setShowCoach(false)}
          onCreate={(sess) => {
            addDealCoachingSession(sess);
            setActiveId(sess.id);
            setShowCoach(false);
            toast.success("Deal coaching session created");
          }}
        />
      )}
    </div>
  );
}

function CoachDealDialog({
  onClose, onCreate,
}: {
  onClose: () => void;
  onCreate: (sess: DealCoachingSession) => void;
}) {
  const salesAgents = useMarqai((s) => s.salesAgents);
  const dealCoachAgents = salesAgents.filter((a) => a.type === "deal-coach");

  const [agentId, setAgentId] = useState(dealCoachAgents[0]?.id ?? salesAgents[0]?.id ?? "");
  const [dealName, setDealName] = useState("");
  const [prospectCompany, setProspectCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [dealValue, setDealValue] = useState<number | "">("");
  const [stage, setStage] = useState("Proposal");
  const [closeDate, setCloseDate] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);

  async function coach() {
    if (!dealName.trim() || !prospectCompany.trim() || !context.trim()) {
      toast.error("Deal name, prospect company, and context are required");
      return;
    }
    setLoading(true);
    const agent = salesAgents.find((a) => a.id === agentId);
    try {
      const res = await fetch("/api/marqai/sales/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: agent?.name,
          methodology: agent?.methodology ?? "MEDDIC",
          productContext: agent?.productContext ?? "B2B SaaS product",
          dealName,
          prospectCompany,
          contactName: contactName || undefined,
          dealValue: typeof dealValue === "number" ? dealValue : undefined,
          currency: "USD",
          stage,
          closeDate: closeDate || undefined,
          context,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Coaching failed");

      const sess: DealCoachingSession = {
        id: uid("dc"),
        agentId,
        dealName,
        prospectCompany,
        contactName: contactName || undefined,
        dealValue: typeof dealValue === "number" ? dealValue : undefined,
        currency: "USD",
        stage,
        closeDate: closeDate || undefined,
        context,
        methodology: agent?.methodology ?? "MEDDIC",
        recommendations: data.recommendations,
        riskFactors: data.riskFactors,
        nextSteps: data.nextSteps,
        closeProbability: data.closeProbability,
        createdAt: new Date().toISOString(),
      };
      onCreate(sess);
      if (data.source === "fallback" && data.warning) {
        toast.warning("Used fallback coaching", { description: data.warning.slice(0, 200) });
      }
    } catch (e) {
      toast.error("Coaching failed", {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Coach a Deal</DialogTitle>
          <DialogDescription>
            Provide deal context and the AI will produce a MEDDIC gap analysis, risks, next steps, and a close probability.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Coach Agent</Label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {dealCoachAgents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Deal Name</Label>
              <Input value={dealName} onChange={(e) => setDealName(e.target.value)} placeholder="e.g. Vertex Cloud — Scale plan" />
            </div>
            <div>
              <Label>Prospect Company</Label>
              <Input value={prospectCompany} onChange={(e) => setProspectCompany(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Contact Name</Label>
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </div>
            <div>
              <Label>Deal Value (USD)</Label>
              <Input
                type="number"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value ? Number(e.target.value) : "")}
              />
            </div>
            <div>
              <Label>Stage</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STAGE_LABELS).filter(([k]) => !k.startsWith("closed")).map(([k, v]) => (
                    <SelectItem key={k} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Target Close Date</Label>
            <Input type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
          </div>
          <div>
            <Label>Deal Context (rep's notes)</Label>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={5}
              placeholder="Who's the contact? Who else is involved? What stage are we at? What's blocking us? What's the competition? Anything else relevant."
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={coach} disabled={loading}>
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Coaching…</>
            ) : (
              <><Brain className="h-4 w-4 mr-1" /> Coach Deal</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DealCoachDetail({
  session, onDelete,
}: {
  session: DealCoachingSession;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {session.dealName}
              <Badge variant="outline">{session.stage}</Badge>
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {session.prospectCompany}
              {session.contactName ? ` · ${session.contactName}` : ""}
              {session.dealValue ? ` · $${session.dealValue.toLocaleString()}` : ""}
              {session.closeDate ? ` · Close by ${session.closeDate}` : ""}
              {" · "}Coached {formatDateTime(session.createdAt)}
            </CardDescription>
          </div>
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-rose-600 hover:text-rose-700">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Close probability gauge */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Close probability</span>
              <span className={`font-bold ${SCORE_COLORS[session.closeProbability >= 70 ? "high" : session.closeProbability >= 40 ? "medium" : "low"]}`}>
                {session.closeProbability}%
              </span>
            </div>
            <Progress value={session.closeProbability} className="h-2" />
          </div>
          <Badge variant={session.closeProbability >= 70 ? "default" : session.closeProbability >= 40 ? "secondary" : "destructive"}>
            {session.closeProbability >= 70 ? "Forecast: Best case" : session.closeProbability >= 40 ? "Forecast: Pipeline" : "Forecast: At risk"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recommendations */}
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
            <ListChecks className="h-4 w-4" /> Recommendations
          </h4>
          <div className="space-y-2">
            {session.recommendations.map((r, i) => (
              <div key={i} className="border rounded-lg p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="font-medium text-sm">{r.title}</div>
                  <div className="flex gap-1 shrink-0">
                    <Badge variant="outline" className="text-[10px] capitalize">{r.category}</Badge>
                    <Badge
                      variant={r.priority === "high" ? "destructive" : r.priority === "medium" ? "secondary" : "outline"}
                      className="text-[10px] capitalize"
                    >
                      {r.priority}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{r.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Risk factors */}
        {session.riskFactors.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Risk Factors
            </h4>
            <ul className="space-y-1">
              {session.riskFactors.map((r, i) => (
                <li key={i} className="text-xs flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next steps */}
        {session.nextSteps.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
              <Zap className="h-4 w-4 text-emerald-500" /> Next Steps
            </h4>
            <div className="space-y-1.5">
              {session.nextSteps.map((s, i) => (
                <div key={i} className="text-xs flex items-start gap-2 p-2 bg-muted/50 rounded">
                  <span className="font-bold text-emerald-600 mt-0.5">{i + 1}.</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Tab 5: Objections — objection handler library
// ============================================================

function ObjectionsTab() {
  const objectionResponses = useMarqai((s) => s.objectionResponses);
  const addObjectionResponse = useMarqai((s) => s.addObjectionResponse);
  const deleteObjectionResponse = useMarqai((s) => s.deleteObjectionResponse);

  const discoveryQuestionSets = useMarqai((s) => s.discoveryQuestionSets);
  const addDiscoveryQuestionSet = useMarqai((s) => s.addDiscoveryQuestionSet);
  const deleteDiscoveryQuestionSet = useMarqai((s) => s.deleteDiscoveryQuestionSet);

  const [showHandle, setShowHandle] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all"
    ? objectionResponses
    : objectionResponses.filter((o) => o.category === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground flex-1">
          Generate AI responses to any objection — three distinct approaches per objection. Also: generate SPIN-style discovery questions.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowDiscovery(true)}>
            <Sparkles className="h-4 w-4 mr-1" /> Discovery Questions
          </Button>
          <Button size="sm" onClick={() => setShowHandle(true)}>
            <Shield className="h-4 w-4 mr-1" /> Handle Objection
          </Button>
        </div>
      </div>

      {/* Discovery question sets (small section on top) */}
      {discoveryQuestionSets.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-cyan-500" /> Discovery Question Sets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {discoveryQuestionSets.map((d) => (
              <div key={d.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-medium text-sm">{d.prospectCompany} — {d.prospectPersona}</div>
                    <div className="text-xs text-muted-foreground">{d.methodology} · {formatDateTime(d.createdAt)}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteDiscoveryQuestionSet(d.id)}
                    className="text-rose-600 hover:text-rose-700 h-7"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {d.questions.map((q, i) => (
                    <div key={i} className="text-xs bg-muted/50 p-2 rounded">
                      <Badge variant="outline" className="text-[10px] mr-2">{q.category}</Badge>
                      <span className="font-medium">{q.question}</span>
                      <div className="text-[10px] text-muted-foreground italic mt-1 ml-1">Goal: {q.goal}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Objection responses */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Filter:</span>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {OBJECTION_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.length} objection(s)</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.length === 0 && (
          <Card className="lg:col-span-2">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No objection responses yet. Click <strong>Handle Objection</strong> to generate one.
            </CardContent>
          </Card>
        )}
        {filtered.map((o) => (
          <ObjectionCard
            key={o.id}
            objection={o}
            onDelete={() => deleteObjectionResponse(o.id)}
          />
        ))}
      </div>

      {showHandle && (
        <HandleObjectionDialog
          onClose={() => setShowHandle(false)}
          onCreate={(o) => {
            addObjectionResponse(o);
            setShowHandle(false);
            toast.success("Objection responses generated");
          }}
        />
      )}

      {showDiscovery && (
        <DiscoveryDialog
          onClose={() => setShowDiscovery(false)}
          onCreate={(d) => {
            addDiscoveryQuestionSet(d);
            setShowDiscovery(false);
            toast.success(`Generated ${d.questions.length} discovery questions`);
          }}
        />
      )}
    </div>
  );
}

function ObjectionCard({
  objection, onDelete,
}: {
  objection: ObjectionResponse;
  onDelete: () => void;
}) {
  const categoryLabel = OBJECTION_CATEGORIES.find((c) => c.value === objection.category)?.label ?? objection.category;
  const [copied, setCopied] = useState<number | null>(null);

  function copyScript(idx: number, script: string) {
    navigator.clipboard.writeText(script);
    setCopied(idx);
    setTimeout(() => setCopied(null), 1500);
    toast.success("Script copied");
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <Badge variant="outline" className="mb-1.5 text-[10px]">{categoryLabel}</Badge>
            <CardTitle className="text-sm italic">"{objection.objection}"</CardTitle>
            <CardDescription className="text-xs mt-1">
              {objection.productName ?? "General"} · {formatDateTime(objection.createdAt)}
            </CardDescription>
          </div>
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-rose-600 hover:text-rose-700">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {objection.responses.map((r, i) => (
          <div key={i} className="border rounded-lg p-2.5">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="text-xs font-semibold text-primary">{r.approach}</div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyScript(i, r.script)}
                className="h-6 px-2"
              >
                {copied === i ? <span className="text-[10px]">✓</span> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
            <p className="text-xs leading-relaxed">{r.script}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function HandleObjectionDialog({
  onClose, onCreate,
}: {
  onClose: () => void;
  onCreate: (o: ObjectionResponse) => void;
}) {
  const [objection, setObjection] = useState("");
  const [category, setCategory] = useState<ObjectionCategory | "">("");
  const [productName, setProductName] = useState("Marqai Marketing Suite");
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (!objection.trim()) {
      toast.error("Enter the objection");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/marqai/sales/objection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objection,
          category: category || undefined,
          productName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");

      const o: ObjectionResponse = {
        id: uid("ob"),
        objection,
        category: data.category,
        productName,
        responses: data.responses,
        createdAt: new Date().toISOString(),
      };
      onCreate(o);
      if (data.source === "fallback" && data.warning) {
        toast.warning("Used fallback responses", { description: data.warning.slice(0, 200) });
      }
    } catch (e) {
      toast.error("Generation failed", {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Handle an Objection</DialogTitle>
          <DialogDescription>
            Enter the verbatim objection. The AI will produce three distinct response strategies with verbatim scripts.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Objection (verbatim)</Label>
            <Textarea
              value={objection}
              onChange={(e) => setObjection(e.target.value)}
              rows={2}
              placeholder="e.g. It's too expensive — we can't afford that right now."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category (optional — auto-detected)</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ObjectionCategory)}>
                <SelectTrigger><SelectValue placeholder="Auto-detect" /></SelectTrigger>
                <SelectContent>
                  {OBJECTION_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Product Name</Label>
              <Input value={productName} onChange={(e) => setProductName(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handle} disabled={loading}>
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating…</>
            ) : (
              <><Shield className="h-4 w-4 mr-1" /> Generate Responses</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DiscoveryDialog({
  onClose, onCreate,
}: {
  onClose: () => void;
  onCreate: (d: DiscoveryQuestionSet) => void;
}) {
  const salesAgents = useMarqai((s) => s.salesAgents);
  const discoveryAgents = salesAgents.filter((a) => a.type === "discovery");

  const [agentId, setAgentId] = useState(discoveryAgents[0]?.id ?? salesAgents[0]?.id ?? "");
  const [prospectCompany, setProspectCompany] = useState("");
  const [prospectPersona, setProspectPersona] = useState("VP Marketing at a Series B SaaS company");
  const [prospectContext, setProspectContext] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!prospectCompany.trim() || !prospectPersona.trim()) {
      toast.error("Prospect company and persona are required");
      return;
    }
    setLoading(true);
    const agent = salesAgents.find((a) => a.id === agentId);
    try {
      const res = await fetch("/api/marqai/sales/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          methodology: agent?.methodology ?? "SPIN",
          productContext: agent?.productContext ?? "B2B SaaS product",
          prospectCompany,
          prospectPersona,
          prospectContext: prospectContext || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");

      const d: DiscoveryQuestionSet = {
        id: uid("dq"),
        prospectCompany,
        prospectPersona,
        productContext: agent?.productContext ?? "B2B SaaS product",
        methodology: agent?.methodology ?? "SPIN",
        questions: data.questions,
        createdAt: new Date().toISOString(),
      };
      onCreate(d);
      if (data.source === "fallback" && data.warning) {
        toast.warning("Used fallback questions", { description: data.warning.slice(0, 200) });
      }
    } catch (e) {
      toast.error("Generation failed", {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Generate Discovery Questions</DialogTitle>
          <DialogDescription>
            AI generates a tailored set of {`SPIN/BANT/MEDDIC`} discovery questions for the prospect.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Agent / Methodology</Label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {discoveryAgents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name} ({a.methodology})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prospect Company</Label>
              <Input value={prospectCompany} onChange={(e) => setProspectCompany(e.target.value)} />
            </div>
            <div>
              <Label>Prospect Persona</Label>
              <Input value={prospectPersona} onChange={(e) => setProspectPersona(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Research Notes (optional)</Label>
            <Textarea
              value={prospectContext}
              onChange={(e) => setProspectContext(e.target.value)}
              rows={2}
              placeholder="Anything you already know about this prospect."
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={generate} disabled={loading}>
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating…</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-1" /> Generate Questions</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
