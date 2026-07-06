"use client";

import { useState } from "react";
import { useMarqai } from "@/lib/marqai/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  PenTool, Loader2, Download, Trash2, Sparkles, Palette, Wand2,
} from "lucide-react";
import type { LogoAsset, LogoStyle } from "@/lib/marqai/types";
import { uid, formatDateTime } from "@/lib/marqai/utils";
import { KpiCard } from "../kpi-card";

const STYLES: { id: LogoStyle; label: string; desc: string }[] = [
  { id: "minimal", label: "Minimal", desc: "Clean wordmark + accent bar" },
  { id: "wordmark", label: "Wordmark", desc: "Brand name front and center" },
  { id: "monogram", label: "Monogram", desc: "Intertwined initials in a circle" },
  { id: "emblem", label: "Emblem", desc: "Classic badge / crest style" },
  { id: "abstract", label: "Abstract", desc: "Geometric shape mark" },
  { id: "gradient", label: "Gradient", desc: "Modern gradient + initials" },
];

const PALETTES: { name: string; colors: string[] }[] = [
  { name: "Teal",     colors: ["#0d9488", "#14b8a6", "#f59e0b"] },
  { name: "Indigo",   colors: ["#4f46e5", "#6366f1", "#fbbf24"] },
  { name: "Rose",     colors: ["#e11d48", "#fb7185", "#0ea5e9"] },
  { name: "Emerald",  colors: ["#059669", "#10b981", "#f97316"] },
  { name: "Slate",    colors: ["#0f172a", "#334155", "#f1f5f9"] },
  { name: "Amber",    colors: ["#d97706", "#f59e0b", "#0d9488"] },
];

export function LogoBuilderModule() {
  const logos = useMarqai((s) => s.logos);
  const addLogo = useMarqai((s) => s.addLogo);
  const deleteLogo = useMarqai((s) => s.deleteLogo);

  const [brandName, setBrandName] = useState("");
  const [tagline, setTagline] = useState("");
  const [industry, setIndustry] = useState("");
  const [style, setStyle] = useState<LogoStyle>("minimal");
  const [palette, setPalette] = useState<string[]>(PALETTES[0].colors);
  const [mode, setMode] = useState<"template" | "ai">("template");
  const [generating, setGenerating] = useState(false);

  async function generate() {
    if (!brandName.trim()) {
      toast.error("Enter a brand name first");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/marqai/generate-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName, tagline, industry, style, palette, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Logo generation failed");

      const asset: LogoAsset = {
        id: uid("logo"),
        brandName,
        tagline: tagline || undefined,
        industry: industry || undefined,
        style,
        palette,
        imageUrl: data.url,
        svgContent: data.svg,
        prompt: data.prompt ?? `[${mode}] ${brandName} · ${style}`,
        createdAt: new Date().toISOString(),
      };
      addLogo(asset);
      toast.success("Logo generated", { description: mode === "ai" ? "AI image ready" : "SVG template ready" });
    } catch (e) {
      toast.error("Logo generation failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setGenerating(false);
    }
  }

  function downloadSvg(svg: string, name: string) {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.toLowerCase().replace(/\s+/g, "-")}-logo.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadUrl(url: string, name: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.toLowerCase().replace(/\s+/g, "-")}-logo.png`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <PenTool className="h-5 w-5 text-emerald-600" />
          <h2 className="text-2xl font-bold">Logo Builder</h2>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Generate brand logos in two modes: instant SVG templates (free, vector, editable) or
          AI-generated PNG logos (uses AI credits). All logos are saved to your workspace and can be re-downloaded anytime.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Logos created" value={String(logos.length)} icon={PenTool} accent="emerald" />
        <KpiCard label="AI logos" value={String(logos.filter((l) => l.imageUrl).length)} icon={Sparkles} accent="violet" />
        <KpiCard label="Template logos" value={String(logos.filter((l) => l.svgContent).length)} icon={Palette} accent="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* CONFIG */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Configure your logo</CardTitle>
            <CardDescription className="text-xs">Pick a template mode for instant SVG, or AI mode for a one-of-a-kind PNG.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="brand">Brand name</Label>
              <Input id="brand" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Acme Marketing" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tagline">Tagline <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Marketing that compounds" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="industry">Industry <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="SaaS · B2B · D2C" />
            </div>

            <div className="space-y-1.5">
              <Label>Generation mode</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode("template")}
                  className={`rounded-md border px-3 py-2 text-left text-sm transition ${mode === "template" ? "border-emerald-500 bg-emerald-50" : "border-border hover:bg-muted"}`}
                >
                  <div className="font-medium flex items-center gap-1.5"><Palette className="h-3.5 w-3.5" /> Template</div>
                  <div className="text-[11px] text-muted-foreground">Instant SVG · Free</div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("ai")}
                  className={`rounded-md border px-3 py-2 text-left text-sm transition ${mode === "ai" ? "border-violet-500 bg-violet-50" : "border-border hover:bg-muted"}`}
                >
                  <div className="font-medium flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> AI Image</div>
                  <div className="text-[11px] text-muted-foreground">8 credits · PNG</div>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Style</Label>
              <div className="grid grid-cols-3 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyle(s.id)}
                    className={`rounded-md border px-2 py-2 text-left text-xs transition ${style === s.id ? "border-emerald-500 bg-emerald-50" : "border-border hover:bg-muted"}`}
                  >
                    <div className="font-medium">{s.label}</div>
                    <div className="text-[10px] text-muted-foreground line-clamp-1">{s.desc}</div>
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
              {generating ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Generating...</> : <><Wand2 className="h-4 w-4 mr-1.5" /> Generate logo</>}
            </Button>
          </CardContent>
        </Card>

        {/* GALLERY */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Your logos</CardTitle>
            <CardDescription className="text-xs">{logos.length} saved · click to download</CardDescription>
          </CardHeader>
          <CardContent>
            {logos.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                <PenTool className="h-8 w-8 mx-auto mb-3 opacity-30" />
                No logos yet. Configure on the left and hit Generate.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {logos.map((l) => (
                  <div key={l.id} className="rounded-lg border overflow-hidden bg-white">
                    <div className="aspect-[2/1] flex items-center justify-center bg-slate-50 relative">
                      {l.imageUrl ? (
                        <img src={l.imageUrl} alt={l.brandName} className="max-w-full max-h-full object-contain" />
                      ) : l.svgContent ? (
                        <div dangerouslySetInnerHTML={{ __html: l.svgContent }} className="max-w-full max-h-full" />
                      ) : (
                        <div className="text-xs text-muted-foreground">No preview</div>
                      )}
                    </div>
                    <div className="p-3 border-t">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{l.brandName}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="secondary" className="text-[10px]">{l.style}</Badge>
                            <Badge variant="outline" className="text-[10px]">{l.imageUrl ? "AI" : "SVG"}</Badge>
                            <span className="text-[10px] text-muted-foreground">{formatDateTime(l.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              if (l.imageUrl) downloadUrl(l.imageUrl, l.brandName);
                              else if (l.svgContent) downloadSvg(l.svgContent, l.brandName);
                            }}
                            title="Download"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => {
                              deleteLogo(l.id);
                              toast.success("Logo deleted");
                            }}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
