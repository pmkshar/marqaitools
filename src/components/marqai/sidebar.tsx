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
  Shield,
  Users,
  CreditCard,
  BookOpen,
  Crown,
  PenTool,
  LayoutTemplate,
  Target,
  ClipboardList,
  BarChart3,
  MessageCircle,
  Bot,
} from "lucide-react";
import { useMarqai } from "@/lib/marqai/store";
import { classNames } from "@/lib/marqai/utils";
import { canAccess } from "@/lib/marqai/rbac";
import { isModuleInPlan } from "@/lib/marqai/saas";
import { visibleModulesFor } from "@/lib/marqai/saas-seed";
import type { ModuleId } from "@/lib/marqai/types";

const NAV: {
  id: ModuleId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "System" | "Marketing" | "Creative" | "Outreach" | "Analysis" | "Administration";
  description: string;
}[] = [
  { id: "dashboard",        label: "Dashboard",         icon: LayoutDashboard, group: "System",         description: "Overview & KPIs" },
  { id: "seo",              label: "SEO Analyzer",      icon: Search,          group: "Analysis",       description: "Audit any URL" },
  { id: "social",           label: "Social Marketing",  icon: Share2,          group: "Marketing",      description: "Multi-platform posting" },
  { id: "scheduler",        label: "Scheduler",         icon: CalendarDays,    group: "Marketing",      description: "Daily content calendar" },
  { id: "images",           label: "Image Studio",      icon: ImageIcon,       group: "Creative",       description: "AI image generation" },
  { id: "videos",           label: "Video Studio",      icon: Video,           group: "Creative",       description: "AI marketing videos" },
  { id: "logo-builder",     label: "Logo Builder",      icon: PenTool,         group: "Creative",       description: "AI logos + SVG templates" },
  { id: "website-builder",  label: "Website Builder",   icon: LayoutTemplate,  group: "Creative",       description: "AI landing pages" },
  { id: "email",            label: "Email Automation",  icon: Mail,            group: "Outreach",       description: "Campaigns & flows" },
  { id: "leads-generator",  label: "Leads Generator",   icon: Target,          group: "Outreach",       description: "AI prospect lists per product" },
  { id: "sales-agents",    label: "AI Sales Agents",   icon: Bot,             group: "Outreach",       description: "Conversational sales suite (BANT/MEDDIC)" },
  { id: "whatsapp",         label: "WhatsApp Marketing", icon: MessageCircle,  group: "Outreach",       description: "Broadcasts, templates, contacts & API" },
  { id: "analyzer",         label: "Website Analyzer",  icon: Globe,           group: "Analysis",       description: "Deep portal analysis" },
  { id: "ai-testing",               label: "AI Tool Testing",          icon: FlaskConical,    group: "Analysis",       description: "Grade any AI tool" },
  { id: "ai-testing-methodologies", label: "Testing Methodologies",    icon: ClipboardList,  group: "Analysis",       description: "QA playbook for any AI platform" },
  { id: "team",                     label: "Team Management",          icon: Users,          group: "Administration", description: "Members & seats" },
  { id: "roles",                    label: "Role Master",              icon: Shield,         group: "Administration", description: "Create custom roles" },
  { id: "billing",                  label: "Subscription",             icon: CreditCard,     group: "Administration", description: "Plan & invoices" },
  { id: "reports",                  label: "Module Reports",           icon: BarChart3,      group: "Administration", description: "QA coverage & AI health per module" },
  { id: "wiki",             label: "Wiki / Docs",       icon: BookOpen,        group: "System",         description: "Functional & technical docs" },
  { id: "settings",         label: "Settings",          icon: Settings,        group: "System",         description: "Brand & account" },
];

const GROUPS = ["System", "Marketing", "Creative", "Outreach", "Analysis", "Administration"] as const;

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const activeModule = useMarqai((s) => s.activeModule);
  const setActiveModule = useMarqai((s) => s.setActiveModule);
  const principal = useMarqai((s) => s.principal);

  const visibleIds = new Set(visibleModulesFor(principal).map((m) => m.id));

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
              {principal?.kind === "super_admin" ? "Super Admin" : "Marketing Suite"}
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
          const items = NAV.filter((n) => n.group === group && visibleIds.has(n.id));
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
                        <div className="text-sm font-medium leading-tight flex items-center gap-1.5">
                          {item.label}
                          {item.id === "roles" && principal?.kind === "super_admin" && (
                            <Crown className="h-3 w-3 text-amber-400" />
                          )}
                        </div>
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
            {visibleIds.size} modules unlocked · {principal?.planName ?? "no plan"}
          </div>
        </div>
      </div>
    </aside>
  );
}
