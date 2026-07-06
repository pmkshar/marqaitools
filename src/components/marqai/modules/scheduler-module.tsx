"use client";

import { useState, useMemo } from "react";
import { useMarqai } from "@/lib/marqai/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  CalendarDays,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Trash2,
  Edit3,
  Filter,
  List,
} from "lucide-react";
import { platformMeta } from "@/lib/marqai/mock-data";
import { formatDateTime, timeAgo, uid, formatNumber } from "@/lib/marqai/utils";
import type { Platform, ScheduledPost } from "@/lib/marqai/types";
import { KpiCard } from "../kpi-card";

const platformOptions: Platform[] = ["twitter", "linkedin", "facebook", "instagram", "youtube", "tiktok", "pinterest"];

export function SchedulerModule() {
  const scheduledPosts = useMarqai((s) => s.scheduledPosts);
  const addScheduledPost = useMarqai((s) => s.addScheduledPost);
  const updateScheduledPost = useMarqai((s) => s.updateScheduledPost);
  const deleteScheduledPost = useMarqai((s) => s.deleteScheduledPost);

  const [view, setView] = useState<"week" | "list">("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>(["twitter"]);
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [hashtags, setHashtags] = useState("");
  const [mediaType, setMediaType] = useState<"text" | "image" | "video">("text");

  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0 Sun
    d.setDate(d.getDate() - day);
    return d;
  }, [weekOffset]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const filteredPosts = useMemo(() => {
    if (filterPlatform === "all") return scheduledPosts;
    return scheduledPosts.filter((p) => p.platforms.includes(filterPlatform as Platform));
  }, [scheduledPosts, filterPlatform]);

  function openNew() {
    setEditingId(null);
    setTitle("");
    setContent("");
    setPlatforms(["twitter"]);
    setHashtags("");
    setMediaType("text");
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    setScheduledAt(d.toISOString().slice(0, 16));
    setOpen(true);
  }

  function openEdit(p: ScheduledPost) {
    setEditingId(p.id);
    setTitle(p.title);
    setContent(p.content);
    setPlatforms(p.platforms);
    setScheduledAt(new Date(p.scheduledAt).toISOString().slice(0, 16));
    setHashtags(p.hashtags.join(", "));
    setMediaType(p.mediaType);
    setOpen(true);
  }

  function save() {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    if (platforms.length === 0) {
      toast.error("Pick at least one platform");
      return;
    }
    const tagList = hashtags.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean).map((t) => `#${t}`);
    if (editingId) {
      updateScheduledPost(editingId, {
        title,
        content,
        platforms,
        scheduledAt: new Date(scheduledAt).toISOString(),
        hashtags: tagList,
        mediaType,
      });
      toast.success("Post updated");
    } else {
      const newPost: ScheduledPost = {
        id: uid("post"),
        title,
        content,
        platforms,
        scheduledAt: new Date(scheduledAt).toISOString(),
        status: "scheduled",
        hashtags: tagList,
        mediaType,
        author: "Priya M.",
      };
      addScheduledPost(newPost);
      toast.success("Post scheduled");
    }
    setOpen(false);
  }

  function postsForDay(day: Date) {
    return filteredPosts.filter((p) => {
      const pd = new Date(p.scheduledAt);
      return pd.getDate() === day.getDate() && pd.getMonth() === day.getMonth() && pd.getFullYear() === day.getFullYear();
    });
  }

  const today = new Date();
  const isToday = (d: Date) => d.toDateString() === today.toDateString();
  const upcoming = filteredPosts
    .filter((p) => new Date(p.scheduledAt) >= new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const published = filteredPosts.filter((p) => p.status === "published");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Scheduled" value={filteredPosts.filter((p) => p.status === "scheduled").length} icon={CalendarDays} accent="emerald" hint="next 30 days" />
        <KpiCard label="Published" value={published.length} icon={Clock} accent="violet" hint="all time" />
        <KpiCard label="Upcoming this week" value={upcoming.filter((p) => new Date(p.scheduledAt) <= new Date(Date.now() + 7 * 86400000)).length} icon={Clock} accent="amber" />
        <KpiCard label="Avg posts/day" value={(filteredPosts.length / 7).toFixed(1)} icon={CalendarDays} accent="rose" />
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> Content calendar
            </CardTitle>
            <CardDescription>
              {view === "week"
                ? `Week of ${weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`
                : "All scheduled posts"}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-40 h-9">
                <Filter className="h-3.5 w-3.5 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All platforms</SelectItem>
                {platformOptions.map((p) => (
                  <SelectItem key={p} value={p}>{platformMeta[p].name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex rounded-md border border-border overflow-hidden">
              <Button
                variant={view === "week" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("week")}
                className="rounded-none"
              >
                <CalendarDays className="h-3.5 w-3.5 mr-1.5" /> Week
              </Button>
              <Button
                variant={view === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("list")}
                className="rounded-none"
              >
                <List className="h-3.5 w-3.5 mr-1.5" /> List
              </Button>
            </div>

            {view === "week" && (
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setWeekOffset((o) => o - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>Today</Button>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setWeekOffset((o) => o + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Button onClick={openNew} size="sm">
              <Plus className="h-4 w-4 mr-1.5" /> Schedule post
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {view === "week" ? (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
              {weekDays.map((day, i) => {
                const posts = postsForDay(day);
                return (
                  <div
                    key={i}
                    className={`min-h-[160px] rounded-lg border p-2 ${isToday(day) ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {day.toLocaleDateString("en-US", { weekday: "short" })}
                        </div>
                        <div className={`text-sm font-semibold ${isToday(day) ? "text-primary" : ""}`}>
                          {day.getDate()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={openNew}
                        aria-label="Add"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      {posts.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => openEdit(p)}
                          className="w-full text-left p-1.5 rounded bg-muted/60 hover:bg-muted border border-transparent hover:border-border transition-colors"
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            {p.platforms.slice(0, 3).map((pl) => (
                              <span
                                key={pl}
                                className="h-3 w-3 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                                style={{ background: platformMeta[pl].color }}
                              >
                                {platformMeta[pl].icon.charAt(0)}
                              </span>
                            ))}
                          </div>
                          <div className="text-[11px] font-medium line-clamp-2 leading-tight">
                            {p.title}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(p.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto scroll-thin">
              {filteredPosts.length === 0 && (
                <p className="text-sm text-muted-foreground py-8 text-center">No posts match this filter</p>
              )}
              {filteredPosts
                .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
                .map((p) => (
                  <div key={p.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                    <div className="flex -space-x-1.5 mt-0.5">
                      {p.platforms.map((pl) => (
                        <div
                          key={pl}
                          className="h-7 w-7 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ background: platformMeta[pl].color }}
                        >
                          {platformMeta[pl].icon}
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="text-sm font-medium truncate">{p.title}</div>
                        <Badge
                          variant={p.status === "published" ? "default" : p.status === "failed" ? "destructive" : "secondary"}
                          className="text-[10px]"
                        >
                          {p.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{p.content}</div>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(p.scheduledAt)} ({timeAgo(p.scheduledAt)})
                        </span>
                        <span>·</span>
                        <span>{p.author}</span>
                        {p.hashtags.length > 0 && (
                          <>
                            <span>·</span>
                            <span>{p.hashtags.length} hashtags</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => {
                          deleteScheduledPost(p.id);
                          toast.success("Post deleted");
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Next up</CardTitle>
          <CardDescription>Upcoming scheduled content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcoming.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">No upcoming posts</p>
          )}
          {upcoming.slice(0, 5).map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors">
              <div className="text-center w-14 shrink-0">
                <div className="text-[10px] uppercase text-muted-foreground">
                  {new Date(p.scheduledAt).toLocaleDateString("en-US", { month: "short" })}
                </div>
                <div className="text-lg font-bold leading-none">{new Date(p.scheduledAt).getDate()}</div>
                <div className="text-[10px] text-muted-foreground">
                  {new Date(p.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </div>
              </div>
              <div className="flex -space-x-1.5">
                {p.platforms.map((pl) => (
                  <div
                    key={pl}
                    className="h-6 w-6 rounded-full border-2 border-background flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ background: platformMeta[pl].color }}
                  >
                    {platformMeta[pl].icon}
                  </div>
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{p.title}</div>
                <div className="text-xs text-muted-foreground truncate">{p.content}</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                <Edit3 className="h-3 w-3 mr-1" /> Edit
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit scheduled post" : "Schedule new post"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto scroll-thin pr-1">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Internal title for this post" />
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={5} placeholder="The actual post text" />
              <div className="text-[11px] text-muted-foreground mt-1">{content.length} chars</div>
            </div>
            <div>
              <Label>Platforms</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {platformOptions.map((p) => {
                  const selected = platforms.includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() =>
                        setPlatforms((prev) => (selected ? prev.filter((x) => x !== p) : [...prev, p]))
                      }
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs ${
                        selected ? "border-primary bg-primary/5 text-primary" : "border-border"
                      }`}
                    >
                      <span
                        className="h-3 w-3 rounded-full flex items-center justify-center text-[7px] font-bold text-white"
                        style={{ background: platformMeta[p].color }}
                      >
                        {platformMeta[p].icon.charAt(0)}
                      </span>
                      {platformMeta[p].name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="scheduledAt">Publish at</Label>
                <Input id="scheduledAt" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </div>
              <div>
                <Label>Media type</Label>
                <Select value={mediaType} onValueChange={(v) => setMediaType(v as any)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text only</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="hashtags">Hashtags (comma separated)</Label>
              <Input id="hashtags" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="AI, marketing, growth" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editingId ? "Save changes" : "Schedule post"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
