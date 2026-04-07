"use client";

import { cn } from "@/lib/utils";

interface MetricGaugeProps {
  value: number | null | undefined;
  label: string;
  maxValue?: number;
  size?: "sm" | "md" | "lg";
  color?: "cyan" | "purple" | "emerald" | "amber" | "red";
}

export function MetricGauge({ 
  value, 
  label, 
  maxValue = 100, 
  size = "md",
  color = "cyan"
}: MetricGaugeProps) {
  // Handle undefined, null, or NaN values
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  const isLoading = value === null || value === undefined;
  
  const percentage = Math.min(Math.max((safeValue / maxValue) * 100, 0), 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const sizes = {
    sm: { svg: 80, text: "text-lg" },
    md: { svg: 120, text: "text-2xl" },
    lg: { svg: 160, text: "text-3xl" },
  };

  const colors = {
    cyan: "stroke-cyan-500",
    purple: "stroke-purple-500",
    emerald: "stroke-emerald-500",
    amber: "stroke-amber-500",
    red: "stroke-red-500",
  };

  const dynamicColor = isLoading ? "stroke-zinc-600" :
                       percentage >= 90 ? "stroke-red-500" : 
                       percentage >= 70 ? "stroke-amber-500" : 
                       colors[color];

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: sizes[size].svg, height: sizes[size].svg }}>
        <svg className="transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            className="stroke-zinc-800"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={cn("transition-all duration-500", dynamicColor)}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: isNaN(strokeDashoffset) ? circumference : strokeDashoffset,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isLoading ? (
            <span className="text-zinc-500 text-sm">Loading...</span>
          ) : (
            <span className={cn("font-bold text-white font-mono", sizes[size].text)}>
              {safeValue.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
      <span className="mt-2 text-sm text-zinc-400">{label}</span>
    </div>
  );
}
