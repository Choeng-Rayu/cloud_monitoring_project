"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  RefreshCw, 
  Trash2, 
  Server, 
  AlertTriangle, 
  Settings, 
  Info,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

interface ActivityLog {
  id: string;
  timestamp: string;
  type: "api" | "node" | "alert" | "settings" | "system" | "error";
  action: string;
  details: string;
  metadata?: Record<string, any>;
  status: "success" | "error" | "warning" | "info";
  duration?: number;
}

const typeIcons: Record<string, React.ReactNode> = {
  api: <Activity className="h-4 w-4" />,
  node: <Server className="h-4 w-4" />,
  alert: <AlertTriangle className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  system: <Info className="h-4 w-4" />,
  error: <XCircle className="h-4 w-4" />,
};

const statusColors: Record<string, string> = {
  success: "text-green-400 bg-green-400/10",
  error: "text-red-400 bg-red-400/10",
  warning: "text-yellow-400 bg-yellow-400/10",
  info: "text-blue-400 bg-blue-400/10",
};

const typeColors: Record<string, string> = {
  api: "text-purple-400 bg-purple-400/10",
  node: "text-cyan-400 bg-cyan-400/10",
  alert: "text-orange-400 bg-orange-400/10",
  settings: "text-gray-400 bg-gray-400/10",
  system: "text-blue-400 bg-blue-400/10",
  error: "text-red-400 bg-red-400/10",
};

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const typeParam = filter !== "all" ? `&type=${filter}` : "";
      const response = await fetch(`/api/logs?limit=200${typeParam}`);
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
    setLoading(false);
  };

  const clearLogs = async () => {
    if (confirm("Are you sure you want to clear all activity logs?")) {
      await fetch("/api/logs", { method: "DELETE" });
      fetchLogs();
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [filter]);

  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Activity Logs</h1>
          <p className="text-zinc-400">Track all system activities and debug issues</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={clearLogs} className="text-red-400">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Logs
          </Button>
        </div>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 flex-wrap">
        {["all", "node", "api", "alert", "settings", "system", "error"].map((type) => (
          <Button
            key={type}
            variant={filter === type ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {logs.filter(l => l.status === "success").length}
                </p>
                <p className="text-xs text-zinc-400">Success</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {logs.filter(l => l.status === "error").length}
                </p>
                <p className="text-xs text-zinc-400">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {logs.filter(l => l.status === "warning").length}
                </p>
                <p className="text-xs text-zinc-400">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{logs.length}</p>
                <p className="text-xs text-zinc-400">Total Logs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs list */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && logs.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">No activity logs yet</div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${typeColors[log.type]}`}>
                    {typeIcons[log.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{log.action}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${statusColors[log.status]}`}>
                        {log.status}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs bg-zinc-700 text-zinc-300">
                        {log.type}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 truncate">{log.details}</p>
                    {log.metadata && (
                      <details className="mt-1">
                        <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-300">
                          View metadata
                        </summary>
                        <pre className="text-xs text-zinc-400 mt-1 p-2 bg-zinc-900 rounded overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-zinc-400">{formatTimeAgo(log.timestamp)}</p>
                    {log.duration && (
                      <p className="text-xs text-zinc-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {log.duration}ms
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
