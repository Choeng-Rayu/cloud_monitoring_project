"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { MetricChart } from "@/components/dashboard/MetricChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { initialNodes, REFRESH_INTERVAL } from "@/config/nodes";
import { MetricDataPoint } from "@/types";
import { getCPUHistory, getMemoryHistory } from "@/lib/prometheus";
import { Activity, Clock, RefreshCw } from "lucide-react";

export default function MetricsPage() {
  const [timeRange, setTimeRange] = useState<1 | 6 | 24>(1);
  const [cpuData, setCpuData] = useState<Record<string, MetricDataPoint[]>>({});
  const [memoryData, setMemoryData] = useState<Record<string, MetricDataPoint[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const targetNodes = initialNodes.filter(n => n.role === "target");

  const fetchMetrics = async () => {
    setIsLoading(true);
    const cpu: Record<string, MetricDataPoint[]> = {};
    const memory: Record<string, MetricDataPoint[]> = {};

    for (const node of targetNodes) {
      const instance = `${node.ip}:${node.port}`;
      cpu[node.id] = await getCPUHistory(instance, timeRange);
      memory[node.id] = await getMemoryHistory(instance, timeRange);
    }

    setCpuData(cpu);
    setMemoryData(memory);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  return (
    <div className="min-h-screen">
      <Header 
        title="Metrics" 
        description="Detailed performance metrics and history"
      />
      
      <div className="p-6 space-y-6">
        {/* Time Range Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-zinc-400" />
            <span className="text-sm text-zinc-400">Time Range:</span>
            <div className="flex rounded-lg border border-zinc-700 p-1">
              {[
                { value: 1, label: "1 Hour" },
                { value: 6, label: "6 Hours" },
                { value: 24, label: "24 Hours" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeRange(option.value as 1 | 6 | 24)}
                  className={`rounded px-3 py-1 text-sm transition-colors ${
                    timeRange === option.value
                      ? "bg-cyan-500/20 text-cyan-400"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* CPU Charts */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            CPU Usage
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {targetNodes.map((node) => (
              <MetricChart
                key={`cpu-${node.id}`}
                title={node.name}
                data={cpuData[node.id] || []}
                color="#06b6d4"
                unit="%"
                type="area"
              />
            ))}
          </div>
        </div>

        {/* Memory Charts */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-400" />
            Memory Usage
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {targetNodes.map((node) => (
              <MetricChart
                key={`mem-${node.id}`}
                title={node.name}
                data={memoryData[node.id] || []}
                color="#a855f7"
                unit="%"
                type="area"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
