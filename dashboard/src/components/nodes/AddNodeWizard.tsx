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
  Terminal,
  AlertCircle,
  Download,
  Settings,
  Play
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

interface InstallationStep {
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  message?: string;
}

interface NodeResponse {
  success: boolean;
  message?: string;
  error?: string;
  node?: {
    name: string;
    ip: string;
    port: number;
  };
}

const steps = [
  { id: 1, title: "Node Details", icon: Server },
  { id: 2, title: "SSH & Install", icon: Key },
  { id: 3, title: "Installation", icon: Terminal },
  { id: 4, title: "Verification", icon: CheckCircle },
];

export function AddNodeWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [installationSteps, setInstallationSteps] = useState<InstallationStep[]>([
    { name: "Connecting to node via SSH", status: "pending" },
    { name: "Downloading Node Exporter", status: "pending" },
    { name: "Installing Node Exporter", status: "pending" },
    { name: "Configuring systemd service", status: "pending" },
    { name: "Adding target to Prometheus", status: "pending" },
  ]);
  const [nodeResponse, setNodeResponse] = useState<NodeResponse | null>(null);
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
    setError("");
  };

  const updateInstallationStep = (stepIndex: number, status: InstallationStep["status"], message?: string) => {
    setInstallationSteps(prev => prev.map((step, idx) => 
      idx === stepIndex ? { ...step, status, message } : step
    ));
  };

  const submitNodeInstallation = async () => {
    setIsLoading(true);
    setError("");
    setCurrentStep(3);

    try {
      // Start installation process
      const response = await fetch("/api/nodes/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          hostname: formData.name.toLowerCase().replace(/\s+/g, '-'),
          ip: formData.ip,
          port: parseInt(formData.port),
          sshUsername: formData.sshUser,
          sshPassword: formData.sshPassword,
          autoInstall: formData.autoInstall,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // API returns { error: "message" } for errors
        throw new Error(data.error || data.message || "Failed to add node");
      }

      if (!data.success) {
        throw new Error(data.error || data.message || "Failed to add node");
      }

      // Simulate progress through installation steps
      // In production, this would be replaced with WebSocket or SSE for real-time updates
      for (let i = 0; i < installationSteps.length; i++) {
        updateInstallationStep(i, "running");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if installation failed at any step
        if (!data.success && i === 0) {
          const stepError = data.error || data.message || "Installation failed";
          updateInstallationStep(i, "failed", stepError);
          throw new Error(stepError);
        }
        
        updateInstallationStep(i, "completed");
      }

      setNodeResponse(data);
      setCurrentStep(4);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      
      // Log the error to activity log
      try {
        await fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "error",
            action: "node_add_failed_frontend",
            details: `Failed to add node ${formData.name} (${formData.ip}): ${errorMessage}`,
            status: "error",
            metadata: { name: formData.name, ip: formData.ip, error: errorMessage }
          })
        });
      } catch {
        // Ignore logging errors
      }
      
      // Mark current running step as failed
      const runningStepIndex = installationSteps.findIndex(s => s.status === "running");
      if (runningStepIndex !== -1) {
        updateInstallationStep(runningStepIndex, "failed", errorMessage);
      } else {
        // If no step was running, mark first step as failed
        updateInstallationStep(0, "failed", errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      // Validate form
      if (!formData.name || !formData.ip) {
        setError("Please fill in all required fields");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate SSH credentials
      if (!formData.sshUser || !formData.sshPassword) {
        setError("Please provide SSH credentials");
        return;
      }
      // Submit the installation
      await submitNodeInstallation();
    } else if (currentStep === 4) {
      // Complete - redirect to nodes page
      router.push("/nodes");
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && currentStep !== 3 && !isLoading) {
      setCurrentStep(prev => prev - 1);
      setError("");
    }
  };

  const handleRetry = () => {
    // Reset installation steps
    setInstallationSteps([
      { name: "Connecting to node via SSH", status: "pending" },
      { name: "Downloading Node Exporter", status: "pending" },
      { name: "Installing Node Exporter", status: "pending" },
      { name: "Configuring systemd service", status: "pending" },
      { name: "Adding target to Prometheus", status: "pending" },
    ]);
    setError("");
    setCurrentStep(2);
  };

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
            {currentStep === 2 && "Provide SSH credentials and start the installation process."}
            {currentStep === 3 && "Installing Node Exporter and configuring monitoring."}
            {currentStep === 4 && "Node is now connected and sending metrics."}
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
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Installation Progress */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4">
                <div className="mb-4 flex items-center gap-3">
                  <Terminal className="h-6 w-6 text-cyan-400" />
                  <div>
                    <p className="font-medium text-cyan-400">Installing Node Exporter</p>
                    <p className="text-sm text-zinc-400">
                      Setting up monitoring on {formData.name} ({formData.ip})
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {installationSteps.map((step, index) => {
                    const StepIcon = 
                      step.status === "completed" ? CheckCircle :
                      step.status === "running" ? Loader2 :
                      step.status === "failed" ? AlertCircle :
                      index === 0 ? Key :
                      index === 1 ? Download :
                      index === 2 ? Terminal :
                      index === 3 ? Settings :
                      Play;

                    return (
                      <div 
                        key={index}
                        className={cn(
                          "flex items-start gap-3 rounded-lg p-3 transition-all",
                          step.status === "completed" && "bg-emerald-500/10",
                          step.status === "running" && "bg-blue-500/10",
                          step.status === "failed" && "bg-red-500/10",
                          step.status === "pending" && "bg-zinc-800/50"
                        )}
                      >
                        <StepIcon 
                          className={cn(
                            "h-5 w-5 mt-0.5",
                            step.status === "completed" && "text-emerald-400",
                            step.status === "running" && "text-blue-400 animate-spin",
                            step.status === "failed" && "text-red-400",
                            step.status === "pending" && "text-zinc-500"
                          )}
                        />
                        <div className="flex-1">
                          <p className={cn(
                            "text-sm font-medium",
                            step.status === "completed" && "text-emerald-400",
                            step.status === "running" && "text-blue-400",
                            step.status === "failed" && "text-red-400",
                            step.status === "pending" && "text-zinc-500"
                          )}>
                            {step.name}
                          </p>
                          {step.message && (
                            <p className="mt-1 text-xs text-zinc-400">{step.message}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="space-y-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Installation Failed</span>
                  </div>
                  <p className="text-sm text-zinc-300">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="w-full"
                  >
                    Try Again
                  </Button>
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
                    <span className="text-zinc-200">{nodeResponse?.node?.name || formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">IP Address:</span>
                    <span className="text-zinc-200">{nodeResponse?.node?.ip || formData.ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Port:</span>
                    <span className="text-zinc-200">{nodeResponse?.node?.port || formData.port}</span>
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
              disabled={currentStep === 1 || currentStep === 3 || isLoading}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={
                isLoading || 
                (currentStep === 1 && (!formData.name || !formData.ip)) ||
                (currentStep === 2 && (!formData.sshUser || !formData.sshPassword)) ||
                (currentStep === 3 && !error)
              }
              className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {currentStep === 4 && "Go to Dashboard"}
              {currentStep === 2 && !isLoading && "Install Node"}
              {currentStep === 1 && "Continue"}
              {currentStep !== 4 && !isLoading && currentStep !== 2 && currentStep !== 1 && <ArrowRight className="h-4 w-4" />}
              {currentStep === 1 && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
