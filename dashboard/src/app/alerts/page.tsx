"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  X,
  Clock,
  Server
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
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    severity: "warning",
    title: "High CPU Usage",
    message: "CPU usage exceeded 80% for more than 5 minutes",
    node: "VM2 - Target Node",
    timestamp: "2 minutes ago",
    acknowledged: false,
  },
  {
    id: "2",
    severity: "info",
    title: "Node Exporter Updated",
    message: "Node Exporter was updated to version 1.8.2",
    node: "VM3 - Target Node",
    timestamp: "1 hour ago",
    acknowledged: true,
  },
  {
    id: "3",
    severity: "critical",
    title: "Disk Space Low",
    message: "Disk usage exceeded 90% on root partition",
    node: "VM2 - Target Node",
    timestamp: "3 hours ago",
    acknowledged: true,
  },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [filter, setFilter] = useState<"all" | "active" | "acknowledged">("all");

  const acknowledgeAlert = (id: string) => {
    setAlerts(alerts.map(a => 
      a.id === id ? { ...a, acknowledged: true } : a
    ));
  };

  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === "active") return !alert.acknowledged;
    if (filter === "acknowledged") return alert.acknowledged;
    return true;
  });

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
                  {alerts.filter(a => a.severity === "critical" && !a.acknowledged).length}
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
                  {alerts.filter(a => a.severity === "warning" && !a.acknowledged).length}
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
                  {alerts.filter(a => a.acknowledged).length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({alerts.length})
          </Button>
          <Button
            variant={filter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("active")}
          >
            Active ({alerts.filter(a => !a.acknowledged).length})
          </Button>
          <Button
            variant={filter === "acknowledged" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("acknowledged")}
          >
            Acknowledged ({alerts.filter(a => a.acknowledged).length})
          </Button>
        </div>

        {/* Alerts List */}
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
                              {alert.timestamp}
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

          {filteredAlerts.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
                <p className="text-zinc-400">No alerts to display</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
