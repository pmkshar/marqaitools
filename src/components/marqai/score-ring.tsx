"use client";

import { classNames } from "@/lib/marqai/utils";

interface ScoreRingProps {
  score: number;
  size?: number;
  label?: string;
  showValue?: boolean;
}

export function ScoreRing({
  score,
  size = 96,
  label,
  showValue = true,
}: ScoreRingProps) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={6}
          className="text-muted/40"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={classNames("transition-all duration-700", color)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && (
          <span className={classNames("text-xl font-bold", color)}>{Math.round(score)}</span>
        )}
        {label && <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>}
      </div>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 85) return "text-emerald-500";
  if (score >= 70) return "text-amber-500";
  if (score >= 50) return "text-orange-500";
  return "text-rose-500";
}
