"use client";

import {
  LayoutDashboard,
  Search,
  Share2,
  CalendarDays,
  Image as ImageIcon,
  Video,
  Mail,
  Globe,
  FlaskConical,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { useMarqai } from "@/lib/marqai/store";
import { classNames } from "@/lib/marqai/utils";
import type { ModuleId } from "@/lib/marqai/types";

const NAV: {
  id: ModuleId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "Marketing" | "Creative" | "Outreach" | "Analysis" | "System";
  description: string;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "System", description: "Overview & KPIs" },
  { id: "seo", label: "SEO Analyzer", icon: Search, group: "Analysis", description: "Audit any URL" },
  { id: "social", label: "Social Marketing", icon: Share2, group: "Marketing", description: "Multi-platform posting" },
  { id: "scheduler", label: "Scheduler", icon: CalendarDays, group: "Marketing", description: "Daily content calendar" },
  { id: "images", label: "Image Studio", icon: ImageIcon, group: "Creative", description: "AI image generation" },
  { id: "videos", label: "Video Studio", icon: Video, group: "Creative", description: "AI marketing videos" },
  { id: "email", label: "Email Automation", icon: Mail, group: "Outreach", description: "Campaigns & flows" },
  { id: "analyzer", label: "Website Analyzer", icon: Globe, group: "Analysis", description: "Deep portal analysis" },
  { id: "ai-testing", label: "AI Tool Testing", icon: FlaskConical, group: "Analysis", description: "Grade any AI tool" },
  { id: "settings", label: "Settings", icon: Settings, group: "System", description: "Brand & account" },
];

const GROUPS = ["System", "Marketing", "Creative", "Outreach", "Analysis"] as const;

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const activeModule = useMarqai((s) => s.activeModule);
  const setActiveModule = useMarqai((s) => s.setActiveModule);

  return (
    <aside
      className={classNames(
        "fixed lg:sticky top-0 z-50 lg:z-30 h-screen w-72 shrink-0",
        "bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
        "flex flex-col transition-transform duration-300",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
    >
      <div className="h-16 flex items-center justify-between px-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg marqai-gradient flex items-center justify-center shadow-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-base tracking-tight">Marqai</div>
            <div className="text-[10px] uppercase tracking-wider text-sidebar-accent-foreground/70">
              Marketing Suite
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-md hover:bg-sidebar-accent"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scroll-thin py-3 px-3 space-y-4">
        {GROUPS.map((group) => {
          const items = NAV.filter((n) => n.group === group);
          if (!items.length) return null;
          return (
            <div key={group}>
              <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-accent-foreground/50">
                {group}
              </div>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = activeModule === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveModule(item.id);
                        onClose();
                      }}
                      className={classNames(
                        "w-full group flex items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "hover:bg-sidebar-accent text-sidebar-foreground/85",
                      )}
                    >
                      <Icon
                        className={classNames(
                          "h-4.5 w-4.5 mt-0.5 shrink-0",
                          active ? "text-sidebar-primary-foreground" : "text-sidebar-accent-foreground/70 group-hover:text-sidebar-foreground",
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium leading-tight">{item.label}</div>
                        <div
                          className={classNames(
                            "text-[11px] leading-tight truncate",
                            active ? "text-sidebar-primary-foreground/80" : "text-sidebar-accent-foreground/50",
                          )}
                        >
                          {item.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-lg bg-sidebar-accent/50 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="text-xs font-semibold">AI Engine online</div>
          </div>
          <div className="text-[11px] text-sidebar-accent-foreground/70">
            7 modules active · 3 campaigns scheduled
          </div>
        </div>
      </div>
    </aside>
  );
}
