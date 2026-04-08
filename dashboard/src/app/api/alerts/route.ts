import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { logActivity } from "@/lib/activityLogger";

const PROMETHEUS_URL = process.env.NEXT_PUBLIC_PROMETHEUS_URL || "http://192.168.122.101:9090";
const SETTINGS_FILE = path.join(process.cwd(), "data", "settings.json");

interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  node: string;
  timestamp: string;
  acknowledged: boolean;
  metric: string;
  value: number;
}

interface PrometheusResult {
  metric: { instance?: string; job?: string; [key: string]: string | undefined };
  value: [number, string];
}

interface Thresholds {
  cpu: number;
  memory: number;
  disk: number;
}

const defaultThresholds: Thresholds = {
  cpu: 80,
  memory: 85,
  disk: 90,
};

async function loadThresholds(): Promise<Thresholds> {
  try {
    const data = await fs.readFile(SETTINGS_FILE, "utf-8");
    const settings = JSON.parse(data);
    return settings.thresholds || defaultThresholds;
  } catch {
    return defaultThresholds;
  }
}

async function queryPrometheus(query: string): Promise<PrometheusResult[]> {
  const response = await fetch(
    `${PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent(query)}`,
    { cache: "no-store" }
  );
  const data = await response.json();
  return data.data?.result || [];
}

export async function GET() {
  try {
    const alerts: Alert[] = [];
    const now = new Date();
    const thresholds = await loadThresholds();
    
    // Check CPU usage against threshold
    const cpuResults = await queryPrometheus(
      '100 - (avg by(instance)(rate(node_cpu_seconds_total{mode="idle"}[1m])) * 100)'
    );
    for (const result of cpuResults) {
      const value = parseFloat(result.value[1]);
      if (value > thresholds.cpu) {
        alerts.push({
          id: `cpu-${result.metric.instance}`,
          severity: value > thresholds.cpu + 10 ? "critical" : "warning",
          title: "High CPU Usage",
          message: `CPU usage is at ${value.toFixed(1)}% (threshold: ${thresholds.cpu}%)`,
          node: result.metric.instance || "unknown",
          timestamp: now.toISOString(),
          acknowledged: false,
          metric: "cpu",
          value,
        });
      }
    }

    // Check Memory usage against threshold
    const memResults = await queryPrometheus(
      '(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100'
    );
    for (const result of memResults) {
      const value = parseFloat(result.value[1]);
      if (value > thresholds.memory) {
        alerts.push({
          id: `memory-${result.metric.instance}`,
          severity: value > thresholds.memory + 10 ? "critical" : "warning",
          title: "High Memory Usage",
          message: `Memory usage is at ${value.toFixed(1)}% (threshold: ${thresholds.memory}%)`,
          node: result.metric.instance || "unknown",
          timestamp: now.toISOString(),
          acknowledged: false,
          metric: "memory",
          value,
        });
      }
    }

    // Check Disk usage against threshold
    const diskResults = await queryPrometheus(
      '100 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100'
    );
    for (const result of diskResults) {
      const value = parseFloat(result.value[1]);
      if (value > thresholds.disk) {
        alerts.push({
          id: `disk-${result.metric.instance}`,
          severity: value > thresholds.disk + 5 ? "critical" : "warning",
          title: "High Disk Usage",
          message: `Disk usage is at ${value.toFixed(1)}% (threshold: ${thresholds.disk}%)`,
          node: result.metric.instance || "unknown",
          timestamp: now.toISOString(),
          acknowledged: false,
          metric: "disk",
          value,
        });
      }
    }

    // Check for down targets
    const upResults = await queryPrometheus('up');
    for (const result of upResults) {
      const value = parseFloat(result.value[1]);
      if (value === 0) {
        alerts.push({
          id: `down-${result.metric.instance}`,
          severity: "critical",
          title: "Node Down",
          message: `Node ${result.metric.instance} is not responding`,
          node: result.metric.instance || "unknown",
          timestamp: now.toISOString(),
          acknowledged: false,
          metric: "up",
          value: 0,
        });
      }
    }

    // If no alerts, add an info message
    if (alerts.length === 0) {
      alerts.push({
        id: "all-clear",
        severity: "info",
        title: "All Systems Normal",
        message: "All monitored nodes are operating within normal parameters",
        node: "System",
        timestamp: now.toISOString(),
        acknowledged: false,
        metric: "system",
        value: 0,
      });
    }

    // Log critical and warning alerts
    const criticalAlerts = alerts.filter(a => a.severity === "critical");
    const warningAlerts = alerts.filter(a => a.severity === "warning");
    
    if (criticalAlerts.length > 0 || warningAlerts.length > 0) {
      await logActivity({
        type: "alert",
        action: "alerts_detected",
        details: `Alerts detected: ${criticalAlerts.length} critical, ${warningAlerts.length} warning`,
        status: criticalAlerts.length > 0 ? "error" : "warning",
        metadata: {
          criticalCount: criticalAlerts.length,
          warningCount: warningAlerts.length,
          alerts: alerts.filter(a => a.severity !== "info").map(a => ({
            id: a.id,
            severity: a.severity,
            title: a.title,
            node: a.node,
            value: a.value,
          })),
        },
      });
    }

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("Failed to fetch alerts:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await logActivity({
      type: "error",
      action: "alerts_fetch_failed",
      details: `Failed to fetch alerts: ${errorMessage}`,
      status: "error",
      metadata: { error: errorMessage },
    });
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}
