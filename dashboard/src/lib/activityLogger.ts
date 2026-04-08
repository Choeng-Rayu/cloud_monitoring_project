import fs from "fs/promises";
import path from "path";

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: "api" | "node" | "alert" | "settings" | "system" | "error";
  action: string;
  details: string;
  metadata?: Record<string, any>;
  status: "success" | "error" | "warning" | "info";
  duration?: number;
  ip?: string;
}

const LOG_FILE = path.join(process.cwd(), "data", "activity-logs.json");
const MAX_LOGS = 500; // Keep last 500 logs

async function ensureLogFile(): Promise<ActivityLog[]> {
  try {
    await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });
    const data = await fs.readFile(LOG_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function logActivity(log: Omit<ActivityLog, "id" | "timestamp">): Promise<void> {
  try {
    const logs = await ensureLogFile();
    
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    
    logs.unshift(newLog); // Add to beginning
    
    // Keep only last MAX_LOGS
    const trimmedLogs = logs.slice(0, MAX_LOGS);
    
    await fs.writeFile(LOG_FILE, JSON.stringify(trimmedLogs, null, 2));
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

export async function getActivityLogs(limit = 100, type?: string): Promise<ActivityLog[]> {
  try {
    const logs = await ensureLogFile();
    let filtered = logs;
    
    if (type && type !== "all") {
      filtered = logs.filter(l => l.type === type);
    }
    
    return filtered.slice(0, limit);
  } catch {
    return [];
  }
}

export async function clearActivityLogs(): Promise<void> {
  await fs.writeFile(LOG_FILE, "[]");
}

// Helper to format activity messages
export const ActivityMessages = {
  nodeAdded: (name: string, ip: string) => `Node "${name}" (${ip}) added to monitoring`,
  nodeRemoved: (name: string, ip: string) => `Node "${name}" (${ip}) removed from monitoring`,
  nodeStatusChange: (name: string, oldStatus: string, newStatus: string) => 
    `Node "${name}" status changed: ${oldStatus} → ${newStatus}`,
  settingsSaved: () => "Settings saved successfully",
  alertTriggered: (severity: string, title: string) => `Alert triggered: [${severity}] ${title}`,
  alertAcknowledged: (title: string) => `Alert acknowledged: ${title}`,
  prometheusConnected: () => "Connected to Prometheus server",
  prometheusError: (error: string) => `Prometheus connection error: ${error}`,
  apiRequest: (method: string, path: string) => `API ${method} ${path}`,
  systemStartup: () => "Dashboard system started",
};
