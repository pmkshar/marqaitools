"use client";

import { useState, useMemo } from "react";
import { useMarqai } from "@/lib/marqai/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KpiCard } from "../kpi-card";
import { LoadingState, EmptyState } from "../loading-states";
import { toast } from "sonner";
import {
  MessageCircle,
  Send,
  Users,
  FileText,
  BarChart3,
  Plug,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Phone,
  Tag,
  Copy,
  ExternalLink,
  ChevronDown,
  Webhook,
  RefreshCw,
  Filter,
} from "lucide-react";
import type {
  WhatsAppTemplate,
  WhatsAppContact,
  WhatsAppContactList,
  WhatsAppCampaign,
  WhatsAppCampaignStats,
  WhatsAppMessageLog,
  WhatsAppConnection,
  WhatsAppTemplateCategory,
  WhatsAppTemplateStatus,
  WhatsAppCampaignType,
  WhatsAppCampaignStatus,
  WhatsAppMessageStatus,
} from "@/lib/marqai/types";
import { formatDateTime, formatDate, uid } from "@/lib/marqai/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
  PieChart,
  Pie,
} from "recharts";

const TEMPLATE_CATEGORIES: { id: WhatsAppTemplateCategory; label: string }[] = [
  { id: "marketing", label: "Marketing" },
  { id: "utility", label: "Utility" },
  { id: "authentication", label: "Authentication" },
  { id: "transactional", label: "Transactional" },
];

const TEMPLATE_STATUSES: { id: WhatsAppTemplateStatus; label: string; color: string }[] = [
  { id: "approved", label: "Approved", color: "bg-emerald-100 text-emerald-700" },
  { id: "pending", label: "Pending review", color: "bg-amber-100 text-amber-700" },
  { id: "rejected", label: "Rejected", color: "bg-rose-100 text-rose-700" },
  { id: "draft", label: "Draft", color: "bg-slate-100 text-slate-700" },
];

const CAMPAIGN_TYPES: { id: WhatsAppCampaignType; label: string; desc: string }[] = [
  { id: "broadcast", label: "Broadcast", desc: "Send now to a contact list" },
  { id: "scheduled", label: "Scheduled", desc: "Send at a future date/time" },
  { id: "api-triggered", label: "API-triggered", desc: "Triggered via REST API by external systems" },
];

const CAMPAIGN_STATUS_COLORS: Record<WhatsAppCampaignStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  scheduled: "bg-blue-100 text-blue-700",
  sending: "bg-amber-100 text-amber-700",
  sent: "bg-emerald-100 text-emerald-700",
  partial: "bg-amber-100 text-amber-700",
  aborted: "bg-rose-100 text-rose-700",
};

const MESSAGE_STATUS_COLORS: Record<WhatsAppMessageStatus, string> = {
  queued: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  delivered: "bg-cyan-100 text-cyan-700",
  read: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  clicked: "bg-violet-100 text-violet-700",
  replied: "bg-amber-100 text-amber-700",
};

