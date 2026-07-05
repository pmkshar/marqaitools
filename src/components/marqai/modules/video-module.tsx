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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Video,
  Sparkles,
  Loader2,
  Play,
  Wand2,
  Film,
  Clock,
  Download,
  X,
  CheckCircle2,
} from "lucide-react";
import type { VideoProject } from "@/lib/marqai/types";
import { formatDateTime, formatNumber, uid } from "@/lib/marqai/utils";
import { KpiCard } from "../kpi-card";

const stylePresets = [
  { id: "promo", label: "Promo", duration: 30 },
  { id: "explainer", label: "Explainer", duration: 60 },
  { id: "social-short", label: "Social Short (Reel/Shorts)", duration: 15 },
  { id: "tutorial", label: "Tutorial", duration: 90 },
  { id: "testimonial", label: "Testimonial", duration: 45 },
];

const aspectRatios = [
  { id: "16:9", label: "16:9 Landscape (YouTube)" },
  { id: "9:16", label: "9:16 Vertical (Reels/Shorts/TikTok)" },
  { id: "1:1", label: "1:1 Square (Feed)" },
  { id: "4:5", label: "4:5 Portrait (Instagram)" },
];

const quickScripts = [
  "Hook: Stop juggling 9 marketing tools. Cut to: Marqai dashboard. CTA: Start free.",
  "POV: you ran an SEO audit in 15 seconds. Yes, that's Marqai.",
  "Why most 'AI tool reviews' are vibes. Marqai runs 40+ objective test cases. Show report card.",
  "How Aurora Labs cut content production time by 64% after switching to Marqai.",
];

