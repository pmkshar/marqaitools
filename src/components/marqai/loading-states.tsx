"use client";

import { Loader2 } from "lucide-react";
import { classNames } from "@/lib/marqai/utils";

export function LoadingState({ message = "Working...", className }: { message?: string; className?: string }) {
  return (
    <div className={classNames("flex flex-col items-center justify-center py-12 text-muted-foreground", className)}>
      <Loader2 className="h-6 w-6 animate-spin mb-2 text-primary" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
}
