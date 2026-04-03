"use client";

import { useEffect, useState } from "react";
import { Server, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { StatsCard } from "./StatsCard";
import { VMNode } from "@/types";

interface SystemOverviewProps {
  nodes: VMNode[];
}

export function SystemOverview({ nodes }: SystemOverviewProps) {
  const [currentTime, setCurrentTime] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalNodes = nodes.length;
  const healthyNodes = nodes.filter(n => n.status === "up").length;
  const unhealthyNodes = nodes.filter(n => n.status === "down").length;
  const avgCPU = nodes.reduce((acc, n) => acc + (n.metrics?.cpu.usage || 0), 0) / totalNodes;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Nodes"
        value={totalNodes}
        subtitle={currentTime ? `Last updated: ${currentTime}` : "Loading..."}
        icon={Server}
        color="cyan"
      />
      <StatsCard
        title="Healthy Nodes"
        value={healthyNodes}
        subtitle={`${((healthyNodes / totalNodes) * 100).toFixed(0)}% of total`}
        icon={CheckCircle}
        color="emerald"
      />
      <StatsCard
        title="Alerts"
        value={unhealthyNodes}
        subtitle={unhealthyNodes > 0 ? "Requires attention" : "No issues detected"}
        icon={AlertTriangle}
        color={unhealthyNodes > 0 ? "red" : "emerald"}
      />
      <StatsCard
        title="Avg CPU Usage"
        value={`${avgCPU.toFixed(1)}%`}
        subtitle="Across all nodes"
        icon={Activity}
        trend={{ value: 2.5, isPositive: false }}
        color="purple"
      />
    </div>
  );
}
