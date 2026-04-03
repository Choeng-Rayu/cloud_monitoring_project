export interface VMNode {
  id: string;
  name: string;
  hostname: string;
  ip: string;
  port: number;
  status: 'up' | 'down' | 'pending' | 'unknown';
  role: 'monitoring' | 'target';
  metrics?: NodeMetrics;
  lastSeen?: string;
  uptime?: number;
}

export interface NodeMetrics {
  cpu: {
    usage: number;
    cores: number;
    load1: number;
    load5: number;
    load15: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
}

export interface MetricDataPoint {
  timestamp: number;
  value: number;
}

export interface ChartData {
  time: string;
  value: number;
  label?: string;
}

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  nodeId: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface PrometheusTarget {
  labels: {
    instance: string;
    job: string;
    [key: string]: string;
  };
  health: 'up' | 'down' | 'unknown';
  lastScrape: string;
  lastScrapeDuration: number;
}

export interface AddNodeFormData {
  name: string;
  ip: string;
  port: number;
  sshUser: string;
  sshPassword: string;
  autoInstall: boolean;
}
