"use client";

import { Menu, Bell, Search, Plus, Zap } from "lucide-react";
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
  settings: { title: "Settings", subtitle: "Brand, accounts & integrations" },
};

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const activeModule = useMarqai((s) => s.activeModule);
  const info = moduleTitles[activeModule] ?? moduleTitles.dashboard;
  const brand = useMarqai((s) => s.brand);

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

        <div className="hidden md:flex relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search modules, campaigns..."
            className="pl-9 h-9 bg-muted/40 border-0"
          />
        </div>

        <Button variant="default" size="sm" className="hidden md:inline-flex">
          <Plus className="h-4 w-4 mr-1.5" />
          New campaign
        </Button>

        <Button variant="outline" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 hover:bg-muted rounded-full pl-1 pr-3 py-1 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="marqai-gradient text-white text-xs">
                  PM
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left leading-tight">
                <div className="text-xs font-medium">Priya M.</div>
                <div className="text-[10px] text-muted-foreground">Admin · {brand.name}</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="text-sm font-semibold">Priya Menon</div>
              <div className="text-xs text-muted-foreground">priya@marqai.app</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Workspace settings</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Zap className="h-3.5 w-3.5 mr-2" /> Upgrade plan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
