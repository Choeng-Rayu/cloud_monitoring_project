import { NextResponse } from "next/server";
import { initialNodes } from "@/config/nodes";
import { getNodeMetrics, getTargets, checkPrometheusHealth } from "@/lib/prometheus";
import { VMNode } from "@/types";
import fs from "fs/promises";
import path from "path";
import { logActivity } from "@/lib/activityLogger";

export async function GET() {
  const startTime = Date.now();
  try {
    const targets = await getTargets();
    
    // Load dynamically added nodes from JSON file
    let dynamicNodes = [];
    try {
      const nodesFile = path.join(process.cwd(), "data", "nodes.json");
      const data = await fs.readFile(nodesFile, "utf-8");
      dynamicNodes = JSON.parse(data);
    } catch {
      // File doesn't exist or is empty, use empty array
    }
    
    // Merge initial nodes with dynamic nodes
    const allNodes = [...initialNodes, ...dynamicNodes];
    
    const nodes: VMNode[] = await Promise.all(
      allNodes.map(async (node) => {
        let status: "up" | "down" | "unknown" = "unknown";
        let metrics = undefined;
        
        if (node.role === "monitoring") {
          // For monitoring server, check prometheus-server instance or health endpoint
          const prometheusTarget = targets.find(t => 
            t.labels.instance === "prometheus-server" || 
            t.labels.job === "prometheus"
          );
          
          if (prometheusTarget) {
            status = prometheusTarget.health;
          } else {
            // Fallback: check Prometheus health directly
            const healthy = await checkPrometheusHealth();
            status = healthy ? "up" : "down";
          }
        } else {
          // For target nodes, use IP:port lookup
          const instance = `${node.ip}:${node.port}`;
          const target = targets.find(t => t.labels.instance === instance);
          status = target?.health || "unknown";
          metrics = await getNodeMetrics(instance);
        }
        
        return {
          ...node,
          status,
          metrics: metrics || undefined,
        };
      })
    );

    const duration = Date.now() - startTime;
    const downNodes = nodes.filter(n => n.status === "down");
    
    // Log if any nodes are down
    if (downNodes.length > 0) {
      await logActivity({
        type: "node",
        action: "node_status_check",
        details: `Node status check: ${downNodes.length} node(s) down`,
        status: "warning",
        duration,
        metadata: {
          totalNodes: nodes.length,
          downNodes: downNodes.map(n => ({ name: n.name, ip: n.ip })),
        },
      });
    }

    return NextResponse.json({ nodes });
  } catch (error) {
    console.error("Failed to fetch nodes:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const duration = Date.now() - startTime;
    await logActivity({
      type: "error",
      action: "nodes_fetch_failed",
      details: `Failed to fetch nodes: ${errorMessage}`,
      status: "error",
      duration,
      metadata: { error: errorMessage },
    });
    return NextResponse.json(
      { error: "Failed to fetch nodes" },
      { status: 500 }
    );
  }
}
