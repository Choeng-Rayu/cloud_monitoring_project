import { NextResponse } from "next/server";

const PROMETHEUS_URL = process.env.NEXT_PUBLIC_PROMETHEUS_URL || "http://192.168.122.101:9090";

interface Activity {
  time: string;
  event: string;
  type: "info" | "warning" | "success" | "danger";
}

async function queryPrometheus(query: string) {
  const response = await fetch(
    `${PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent(query)}`,
    { cache: "no-store" }
  );
  const data = await response.json();
  return data.data?.result || [];
}

function formatTimeAgo(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)} seconds ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

export async function GET() {
  try {
    const activities: Activity[] = [];

    // Get last scrape times for each target
    await queryPrometheus('scrape_duration_seconds');
    
    // Get target health
    const upResults = await queryPrometheus('up');
    const upCount = upResults.filter((r: { value: [number, string] }) => parseFloat(r.value[1]) === 1).length;
    const totalCount = upResults.length;
    
    activities.push({
      time: "Just now",
      event: `Metrics collected from ${upCount}/${totalCount} nodes`,
      type: upCount === totalCount ? "success" : "warning",
    });

    // Check for high CPU
    const cpuResults = await queryPrometheus(
      '100 - (avg by(instance)(rate(node_cpu_seconds_total{mode="idle"}[1m])) * 100) > 70'
    );
    if (cpuResults.length > 0) {
      for (const result of cpuResults.slice(0, 2)) {
        const value = parseFloat(result.value[1]);
        activities.push({
          time: "Now",
          event: `${result.metric.instance} CPU at ${value.toFixed(1)}%`,
          type: value > 80 ? "warning" : "info",
        });
      }
    }

    // Check for high memory
    const memResults = await queryPrometheus(
      '(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 > 70'
    );
    if (memResults.length > 0) {
      for (const result of memResults.slice(0, 2)) {
        const value = parseFloat(result.value[1]);
        activities.push({
          time: "Now",
          event: `${result.metric.instance} memory at ${value.toFixed(1)}%`,
          type: value > 85 ? "warning" : "info",
        });
      }
    }

    // Get uptime info
    const uptimeResults = await queryPrometheus('node_time_seconds - node_boot_time_seconds');
    for (const result of uptimeResults.slice(0, 2)) {
      const uptimeSeconds = parseFloat(result.value[1]);
      const uptimeHours = Math.floor(uptimeSeconds / 3600);
      if (uptimeHours < 1) {
        activities.push({
          time: formatTimeAgo(uptimeSeconds),
          event: `${result.metric.instance} was recently started`,
          type: "info",
        });
      }
    }

    // Add a general status
    activities.push({
      time: "Continuous",
      event: "Prometheus scraping every 5 seconds",
      type: "info",
    });

    return NextResponse.json({ activities: activities.slice(0, 6) });
  } catch (error) {
    console.error("Failed to fetch activity:", error);
    return NextResponse.json({ 
      activities: [{
        time: "Now",
        event: "Unable to fetch activity data",
        type: "danger"
      }]
    });
  }
}
