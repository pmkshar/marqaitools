"use client";

import { useState, useEffect } from "react";
import { useMarqai } from "@/lib/marqai/store";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { AuthScreen } from "./auth-screen";
import { Dashboard } from "./modules/dashboard";
import { SeoModule } from "./modules/seo-module";
import { SocialModule } from "./modules/social-module";
import { SchedulerModule } from "./modules/scheduler-module";
import { ImageModule } from "./modules/image-module";
import { VideoModule } from "./modules/video-module";
import { EmailModule } from "./modules/email-module";
import { AnalyzerModule } from "./modules/analyzer-module";
import { AiTestingModule } from "./modules/ai-testing-module";
import { AiTestingMethodologiesModule } from "./modules/ai-testing-methodologies-module";
import { LogoBuilderModule } from "./modules/logo-builder-module";
import { WebsiteBuilderModule } from "./modules/website-builder-module";
import { LeadsGeneratorModule } from "./modules/leads-generator-module";
import { SalesAgentsModule } from "./modules/sales-agents-module";
import { WhatsAppModule } from "./modules/whatsapp-module";
import { ReportsModule } from "./modules/reports-module";
import { RolesModule } from "./modules/roles-module";
import { TeamModule } from "./modules/team-module";
import { BillingModule } from "./modules/billing-module";
import { WikiModule } from "./modules/wiki-module";
import { SettingsModule } from "./modules/settings-module";
import { canAccess } from "@/lib/marqai/rbac";
import { isModuleInPlan } from "@/lib/marqai/saas";
import type { ModuleId } from "@/lib/marqai/types";

export function AppShell() {
  const activeModule = useMarqai((s) => s.activeModule);
  const setActiveModule = useMarqai((s) => s.setActiveModule);
  const principal = useMarqai((s) => s.principal);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // If user lacks access to the active module, fall back to dashboard.
  useEffect(() => {
    if (!principal) return;
    if (activeModule === "dashboard") return;
    const allowed =
      canAccess(principal, activeModule, "view") &&
      (principal.kind === "super_admin" || isModuleInPlan(activeModule, principal.planSlug ?? "starter"));
    if (!allowed) {
      setActiveModule("dashboard");
    }
  }, [principal, activeModule, setActiveModule]);

  // ---------- AUTH GATE ----------
  if (!principal) {
    return <AuthScreen />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto scroll-thin">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto animate-slide-up">
            {renderModule(activeModule, principal)}
          </div>
          <footer className="mt-auto border-t border-border bg-card/50 px-6 py-4 text-xs text-muted-foreground">
            <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
              <div>
                © {new Date().getFullYear()} Marqai — AI Marketing & AI Tool Testing SaaS. Multi-tenant RBAC edition.
              </div>
              <div className="flex items-center gap-3">
                <span>v2.0.0 · SaaS</span>
                <span>·</span>
                <span>Built with Next.js 16</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

function renderModule(m: ModuleId, principal: ReturnType<typeof useMarqai.getState>["principal"]) {
  // Permission gate
  const canView = canAccess(principal, m, "view");
  if (!canView && principal?.kind !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <h2 className="text-xl font-semibold mb-1">Access denied</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          You don&apos;t have permission to view this module. Contact your workspace admin to request access.
        </p>
      </div>
    );
  }

  // Plan gate
  if (principal?.kind !== "super_admin") {
    const planSlug = principal?.planSlug ?? "starter";
    if (!isModuleInPlan(m, planSlug)) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl mb-3">⚡</div>
          <h2 className="text-xl font-semibold mb-1">Upgrade to unlock</h2>
          <p className="text-sm text-muted-foreground max-w-md mb-4">
            This module is not included in your <strong>{principal?.planName}</strong> plan. Upgrade to access it.
          </p>
        </div>
      );
    }
  }

  switch (m) {
    case "dashboard":
      return <Dashboard />;
    case "seo":
      return <SeoModule />;
    case "social":
      return <SocialModule />;
    case "scheduler":
      return <SchedulerModule />;
    case "images":
      return <ImageModule />;
    case "videos":
      return <VideoModule />;
    case "email":
      return <EmailModule />;
    case "analyzer":
      return <AnalyzerModule />;
    case "ai-testing":
      return <AiTestingModule />;
    case "ai-testing-methodologies":
      return <AiTestingMethodologiesModule />;
    case "logo-builder":
      return <LogoBuilderModule />;
    case "website-builder":
      return <WebsiteBuilderModule />;
    case "leads-generator":
      return <LeadsGeneratorModule />;
    case "sales-agents":
      return <SalesAgentsModule />;
    case "whatsapp":
      return <WhatsAppModule />;
    case "reports":
      return <ReportsModule />;
    case "roles":
      return <RolesModule />;
    case "team":
      return <TeamModule />;
    case "billing":
      return <BillingModule />;
    case "wiki":
      return <WikiModule />;
    case "settings":
      return <SettingsModule />;
    default:
      return <Dashboard />;
  }
}
