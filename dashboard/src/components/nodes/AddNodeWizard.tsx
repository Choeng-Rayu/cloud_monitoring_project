"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Server, 
  Network, 
  Key, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  Copy,
  Terminal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FormData {
  name: string;
  ip: string;
  port: string;
  sshUser: string;
  sshPassword: string;
  autoInstall: boolean;
}

const steps = [
  { id: 1, title: "Node Details", icon: Server },
  { id: 2, title: "SSH Connection", icon: Key },
  { id: 3, title: "Installation", icon: Terminal },
  { id: 4, title: "Verification", icon: CheckCircle },
];

export function AddNodeWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "failed">("idle");
  const [installStatus, setInstallStatus] = useState<"idle" | "installing" | "success" | "failed">("idle");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    ip: "",
    port: "9100",
    sshUser: "rayu",
    sshPassword: "",
    autoInstall: true,
  });

  const updateForm = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const testConnection = async () => {
    setConnectionStatus("testing");
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 2000));
    setConnectionStatus("success");
  };

  const installNodeExporter = async () => {
    setInstallStatus("installing");
    // Simulate installation
    await new Promise(resolve => setTimeout(resolve, 3000));
    setInstallStatus("success");
  };

  const handleNext = async () => {
    if (currentStep === 2) {
      await testConnection();
    }
    if (currentStep === 3 && formData.autoInstall) {
      await installNodeExporter();
    }
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete
      router.push("/nodes");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const nodeExporterScript = `#!/bin/bash
# Node Exporter Installation Script
# Run with: curl -sSL <url> | sudo bash

NODE_EXPORTER_VERSION="1.8.2"
wget -q https://github.com/prometheus/node_exporter/releases/download/v\${NODE_EXPORTER_VERSION}/node_exporter-\${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz
tar xzf node_exporter-\${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz
sudo cp node_exporter-\${NODE_EXPORTER_VERSION}.linux-amd64/node_exporter /usr/local/bin/
sudo useradd --no-create-home --shell /bin/false node_exporter
# ... (full script continues)`;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                currentStep >= step.id
                  ? "border-cyan-500 bg-cyan-500/20 text-cyan-400"
                  : "border-zinc-700 text-zinc-500"
              )}>
                <step.icon className="h-5 w-5" />
              </div>
              <span className={cn(
                "ml-2 hidden text-sm font-medium md:block",
                currentStep >= step.id ? "text-zinc-200" : "text-zinc-500"
              )}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={cn(
                  "mx-4 h-0.5 w-12 lg:w-24",
                  currentStep > step.id ? "bg-cyan-500" : "bg-zinc-700"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>
            {currentStep === 1 && "Enter the details of the new node you want to add."}
            {currentStep === 2 && "Provide SSH credentials to connect to the node."}
            {currentStep === 3 && "Install Node Exporter on the target machine."}
            {currentStep === 4 && "Verify the node is connected and sending metrics."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Node Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Node Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Production Server 1"
                  value={formData.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ip">IP Address</Label>
                  <Input
                    id="ip"
                    placeholder="e.g., 192.168.122.104"
                    value={formData.ip}
                    onChange={(e) => updateForm("ip", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Node Exporter Port</Label>
                  <Input
                    id="port"
                    placeholder="9100"
                    value={formData.port}
                    onChange={(e) => updateForm("port", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: SSH Connection */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sshUser">SSH Username</Label>
                <Input
                  id="sshUser"
                  placeholder="e.g., rayu"
                  value={formData.sshUser}
                  onChange={(e) => updateForm("sshUser", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sshPassword">SSH Password</Label>
                <Input
                  id="sshPassword"
                  type="password"
                  placeholder="Enter SSH password"
                  value={formData.sshPassword}
                  onChange={(e) => updateForm("sshPassword", e.target.value)}
                />
              </div>
              {connectionStatus !== "idle" && (
                <div className={cn(
                  "flex items-center gap-2 rounded-lg p-3",
                  connectionStatus === "testing" && "bg-blue-500/10 text-blue-400",
                  connectionStatus === "success" && "bg-emerald-500/10 text-emerald-400",
                  connectionStatus === "failed" && "bg-red-500/10 text-red-400"
                )}>
                  {connectionStatus === "testing" && <Loader2 className="h-4 w-4 animate-spin" />}
                  {connectionStatus === "success" && <CheckCircle className="h-4 w-4" />}
                  {connectionStatus === "testing" && "Testing SSH connection..."}
                  {connectionStatus === "success" && "Connection successful!"}
                  {connectionStatus === "failed" && "Connection failed. Check credentials."}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Installation */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-zinc-700 p-4">
                <div>
                  <p className="font-medium text-zinc-200">Auto-install Node Exporter</p>
                  <p className="text-sm text-zinc-400">
                    Automatically install and configure Node Exporter via SSH
                  </p>
                </div>
                <Switch
                  checked={formData.autoInstall}
                  onCheckedChange={(checked) => updateForm("autoInstall", checked)}
                />
              </div>

              {!formData.autoInstall && (
                <div className="space-y-2">
                  <Label>Manual Installation Script</Label>
                  <div className="relative">
                    <pre className="max-h-48 overflow-auto rounded-lg bg-zinc-900 p-4 text-xs text-zinc-300">
                      {nodeExporterScript}
                    </pre>
                    <button 
                      className="absolute right-2 top-2 rounded-md bg-zinc-800 p-2 hover:bg-zinc-700"
                      onClick={() => navigator.clipboard.writeText(nodeExporterScript)}
                    >
                      <Copy className="h-4 w-4 text-zinc-400" />
                    </button>
                  </div>
                </div>
              )}

              {installStatus !== "idle" && formData.autoInstall && (
                <div className={cn(
                  "flex items-center gap-2 rounded-lg p-3",
                  installStatus === "installing" && "bg-blue-500/10 text-blue-400",
                  installStatus === "success" && "bg-emerald-500/10 text-emerald-400"
                )}>
                  {installStatus === "installing" && <Loader2 className="h-4 w-4 animate-spin" />}
                  {installStatus === "success" && <CheckCircle className="h-4 w-4" />}
                  {installStatus === "installing" && "Installing Node Exporter..."}
                  {installStatus === "success" && "Node Exporter installed successfully!"}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Verification */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-emerald-400" />
                  <div>
                    <p className="font-medium text-emerald-400">Node Added Successfully!</p>
                    <p className="text-sm text-zinc-400">
                      {formData.name} ({formData.ip}) is now being monitored.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-zinc-300">Node Configuration:</p>
                <div className="grid gap-2 rounded-lg bg-zinc-900 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Name:</span>
                    <span className="text-zinc-200">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">IP Address:</span>
                    <span className="text-zinc-200">{formData.ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Port:</span>
                    <span className="text-zinc-200">{formData.port}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Status:</span>
                    <Badge variant="success">Connected</Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-zinc-900 p-4">
                <p className="text-sm text-zinc-400">
                  <strong className="text-zinc-200">Next Steps:</strong><br />
                  The node has been added to Prometheus. Metrics will appear in the dashboard within 30 seconds.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={isLoading || (currentStep === 1 && (!formData.name || !formData.ip))}
              className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              {currentStep === 4 ? "Go to Dashboard" : "Continue"}
              {currentStep !== 4 && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
