"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { classNames } from "@/lib/marqai/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: number;
  icon?: LucideIcon;
  hint?: string;
  accent?: "default" | "emerald" | "amber" | "rose" | "violet";
}

const accentClasses = {
  default: "bg-muted text-foreground",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
};

export function KpiCard({ label, value, delta, icon: Icon, hint, accent = "default" }: KpiCardProps) {
  const TrendIcon = delta === undefined ? null : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor =
    delta === undefined
      ? ""
      : delta > 0
        ? "text-emerald-600"
        : delta < 0
          ? "text-rose-600"
          : "text-muted-foreground";

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </CardTitle>
        {Icon && (
          <div className={classNames("h-8 w-8 rounded-md flex items-center justify-center", accentClasses[accent])}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="flex items-center gap-1.5 mt-1 text-xs">
          {TrendIcon && delta !== undefined && (
            <span className={classNames("flex items-center gap-0.5 font-medium", trendColor)}>
              <TrendIcon className="h-3 w-3" />
              {delta > 0 ? "+" : ""}
              {delta}%
            </span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
