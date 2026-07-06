"use client";

import { useMarqai } from "@/lib/marqai/store";
import { KpiCard } from "../kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Users,
  Mail,
  Image as ImageIcon,
  Video,
  CalendarDays,
  ArrowUpRight,
  Sparkles,
  Gauge,
  TrendingUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { platformMeta } from "@/lib/marqai/mock-data";
import { formatNumber, formatPercent, timeAgo } from "@/lib/marqai/utils";

const trafficData = [
  { day: "Mon", organic: 4200, social: 2100, direct: 1800, email: 920 },
  { day: "Tue", organic: 4600, social: 2400, direct: 1900, email: 1100 },
  { day: "Wed", organic: 5100, social: 2900, direct: 2100, email: 1450 },
  { day: "Thu", organic: 4900, social: 2600, direct: 2050, email: 980 },
  { day: "Fri", organic: 5800, social: 3400, direct: 2400, email: 1320 },
  { day: "Sat", organic: 4400, social: 2200, direct: 1950, email: 760 },
  { day: "Sun", organic: 4100, social: 1950, direct: 1750, email: 680 },
];

const engagementData = [
  { platform: "Twitter", value: 3.8 },
  { platform: "LinkedIn", value: 5.2 },
  { platform: "Instagram", value: 6.1 },
  { platform: "YouTube", value: 4.4 },
  { platform: "TikTok", value: 8.9 },
];

const trafficSourceData = [
  { name: "Organic search", value: 42, color: "#0d9488" },
  { name: "Social", value: 24, color: "#0891b2" },
  { name: "Direct", value: 18, color: "#f59e0b" },
  { name: "Email", value: 10, color: "#8b5cf6" },
  { name: "Referral", value: 6, color: "#f43f5e" },
];

export function Dashboard() {
  const accounts = useMarqai((s) => s.accounts);
  const scheduledPosts = useMarqai((s) => s.scheduledPosts);
  const emailCampaigns = useMarqai((s) => s.emailCampaigns);
  const images = useMarqai((s) => s.images);
  const videos = useMarqai((s) => s.videos);
  const aiTestReports = useMarqai((s) => s.aiTestReports);
  const setActiveModule = useMarqai((s) => s.setActiveModule);

  const totalFollowers = accounts.reduce((sum, a) => sum + a.followers, 0);
  const upcomingPosts = scheduledPosts
    .filter((p) => p.status === "scheduled")
    .slice(0, 5);
  const lastCampaign = emailCampaigns.find((c) => c.status === "sent");

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="relative overflow-hidden border-0">
        <div className="absolute inset-0 marqai-gradient opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_60%)]" />
        <CardContent className="relative p-6 md:p-8 text-white">
          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
            <div className="max-w-2xl">
              <Badge className="bg-white/20 text-white border-0 mb-3 backdrop-blur-sm">
                <Sparkles className="h-3 w-3 mr-1" /> AI Engine online
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                Welcome back, Priya 👋
              </h2>
              <p className="text-white/80 text-sm md:text-base max-w-xl">
                Your marketing stack is running smoothly. You have {upcomingPosts.length} posts
                scheduled, {emailCampaigns.filter((c) => c.status === "scheduled").length} email
                campaigns queued, and {aiTestReports.length} AI tool reports ready to review.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveModule("seo")}
                className="bg-white text-emerald-700 hover:bg-white/90"
              >
                Run SEO audit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveModule("ai-testing")}
                className="bg-white/10 text-white border-white/30 hover:bg-white/20"
              >
                Test an AI tool
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total reach"
          value={formatNumber(totalFollowers)}
          delta={4.2}
          icon={Users}
          accent="emerald"
          hint="across 7 platforms"
        />
        <KpiCard
          label="Scheduled posts"
          value={upcomingPosts.length}
          icon={CalendarDays}
          accent="amber"
          hint="next 7 days"
        />
        <KpiCard
          label="Email open rate"
          value={lastCampaign ? formatPercent(lastCampaign.openRate ?? 0) : "—"}
          delta={2.1}
          icon={Mail}
          accent="violet"
          hint="last campaign"
        />
        <KpiCard
          label="AI tools tested"
          value={aiTestReports.length}
          icon={Gauge}
          accent="rose"
          hint="this month"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">Traffic by source</CardTitle>
              <CardDescription className="text-xs">Last 7 days · sessions per day</CardDescription>
            </div>
            <Badge variant="outline" className="text-emerald-600 border-emerald-200">
              <TrendingUp className="h-3 w-3 mr-1" /> +12.4% WoW
            </Badge>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="gOrg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0d9488" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gSoc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0891b2" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gDir" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gEml" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                <XAxis dataKey="day" stroke="currentColor" strokeOpacity={0.4} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="currentColor" strokeOpacity={0.4} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="organic" stroke="#0d9488" strokeWidth={2} fill="url(#gOrg)" />
                <Area type="monotone" dataKey="social" stroke="#0891b2" strokeWidth={2} fill="url(#gSoc)" />
                <Area type="monotone" dataKey="direct" stroke="#f59e0b" strokeWidth={2} fill="url(#gDir)" />
                <Area type="monotone" dataKey="email" stroke="#8b5cf6" strokeWidth={2} fill="url(#gEml)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Traffic sources</CardTitle>
            <CardDescription className="text-xs">Distribution this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={trafficSourceData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {trafficSourceData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value}%`}
                  contentStyle={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lower row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming posts */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">Upcoming posts</CardTitle>
              <CardDescription className="text-xs">Next scheduled content</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setActiveModule("scheduler")}>
              View calendar <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto scroll-thin">
            {upcomingPosts.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">No scheduled posts</p>
            )}
            {upcomingPosts.map((p) => (
              <div
                key={p.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors"
              >
                <div className="flex -space-x-1.5 mt-0.5">
                  {p.platforms.slice(0, 3).map((pl) => (
                    <div
                      key={pl}
                      className="h-6 w-6 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white"
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
                <div className="text-right shrink-0">
                  <div className="text-xs font-medium">{timeAgo(p.scheduledAt)}</div>
                  <div className="text-[10px] text-muted-foreground">{p.author}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Engagement by platform */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Engagement rate</CardTitle>
            <CardDescription className="text-xs">By platform · last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={engagementData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} horizontal={false} />
                <XAxis type="number" stroke="currentColor" strokeOpacity={0.4} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="platform" stroke="currentColor" strokeOpacity={0.4} fontSize={11} tickLine={false} axisLine={false} width={70} />
                <Tooltip
                  formatter={(value: number) => `${value}%`}
                  contentStyle={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Module launcher grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Launchpad</CardTitle>
          <CardDescription className="text-xs">Jump into any Marqai module</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { id: "seo" as const, label: "SEO Analyzer", icon: Activity, color: "bg-emerald-500" },
              { id: "social" as const, label: "Social", icon: Users, color: "bg-cyan-500" },
              { id: "scheduler" as const, label: "Scheduler", icon: CalendarDays, color: "bg-amber-500" },
              { id: "images" as const, label: "Images", icon: ImageIcon, color: "bg-violet-500" },
              { id: "videos" as const, label: "Videos", icon: Video, color: "bg-rose-500" },
              { id: "email" as const, label: "Email", icon: Mail, color: "bg-teal-500" },
              { id: "analyzer" as const, label: "Web Analyzer", icon: TrendingUp, color: "bg-indigo-500" },
              { id: "ai-testing" as const, label: "AI Testing", icon: Gauge, color: "bg-fuchsia-500" },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveModule(m.id)}
                  className="group flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/40 transition-all"
                >
                  <div className={`h-10 w-10 rounded-lg ${m.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium">{m.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
