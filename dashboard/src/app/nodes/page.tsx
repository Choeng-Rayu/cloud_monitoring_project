"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { NodeCard } from "@/components/dashboard/NodeCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { initialNodes, REFRESH_INTERVAL } from "@/config/nodes";
import { VMNode } from "@/types";
import { getNodeMetrics, getTargets } from "@/lib/prometheus";
import { Plus, Filter, Grid, List } from "lucide-react";
import Link from "next/link";

export default function NodesPage() {
  const [nodes, setNodes] = useState<VMNode[]>(initialNodes);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<"all" | "up" | "down">("all");

  const fetchMetrics = async () => {
    try {
      const targets = await getTargets();
      
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
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const filteredNodes = nodes.filter(node => {
    if (filter === "all") return true;
    return node.status === filter;
  });

  return (
    <div className="min-h-screen">
      <Header 
        title="Nodes" 
        description="Manage your monitored infrastructure"
      />
      
      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All ({nodes.length})
            </Button>
            <Button
              variant={filter === "up" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("up")}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 mr-2" />
              Healthy ({nodes.filter(n => n.status === "up").length})
            </Button>
            <Button
              variant={filter === "down" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("down")}
            >
              <span className="h-2 w-2 rounded-full bg-red-400 mr-2" />
              Down ({nodes.filter(n => n.status === "down").length})
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-zinc-700 p-1">
              <button
                onClick={() => setView("grid")}
                className={`rounded p-1.5 ${view === "grid" ? "bg-zinc-700" : ""}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`rounded p-1.5 ${view === "list" ? "bg-zinc-700" : ""}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <Link href="/nodes/add">
              <Button className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-500">
                <Plus className="h-4 w-4" />
                Add Node
              </Button>
            </Link>
          </div>
        </div>

        {/* Nodes Grid/List */}
        <div className={view === "grid" 
          ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" 
          : "space-y-4"
        }>
          {filteredNodes.map((node) => (
            <NodeCard key={node.id} node={node} />
          ))}
        </div>

        {filteredNodes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <p>No nodes found matching the filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
