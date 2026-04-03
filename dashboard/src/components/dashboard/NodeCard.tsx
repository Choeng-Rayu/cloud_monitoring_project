"use client";

import Link from "next/link";
import { Server, Activity, HardDrive, Cpu, MemoryStick, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { VMNode } from "@/types";
import { formatBytes } from "@/lib/prometheus";
import { cn } from "@/lib/utils";

interface NodeCardProps {
  node: VMNode;
}

export function NodeCard({ node }: NodeCardProps) {
  const statusVariant = {
    up: "success" as const,
    down: "danger" as const,
    pending: "warning" as const,
    unknown: "default" as const,
  };

  const getProgressColor = (value: number) => {
    if (value >= 90) return "bg-red-500";
    if (value >= 70) return "bg-amber-500";
    return "bg-gradient-to-r from-cyan-500 to-blue-500";
  };

  return (
    <Link href={`/nodes/${node.id}`}>
      <Card className="group cursor-pointer transition-all duration-300 hover:border-cyan-500/50 hover:shadow-cyan-500/10 hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                node.role === "monitoring" 
                  ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30"
                  : "bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30"
              )}>
                <Server className={cn(
                  "h-5 w-5",
                  node.role === "monitoring" ? "text-purple-400" : "text-cyan-400"
                )} />
              </div>
              <div>
                <CardTitle className="text-base">{node.name}</CardTitle>
                <p className="text-xs text-zinc-500">{node.ip}:{node.port}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant[node.status]}>
                <Activity className="mr-1 h-3 w-3" />
                {node.status.toUpperCase()}
              </Badge>
              <ArrowUpRight className="h-4 w-4 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {node.metrics ? (
            <div className="space-y-4">
              {/* CPU */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Cpu className="h-4 w-4" />
                    <span>CPU</span>
                  </div>
                  <span className="font-mono text-zinc-200">
                    {node.metrics.cpu.usage.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={node.metrics.cpu.usage} 
                  indicatorClassName={getProgressColor(node.metrics.cpu.usage)}
                />
              </div>

              {/* Memory */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <MemoryStick className="h-4 w-4" />
                    <span>Memory</span>
                  </div>
                  <span className="font-mono text-zinc-200">
                    {node.metrics.memory.usagePercent.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={node.metrics.memory.usagePercent} 
                  indicatorClassName={getProgressColor(node.metrics.memory.usagePercent)}
                />
                <p className="text-xs text-zinc-500">
                  {formatBytes(node.metrics.memory.used)} / {formatBytes(node.metrics.memory.total)}
                </p>
              </div>

              {/* Disk */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <HardDrive className="h-4 w-4" />
                    <span>Disk</span>
                  </div>
                  <span className="font-mono text-zinc-200">
                    {node.metrics.disk.usagePercent.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={node.metrics.disk.usagePercent} 
                  indicatorClassName={getProgressColor(node.metrics.disk.usagePercent)}
                />
                <p className="text-xs text-zinc-500">
                  {formatBytes(node.metrics.disk.used)} / {formatBytes(node.metrics.disk.total)}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-zinc-500">
              <p>Loading metrics...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
