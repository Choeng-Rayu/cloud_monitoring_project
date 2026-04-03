import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "cyan" | "purple" | "emerald" | "amber" | "red";
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  color = "cyan"
}: StatsCardProps) {
  const colors = {
    cyan: {
      bg: "from-cyan-500/20 to-blue-500/20",
      border: "border-cyan-500/30",
      icon: "text-cyan-400",
    },
    purple: {
      bg: "from-purple-500/20 to-pink-500/20",
      border: "border-purple-500/30",
      icon: "text-purple-400",
    },
    emerald: {
      bg: "from-emerald-500/20 to-green-500/20",
      border: "border-emerald-500/30",
      icon: "text-emerald-400",
    },
    amber: {
      bg: "from-amber-500/20 to-orange-500/20",
      border: "border-amber-500/30",
      icon: "text-amber-400",
    },
    red: {
      bg: "from-red-500/20 to-rose-500/20",
      border: "border-red-500/30",
      icon: "text-red-400",
    },
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-zinc-400">{title}</p>
            <p className="mt-2 text-3xl font-bold text-white">{value}</p>
            {subtitle && (
              <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
            )}
            {trend && (
              <p className={cn(
                "mt-2 text-sm",
                trend.isPositive ? "text-emerald-400" : "text-red-400"
              )}>
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}% from last hour
              </p>
            )}
          </div>
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br border",
            colors[color].bg,
            colors[color].border
          )}>
            <Icon className={cn("h-6 w-6", colors[color].icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
