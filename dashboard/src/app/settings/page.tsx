"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  Bell, 
  Shield, 
  Save,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";

interface Settings {
  prometheus: {
    url: string;
    scrapeInterval: string;
  };
  grafana: {
    url: string;
  };
  notifications: {
    email: boolean;
    slack: boolean;
    browser: boolean;
  };
  thresholds: {
    cpu: number;
    memory: number;
    disk: number;
  };
  updatedAt: string;
}

const defaultSettings: Settings = {
  prometheus: {
    url: "http://192.168.122.101:9090",
    scrapeInterval: "5s",
  },
  grafana: {
    url: "http://192.168.122.101:3000",
  },
  notifications: {
    email: false,
    slack: false,
    browser: true,
  },
  thresholds: {
    cpu: 80,
    memory: 85,
    disk: 90,
  },
  updatedAt: new Date().toISOString(),
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [hasChanges, setHasChanges] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("idle");
    
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        setSaveStatus("success");
        setHasChanges(false);
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (
    section: keyof Settings,
    updates: Record<string, string | number | boolean>
  ) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...(prev[section] as Record<string, unknown>), ...updates },
    }));
    setHasChanges(true);
  };

  const updateNotification = (key: keyof Settings["notifications"], value: boolean) => {
    updateSettings("notifications", { [key]: value });
  };

  const updateThreshold = (key: keyof Settings["thresholds"], value: number) => {
    updateSettings("thresholds", { [key]: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header 
          title="Settings" 
          description="Configure your monitoring dashboard"
        />
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header 
        title="Settings" 
        description="Configure your monitoring dashboard"
      />
      
      <div className="p-6 space-y-6 max-w-4xl">
        {/* Connection Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-cyan-400" />
              Connection Settings
            </CardTitle>
            <CardDescription>
              Configure connections to Prometheus and Grafana
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="prometheus">Prometheus URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="prometheus"
                    value={settings.prometheus.url}
                    onChange={(e) => updateSettings("prometheus", { url: e.target.value })}
                  />
                  <a href={settings.prometheus.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="grafana">Grafana URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="grafana"
                    value={settings.grafana.url}
                    onChange={(e) => updateSettings("grafana", { url: e.target.value })}
                  />
                  <a href={settings.grafana.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scrapeInterval">Prometheus Scrape Interval</Label>
              <Input
                id="scrapeInterval"
                value={settings.prometheus.scrapeInterval}
                onChange={(e) => updateSettings("prometheus", { scrapeInterval: e.target.value })}
                className="max-w-xs"
                placeholder="e.g., 5s, 15s, 1m"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-400" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure alert notifications and thresholds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-zinc-200">Email Notifications</p>
                <p className="text-sm text-zinc-400">Receive alerts via email</p>
              </div>
              <Switch 
                checked={settings.notifications.email}
                onCheckedChange={(checked) => updateNotification("email", checked)}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-zinc-200">Slack Notifications</p>
                <p className="text-sm text-zinc-400">Send alerts to Slack channel</p>
              </div>
              <Switch 
                checked={settings.notifications.slack}
                onCheckedChange={(checked) => updateNotification("slack", checked)}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-zinc-200">Browser Notifications</p>
                <p className="text-sm text-zinc-400">Show desktop notifications</p>
              </div>
              <Switch 
                checked={settings.notifications.browser}
                onCheckedChange={(checked) => updateNotification("browser", checked)}
              />
            </div>
            <div className="border-t border-zinc-800 pt-4 mt-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-4">Alert Thresholds</h4>
              <p className="text-xs text-zinc-500 mb-4">
                These thresholds are used by the alerts API to determine when to trigger alerts.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="cpuThreshold">CPU Alert Threshold (%)</Label>
                  <Input 
                    id="cpuThreshold"
                    type="number" 
                    min={0}
                    max={100}
                    value={settings.thresholds.cpu}
                    onChange={(e) => updateThreshold("cpu", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memoryThreshold">Memory Alert Threshold (%)</Label>
                  <Input 
                    id="memoryThreshold"
                    type="number"
                    min={0}
                    max={100}
                    value={settings.thresholds.memory}
                    onChange={(e) => updateThreshold("memory", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diskThreshold">Disk Alert Threshold (%)</Label>
                  <Input 
                    id="diskThreshold"
                    type="number"
                    min={0}
                    max={100}
                    value={settings.thresholds.disk}
                    onChange={(e) => updateThreshold("disk", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings - Coming Soon */}
        <Card className="opacity-75">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-400" />
              Security Settings
              <Badge variant="info" className="ml-2">Coming Soon</Badge>
            </CardTitle>
            <CardDescription>
              Manage authentication and access control
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-zinc-400">Two-Factor Authentication</p>
                <p className="text-sm text-zinc-500">Add an extra layer of security</p>
              </div>
              <Badge variant="default" className="text-zinc-500">Not Available</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-zinc-400">API Key</p>
                <p className="text-sm text-zinc-500">For programmatic access</p>
              </div>
              <Button variant="outline" size="sm" disabled>Generate</Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4 items-center">
          {hasChanges && (
            <span className="text-sm text-amber-400">Unsaved changes</span>
          )}
          {saveStatus === "success" && (
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle className="h-4 w-4" />
              Settings saved!
            </div>
          )}
          {saveStatus === "error" && (
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-4 w-4" />
              Failed to save settings
            </div>
          )}
          <Button 
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