export function VideoModule() {
  const videos = useMarqai((s) => s.videos);
  const addVideo = useMarqai((s) => s.addVideo);
  const updateVideo = useMarqai((s) => s.updateVideo);

  const [title, setTitle] = useState("");
  const [script, setScript] = useState("");
  const [style, setStyle] = useState<VideoProject["style"]>("social-short");
  const [aspectRatio, setAspectRatio] = useState<VideoProject["aspectRatio"]>("9:16");
  const [generating, setGenerating] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<VideoProject | null>(null);

  async function generate() {
    if (!title.trim() || !script.trim()) {
      toast.error("Title and script are required");
      return;
    }
    setGenerating(true);
    const stylePreset = stylePresets.find((s) => s.id === style);
    const newVideo: VideoProject = {
      id: uid("vid"),
      title,
      script,
      durationSec: stylePreset?.duration ?? 30,
      style,
      aspectRatio,
      status: "rendering",
      scenes: [],
      createdAt: new Date().toISOString(),
    };
    addVideo(newVideo);
    try {
      const res = await fetch("/api/marqai/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          script,
          style,
          aspectRatio,
          durationSec: newVideo.durationSec,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Render failed");
      updateVideo(newVideo.id, {
        status: "done",
        scenes: data.video.scenes,
        thumbnailUrl: data.video.thumbnailUrl,
      });
      toast.success("Video rendered");
      setTitle("");
      setScript("");
    } catch (e) {
      updateVideo(newVideo.id, { status: "failed" });
      toast.error(e instanceof Error ? e.message : "Render failed");
    } finally {
      setGenerating(false);
    }
  }

  function aspectRatioClass(ratio: string): string {
    switch (ratio) {
      case "16:9":
        return "aspect-video";
      case "9:16":
        return "aspect-[9/16] max-h-[400px] mx-auto";
      case "1:1":
        return "aspect-square max-w-[400px] mx-auto";
      case "4:5":
        return "aspect-[4/5] max-h-[400px] mx-auto";
      default:
        return "aspect-video";
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total videos" value={videos.length} icon={Video} accent="rose" />
        <KpiCard label="Rendered today" value={videos.filter((v) => isToday(v.createdAt)).length} icon={Film} accent="emerald" />
        <KpiCard label="Avg duration" value={`${Math.round(videos.reduce((s, v) => s + v.durationSec, 0) / Math.max(1, videos.length))}s`} icon={Clock} accent="amber" />
        <KpiCard label="Total watch time" value={`${formatNumber(videos.reduce((s, v) => s + v.durationSec * 1240, 0) / 60)}m`} icon={Play} accent="violet" hint="est. views × duration" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Film className="h-4 w-4 text-primary" /> Video generator
            </CardTitle>
            <CardDescription>Turn a script into a marketing video — Marqai auto-splits scenes, picks visuals, and renders.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="vtitle">Title</Label>
              <Input id="vtitle" placeholder="Marqai — 30s Product Reel" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="vscript">Script / brief</Label>
              <Textarea
                id="vscript"
                placeholder="Hook → Setup → CTA. Marqai will split this into 3-5 scenes."
                value={script}
                onChange={(e) => setScript(e.target.value)}
                rows={4}
                className="mt-1"
              />
              <div className="text-[11px] text-muted-foreground mt-1">{script.length} chars · ~{Math.ceil(script.split(/\s+/).length / 2.5)}s spoken</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Style</Label>
                <Select value={style} onValueChange={(v) => setStyle(v as VideoProject["style"])}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {stylePresets.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label} · {s.duration}s
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Aspect ratio</Label>
                <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as VideoProject["aspectRatio"])}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {aspectRatios.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={generate} disabled={generating} size="lg" className="w-full">
              {generating ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
              {generating ? "Rendering..." : "Generate video"}
            </Button>
            <div>
              <div className="text-xs text-muted-foreground mb-2">Quick scripts:</div>
              <div className="flex flex-wrap gap-2">
                {quickScripts.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setScript(s);
                      setTitle(s.split(".")[0].slice(0, 50));
                    }}
                    className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-muted/70 transition-colors"
                  >
                    {s.length > 50 ? s.slice(0, 50) + "..." : s}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Render pipeline</CardTitle>
            <CardDescription>What happens when you click Generate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <PipelineStep n={1} title="Script analysis" desc="Split script into 3-5 scenes; assign voiceover + on-screen visuals." />
            <PipelineStep n={2} title="Storyboard generation" desc="Pick stock B-roll, generate text overlays, choose transitions." />
            <PipelineStep n={3} title="Voiceover synthesis" desc="Generate AI voiceover at the right pace for the chosen duration." />
            <PipelineStep n={4} title="Music & captions" desc="Add royalty-free music and auto-burned captions." />
            <PipelineStep n={5} title="Render & export" desc="Render at the chosen aspect ratio and return thumbnail + scenes." />
          </CardContent>
        </Card>
      </div>

      {/* Library */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Video library</CardTitle>
          <CardDescription>{videos.length} video{videos.length !== 1 ? "s" : ""} rendered</CardDescription>
        </CardHeader>
        <CardContent>
          {videos.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No videos yet. Generate your first marketing video above.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((v) => (
                <div key={v.id} className="rounded-lg border border-border overflow-hidden hover:border-primary/40 transition-colors cursor-pointer" onClick={() => v.status === "done" && setPreviewVideo(v)}>
                  <div className={`relative ${aspectRatioClass(v.aspectRatio)} bg-muted`}>
                    {v.thumbnailUrl ? (
                      <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {v.status === "done" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="h-5 w-5 text-black ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-[10px]">{v.durationSec}s</Badge>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="secondary" className="text-[10px]">{v.aspectRatio}</Badge>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="text-sm font-medium line-clamp-1">{v.title}</div>
                      {v.status === "done" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : v.status === "rendering" ? (
                        <Loader2 className="h-4 w-4 animate-spin text-amber-500 shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-destructive shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground line-clamp-2">{v.script}</div>
                    <div className="text-[10px] text-muted-foreground mt-1.5">{formatDateTime(v.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview modal */}
      {previewVideo && (
        <Dialog open onOpenChange={() => setPreviewVideo(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Video className="h-4 w-4" /> {previewVideo.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className={`relative ${aspectRatioClass(previewVideo.aspectRatio)} bg-black rounded-lg overflow-hidden`}>
                {previewVideo.thumbnailUrl && (
                  <img src={previewVideo.thumbnailUrl} alt={previewVideo.title} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="h-6 w-6 text-black ml-1" fill="currentColor" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">Duration</Label>
                  <div>{previewVideo.durationSec}s</div>
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">Aspect</Label>
                  <div>{previewVideo.aspectRatio}</div>
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">Style</Label>
                  <div className="capitalize">{previewVideo.style.replace("-", " ")}</div>
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">Scenes</Label>
                  <div>{previewVideo.scenes.length}</div>
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase text-muted-foreground">Scene breakdown</Label>
                <div className="space-y-2 mt-2">
                  {previewVideo.scenes.map((s) => (
                    <div key={s.index} className="p-3 rounded-lg border border-border bg-muted/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px]">Scene {s.index}</Badge>
                        <div className="text-xs text-muted-foreground">{s.visual}</div>
                      </div>
                      <div className="text-sm">{s.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm">
                <Download className="h-3.5 w-3.5 mr-1.5" /> Download MP4
              </Button>
              <DialogClose asChild>
                <Button size="sm">Close</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function PipelineStep({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
        {n}
      </div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
}
