"use client";

import { useState } from "react";
import { useMarqai } from "@/lib/marqai/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { toast } from "sonner";
import {
  Target, Loader2, Trash2, Wand2, Download, Mail, Linkedin, Globe, Trophy,
} from "lucide-react";
import type { LeadList, LeadStatus } from "@/lib/marqai/types";
import { uid, formatDateTime } from "@/lib/marqai/utils";
import { KpiCard } from "../kpi-card";

const CATEGORIES = ["SaaS", "E-commerce", "D2C", "B2B Services", "Healthcare", "FinTech", "EdTech", "MarTech", "Real Estate", "Manufacturing"];
const MARKETS = ["India", "United States", "United Kingdom", "Singapore", "UAE", "Australia", "Germany", "Global"];
const STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "won", "lost"];

export function LeadsGeneratorModule() {
  const leadLists = useMarqai((s) => s.leadLists);
  const addLeadList = useMarqai((s) => s.addLeadList);
  const deleteLeadList = useMarqai((s) => s.deleteLeadList);
  const updateLeadStatus = useMarqai((s) => s.updateLeadStatus);

  const [productName, setProductName] = useState("");
  const [productCategory, setProductCategory] = useState("SaaS");
  const [targetMarket, setTargetMarket] = useState("India");
  const [criteria, setCriteria] = useState("");
  const [count, setCount] = useState(12);
  const [generating, setGenerating] = useState(false);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [fallbackWarning, setFallbackWarning] = useState<string | null>(null);

  const activeList = leadLists.find((l) => l.id === activeListId) ?? leadLists[0] ?? null;

  async function generate() {
    if (!productName.trim()) {
      toast.error("Enter a product / service name");
      return;
    }
    setGenerating(true);
    setFallbackWarning(null);
    try {
      const res = await fetch("/api/marqai/generate-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, productCategory, targetMarket, criteria, count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lead generation failed");

      // Surface fallback-mode warning to the user (AI unavailable → sample leads shown).
      if (data.source === "fallback" && data.warning) {
        setFallbackWarning(data.warning);
        toast.warning("Showing sample leads", { description: "AI service is unavailable — using demo data." });
      } else {
        setFallbackWarning(null);
        toast.success(`Generated ${data.leads.length} leads`, { description: "AI prospects ready for outreach" });
      }

      const list: LeadList = {
        id: uid("ll"),
        productName,
        productCategory,
        targetMarket,
        criteria,
        totalLeads: data.leads.length,
        leads: data.leads,
        createdAt: new Date().toISOString(),
      };
      addLeadList(list);
      setActiveListId(list.id);
    } catch (e) {
      toast.error("Lead generation failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setGenerating(false);
    }
  }

  function exportCsv(list: LeadList) {
    const headers = ["Company", "Website", "Industry", "Size", "Location", "Contact Name", "Contact Title", "Email", "LinkedIn", "Score", "Fit Reason", "Status"];
    const rows = list.leads.map((l) => [
      l.companyName,
      l.website ?? "",
      l.industry ?? "",
      l.size ?? "",
      l.location ?? "",
      l.contactName ?? "",
      l.contactTitle ?? "",
      l.email ?? "",
      l.linkedin ?? "",
      String(l.score),
      (l.fitReason ?? "").replace(/"/g, '""'),
      l.status,
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${list.productName.toLowerCase().replace(/\s+/g, "-")}-leads.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const avgScore = activeList && activeList.leads.length
    ? Math.round(activeList.leads.reduce((n, l) => n + l.score, 0) / activeList.leads.length)
    : 0;
  const wonCount = activeList?.leads.filter((l) => l.status === "won").length ?? 0;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Target className="h-5 w-5 text-emerald-600" />
          <h2 className="text-2xl font-bold">AI Leads Generator</h2>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Describe your product or service. The AI returns a list of qualified prospect companies — with
          website, industry, size, location, decision-maker name and title, fit-reason, and a 0-100 score.
          Export to CSV and pipe directly into your CRM or cold-outreach tool.
        </p>
        <div className="mt-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-800">
          <strong>Compliance note:</strong> AI-predicted emails use common patterns (first.last@domain) and
          must be verified before sending. Always comply with local anti-spam laws (CAN-SPAM, GDPR, DPDP).
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        <KpiCard label="Lead lists" value={String(leadLists.length)} icon={Target} accent="emerald" />
        <KpiCard label="Total leads" value={String(leadLists.reduce((n, l) => n + l.totalLeads, 0))} icon={Wand2} accent="violet" />
        <KpiCard label="Avg score" value={activeList ? String(avgScore) : "—"} icon={Trophy} accent="amber" />
        <KpiCard label="Won (active list)" value={String(wonCount)} icon={Trophy} accent="emerald" />
      </div>

      {/* FALLBACK WARNING BANNER */}
      {fallbackWarning && (
        <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <span className="text-base leading-none">⚠️</span>
            <div className="flex-1">
              <strong className="block mb-0.5">AI service unavailable — showing sample leads</strong>
              <span className="text-xs text-amber-800">{fallbackWarning}</span>
            </div>
            <button
              onClick={() => setFallbackWarning(null)}
              className="text-amber-700 hover:text-amber-900 text-xs underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* CONFIG */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Generate a lead list</CardTitle>
            <CardDescription className="text-xs">The AI returns up to 25 prospects per run.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="prod">Product / Service</Label>
              <Textarea
                id="prod"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="AI-powered SEO audit tool for in-house marketing teams"
                className="min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={productCategory} onValueChange={setProductCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Target market</Label>
                <Select value={targetMarket} onValueChange={setTargetMarket}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MARKETS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="criteria">Criteria <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                id="criteria"
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                placeholder="Mid-market companies with marketing teams of 5+, currently running paid ads"
                className="min-h-[60px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>How many leads? <span className="text-muted-foreground text-xs">({count})</span></Label>
              <input
                type="range"
                min={3}
                max={25}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <Button className="w-full" disabled={generating} onClick={generate}>
              {generating ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Generating ({count}s)...</> : <><Wand2 className="h-4 w-4 mr-1.5" /> Generate {count} leads</>}
            </Button>
            <div className="text-[11px] text-muted-foreground text-center">Uses {Math.max(2, Math.ceil(count / 2))} AI credits</div>
          </CardContent>
        </Card>

        {/* RESULTS */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Lead lists</CardTitle>
                <CardDescription className="text-xs">{leadLists.length} lists · click a row to expand</CardDescription>
              </div>
              {activeList && (
                <Button size="sm" variant="outline" onClick={() => exportCsv(activeList)}>
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* List tabs */}
            {leadLists.length > 1 && (
              <div className="flex flex-wrap gap-1.5 border-b pb-2">
                {leadLists.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setActiveListId(l.id)}
                    className={`rounded-md px-2.5 py-1 text-xs transition ${activeListId === l.id ? "bg-emerald-100 text-emerald-800" : "hover:bg-muted text-muted-foreground"}`}
                  >
                    {l.productName.slice(0, 22)}{l.productName.length > 22 ? "…" : ""} ({l.totalLeads})
                  </button>
                ))}
              </div>
            )}

            {!activeList ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-3 opacity-30" />
                No leads yet. Configure on the left and hit Generate.
              </div>
            ) : (
              <>
                {/* List header */}
                <div className="rounded-md bg-muted/50 px-3 py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{activeList.productName}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {activeList.productCategory} · {activeList.targetMarket} · {formatDateTime(activeList.createdAt)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-destructive hover:text-destructive"
                    onClick={() => {
                      deleteLeadList(activeList.id);
                      toast.success("List deleted");
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Leads table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead className="hidden md:table-cell">Contact</TableHead>
                        <TableHead className="hidden lg:table-cell">Industry</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Links</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeList.leads.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell>
                            <div className="font-medium text-sm">{l.companyName}</div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                              {l.size && <span>{l.size}</span>}
                              {l.location && <span>· {l.location}</span>}
                            </div>
                            {l.fitReason && (
                              <div className="text-[11px] text-slate-500 mt-1 max-w-xs line-clamp-2 italic">
                                "{l.fitReason}"
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="text-sm font-medium">{l.contactName ?? "—"}</div>
                            <div className="text-[11px] text-muted-foreground">{l.contactTitle ?? ""}</div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                            {l.industry ?? "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-[80px]">
                              <Progress value={l.score} className="h-1.5 w-12" />
                              <span className={`text-xs font-semibold ${l.score >= 80 ? "text-emerald-600" : l.score >= 60 ? "text-amber-600" : "text-slate-500"}`}>
                                {l.score}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={l.status}
                              onValueChange={(v) => updateLeadStatus(activeList.id, l.id, v as LeadStatus)}
                            >
                              <SelectTrigger className="h-7 w-[110px] text-[11px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {l.website && (
                                <a href={`https://${l.website}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-muted" title={l.website}>
                                  <Globe className="h-3.5 w-3.5 text-slate-500" />
                                </a>
                              )}
                              {l.linkedin && (
                                <a href={`https://${l.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-muted" title="LinkedIn">
                                  <Linkedin className="h-3.5 w-3.5 text-[#0a66c2]" />
                                </a>
                              )}
                              {l.email && (
                                <a href={`mailto:${l.email}`} className="p-1.5 rounded hover:bg-muted" title={l.email}>
                                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                                </a>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
