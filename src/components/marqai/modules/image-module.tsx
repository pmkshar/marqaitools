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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  Sparkles,
  Loader2,
  Download,
  Copy,
  Trash2,
  Wand2,
  Heart,
  X,
} from "lucide-react";
import type { GeneratedImage } from "@/lib/marqai/types";
import { formatDateTime, uid } from "@/lib/marqai/utils";
import { KpiCard } from "../kpi-card";

const stylePresets = [
  { id: "photoreal", label: "Photoreal", prompt: "photorealistic, studio lighting, sharp focus, high detail" },
  { id: "marketing", label: "Marketing", prompt: "marketing hero banner, clean composition, brand-safe, modern" },
  { id: "social", label: "Social", prompt: "social media square, bold typography, vibrant, scroll-stopping" },
  { id: "3d", label: "3D Render", prompt: "3D render, octane, soft shadows, glossy, isometric" },
  { id: "illustration", label: "Illustration", prompt: "flat vector illustration, minimal, branded palette" },
  { id: "minimal", label: "Minimal", prompt: "minimalist, lots of whitespace, single accent color" },
];

const sizePresets = [
  { id: "1024x1024", label: "Square 1024×1024", ratio: "1:1" },
  { id: "1792x1024", label: "Landscape 1792×1024", ratio: "16:9" },
  { id: "1024x1792", label: "Portrait 1024×1792", ratio: "9:16" },
  { id: "1280x720", label: "Banner 1280×720", ratio: "16:9" },
];

const quickPrompts = [
  "Marketing dashboard on a laptop, emerald accent, 3D render",
  "AI tool testing lab, abstract, futuristic, dark background",
  "SEO growth chart, upward arrow, gradient emerald-to-teal",
  "Social media content calendar mockup, modern UI",
  "Email campaign blast, abstract envelopes floating",
  "Hero banner for AI marketing SaaS, abstract gradient",
];

export function ImageModule() {
  const images = useMarqai((s) => s.images);
  const addImage = useMarqai((s) => s.addImage);
  const updateImage = useMarqai((s) => s.updateImage);

  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("marketing");
  const [size, setSize] = useState("1024x1024");
  const [generating, setGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);

  async function generate() {
    if (!prompt.trim()) {
      toast.error("Enter a prompt first");
      return;
    }
    setGenerating(true);
    const newImage: GeneratedImage = {
      id: uid("img"),
      prompt,
      url: "",
      size,
      style,
      createdAt: new Date().toISOString(),
      status: "generating",
    };
    addImage(newImage);
    try {
      const stylePreset = stylePresets.find((s) => s.id === style);
      const fullPrompt = `${prompt}. Style: ${stylePreset?.prompt ?? ""}. Aspect ratio: ${size}.`;
      const res = await fetch("/api/marqai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: fullPrompt, size }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      updateImage(newImage.id, { url: data.url, status: "done" });
      toast.success("Image generated");
      setPrompt("");
    } catch (e) {
      updateImage(newImage.id, { status: "failed" });
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  const recent = images.slice(0, 12);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total images" value={images.length} icon={ImageIcon} accent="violet" />
        <KpiCard label="Generated today" value={images.filter((i) => isToday(i.createdAt)).length} icon={Sparkles} accent="emerald" />
        <KpiCard label="Avg generation time" value="3.2s" icon={Wand2} accent="amber" />
        <KpiCard label="Favorites" value={images.filter((_, i) => i % 4 === 0).length} icon={Heart} accent="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" /> Image generator
            </CardTitle>
            <CardDescription>Describe the marketing image you need — Marqai will generate it.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="e.g. Hero banner for AI marketing SaaS landing page, abstract gradient emerald-to-teal, floating UI cards"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Style preset</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {stylePresets.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Aspect ratio</Label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {sizePresets.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={generate} disabled={generating} size="lg" className="w-full">
              {generating ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
              {generating ? "Generating..." : "Generate image"}
            </Button>
            <div>
              <div className="text-xs text-muted-foreground mb-2">Quick prompts:</div>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(p)}
                    className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-muted/70 transition-colors"
                  >
                    {p.length > 40 ? p.slice(0, 40) + "..." : p}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tips for better prompts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-2">
              <Badge variant="outline" className="shrink-0">1</Badge>
              <span>Describe the <strong className="text-foreground">subject</strong> first (product, scene, character), then the <strong className="text-foreground">style</strong>, then the <strong className="text-foreground">mood</strong>.</span>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="shrink-0">2</Badge>
              <span>Specify the <strong className="text-foreground">aspect ratio</strong> upfront — square for IG, landscape for hero banners, portrait for Stories.</span>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="shrink-0">3</Badge>
              <span>Add brand cues: <em>"emerald accent", "geometric", "premium"</em> — they help the model match your visual identity.</span>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="shrink-0">4</Badge>
              <span>Avoid asking for real logos or copyrighted characters. The model declines those.</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gallery */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent generations</CardTitle>
          <CardDescription>{images.length} image{images.length !== 1 ? "s" : ""} in your library</CardDescription>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No images yet. Generate your first marketing image above.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {recent.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-border cursor-pointer"
                  onClick={() => img.status === "done" && setPreviewImage(img)}
                >
                  {img.status === "done" && img.url ? (
                    <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
                      {img.status === "generating" ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <X className="h-6 w-6 text-destructive" />
                      )}
                      <span className="text-[10px] text-muted-foreground mt-1">{img.status}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                    <div className="text-[10px] text-white/90 line-clamp-2 mb-1">{img.prompt}</div>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-[9px]">{img.style}</Badge>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(img.prompt);
                            toast.success("Prompt copied");
                          }}
                          className="h-6 w-6 rounded bg-white/20 hover:bg-white/30 flex items-center justify-center"
                          aria-label="Copy prompt"
                        >
                          <Copy className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 bg-black flex items-center justify-center min-h-[300px]">
              <img src={previewImage.url} alt={previewImage.prompt} className="max-w-full max-h-[80vh] object-contain" />
            </div>
            <div className="w-full md:w-80 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-semibold">Image details</h3>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewImage(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground">Prompt</Label>
                <p className="text-xs mt-1">{previewImage.prompt}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">Size</Label>
                  <div>{previewImage.size}</div>
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">Style</Label>
                  <div>{previewImage.style}</div>
                </div>
                <div className="col-span-2">
                  <Label className="text-[10px] uppercase text-muted-foreground">Created</Label>
                  <div>{formatDateTime(previewImage.createdAt)}</div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    // Handle both data: URLs (base64 from Z.AI SDK) and
                    // regular URLs. For data URLs, we decode → blob →
                    // object URL so the download attribute actually
                    // triggers a file download instead of opening a tab.
                    const url = previewImage.url;
                    if (url.startsWith("data:")) {
                      try {
                        const [meta, b64] = url.split(",");
                        const mimeMatch = meta.match(/data:([^;]+)/);
                        const mime = mimeMatch ? mimeMatch[1] : "image/png";
                        const ext = mime.split("/")[1] ?? "png";
                        const byteString = atob(b64);
                        const bytes = new Uint8Array(byteString.length);
                        for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);
                        const blob = new Blob([bytes], { type: mime });
                        const objUrl = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = objUrl;
                        a.download = `marqai-${previewImage.id}.${ext}`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(objUrl);
                        return;
                      } catch {
                        // fall through to default
                      }
                    }
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `marqai-${previewImage.id}.png`;
                    a.target = "_blank";
                    a.click();
                  }}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(previewImage.prompt);
                    toast.success("Prompt copied");
                  }}
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Prompt
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
}
