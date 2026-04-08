import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { initialNodes } from "@/config/nodes";
import { logActivity } from "@/lib/activityLogger";

const execAsync = promisify(exec);
const NODES_FILE = path.join(process.cwd(), "data", "nodes.json");

export async function POST(request: NextRequest) {
  let requestNodeId: string | undefined;
  let requestIp: string | undefined;
  
  try {
    const { nodeId, ip } = await request.json();
    requestNodeId = nodeId;
    requestIp = ip;

    if (!nodeId || !ip) {
      return NextResponse.json({ error: "Missing nodeId or ip" }, { status: 400 });
    }

    // Check if it's an initial node (can't remove these via API)
    const isInitialNode = initialNodes.some(n => n.id === nodeId);
    if (isInitialNode) {
      return NextResponse.json(
        { error: "Cannot remove initial nodes. Edit config/nodes.ts instead." },
        { status: 400 }
      );
    }

    // Remove from nodes.json
    try {
      const data = await fs.readFile(NODES_FILE, "utf-8");
      const nodes = JSON.parse(data);
      const filteredNodes = nodes.filter((n: { id: string }) => n.id !== nodeId);
      await fs.writeFile(NODES_FILE, JSON.stringify(filteredNodes, null, 2));
    } catch {
      // File might not exist
    }

    // Remove from Prometheus config on VM1
    try {
      const removeCmd = `sshpass -p "rayuchoengrayu" ssh -o StrictHostKeyChecking=no rayu@192.168.122.101 << 'EOF'
# Remove the target from Prometheus config
sudo sed -i '/${ip}:9100/d' /etc/prometheus/prometheus.yml
# Reload Prometheus
sudo systemctl reload prometheus
EOF`;
      await execAsync(removeCmd, { timeout: 30000 });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to update Prometheus:", errorMessage);
      // Continue anyway - node is removed from dashboard
    }

    await logActivity({
      type: "node",
      action: "node_removed",
      details: `Node (${ip}) removed from monitoring`,
      status: "success",
      metadata: { nodeId, ip },
    });

    return NextResponse.json({ success: true, message: "Node removed successfully" });
  } catch (error: unknown) {
    console.error("Failed to remove node:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await logActivity({
      type: "error",
      action: "node_remove_failed",
      details: `Failed to remove node: ${errorMessage}`,
      status: "error",
      metadata: { nodeId: requestNodeId, ip: requestIp, error: errorMessage },
    });
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
