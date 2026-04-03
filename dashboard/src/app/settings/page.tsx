"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PROMETHEUS_URL, GRAFANA_URL, REFRESH_INTERVAL } from "@/config/nodes";
import { 
  Settings, 
  Database, 
  Bell, 
  Shield, 
  Save,
  ExternalLink,
  CheckCircle
} from "lucide-react";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

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
                    defaultValue={PROMETHEUS_URL}
                  />
                  <a href={PROMETHEUS_URL} target="_blank" rel="noopener noreferrer">
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
                    defaultValue={GRAFANA_URL}
                  />
                  <a href={GRAFANA_URL} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="refresh">Refresh Interval (ms)</Label>
              <Input
                id="refresh"
                type="number"
                defaultValue={REFRESH_INTERVAL}
                className="max-w-xs"
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
              <Switch />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-zinc-200">Browser Notifications</p>
                <p className="text-sm text-zinc-400">Show desktop notifications</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-zinc-200">Critical Alerts Only</p>
                <p className="text-sm text-zinc-400">Only notify for critical issues</p>
              </div>
              <Switch />
            </div>
            <div className="grid gap-4 md:grid-cols-3 pt-4">
              <div className="space-y-2">
                <Label>CPU Alert Threshold (%)</Label>
                <Input type="number" defaultValue="80" />
              </div>
              <div className="space-y-2">
                <Label>Memory Alert Threshold (%)</Label>
                <Input type="number" defaultValue="85" />
              </div>
              <div className="space-y-2">
                <Label>Disk Alert Threshold (%)</Label>
                <Input type="number" defaultValue="90" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-400" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Manage authentication and access control
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-zinc-200">Two-Factor Authentication</p>
                <p className="text-sm text-zinc-400">Add an extra layer of security</p>
              </div>
              <Badge variant="warning">Not Configured</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-zinc-200">API Key</p>
                <p className="text-sm text-zinc-400">For programmatic access</p>
              </div>
              <Button variant="outline" size="sm">Generate</Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          {saved && (
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle className="h-4 w-4" />
              Settings saved!
            </div>
          )}
          <Button 
            onClick={handleSave}
            className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-500"
          >
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
