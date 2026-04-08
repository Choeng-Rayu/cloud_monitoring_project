"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { MetricChart } from "@/components/dashboard/MetricChart";
import { MetricGauge } from "@/components/dashboard/MetricGauge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { initialNodes, REFRESH_INTERVAL } from "@/config/nodes";
import { VMNode, MetricDataPoint } from "@/types";
import { getNodeMetrics, getCPUHistory, getMemoryHistory, formatBytes } from "@/lib/prometheus";
import { 
  ArrowLeft, 
  Server, 
  MemoryStick, 
  HardDrive, 
  Activity,
  RefreshCw,
  Terminal,
  Settings,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function NodeDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [node, setNode] = useState<VMNode | null>(null);
  const [cpuHistory, setCpuHistory] = useState<MetricDataPoint[]>([]);
  const [memoryHistory, setMemoryHistory] = useState<MetricDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [sshModalOpen, setSshModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  // Check if this is an initial node (cannot be removed via API)
  const isInitialNode = initialNodes.some(n => n.id === id);

  useEffect(() => {
    const baseNode = initialNodes.find(n => n.id === id);
    if (!baseNode) {
      router.push("/nodes");
      return;
    }

    const fetchData = async () => {
      const instance = `${baseNode.ip}:${baseNode.port}`;
      const metrics = await getNodeMetrics(instance);
      const cpu = await getCPUHistory(instance, 1);
      const memory = await getMemoryHistory(instance, 1);

      setNode({
        ...baseNode,
        status: metrics ? "up" : "down",
        metrics: metrics || undefined,
      });
      setCpuHistory(cpu);
      setMemoryHistory(memory);
      setIsLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [id, router]);

  const handleCopySSH = async () => {
    if (!node) return;
    const sshCommand = `ssh rayu@${node.ip}`;
    await navigator.clipboard.writeText(sshCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveNode = async () => {
    if (!node) return;
    setIsRemoving(true);
    setRemoveError(null);

    try {
      const response = await fetch("/api/nodes/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId: node.id, ip: node.ip }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove node");
      }

      // Success - redirect to nodes list
      router.push("/nodes");
    } catch (error) {
      setRemoveError(error instanceof Error ? error.message : "Failed to remove node");
      setIsRemoving(false);
    }
  };

  if (!node) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header 
        title={node.name} 
        description={`${node.ip}:${node.port}`}
      />
      
      <div className="p-6 space-y-6">
        {/* Back button and actions */}
        <div className="flex items-center justify-between">
          <Link href="/nodes">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Nodes
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setSshModalOpen(true)}
            >
              <Terminal className="h-4 w-4" />
              SSH Console
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setConfigModalOpen(true)}
            >
              <Settings className="h-4 w-4" />
              Configure
            </Button>
            <Button 
              variant="outline" 
              className="gap-2 text-red-400 hover:text-red-300 hover:border-red-500/50"
              onClick={() => setRemoveModalOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>

        {/* Node Info Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                <Server className="h-8 w-8 text-cyan-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">{node.name}</h2>
                  <Badge variant={node.status === "up" ? "success" : "danger"}>
                    <Activity className="mr-1 h-3 w-3" />
                    {node.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500">Hostname</span>
                    <p className="text-zinc-200">{node.hostname}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">IP Address</span>
                    <p className="text-zinc-200">{node.ip}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Port</span>
                    <p className="text-zinc-200">{node.port}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Role</span>
                    <p className="text-zinc-200 capitalize">{node.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gauges */}
        {node.metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 flex flex-col items-center">
                <MetricGauge 
                  value={node.metrics.cpu.usage} 
                  label="CPU Usage" 
                  color="cyan"
                  size="lg"
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex flex-col items-center">
                <MetricGauge 
                  value={node.metrics.memory.usagePercent} 
                  label="Memory Usage" 
                  color="purple"
                  size="lg"
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex flex-col items-center">
                <MetricGauge 
                  value={node.metrics.disk.usagePercent} 
                  label="Disk Usage" 
                  color="emerald"
                  size="lg"
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex flex-col items-center">
                <MetricGauge 
                  value={node.metrics.cpu.load1 * 10} 
                  label="Load Average" 
                  color="amber"
                  size="lg"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <MetricChart
            title="CPU Usage (Last Hour)"
            data={cpuHistory}
            color="#06b6d4"
            unit="%"
            type="area"
          />
          <MetricChart
            title="Memory Usage (Last Hour)"
            data={memoryHistory}
            color="#a855f7"
            unit="%"
            type="area"
          />
        </div>

        {/* Detailed Metrics */}
        {node.metrics && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Memory Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MemoryStick className="h-5 w-5 text-purple-400" />
                  Memory Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Used</span>
                    <span className="text-zinc-200">{formatBytes(node.metrics.memory.used)}</span>
                  </div>
                  <Progress 
                    value={node.metrics.memory.usagePercent} 
                    indicatorClassName="bg-purple-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg bg-zinc-800/50 p-3">
                    <span className="text-zinc-500">Total</span>
                    <p className="text-lg font-bold text-white">{formatBytes(node.metrics.memory.total)}</p>
                  </div>
                  <div className="rounded-lg bg-zinc-800/50 p-3">
                    <span className="text-zinc-500">Available</span>
                    <p className="text-lg font-bold text-white">{formatBytes(node.metrics.memory.free)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disk Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HardDrive className="h-5 w-5 text-emerald-400" />
                  Disk Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Used</span>
                    <span className="text-zinc-200">{formatBytes(node.metrics.disk.used)}</span>
                  </div>
                  <Progress 
                    value={node.metrics.disk.usagePercent} 
                    indicatorClassName="bg-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg bg-zinc-800/50 p-3">
                    <span className="text-zinc-500">Total</span>
                    <p className="text-lg font-bold text-white">{formatBytes(node.metrics.disk.total)}</p>
                  </div>
                  <div className="rounded-lg bg-zinc-800/50 p-3">
                    <span className="text-zinc-500">Available</span>
                    <p className="text-lg font-bold text-white">{formatBytes(node.metrics.disk.free)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* SSH Console Modal */}
      <Dialog open={sshModalOpen} onOpenChange={setSshModalOpen}>
        <DialogClose onClose={() => setSshModalOpen(false)} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-cyan-400" />
            SSH Connection
          </DialogTitle>
          <DialogDescription>
            Use the command below to connect to {node.name} via SSH.
          </DialogDescription>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-zinc-800 p-4 font-mono text-sm">
              <div className="flex items-center justify-between">
                <code className="text-cyan-400">ssh rayu@{node.ip}</code>
                <Button 
                  variant="ghost" 
                  size="icon-sm"
                  onClick={handleCopySSH}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="text-xs text-zinc-500 space-y-1">
              <p>Port: 22 (default SSH port)</p>
              <p>Note: Make sure you have SSH access to this node.</p>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setSshModalOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Configure Modal */}
      <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
        <DialogClose onClose={() => setConfigModalOpen(false)} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-cyan-400" />
            Node Configuration
          </DialogTitle>
          <DialogDescription>
            Configuration options for {node.name}
          </DialogDescription>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            <div className="rounded-lg border border-zinc-700 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Node ID</span>
                <span className="text-zinc-200 font-mono">{node.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Prometheus Target</span>
                <span className="text-zinc-200 font-mono">{node.ip}:{node.port}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Role</span>
                <span className="text-zinc-200 capitalize">{node.role}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-zinc-300">Quick Links</p>
              <div className="flex flex-col gap-2">
                <Link 
                  href={`http://${node.ip}:${node.port}/metrics`}
                  target="_blank"
                  className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Raw Metrics
                </Link>
                <Link 
                  href="/settings"
                  className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
                >
                  <Settings className="h-4 w-4" />
                  Go to Settings
                </Link>
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfigModalOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Remove Node Modal */}
      <Dialog open={removeModalOpen} onOpenChange={setRemoveModalOpen}>
        <DialogClose onClose={() => setRemoveModalOpen(false)} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Remove Node
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to remove <strong>{node.name}</strong>?
          </DialogDescription>
        </DialogHeader>
        <DialogContent>
          {isInitialNode ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm text-amber-400">
                This is an initial node defined in <code className="bg-zinc-800 px-1 rounded">config/nodes.ts</code>.
                It cannot be removed via the dashboard. Edit the configuration file directly to remove it.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                <p className="text-sm text-red-300">
                  This action will:
                </p>
                <ul className="mt-2 text-sm text-red-300 list-disc list-inside space-y-1">
                  <li>Remove the node from the dashboard</li>
                  <li>Remove the target from Prometheus configuration</li>
                </ul>
              </div>
              {removeError && (
                <div className="rounded-lg border border-red-500 bg-red-500/20 p-3">
                  <p className="text-sm text-red-300">{removeError}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setRemoveModalOpen(false)}
            disabled={isRemoving}
          >
            Cancel
          </Button>
          {!isInitialNode && (
            <Button 
              variant="destructive"
              onClick={handleRemoveNode}
              disabled={isRemoving}
              className="gap-2"
            >
              {isRemoving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Remove Node
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </Dialog>
    </div>
  );
}
