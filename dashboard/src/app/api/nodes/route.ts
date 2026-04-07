import { NextResponse } from "next/server";
import { initialNodes } from "@/config/nodes";
import { getNodeMetrics, getTargets, checkPrometheusHealth } from "@/lib/prometheus";
import { VMNode } from "@/types";

export async function GET() {
  try {
    const targets = await getTargets();
    
    const nodes: VMNode[] = await Promise.all(
      initialNodes.map(async (node) => {
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

    return NextResponse.json({ nodes });
  } catch (error) {
    console.error("Failed to fetch nodes:", error);
    return NextResponse.json(
      { error: "Failed to fetch nodes" },
      { status: 500 }
    );
  }
}
