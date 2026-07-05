"use client";

import { useState } from "react";
import { useMarqai } from "@/lib/marqai/store";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { Dashboard } from "./modules/dashboard";
import { SeoModule } from "./modules/seo-module";
import { SocialModule } from "./modules/social-module";
import { SchedulerModule } from "./modules/scheduler-module";
import { ImageModule } from "./modules/image-module";
import { VideoModule } from "./modules/video-module";
import { EmailModule } from "./modules/email-module";
import { AnalyzerModule } from "./modules/analyzer-module";
import { AiTestingModule } from "./modules/ai-testing-module";
import { SettingsModule } from "./modules/settings-module";
import type { ModuleId } from "@/lib/marqai/types";

export function AppShell() {
  const activeModule = useMarqai((s) => s.activeModule);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            {renderModule(activeModule)}
          </div>
          <footer className="mt-auto border-t border-border bg-card/50 px-6 py-4 text-xs text-muted-foreground">
            <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
              <div>
                © {new Date().getFullYear()} Marqai — AI Marketing & AI Tool Testing Suite. Built with Next.js 16.
              </div>
              <div className="flex items-center gap-3">
                <span>v1.0.0</span>
                <span>·</span>
                <span>Reference: coreyhaines31/marketingskills</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

function renderModule(m: ModuleId) {
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
    case "settings":
      return <SettingsModule />;
    default:
      return <Dashboard />;
  }
}
