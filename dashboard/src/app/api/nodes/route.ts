import { NextResponse } from "next/server";
import { initialNodes } from "@/config/nodes";
import { getNodeMetrics, getTargets } from "@/lib/prometheus";
import { VMNode } from "@/types";

export async function GET() {
  try {
    const targets = await getTargets();
    
    const nodes: VMNode[] = await Promise.all(
      initialNodes.map(async (node) => {
        const instance = `${node.ip}:${node.port}`;
        const target = targets.find(t => t.labels.instance === instance);
        const metrics = node.role === "target" ? await getNodeMetrics(instance) : null;
        
        return {
          ...node,
          status: target?.health || "unknown",
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
