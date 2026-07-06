"use client";

import { useState } from "react";
import { useMarqai } from "@/lib/marqai/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  LayoutTemplate, Loader2, Download, Trash2, Wand2, Code2, Eye, Globe,
} from "lucide-react";
import type { WebsiteAsset } from "@/lib/marqai/types";
import { uid, formatDateTime } from "@/lib/marqai/utils";
import { KpiCard } from "../kpi-card";

const PALETTES: { name: string; colors: string[] }[] = [
  { name: "Teal",     colors: ["#0d9488", "#14b8a6", "#f59e0b"] },
  { name: "Indigo",   colors: ["#4f46e5", "#6366f1", "#fbbf24"] },
  { name: "Rose",     colors: ["#e11d48", "#fb7185", "#0ea5e9"] },
  { name: "Emerald",  colors: ["#059669", "#10b981", "#f97316"] },
  { name: "Slate",    colors: ["#0f172a", "#334155", "#0ea5e9"] },
];

const TONES = ["confident, clear, benefit-led", "playful and energetic", "premium and exclusive", "friendly and helpful", "data-driven and analytical"];

export function WebsiteBuilderModule() {
  const websites = useMarqai((s) => s.websites);
  const addWebsite = useMarqai((s) => s.addWebsite);
  const deleteWebsite = useMarqai((s) => s.deleteWebsite);

  const [brandName, setBrandName] = useState("");
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState(TONES[0]);
  const [palette, setPalette] = useState<string[]>(PALETTES[0].colors);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<WebsiteAsset | null>(null);

  async function generate() {
    if (!brandName.trim() || !product.trim()) {
      toast.error("Brand name and product are required");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/marqai/generate-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName, product, audience, palette, tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Website generation failed");

      const asset: WebsiteAsset = {
        id: uid("site"),
        brandName,
        product,
        audience: audience || undefined,
        sections: data.sections,
        html: data.html,
        palette,
        createdAt: new Date().toISOString(),
      };
      addWebsite(asset);
      toast.success("Landing page generated", { description: `${data.sections.length} sections` });
    } catch (e) {
      toast.error("Website generation failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setGenerating(false);
    }
  }

  function downloadHtml(asset: WebsiteAsset) {
    const blob = new Blob([asset.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${asset.brandName.toLowerCase().replace(/\s+/g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function copyHtml(asset: WebsiteAsset) {
    navigator.clipboard.writeText(asset.html);
    toast.success("HTML copied to clipboard");
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <LayoutTemplate className="h-5 w-5 text-emerald-600" />
          <h2 className="text-2xl font-bold">Website Builder</h2>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Generate a complete, conversion-optimized landing page in seconds. AI writes hero copy,
          feature cards, testimonial, pricing tiers, FAQ, and final CTA. Export the result as a
          self-contained HTML file ready to deploy.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Pages created" value={String(websites.length)} icon={LayoutTemplate} accent="emerald" />
        <KpiCard label="Total sections" value={String(websites.reduce((n, w) => n + w.sections.length, 0))} icon={Code2} accent="violet" />
        <KpiCard label="Last generated" value={websites[0] ? formatDateTime(websites[0].createdAt) : "—"} icon={Globe} accent="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* CONFIG */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Configure your page</CardTitle>
            <CardDescription className="text-xs">The AI generates hero, features, testimonial, pricing, FAQ, and final CTA.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="brand">Brand name</Label>
              <Input id="brand" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Acme Marketing" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product">Product / Service</Label>
              <Textarea
                id="product"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="AI-powered SEO audit tool for in-house marketing teams. Saves 10 hours per audit."
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="audience">Target audience <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input id="audience" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="B2B marketing teams and founders" />
            </div>
            <div className="space-y-1.5">
              <Label>Tone</Label>
              <div className="grid grid-cols-1 gap-1.5">
                {TONES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`rounded-md border px-3 py-1.5 text-left text-xs transition ${tone === t ? "border-emerald-500 bg-emerald-50" : "border-border hover:bg-muted"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Palette</Label>
              <div className="grid grid-cols-3 gap-2">
                {PALETTES.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setPalette(p.colors)}
                    className={`rounded-md border px-2 py-2 text-left text-xs transition ${palette.join(",") === p.colors.join(",") ? "border-emerald-500 ring-1 ring-emerald-200" : "border-border hover:bg-muted"}`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      {p.colors.map((c) => (
                        <div key={c} className="h-3 w-3 rounded-full" style={{ background: c }} />
                      ))}
                    </div>
                    <div className="font-medium">{p.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <Button className="w-full" disabled={generating} onClick={generate}>
              {generating ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Generating (15s)...</> : <><Wand2 className="h-4 w-4 mr-1.5" /> Generate landing page</>}
            </Button>
            <div className="text-[11px] text-muted-foreground text-center">Uses 15 AI credits</div>
          </CardContent>
        </Card>

        {/* GALLERY */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Your landing pages</CardTitle>
            <CardDescription className="text-xs">{websites.length} saved · preview, copy, or download</CardDescription>
          </CardHeader>
          <CardContent>
            {websites.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                <LayoutTemplate className="h-8 w-8 mx-auto mb-3 opacity-30" />
                No pages yet. Configure on the left and hit Generate.
              </div>
            ) : (
              <div className="space-y-3">
                {websites.map((w) => (
                  <div key={w.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{w.brandName}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">{w.product}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="sm" variant="outline" className="h-7" onClick={() => setPreview(w)}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => copyHtml(w)} title="Copy HTML">
                          <Code2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => downloadHtml(w)} title="Download HTML">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => { deleteWebsite(w.id); toast.success("Page deleted"); }} title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {w.sections.map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] capitalize">{s.type}</Badge>
                      ))}
                      <span className="text-[10px] text-muted-foreground ml-1">{formatDateTime(w.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PREVIEW DIALOG */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-5xl h-[85vh] p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="text-base">{preview?.brandName} — Live preview</DialogTitle>
            <DialogDescription className="text-xs">
              Rendered inside an iframe. Use the buttons to copy or download the full HTML.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden h-full">
            {preview && (
              <iframe
                title="preview"
                srcDoc={preview.html}
                className="w-full h-[68vh] border-0 bg-white"
                sandbox="allow-same-origin"
              />
            )}
          </div>
          <DialogFooter className="p-3 border-t">
            <Button variant="outline" onClick={() => preview && copyHtml(preview)}>
              <Code2 className="h-4 w-4 mr-1.5" /> Copy HTML
            </Button>
            <Button onClick={() => preview && downloadHtml(preview)}>
              <Download className="h-4 w-4 mr-1.5" /> Download .html
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
