"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  X,
  Clock,
  Server,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "acknowledged">("all");
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/alerts");
      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const acknowledgeAlert = (id: string) => {
    setAcknowledgedIds(prev => new Set(prev).add(id));
  };

  const dismissAlert = (id: string) => {
    setDismissedIds(prev => new Set(prev).add(id));
  };

  // Apply local state (acknowledged/dismissed) to alerts
  const processedAlerts = alerts
    .filter(alert => !dismissedIds.has(alert.id))
    .map(alert => ({
      ...alert,
      acknowledged: alert.acknowledged || acknowledgedIds.has(alert.id)
    }));

  const filteredAlerts = processedAlerts.filter(alert => {
    if (filter === "active") return !alert.acknowledged;
    if (filter === "acknowledged") return alert.acknowledged;
    return true;
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    return date.toLocaleDateString();
  };

  const severityConfig = {
    critical: {
      icon: AlertTriangle,
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      textColor: "text-red-400",
      badge: "danger" as const,
    },
    warning: {
      icon: AlertTriangle,
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      textColor: "text-amber-400",
      badge: "warning" as const,
    },
    info: {
      icon: Info,
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      textColor: "text-blue-400",
      badge: "info" as const,
    },
  };

  return (
    <div className="min-h-screen">
      <Header 
        title="Alerts" 
        description="Monitor system alerts and notifications"
      />
      
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Critical</p>
                <p className="text-2xl font-bold text-white">
                  {processedAlerts.filter(a => a.severity === "critical" && !a.acknowledged).length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Warnings</p>
                <p className="text-2xl font-bold text-white">
                  {processedAlerts.filter(a => a.severity === "warning" && !a.acknowledged).length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Resolved</p>
                <p className="text-2xl font-bold text-white">
                  {processedAlerts.filter(a => a.acknowledged).length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Refresh */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All ({processedAlerts.length})
            </Button>
            <Button
              variant={filter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("active")}
            >
              Active ({processedAlerts.filter(a => !a.acknowledged).length})
            </Button>
            <Button
              variant={filter === "acknowledged" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("acknowledged")}
            >
              Acknowledged ({processedAlerts.filter(a => a.acknowledged).length})
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAlerts}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-500/30">
            <CardContent className="p-4">
              <p className="text-red-400">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && alerts.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <RefreshCw className="h-12 w-12 mx-auto text-zinc-600 mb-4 animate-spin" />
              <p className="text-zinc-400">Loading alerts from Prometheus...</p>
            </CardContent>
          </Card>
        )}

        {/* Alerts List */}
        {!loading || alerts.length > 0 ? (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => {
              const config = severityConfig[alert.severity];
              const Icon = config.icon;
              
              return (
                <Card 
                  key={alert.id}
                  className={cn(
                    "border transition-all",
                    config.borderColor,
                    alert.acknowledged && "opacity-60"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center",
                        config.bgColor
                      )}>
                        <Icon className={cn("h-5 w-5", config.textColor)} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-white">{alert.title}</h3>
                              <Badge variant={config.badge}>
                                {alert.severity}
                              </Badge>
                              {alert.acknowledged && (
                                <Badge variant="default">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Acknowledged
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-zinc-400">{alert.message}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                              <span className="flex items-center gap-1">
                                <Server className="h-3 w-3" />
                                {alert.node}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimestamp(alert.timestamp)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!alert.acknowledged && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => acknowledgeAlert(alert.id)}
                              >
                                Acknowledge
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => dismissAlert(alert.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredAlerts.length === 0 && !loading && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Bell className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
                  <p className="text-zinc-400">No alerts to display</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
