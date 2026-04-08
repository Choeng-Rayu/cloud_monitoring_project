"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { SystemOverview } from "@/components/dashboard/SystemOverview";
import { NodeCard } from "@/components/dashboard/NodeCard";
import { MetricChart } from "@/components/dashboard/MetricChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { initialNodes, REFRESH_INTERVAL, PROMETHEUS_URL, GRAFANA_URL } from "@/config/nodes";
import { VMNode, MetricDataPoint } from "@/types";
import { getNodeMetrics, getTargets, getCPUHistory } from "@/lib/prometheus";
import { Activity, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";

interface ActivityItem {
  time: string;
  event: string;
  type: "info" | "warning" | "success" | "danger";
}

// Client-only time display to prevent hydration mismatch
function ClientTime({ date }: { date: Date }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <span>Loading...</span>;
  }
  
  return <span>Last updated: {date.toLocaleTimeString()}</span>;
}

export default function DashboardPage() {
  const [nodes, setNodes] = useState<VMNode[]>(initialNodes);
  const [cpuHistory, setCpuHistory] = useState<Record<string, MetricDataPoint[]>>({});
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMetrics = async () => {
    try {
      // Fetch target status
      const targets = await getTargets();
      
      // Update nodes with metrics
      const updatedNodes = await Promise.all(
        initialNodes.map(async (node) => {
          const instance = `${node.ip}:${node.port}`;
          const target = targets.find(t => t.labels.instance === instance);
          const metrics = node.role === "target" ? await getNodeMetrics(instance) : null;
          
          return {
            ...node,
            status: target?.health || "unknown",
            metrics: metrics || node.metrics,
          } as VMNode;
        })
      );

      setNodes(updatedNodes);
      setLastUpdated(new Date());

      // Fetch CPU history for each target node
      const historyData: Record<string, MetricDataPoint[]> = {};
      for (const node of updatedNodes.filter(n => n.role === "target")) {
        const instance = `${node.ip}:${node.port}`;
        historyData[node.id] = await getCPUHistory(instance, 1);
      }
      setCpuHistory(historyData);

      // Fetch recent activity
      const activityResponse = await fetch("/api/activity");
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setActivities(activityData.activities || []);
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const targetNodes = nodes.filter(n => n.role === "target");

  return (
    <div className="min-h-screen">
      <Header 
        title="Dashboard" 
        description="Overview of your cloud infrastructure"
      />
      
      <div className="p-6 space-y-6">
        {/* System Overview Stats */}
        <SystemOverview nodes={nodes} />

        {/* Quick Links */}
        <div className="flex flex-wrap gap-3">
          <a 
            href={PROMETHEUS_URL} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-800/50 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Activity className="h-4 w-4 text-orange-400" />
            Open Prometheus
            <ExternalLink className="h-3 w-3" />
          </a>
          <a 
            href={GRAFANA_URL} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-800/50 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Activity className="h-4 w-4 text-orange-500" />
            Open Grafana
            <ExternalLink className="h-3 w-3" />
          </a>
          <div className="ml-auto flex items-center gap-2 text-sm text-zinc-500">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <ClientTime date={lastUpdated} />
          </div>
        </div>

        {/* Node Cards */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Monitored Nodes</h2>
            <Link href="/nodes/add">
              <Badge variant="info" className="cursor-pointer hover:bg-blue-500/30">
                + Add New Node
              </Badge>
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {nodes.map((node) => (
              <NodeCard key={node.id} node={node} />
            ))}
          </div>
        </div>

        {/* CPU Charts */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">CPU Usage History</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {targetNodes.map((node) => (
              <MetricChart
                key={node.id}
                title={`${node.name} - CPU Usage`}
                data={cpuHistory[node.id] || []}
                color="#06b6d4"
                unit="%"
                type="area"
              />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <span className="text-zinc-500 w-24">{activity.time}</span>
                    <Badge variant={activity.type} className="w-20 justify-center">
                      {activity.type}
                    </Badge>
                    <span className="text-zinc-300">{activity.event}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-zinc-500">Loading activity data...</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
