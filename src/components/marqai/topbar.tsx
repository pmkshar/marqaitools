"use client";

import { Menu, Bell, Search, Plus, Zap, Crown, Shield, Building2, LogOut, ChevronDown } from "lucide-react";
import { useMarqai } from "@/lib/marqai/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const moduleTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Marketing command center" },
  seo: { title: "SEO Analyzer", subtitle: "Audit any URL across 6 ranking factors" },
  social: { title: "Social Marketing", subtitle: "Plan, generate & post across 7 platforms" },
  scheduler: { title: "Content Scheduler", subtitle: "Daily and weekly publishing calendar" },
  images: { title: "Image Studio", subtitle: "AI marketing image generation" },
  videos: { title: "Video Studio", subtitle: "AI marketing video production" },
  email: { title: "Email Automation", subtitle: "Campaigns, automations & analytics" },
  analyzer: { title: "Website Analyzer", subtitle: "Deep portal & traffic analysis" },
  "ai-testing": { title: "AI Tool Testing", subtitle: "Objective QA for any AI tool" },
  "ai-testing-methodologies": { title: "AI Testing Methodologies", subtitle: "QA playbook for any AI platform — strategies, methodologies & scenarios" },
  "logo-builder": { title: "Logo Builder", subtitle: "AI logos + SVG templates with palette + style control" },
  "website-builder": { title: "Website Builder", subtitle: "AI landing pages with 6 sections" },
  "leads-generator": { title: "Leads Generator", subtitle: "AI prospect lists per product + market" },
  reports: { title: "Module Reports", subtitle: "QA coverage & AI health per module" },
  roles: { title: "Role Master", subtitle: "Create unlimited custom roles with per-module permissions" },
  team: { title: "Team Management", subtitle: "Invite members, assign roles, track seat usage" },
  billing: { title: "Subscription & Billing", subtitle: "Plan, usage, invoices, upgrade" },
  wiki: { title: "Wiki / Documentation", subtitle: "Functional, technical, developer & user docs" },
  settings: { title: "Settings", subtitle: "Brand, accounts & integrations" },
};

const ROLE_COLOR_CLASS: Record<string, string> = {
  emerald: "from-emerald-400 to-teal-500",
  teal: "from-teal-400 to-cyan-500",
  amber: "from-amber-400 to-orange-500",
  rose: "from-rose-400 to-pink-500",
  violet: "from-violet-400 to-purple-500",
  cyan: "from-cyan-400 to-blue-500",
  slate: "from-slate-400 to-slate-500",
};

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const activeModule = useMarqai((s) => s.activeModule);
  const info = moduleTitles[activeModule] ?? moduleTitles.dashboard;
  const brand = useMarqai((s) => s.brand);
  const principal = useMarqai((s) => s.principal);
  const logout = useMarqai((s) => s.logout);
  const setActiveModule = useMarqai((s) => s.setActiveModule);

  const initials = principal?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2) ?? "?";
  const isSuperAdmin = principal?.kind === "super_admin";
  const roleGradient = ROLE_COLOR_CLASS[principal?.roleColor ?? "emerald"] ?? ROLE_COLOR_CLASS.emerald;

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="h-full flex items-center gap-3 px-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="min-w-0 flex-1">
          <h1 className="text-base md:text-lg font-semibold leading-tight truncate">
            {info.title}
          </h1>
          <p className="text-xs text-muted-foreground leading-tight truncate">
            {info.subtitle}
          </p>
        </div>

        {/* Org + Plan badges (hidden on mobile) */}
        <div className="hidden xl:flex items-center gap-2">
          {!isSuperAdmin && principal?.organizationName && (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <Building2 className="h-3 w-3" />
              {principal.organizationName}
            </Badge>
          )}
          {isSuperAdmin && (
            <Badge className="gap-1 text-[10px] bg-gradient-to-r from-amber-500 to-rose-500 text-white border-0">
              <Crown className="h-3 w-3" />
              Super Admin
            </Badge>
          )}
          {principal?.planName && (
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Zap className="h-3 w-3" />
              {principal.planName}
            </Badge>
          )}
        </div>

        <div className="hidden md:flex relative w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9 h-9 bg-muted/40 border-0"
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 hover:bg-muted rounded-full pl-1 pr-3 py-1 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className={`bg-gradient-to-br ${isSuperAdmin ? "from-amber-400 to-rose-500" : roleGradient} text-white text-xs font-bold`}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left leading-tight">
                <div className="text-xs font-medium truncate max-w-[120px]">{principal?.name ?? "Guest"}</div>
                <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                  {isSuperAdmin ? "Super Admin" : principal?.roleName ?? "No role"}
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <div className="text-sm font-semibold">{principal?.name}</div>
              <div className="text-xs text-muted-foreground">{principal?.email}</div>
              {!isSuperAdmin && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  {principal?.organizationName && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Building2 className="h-2.5 w-2.5" />
                      {principal.organizationName}
                    </Badge>
                  )}
                  {principal?.roleName && (
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <Shield className="h-2.5 w-2.5" />
                      {principal.roleName}
                    </Badge>
                  )}
                </div>
              )}
              {isSuperAdmin && (
                <Badge className="mt-1.5 text-[10px] bg-gradient-to-r from-amber-500 to-rose-500 text-white border-0 gap-1">
                  <Crown className="h-2.5 w-2.5" /> Platform-level
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setActiveModule("settings")}>
              Profile & workspace settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveModule("billing")}>
              Billing & subscription
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveModule("wiki")}>
              Help & documentation
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => logout()}
            >
              <LogOut className="h-3.5 w-3.5 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