export function WhatsAppModule() {
  const [tab, setTab] = useState("campaigns");

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <Card className="relative overflow-hidden border-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_60%)]" />
        <CardContent className="relative p-6 md:p-8 text-white">
          <Badge className="bg-white/20 text-white border-0 mb-3 backdrop-blur-sm">
            <MessageCircle className="h-3 w-3 mr-1" /> WhatsApp Business Cloud API
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
            Send marketing broadcasts to thousands at once.
          </h2>
          <p className="text-white/85 text-sm md:text-base max-w-2xl">
            Build template messages, manage opt-in contacts, schedule broadcasts, and track delivery / read / reply
            analytics. REST API ready so other tools can trigger WhatsApp campaigns for their own products.
          </p>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 max-w-3xl">
          <TabsTrigger value="campaigns" className="text-xs"><Send className="h-3.5 w-3.5 mr-1.5" /> Campaigns</TabsTrigger>
          <TabsTrigger value="templates" className="text-xs"><FileText className="h-3.5 w-3.5 mr-1.5" /> Templates</TabsTrigger>
          <TabsTrigger value="contacts" className="text-xs"><Users className="h-3.5 w-3.5 mr-1.5" /> Contacts</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs"><BarChart3 className="h-3.5 w-3.5 mr-1.5" /> Analytics</TabsTrigger>
          <TabsTrigger value="api" className="text-xs"><Plug className="h-3.5 w-3.5 mr-1.5" /> API / Integration</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs"><Webhook className="h-3.5 w-3.5 mr-1.5" /> Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-4"><CampaignsTab /></TabsContent>
        <TabsContent value="templates" className="mt-4"><TemplatesTab /></TabsContent>
        <TabsContent value="contacts" className="mt-4"><ContactsTab /></TabsContent>
        <TabsContent value="analytics" className="mt-4"><AnalyticsTab /></TabsContent>
        <TabsContent value="api" className="mt-4"><ApiTab /></TabsContent>
        <TabsContent value="logs" className="mt-4"><LogsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// TAB: CAMPAIGNS
// ============================================================
function CampaignsTab() {
  const campaigns = useMarqai((s) => s.whatsappCampaigns);
  const addCampaign = useMarqai((s) => s.addWhatsAppCampaign);
  const updateCampaign = useMarqai((s) => s.updateWhatsAppCampaign);
  const deleteCampaign = useMarqai((s) => s.deleteWhatsAppCampaign);
  const templates = useMarqai((s) => s.whatsappTemplates);
  const contactLists = useMarqai((s) => s.whatsappContactLists);
  const contacts = useMarqai((s) => s.whatsappContacts);
  const addLogs = useMarqai((s) => s.addWhatsAppMessageLogs);

  const [showNew, setShowNew] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const totalSent = campaigns.reduce((s, c) => s + (c.stats?.sent ?? 0), 0);
  const totalDelivered = campaigns.reduce((s, c) => s + (c.stats?.delivered ?? 0), 0);
  const totalRead = campaigns.reduce((s, c) => s + (c.stats?.read ?? 0), 0);
  const totalClicked = campaigns.reduce((s, c) => s + (c.stats?.clicked ?? 0), 0);
  const deliveryRate = totalSent ? Math.round((totalDelivered / totalSent) * 100) : 0;
  const readRate = totalDelivered ? Math.round((totalRead / totalDelivered) * 100) : 0;

  async function sendCampaign(c: WhatsAppCampaign) {
    setSending(c.id);
    try {
      const res = await fetch("/api/marqai/whatsapp/send-broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: c.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");

      const newLogs: WhatsAppMessageLog[] = (data.logs ?? []).map((l: any) => ({
        id: l.id ?? uid("wa-log"),
        campaignId: c.id,
        campaignName: c.name,
        contactId: l.contactId,
        contactName: l.contactName,
        phone: l.phone,
        templateName: c.templateName,
        status: "queued",
        providerMessageId: l.providerMessageId,
        sentAt: new Date().toISOString(),
      }));

      addLogs(newLogs);
      updateCampaign(c.id, {
        status: "sent",
        sentAt: new Date().toISOString(),
        stats: data.stats as WhatsAppCampaignStats,
      });
      toast.success(`Broadcast sent to ${data.stats?.sent ?? 0} recipients`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Campaigns" value={campaigns.length} icon={Send} accent="emerald" />
        <KpiCard label="Messages sent" value={totalSent} icon={MessageCircle} accent="default" />
        <KpiCard label="Delivery rate" value={`${deliveryRate}%`} icon={CheckCircle2} accent="violet" />
        <KpiCard label="Read rate" value={`${readRate}%`} icon={TrendingUp} accent="amber" hint="of delivered" />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">All campaigns ({campaigns.length})</h3>
        <Button onClick={() => setShowNew(true)} size="sm">
          <Plus className="h-4 w-4 mr-1.5" /> New campaign
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card><CardContent><EmptyState icon={Send} title="No campaigns yet" description="Create your first WhatsApp broadcast to start sending marketing messages to your contacts." /></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {campaigns.map((c) => {
            const template = templates.find((t) => t.id === c.templateId);
            const stats = c.stats;
            const deliveryPct = stats && stats.sent > 0 ? Math.round((stats.delivered / stats.sent) * 100) : 0;
            const readPct = stats && stats.delivered > 0 ? Math.round((stats.read / stats.delivered) * 100) : 0;
            const isSending = sending === c.id;
            return (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-[260px]">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-sm">{c.name}</span>
                        <Badge variant="outline" className={`text-[10px] ${CAMPAIGN_STATUS_COLORS[c.status]}`}>{c.status}</Badge>
                        <Badge variant="outline" className="text-[10px] capitalize">{c.type.replace("-", " ")}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {c.templateName} · {c.recipientCount} recipients
                        {c.scheduledAt && <> · Scheduled {formatDateTime(c.scheduledAt)}</>}
                        {c.sentAt && <> · Sent {formatDateTime(c.sentAt)}</>}
                      </div>
                      {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                          <StatBox label="Sent" value={stats.sent} color="text-blue-600" />
                          <StatBox label="Delivered" value={stats.delivered} color="text-cyan-600" />
                          <StatBox label="Read" value={stats.read} color="text-emerald-600" />
                          <StatBox label="Clicked" value={stats.clicked} color="text-violet-600" />
                          <StatBox label="Failed" value={stats.failed} color="text-rose-600" />
                        </div>
                      )}
                      {stats && stats.sent > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="w-20 text-muted-foreground">Delivery</span>
                            <Progress value={deliveryPct} className="h-1.5 flex-1" />
                            <span className="w-10 text-right">{deliveryPct}%</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="w-20 text-muted-foreground">Read rate</span>
                            <Progress value={readPct} className="h-1.5 flex-1" />
                            <span className="w-10 text-right">{readPct}%</span>
                          </div>
                        </div>
                      )}
                      {c.notes && <div className="text-[11px] text-amber-700 mt-2 italic">⚠ {c.notes}</div>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(c.status === "draft" || c.status === "scheduled") && template?.status === "approved" && (
                        <Button size="sm" onClick={() => sendCampaign(c)} disabled={isSending}>
                          {isSending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                          {isSending ? "Sending..." : "Send now"}
                        </Button>
                      )}
                      {template && template.status !== "approved" && (c.status === "draft" || c.status === "scheduled") && (
                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700">Template pending</Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><ChevronDown className="h-3.5 w-3.5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {c.status === "scheduled" && (
                            <DropdownMenuItem onClick={() => updateCampaign(c.id, { status: "draft", scheduledAt: undefined })}>
                              <Clock className="h-3.5 w-3.5 mr-2" /> Unschedule
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => duplicateCampaign(c, addCampaign)}>
                            <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-rose-600" onClick={() => { deleteCampaign(c.id); toast.success("Campaign deleted"); }}>
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showNew && (
        <NewCampaignDialog
          onClose={() => setShowNew(false)}
          onCreate={(c) => {
            addCampaign(c);
            setShowNew(false);
            toast.success("Campaign created");
          }}
          templates={templates.filter((t) => t.status === "approved" || t.status === "pending")}
          contactLists={contactLists}
          contacts={contacts}
        />
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded border border-border p-1.5 text-center">
      <div className={`text-base font-semibold ${color}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
    </div>
  );
}

function duplicateCampaign(c: WhatsAppCampaign, addCampaign: (c: WhatsAppCampaign) => void) {
  addCampaign({
    ...c,
    id: uid("wa-camp"),
    name: `${c.name} (copy)`,
    status: "draft",
    sentAt: undefined,
    scheduledAt: undefined,
    stats: undefined,
    createdAt: new Date().toISOString(),
  });
  toast.success("Campaign duplicated as draft");
}

function NewCampaignDialog({
  onClose,
  onCreate,
  templates,
  contactLists,
  contacts,
}: {
  onClose: () => void;
  onCreate: (c: WhatsAppCampaign) => void;
  templates: WhatsAppTemplate[];
  contactLists: WhatsAppContactList[];
  contacts: WhatsAppContact[];
}) {
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [type, setType] = useState<WhatsAppCampaignType>("broadcast");
  const [audienceMode, setAudienceMode] = useState<"list" | "manual">("list");
  const [listId, setListId] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");

  const template = templates.find((t) => t.id === templateId);

  function handleCreate() {
    if (!name.trim()) { toast.error("Campaign name is required"); return; }
    if (!templateId) { toast.error("Select a template"); return; }
    let contactIds: string[] = [];
    if (audienceMode === "list") {
      const list = contactLists.find((l) => l.id === listId);
      if (!list) { toast.error("Select a contact list"); return; }
      // Only include opted-in contacts
      contactIds = list.contactIds.filter((cid) => {
        const c = contacts.find((x) => x.id === cid);
        return c?.optedIn;
      });
    } else {
      contactIds = selectedContactIds.filter((cid) => {
        const c = contacts.find((x) => x.id === cid);
        return c?.optedIn;
      });
    }
    if (contactIds.length === 0) { toast.error("No opted-in recipients selected"); return; }

    const c: WhatsAppCampaign = {
      id: uid("wa-camp"),
      name: name.trim(),
      templateId,
      templateName: template?.name ?? "",
      type,
      status: type === "scheduled" && scheduledAt ? "scheduled" : "draft",
      contactIds,
      recipientCount: contactIds.length,
      scheduledAt: type === "scheduled" && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    onCreate(c);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="h-4 w-4" /> New WhatsApp campaign</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="cn">Campaign name</Label>
            <Input id="cn" placeholder="e.g. Diwali Sale 2026 Broadcast" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Template</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Choose a template" /></SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} <span className="text-[10px] text-muted-foreground">({t.status})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {template && template.status !== "approved" && (
                <p className="text-[11px] text-amber-700 mt-1">⚠ This template is {template.status}. Meta will reject sends until it is approved.</p>
              )}
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as WhatsAppCampaignType)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Audience</Label>
            <div className="flex items-center gap-2 mt-1 mb-2">
              <Button size="sm" variant={audienceMode === "list" ? "default" : "outline"} onClick={() => setAudienceMode("list")}>From list</Button>
              <Button size="sm" variant={audienceMode === "manual" ? "default" : "outline"} onClick={() => setAudienceMode("manual")}>Manual select</Button>
            </div>
            {audienceMode === "list" ? (
              <Select value={listId} onValueChange={setListId}>
                <SelectTrigger><SelectValue placeholder="Choose a contact list" /></SelectTrigger>
                <SelectContent>
                  {contactLists.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name} ({l.contactIds.length} contacts)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="border border-border rounded-md max-h-48 overflow-y-auto p-2 space-y-1">
                {contacts.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 p-1.5 hover:bg-muted/40 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedContactIds.includes(c.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedContactIds((s) => [...s, c.id]);
                        else setSelectedContactIds((s) => s.filter((x) => x !== c.id));
                      }}
                      disabled={!c.optedIn}
                    />
                    <span className="text-sm flex-1">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.phone}</span>
                    {!c.optedIn && <Badge variant="outline" className="text-[9px] bg-rose-50 text-rose-700">opt-out</Badge>}
                  </label>
                ))}
              </div>
            )}
          </div>

          {type === "scheduled" && (
            <div>
              <Label htmlFor="sch">Schedule send at</Label>
              <Input id="sch" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="mt-1" />
            </div>
          )}

          <div>
            <Label htmlFor="nt">Notes (optional)</Label>
            <Textarea id="nt" placeholder="Internal notes about this campaign..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1" />
          </div>

          {template && (
            <div className="rounded-md border border-border p-3 bg-muted/20">
              <div className="text-xs font-medium mb-1">Template preview</div>
              <div className="text-xs whitespace-pre-wrap text-muted-foreground">{template.preview ?? template.body}</div>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleCreate}>Create campaign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// TAB: TEMPLATES
// ============================================================
function TemplatesTab() {
  const templates = useMarqai((s) => s.whatsappTemplates);
  const addTemplate = useMarqai((s) => s.addWhatsAppTemplate);
  const updateTemplate = useMarqai((s) => s.updateWhatsAppTemplate);
  const deleteTemplate = useMarqai((s) => s.deleteWhatsAppTemplate);
  const [editing, setEditing] = useState<WhatsAppTemplate | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function aiGenerate(intent: string) {
    if (!intent.trim()) { toast.error("Describe what the template should say"); return; }
    setGenerating(true);
    try {
      const res = await fetch("/api/marqai/whatsapp/generate-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: intent.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const t = normalizeTemplate(data.template, intent);
      addTemplate(t);
      toast.success("AI-generated template added as draft");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Templates" value={templates.length} icon={FileText} accent="emerald" />
        <KpiCard label="Approved" value={templates.filter((t) => t.status === "approved").length} icon={CheckCircle2} accent="default" />
        <KpiCard label="Pending" value={templates.filter((t) => t.status === "pending").length} icon={Clock} accent="amber" />
        <KpiCard label="Rejected" value={templates.filter((t) => t.status === "rejected").length} icon={XCircle} accent="rose" />
      </div>

      <AIGenerateCard
        title="AI Template Generator"
        description="Describe the message you want to send. Marqai will draft a Meta-compliant WhatsApp template with variables, header, footer, and CTA."
        placeholder="e.g. festive Diwali greeting + 20% off electronics + free shipping + Diwali10 code"
        actionLabel="Generate template"
        loading={generating}
        onAction={aiGenerate}
      />

      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Templates ({templates.length})</h3>
        <Button onClick={() => setShowNew(true)} size="sm"><Plus className="h-4 w-4 mr-1.5" /> New template</Button>
      </div>

      {templates.length === 0 ? (
        <Card><CardContent><EmptyState icon={FileText} title="No templates yet" description="Templates must be approved by Meta before they can be sent. Create one manually or use AI to draft one." /></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((t) => {
            const status = TEMPLATE_STATUSES.find((s) => s.id === t.status);
            const cat = TEMPLATE_CATEGORIES.find((c) => c.id === t.category);
            return (
              <Card key={t.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{t.name}</span>
                        <Badge variant="outline" className={`text-[10px] ${status?.color ?? ""}`}>{t.status}</Badge>
                        <Badge variant="outline" className="text-[10px]">{cat?.label ?? t.category}</Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{t.elementName} · {t.language}</div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><ChevronDown className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(t)}><Edit2 className="h-3.5 w-3.5 mr-2" /> Edit</DropdownMenuItem>
                        {t.status === "draft" && (
                          <DropdownMenuItem onClick={() => { updateTemplate(t.id, { status: "pending" }); toast.success("Submitted for Meta review"); }}>
                            <ExternalLink className="h-3.5 w-3.5 mr-2" /> Submit for review
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(t.body).then(() => toast.success("Body copied"))}>
                          <Copy className="h-3.5 w-3.5 mr-2" /> Copy body
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-rose-600" onClick={() => { deleteTemplate(t.id); toast.success("Template deleted"); }}>
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {t.header && <div className="text-xs font-medium mb-1">{t.header}</div>}
                  <div className="text-xs text-muted-foreground whitespace-pre-wrap mb-2 line-clamp-4">{t.body}</div>
                  {t.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {t.variables.map((v) => (
                        <span key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700">{v}</span>
                      ))}
                    </div>
                  )}
                  {t.footer && <div className="text-[10px] text-muted-foreground italic">{t.footer}</div>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {(showNew || editing) && (
        <TemplateEditorDialog
          template={editing}
          onClose={() => { setShowNew(false); setEditing(null); }}
          onSave={(t) => {
            if (editing) { updateTemplate(editing.id, t); toast.success("Template updated"); }
            else { addTemplate({ ...t, id: uid("wa-tpl"), createdAt: new Date().toISOString() }); toast.success("Template created as draft"); }
            setShowNew(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function TemplateEditorDialog({
  template,
  onClose,
  onSave,
}: {
  template: WhatsAppTemplate | null;
  onClose: () => void;
  onSave: (t: Omit<WhatsAppTemplate, "id" | "createdAt"> & Partial<Pick<WhatsAppTemplate, "id" | "createdAt">>) => void;
}) {
  const [name, setName] = useState(template?.name ?? "");
  const [elementName, setElementName] = useState(template?.elementName ?? "");
  const [category, setCategory] = useState<WhatsAppTemplateCategory>(template?.category ?? "marketing");
  const [language, setLanguage] = useState(template?.language ?? "en_US");
  const [header, setHeader] = useState(template?.header ?? "");
  const [body, setBody] = useState(template?.body ?? "");
  const [footer, setFooter] = useState(template?.footer ?? "");

  const variables = useMemo(() => {
    const matches = body.match(/\{\{\d+\}\}/g) ?? [];
    return Array.from(new Set(matches));
  }, [body]);

  const preview = useMemo(() => {
    let p = body;
    const samples = ["Priya", "40", "All Summer Apparel", "SUMMER40", "https://shop.example.com/sale", "Marqai Pro", "$99", "$199", "Jul 15, 2026", "Dr. Smith", "Jul 10, 2026", "2:30 PM", "Order #88412"];
    variables.forEach((v, i) => {
      p = p.replace(new RegExp(v.replace(/[{}]/g, "\\$&"), "g"), samples[i] ?? v);
    });
    return p;
  }, [body, variables]);

  function handleSave() {
    if (!name.trim() || !body.trim()) { toast.error("Name and body are required"); return; }
    const finalElementName = elementName.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 50);
    onSave({
      ...(template ?? {}),
      name: name.trim(),
      elementName: finalElementName,
      category,
      language,
      header: header.trim() || undefined,
      body: body.trim(),
      footer: footer.trim() || undefined,
      variables,
      preview,
      status: template?.status ?? "draft",
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle>{template ? "Edit template" : "New WhatsApp template"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tn">Template name</Label>
              <Input id="tn" placeholder="Summer Sale 2026" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="en">Element name (lowercase, underscores)</Label>
              <Input id="en" placeholder="summer_sale_2026" value={elementName} onChange={(e) => setElementName(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as WhatsAppTemplateCategory)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Language</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as WhatsAppTemplate["language"])}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_US">English (US)</SelectItem>
                  <SelectItem value="en_GB">English (UK)</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="pt_BR">Portuguese (BR)</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="zh_CN">Chinese (Simplified)</SelectItem>
                  <SelectItem value="zh_TW">Chinese (Traditional)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="hd">Header (optional)</Label>
            <Input id="hd" placeholder="🔥 Summer Sale — Up to 40% off" value={header} onChange={(e) => setHeader(e.target.value)} className="mt-1" />
          </div>

          <div>
            <Label htmlFor="bd">Body — use {"{{1}}"}, {"{{2}}"} for variables</Label>
            <Textarea
              id="bd"
              placeholder="Hi {{1}}, our Summer Sale is live! Get {{2}}% off on {{3}}. Use code {{4}} at checkout."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="mt-1 font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground mt-1">{body.length} chars · {variables.length} variables detected</p>
          </div>

          <div>
            <Label htmlFor="ft">Footer (optional, max 60 chars)</Label>
            <Input id="ft" placeholder="Reply STOP to opt out" value={footer} onChange={(e) => setFooter(e.target.value)} maxLength={60} className="mt-1" />
          </div>

          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <div className="text-xs font-medium text-emerald-900 mb-1">Preview (with sample values)</div>
            <div className="text-xs text-emerald-900 whitespace-pre-wrap">
              {header && <div className="font-medium mb-1">{header}</div>}
              {preview || "(body will appear here)"}
              {footer && <div className="italic mt-1 text-[10px]">{footer}</div>}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSave}>{template ? "Save changes" : "Create draft"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function normalizeTemplate(raw: any, intent: string): WhatsAppTemplate {
  const body = String(raw.body ?? "");
  const variables = Array.from(new Set(body.match(/\{\{\d+\}\}/g) ?? []));
  const name = String(raw.name ?? intent.slice(0, 40));
  const elementName = String(raw.elementName ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 50));
  return {
    id: uid("wa-tpl"),
    name,
    elementName,
    category: (raw.category as WhatsAppTemplateCategory) ?? "marketing",
    language: (raw.language as WhatsAppTemplate["language"]) ?? "en_US",
    body,
    header: raw.header ?? undefined,
    footer: raw.footer ?? undefined,
    buttons: raw.buttons,
    status: "draft",
    variables,
    createdAt: new Date().toISOString(),
    preview: raw.preview,
  };
}

// ============================================================
// TAB: CONTACTS
// ============================================================
function ContactsTab() {
  const contacts = useMarqai((s) => s.whatsappContacts);
  const addContact = useMarqai((s) => s.addWhatsAppContact);
  const updateContact = useMarqai((s) => s.updateWhatsAppContact);
  const deleteContact = useMarqai((s) => s.deleteWhatsAppContact);
  const contactLists = useMarqai((s) => s.whatsappContactLists);
  const addList = useMarqai((s) => s.addWhatsAppContactList);
  const deleteList = useMarqai((s) => s.deleteWhatsAppContactList);
  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [filter, setFilter] = useState<"all" | "opted-in" | "opted-out">("all");
  const [search, setSearch] = useState("");

  const filtered = contacts.filter((c) => {
    if (filter === "opted-in" && !c.optedIn) return false;
    if (filter === "opted-out" && c.optedIn) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.phone.includes(search)) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total contacts" value={contacts.length} icon={Users} accent="emerald" />
        <KpiCard label="Opted-in" value={contacts.filter((c) => c.optedIn).length} icon={CheckCircle2} accent="default" />
        <KpiCard label="Opted-out" value={contacts.filter((c) => !c.optedIn).length} icon={XCircle} accent="rose" />
        <KpiCard label="Contact lists" value={contactLists.length} icon={Tag} accent="violet" />
      </div>

      <ImportContactsCard onImport={(rows) => {
        let added = 0;
        let skipped = 0;
        for (const r of rows) {
          if (!r.phone || !r.name) { skipped++; continue; }
          addContact({
            id: uid("wa-c"),
            name: r.name,
            phone: r.phone,
            email: r.email,
            optedIn: r.optedIn ?? true,
            tags: r.tags ?? [],
            customFields: r.customFields ?? {},
            createdAt: new Date().toISOString(),
          });
          added++;
        }
        toast.success(`Imported ${added} contacts${skipped ? `, skipped ${skipped} invalid rows` : ""}`);
        setShowImport(false);
      }} />

      {/* Contact lists */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Tag className="h-4 w-4" /> Contact lists ({contactLists.length})</CardTitle>
            <Button size="sm" variant="outline" onClick={() => {
              const name = prompt("List name?");
              if (!name) return;
              addList({ id: uid("wa-cl"), name, contactIds: [], createdAt: new Date().toISOString() });
              toast.success("List created");
            }}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> New list
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {contactLists.length === 0 ? (
            <p className="text-xs text-muted-foreground">No lists yet.</p>
          ) : contactLists.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-2 p-2 rounded border border-border">
              <div className="min-w-0">
                <div className="text-sm font-medium">{l.name}</div>
                <div className="text-[11px] text-muted-foreground">{l.contactIds.length} contacts · {l.description ?? "no description"}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete list "${l.name}"?`)) { deleteList(l.id); toast.success("List deleted"); } }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* All contacts */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Contacts ({filtered.length})</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Filter className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search name or phone" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-7 h-8 text-xs w-48" />
              </div>
              <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="opted-in">Opted-in</SelectItem>
                  <SelectItem value="opted-out">Opted-out</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => setShowImport(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Import</Button>
              <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Add</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState icon={Users} title="No contacts" description="Add contacts manually or import via CSV paste." />
          ) : (
            <div className="space-y-1">
              {filtered.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded border border-border hover:bg-muted/30">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{c.name}</span>
                      {c.optedIn ? (
                        <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700">opt-in</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] bg-rose-50 text-rose-700">opt-out</Badge>
                      )}
                      {c.tags.map((t) => <Badge key={t} variant="outline" className="text-[9px]">{t}</Badge>)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{c.phone} {c.email && `· ${c.email}`}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={c.optedIn} onCheckedChange={(v) => updateContact(c.id, { optedIn: v })} />
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete ${c.name}?`)) { deleteContact(c.id); toast.success("Contact deleted"); } }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showNew && (
        <NewContactDialog
          onClose={() => setShowNew(false)}
          onCreate={(c) => { addContact(c); setShowNew(false); toast.success("Contact added"); }}
        />
      )}
      {showImport && (
        <Dialog open onOpenChange={() => setShowImport(false)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Import contacts</DialogTitle></DialogHeader>
            <ImportContactsCard
              inline
              onImport={(rows) => {
                let added = 0; let skipped = 0;
                for (const r of rows) {
                  if (!r.phone || !r.name) { skipped++; continue; }
                  addContact({
                    id: uid("wa-c"),
                    name: r.name,
                    phone: r.phone,
                    email: r.email,
                    optedIn: r.optedIn ?? true,
                    tags: r.tags ?? [],
                    customFields: r.customFields ?? {},
                    createdAt: new Date().toISOString(),
                  });
                  added++;
                }
                toast.success(`Imported ${added}${skipped ? `, skipped ${skipped}` : ""}`);
                setShowImport(false);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function NewContactDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (c: WhatsAppContact) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [optedIn, setOptedIn] = useState(true);
  const [tags, setTags] = useState("");

  function handleCreate() {
    if (!name.trim() || !phone.trim()) { toast.error("Name and phone are required"); return; }
    if (!/^\+?\d{8,15}$/.test(phone.trim())) { toast.error("Phone must be E.164 format, e.g. +14155551234"); return; }
    onCreate({
      id: uid("wa-c"),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      optedIn,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add contact</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label htmlFor="n">Name</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
          <div><Label htmlFor="p">Phone (E.164)</Label><Input id="p" placeholder="+14155551234" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" /></div>
          <div><Label htmlFor="e">Email (optional)</Label><Input id="e" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" /></div>
          <div><Label htmlFor="t">Tags (comma-separated)</Label><Input id="t" placeholder="vip, newsletter" value={tags} onChange={(e) => setTags(e.target.value)} className="mt-1" /></div>
          <div className="flex items-center gap-2">
            <Switch checked={optedIn} onCheckedChange={setOptedIn} id="opt" />
            <Label htmlFor="opt" className="text-sm cursor-pointer">Opted-in to marketing messages</Label>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleCreate}>Add contact</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportContactsCard({
  onImport,
  inline,
}: {
  onImport: (rows: { name: string; phone: string; email?: string; optedIn?: boolean; tags?: string[]; customFields?: Record<string, string> }[]) => void;
  inline?: boolean;
}) {
  const [text, setText] = useState("");

  function parse() {
    const lines = text.trim().split("\n").filter(Boolean);
    const rows: { name: string; phone: string; email?: string; optedIn?: boolean; tags?: string[]; customFields?: Record<string, string> }[] = [];
    for (const line of lines) {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length < 2) continue;
      const [name, phone, email, tagsStr] = parts;
      rows.push({ name, phone, email: email || undefined, tags: tagsStr ? tagsStr.split(";").map((t) => t.trim()).filter(Boolean) : [] });
    }
    if (rows.length === 0) { toast.error("No valid rows. Format: name, phone, email, tags"); return; }
    onImport(rows);
    setText("");
  }

  if (inline) {
    return (
      <div className="space-y-2">
        <Textarea
          placeholder={"Name, Phone, Email, Tags\nPriya Menon, +14155551234, priya@example.com, vip; newsletter\nArjun Reddy, +14155552345, arjun@example.com, newsletter"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="text-xs font-mono"
        />
        <Button onClick={parse} size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> Import</Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4" /> Bulk import contacts</CardTitle>
        <CardDescription className="text-xs">Paste one contact per line: <code>name, phone, email, tags</code></CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder={"Priya Menon, +14155551234, priya@example.com, vip; newsletter\nArjun Reddy, +14155552345, arjun@example.com, newsletter"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="text-xs font-mono"
        />
        <Button onClick={parse} size="sm" className="mt-2"><Plus className="h-3.5 w-3.5 mr-1" /> Import</Button>
      </CardContent>
    </Card>
  );
}

// ============================================================
// TAB: ANALYTICS
// ============================================================
function AnalyticsTab() {
  const campaigns = useMarqai((s) => s.whatsappCampaigns);
  const logs = useMarqai((s) => s.whatsappMessageLogs);

  const sentCampaigns = campaigns.filter((c) => c.stats);
  const totals = sentCampaigns.reduce(
    (acc, c) => ({
      sent: acc.sent + (c.stats?.sent ?? 0),
      delivered: acc.delivered + (c.stats?.delivered ?? 0),
      read: acc.read + (c.stats?.read ?? 0),
      clicked: acc.clicked + (c.stats?.clicked ?? 0),
      replied: acc.replied + (c.stats?.replied ?? 0),
      failed: acc.failed + (c.stats?.failed ?? 0),
      optedOut: acc.optedOut + (c.stats?.optedOut ?? 0),
    }),
    { sent: 0, delivered: 0, read: 0, clicked: 0, replied: 0, failed: 0, optedOut: 0 },
  );

  const deliveryRate = totals.sent ? Math.round((totals.delivered / totals.sent) * 100) : 0;
  const readRate = totals.delivered ? Math.round((totals.read / totals.delivered) * 100) : 0;
  const clickRate = totals.delivered ? Math.round((totals.clicked / totals.delivered) * 100) : 0;
  const replyRate = totals.delivered ? Math.round((totals.replied / totals.delivered) * 100) : 0;
  const failureRate = totals.sent ? Math.round((totals.failed / totals.sent) * 100) : 0;

  const funnelData = [
    { stage: "Sent", count: totals.sent, fill: "#3b82f6" },
    { stage: "Delivered", count: totals.delivered, fill: "#06b6d4" },
    { stage: "Read", count: totals.read, fill: "#10b981" },
    { stage: "Clicked", count: totals.clicked, fill: "#8b5cf6" },
    { stage: "Replied", count: totals.replied, fill: "#f59e0b" },
  ];

  const statusPie = [
    { name: "Read", value: totals.read, fill: "#10b981" },
    { name: "Delivered (unread)", value: Math.max(0, totals.delivered - totals.read), fill: "#06b6d4" },
    { name: "Clicked", value: totals.clicked, fill: "#8b5cf6" },
    { name: "Replied", value: totals.replied, fill: "#f59e0b" },
    { name: "Failed", value: totals.failed, fill: "#ef4444" },
  ].filter((d) => d.value > 0);

  const byCampaign = sentCampaigns.map((c) => ({
    name: c.name.length > 20 ? c.name.slice(0, 18) + "…" : c.name,
    delivered: c.stats?.delivered ?? 0,
    read: c.stats?.read ?? 0,
    clicked: c.stats?.clicked ?? 0,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Delivery rate" value={`${deliveryRate}%`} icon={CheckCircle2} accent="emerald" hint={`${totals.delivered}/${totals.sent}`} />
        <KpiCard label="Read rate" value={`${readRate}%`} icon={TrendingUp} accent="default" hint="of delivered" />
        <KpiCard label="Click rate" value={`${clickRate}%`} icon={TrendingUp} accent="violet" hint="of delivered" />
        <KpiCard label="Failure rate" value={`${failureRate}%`} icon={XCircle} accent="rose" hint={`${totals.failed} failed`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Engagement funnel</CardTitle><CardDescription className="text-xs">Sent → Delivered → Read → Clicked → Replied</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} horizontal={false} />
                <XAxis type="number" stroke="currentColor" strokeOpacity={0.4} fontSize={10} />
                <YAxis type="category" dataKey="stage" stroke="currentColor" strokeOpacity={0.4} fontSize={11} width={70} />
                <Tooltip contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {funnelData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Message status distribution</CardTitle><CardDescription className="text-xs">Across all sent campaigns</CardDescription></CardHeader>
          <CardContent>
            {statusPie.length === 0 ? (
              <EmptyState icon={BarChart3} title="No data yet" description="Send a campaign to see status distribution." />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={40} label={(e) => `${e.name}: ${e.value}`} labelLine={false}>
                    {statusPie.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {byCampaign.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Per-campaign performance</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(180, byCampaign.length * 40)}>
              <BarChart data={byCampaign} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} horizontal={false} />
                <XAxis type="number" stroke="currentColor" strokeOpacity={0.4} fontSize={10} />
                <YAxis type="category" dataKey="name" stroke="currentColor" strokeOpacity={0.4} fontSize={10} width={120} />
                <Tooltip contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="delivered" name="Delivered" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                <Bar dataKey="read" name="Read" fill="#10b981" radius={[0, 4, 4, 0]} />
                <Bar dataKey="clicked" name="Clicked" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Recent message logs ({logs.length})</CardTitle></CardHeader>
        <CardContent className="max-h-96 overflow-y-auto scroll-thin space-y-1">
          {logs.slice(0, 50).map((l) => (
            <div key={l.id} className="flex items-center gap-3 p-2 rounded border border-border text-xs">
              <Badge variant="outline" className={`text-[9px] capitalize ${MESSAGE_STATUS_COLORS[l.status]}`}>{l.status}</Badge>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{l.contactName} <span className="text-muted-foreground">({l.phone})</span></div>
                <div className="text-[10px] text-muted-foreground truncate">{l.campaignName} · {l.templateName}</div>
              </div>
              <div className="text-[10px] text-muted-foreground text-right shrink-0">
                <div>Sent {formatDateTime(l.sentAt)}</div>
                {l.readAt && <div>Read {formatDateTime(l.readAt)}</div>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// TAB: API / INTEGRATION
// ============================================================
function ApiTab() {
  const connection = useMarqai((s) => s.whatsappConnection);
  const updateConnection = useMarqai((s) => s.updateWhatsAppConnection);
  const [connecting, setConnecting] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [, setForceRender] = useState(0);

  async function testConnection() {
    setConnecting(true);
    try {
      const res = await fetch("/api/marqai/whatsapp/test-connection");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      updateConnection({ connected: data.connected ?? false, qualityRating: data.qualityRating });
      toast.success(data.connected ? "Connection healthy" : "Connection issue detected");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Test failed");
    } finally {
      setConnecting(false);
    }
  }

  const apiKey = typeof window !== "undefined" ? (sessionStorage.getItem("whatsapp_api_key") ?? "") : "";
  const webhookUrl = connection.webhookUrl ?? "https://marqaitools.vercel.app/api/marqai/whatsapp/webhook";

  return (
    <div className="space-y-4">
      {/* Connection card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2"><Plug className="h-4 w-4" /> WhatsApp Business connection</CardTitle>
            <div className="flex items-center gap-2">
              {connection.connected ? (
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Connected</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700"><XCircle className="h-2.5 w-2.5 mr-1" /> Disconnected</Badge>
              )}
              <Button size="sm" variant="outline" onClick={testConnection} disabled={connecting}>
                {connecting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />} Test
              </Button>
              <Button size="sm" onClick={() => setShowConnect(true)}><Plug className="h-3.5 w-3.5 mr-1.5" /> {connection.connected ? "Reconnect" : "Connect"}</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <KV label="Provider" value={connection.provider.replace("-", " ")} />
            <KV label="Display name" value={connection.displayName ?? "—"} />
            <KV label="Phone number" value={connection.phoneNumber ?? "—"} />
            <KV label="Quality rating" value={connection.qualityRating ?? "—"} />
            <KV label="Messaging tier" value={connection.messagingTier ?? "—"} />
            <KV label="Phone number ID" value={connection.phoneNumberId ?? "—"} />
            <KV label="WABA ID" value={connection.wabaId ?? "—"} />
            <KV label="API key" value={connection.apiKeyMasked ?? "—"} />
          </div>
        </CardContent>
      </Card>

      {/* Webhook */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Webhook className="h-4 w-4" /> Webhook endpoint</CardTitle>
          <CardDescription className="text-xs">Configure this URL in your WhatsApp Business Manager → Webhooks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <code className="text-xs bg-muted px-2 py-1 rounded flex-1 break-all">{webhookUrl}</code>
            <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(webhookUrl).then(() => toast.success("Webhook URL copied"))}>
              <Copy className="h-3.5 w-3.5 mr-1" /> Copy
            </Button>
          </div>
          <div className="text-[11px] text-muted-foreground">
            Subscribes to: <code>messages</code>, <code>message_status</code>, <code>message_template_status_update</code>.
            Verify token: <code className="bg-muted px-1 rounded">marqai_verify_2026</code>
          </div>
        </CardContent>
      </Card>

      {/* REST API endpoints */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Plug className="h-4 w-4" /> REST API for external integrations</CardTitle>
          <CardDescription className="text-xs">Other tools and services can use these endpoints to trigger WhatsApp messages for their own products.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ApiEndpoint
            method="POST"
            path="/api/marqai/whatsapp/send-broadcast"
            auth="Bearer WHATSAPP_API_KEY"
            description="Send a broadcast to a list of recipients. Returns per-recipient message IDs."
            body={`{
  "campaignId": "wa-camp-xxx",
  // OR inline:
  "templateId": "wa-tpl-1",
  "contactIds": ["wa-c-1", "wa-c-2"],
  "variableOverrides": {
    "wa-c-1": { "{{1}}": "Priya", "{{2}}": "40" }
  }
}`}
            response={`{
  "ok": true,
  "stats": { "sent": 2, "delivered": 0, "read": 0, "failed": 0, "clicked": 0, "replied": 0, "optedOut": 0 },
  "logs": [{ "id": "wa-log-xxx", "contactId": "wa-c-1", "phone": "+14155551234", "providerMessageId": "wamid.HBgL..." }]
}`}
          />
          <ApiEndpoint
            method="POST"
            path="/api/marqai/whatsapp/send-single"
            auth="Bearer WHATSAPP_API_KEY"
            description="Send a single transactional message to one recipient (e.g. order confirmation)."
            body={`{
  "templateId": "wa-tpl-3",
  "phone": "+14155551234",
  "variables": { "{{1}}": "Priya", "{{2}}": "88412", "{{3}}": "https://track.example.com/88412", "{{4}}": "Jul 8, 2026" }
}`}
            response={`{ "ok": true, "messageId": "wamid.HBgL...", "status": "queued" }`}
          />
          <ApiEndpoint
            method="POST"
            path="/api/marqai/whatsapp/generate-template"
            auth="Bearer WHATSAPP_API_KEY"
            description="Use Marqai AI to draft a Meta-compliant WhatsApp template from a natural-language intent."
            body={`{ "intent": "Diwali greeting + 20% off electronics + free shipping + Diwali10 code" }`}
            response={`{ "ok": true, "template": { "name": "Diwali Sale 2026", "body": "Hi {{1}}, celebrate Diwali with {{2}}% off...", "variables": ["{{1}}", "{{2}}"] } }`}
          />
          <ApiEndpoint
            method="GET"
            path="/api/marqai/whatsapp/message-status?campaignId=wa-camp-1"
            auth="Bearer WHATSAPP_API_KEY"
            description="Get delivery / read / click status for all messages in a campaign."
            body="—"
            response={`{ "ok": true, "logs": [{ "id": "wa-log-1", "status": "read", "phone": "+14155551234", "sentAt": "...", "readAt": "..." }] }`}
          />
          <ApiEndpoint
            method="POST"
            path="/api/marqai/whatsapp/webhook"
            auth="Verify token: marqai_verify_2026"
            description="Webhook receiver for WhatsApp Cloud API callbacks (message status, inbound messages, template status)."
            body={`{ "object": "whatsapp_business_account", "entry": [{ "changes": [{ "value": { "messages": [...] } }] }] }`}
            response={`{ "ok": true }`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">API key</CardTitle><CardDescription className="text-xs">Use this key in the <code>Authorization: Bearer …</code> header for all REST calls.</CardDescription></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input readOnly value={apiKey ? `${apiKey.slice(0, 12)}…${apiKey.slice(-4)}` : "whatsapp_live_xxxxxxxxxxxxxxxxxxxx"} className="font-mono text-xs" />
            <Button size="sm" variant="outline" onClick={() => {
              const key = `whatsapp_live_${uid("")}${uid("")}`;
              sessionStorage.setItem("whatsapp_api_key", key);
              setForceRender((n) => n + 1);
              toast.success("New API key generated (stored in this session only)");
            }}>Generate</Button>
          </div>
          <p className="text-[11px] text-amber-700 mt-2">⚠ This demo stores the API key in <code>sessionStorage</code> only. In production, persist it server-side and rotate regularly.</p>
        </CardContent>
      </Card>

      {showConnect && (
        <ConnectDialog
          connection={connection}
          onClose={() => setShowConnect(false)}
          onSave={(patch) => { updateConnection(patch); setShowConnect(false); toast.success("Connection saved"); }}
        />
      )}
    </div>
  );
}

function ConnectDialog({
  connection,
  onClose,
  onSave,
}: {
  connection: WhatsAppConnection;
  onClose: () => void;
  onSave: (patch: Partial<WhatsAppConnection>) => void;
}) {
  const [provider, setProvider] = useState(connection.provider);
  const [phoneNumberId, setPhoneNumberId] = useState(connection.phoneNumberId ?? "");
  const [wabaId, setWabaId] = useState(connection.wabaId ?? "");
  const [displayName, setDisplayName] = useState(connection.displayName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(connection.phoneNumber ?? "");
  const [apiKey, setApiKey] = useState("");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Plug className="h-4 w-4" /> Connect WhatsApp Business</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Provider</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as WhatsAppConnection["provider"])}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="meta-cloud-api">Meta Cloud API</SelectItem>
                <SelectItem value="twilio">Twilio</SelectItem>
                <SelectItem value="messagebird">MessageBird</SelectItem>
                <SelectItem value="gupshup">Gupshup</SelectItem>
                <SelectItem value="360dialog">360dialog</SelectItem>
                <SelectItem value="manual">Manual (custom)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="pnid">Phone Number ID</Label><Input id="pnid" value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} className="mt-1" /></div>
            <div><Label htmlFor="waba">WABA ID</Label><Input id="waba" value={wabaId} onChange={(e) => setWabaId(e.target.value)} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="dn">Display name</Label><Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1" /></div>
            <div><Label htmlFor="ph">Phone (E.164)</Label><Input id="ph" placeholder="+14155550000" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="mt-1" /></div>
          </div>
          <div>
            <Label htmlFor="ak">API key / access token</Label>
            <Input id="ak" type="password" placeholder="EAAG…" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="mt-1" />
            <p className="text-[11px] text-muted-foreground mt-1">Stored encrypted; only the last 4 chars will be displayed.</p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={() => onSave({
            provider,
            phoneNumberId: phoneNumberId.trim() || undefined,
            wabaId: wabaId.trim() || undefined,
            displayName: displayName.trim() || undefined,
            phoneNumber: phoneNumber.trim() || undefined,
            apiKeyMasked: apiKey ? `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}` : connection.apiKeyMasked,
            connected: true,
            connectedAt: new Date().toISOString(),
          })}>Save & connect</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ApiEndpoint({ method, path, auth, description, body, response }: { method: string; path: string; auth: string; description: string; body: string; response: string }) {
  const methodColor = method === "GET" ? "bg-blue-100 text-blue-700" : method === "POST" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700";
  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-center gap-2 mb-1">
        <Badge className={`text-[10px] ${methodColor}`} variant="outline">{method}</Badge>
        <code className="text-xs font-mono">{path}</code>
      </div>
      <div className="text-xs text-muted-foreground mb-2">{description}</div>
      <div className="text-[10px] text-muted-foreground mb-1">Auth: <code className="bg-muted px-1 rounded">{auth}</code></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
        <div>
          <div className="text-[10px] font-medium text-muted-foreground mb-1">Request</div>
          <pre className="bg-muted p-2 rounded text-[10px] overflow-x-auto"><code>{body}</code></pre>
        </div>
        <div>
          <div className="text-[10px] font-medium text-muted-foreground mb-1">Response</div>
          <pre className="bg-muted p-2 rounded text-[10px] overflow-x-auto"><code>{response}</code></pre>
        </div>
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-medium truncate">{value}</div>
    </div>
  );
}

// ============================================================
// TAB: LOGS
// ============================================================
function LogsTab() {
  const logs = useMarqai((s) => s.whatsappMessageLogs);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = logs.filter((l) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (search && !l.contactName.toLowerCase().includes(search.toLowerCase()) && !l.phone.includes(search) && !l.campaignName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2"><Webhook className="h-4 w-4" /> Message logs ({filtered.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Input placeholder="Search phone / name / campaign" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 text-xs w-56" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="clicked">Clicked</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState icon={Webhook} title="No logs" description="Logs appear here once you start sending campaigns." />
          ) : (
            <div className="space-y-1 max-h-[600px] overflow-y-auto scroll-thin">
              {filtered.map((l) => (
                <div key={l.id} className="flex items-start gap-3 p-2 rounded border border-border text-xs">
                  <Badge variant="outline" className={`text-[9px] capitalize shrink-0 ${MESSAGE_STATUS_COLORS[l.status]}`}>{l.status}</Badge>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{l.contactName} <span className="text-muted-foreground">· {l.phone}</span></div>
                    <div className="text-[10px] text-muted-foreground">{l.campaignName} · {l.templateName}</div>
                    {l.providerMessageId && <div className="text-[9px] text-muted-foreground font-mono mt-0.5 truncate">{l.providerMessageId}</div>}
                    {l.error && <div className="text-[10px] text-rose-600 mt-0.5">⚠ {l.error}</div>}
                  </div>
                  <div className="text-[10px] text-muted-foreground text-right shrink-0">
                    <div>Sent {formatDateTime(l.sentAt)}</div>
                    {l.deliveredAt && <div>Delivered {formatDateTime(l.deliveredAt)}</div>}
                    {l.readAt && <div>Read {formatDateTime(l.readAt)}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// SHARED: AI Generate Card (reused for templates)
// ============================================================
function AIGenerateCard({
  title,
  description,
  placeholder,
  actionLabel,
  loading,
  onAction,
}: {
  title: string;
  description: string;
  placeholder: string;
  actionLabel: string;
  loading: boolean;
  onAction: (input: string) => void;
}) {
  const [input, setInput] = useState("");
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="h-6 w-6 rounded-md bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">AI</span>
          {title}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Textarea
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={2}
        />
        <Button size="sm" onClick={() => onAction(input)} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkle className="h-3.5 w-3.5 mr-1.5" />}
          {loading ? "Generating..." : actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

function Sparkle({ className }: { className?: string }) {
  return <span className={className}>✦</span>;
}
