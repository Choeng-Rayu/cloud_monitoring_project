import { PROMETHEUS_URL } from '@/config/nodes';
import { NodeMetrics, PrometheusTarget, MetricDataPoint } from '@/types';

interface PrometheusQueryResult {
  status: string;
  data: {
    resultType: string;
    result: Array<{
      metric: Record<string, string>;
      value?: [number, string];
      values?: Array<[number, string]>;
    }>;
  };
}

export async function queryPrometheus(query: string): Promise<PrometheusQueryResult> {
  const response = await fetch(
    `${PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent(query)}`,
    { cache: 'no-store' }
  );
  if (!response.ok) {
    throw new Error(`Prometheus query failed: ${response.statusText}`);
  }
  return response.json();
}

export async function queryPrometheusRange(
  query: string,
  start: number,
  end: number,
  step: string = '15s'
): Promise<PrometheusQueryResult> {
  const response = await fetch(
    `${PROMETHEUS_URL}/api/v1/query_range?query=${encodeURIComponent(query)}&start=${start}&end=${end}&step=${step}`,
    { cache: 'no-store' }
  );
  if (!response.ok) {
    throw new Error(`Prometheus range query failed: ${response.statusText}`);
  }
  return response.json();
}

export async function getTargets(): Promise<PrometheusTarget[]> {
  const response = await fetch(`${PROMETHEUS_URL}/api/v1/targets`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch targets: ${response.statusText}`);
  }
  const data = await response.json();
  return data.data.activeTargets;
}

export async function getNodeMetrics(instance: string): Promise<NodeMetrics | null> {
  try {
    const [cpuResult, memTotalResult, memAvailResult, diskTotalResult, diskAvailResult, loadResult] = 
      await Promise.all([
        queryPrometheus(`100 - (avg by(instance) (rate(node_cpu_seconds_total{instance="${instance}",mode="idle"}[5m])) * 100)`),
        queryPrometheus(`node_memory_MemTotal_bytes{instance="${instance}"}`),
        queryPrometheus(`node_memory_MemAvailable_bytes{instance="${instance}"}`),
        queryPrometheus(`node_filesystem_size_bytes{instance="${instance}",mountpoint="/"}`),
        queryPrometheus(`node_filesystem_avail_bytes{instance="${instance}",mountpoint="/"}`),
        queryPrometheus(`node_load1{instance="${instance}"}`),
      ]);

    const cpuUsage = parseFloat(cpuResult.data.result[0]?.value?.[1] || '0');
    const memTotal = parseFloat(memTotalResult.data.result[0]?.value?.[1] || '0');
    const memAvail = parseFloat(memAvailResult.data.result[0]?.value?.[1] || '0');
    const diskTotal = parseFloat(diskTotalResult.data.result[0]?.value?.[1] || '0');
    const diskAvail = parseFloat(diskAvailResult.data.result[0]?.value?.[1] || '0');
    const load1 = parseFloat(loadResult.data.result[0]?.value?.[1] || '0');

    const memUsed = memTotal - memAvail;
    const diskUsed = diskTotal - diskAvail;

    return {
      cpu: {
        usage: cpuUsage,
        cores: 1,
        load1: load1,
        load5: 0,
        load15: 0,
      },
      memory: {
        total: memTotal,
        used: memUsed,
        free: memAvail,
        usagePercent: (memUsed / memTotal) * 100,
      },
      disk: {
        total: diskTotal,
        used: diskUsed,
        free: diskAvail,
        usagePercent: (diskUsed / diskTotal) * 100,
      },
      network: {
        bytesIn: 0,
        bytesOut: 0,
        packetsIn: 0,
        packetsOut: 0,
      },
    };
  } catch (error) {
    console.error(`Failed to get metrics for ${instance}:`, error);
    return null;
  }
}

export async function getCPUHistory(instance: string, hours: number = 1): Promise<MetricDataPoint[]> {
  const prometheusNow = await getPrometheusTime();
  const end = Math.floor(prometheusNow / 1000);
  const start = end - (hours * 3600);
  const query = `100 - (avg by(instance) (rate(node_cpu_seconds_total{instance="${instance}",mode="idle"}[5m])) * 100)`;
  
  try {
    const result = await queryPrometheusRange(query, start, end, '1m');
    return result.data.result[0]?.values?.map(([timestamp, value]) => ({
      timestamp: timestamp * 1000,
      value: parseFloat(value),
    })) || [];
  } catch (error) {
    console.error(`[getCPUHistory] Error:`, error);
    return [];
  }
}

export async function getMemoryHistory(instance: string, hours: number = 1): Promise<MetricDataPoint[]> {
  const prometheusNow = await getPrometheusTime();
  const end = Math.floor(prometheusNow / 1000);
  const start = end - (hours * 3600);
  const query = `(1 - (node_memory_MemAvailable_bytes{instance="${instance}"} / node_memory_MemTotal_bytes{instance="${instance}"})) * 100`;
  
  try {
    const result = await queryPrometheusRange(query, start, end, '1m');
    return result.data.result[0]?.values?.map(([timestamp, value]) => ({
      timestamp: timestamp * 1000,
      value: parseFloat(value),
    })) || [];
  } catch {
    return [];
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function checkPrometheusHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${PROMETHEUS_URL}/-/healthy`, {
      cache: 'no-store',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get the current time from Prometheus server
 * This ensures we use Prometheus's time instead of local system time,
 * avoiding timezone mismatches
 */
async function getPrometheusTime(): Promise<number> {
  try {
    const response = await fetch(`${PROMETHEUS_URL}/api/v1/query?query=time()`, {
      cache: 'no-store',
    });
    const data = await response.json();
    // Prometheus time() returns a scalar, not a vector
    // Result format: [timestamp_float, "timestamp_string"]
    const timeValue = data.data.resultType === 'scalar' 
      ? parseFloat(data.data.result[0])
      : parseFloat(data.data.result[0].value[1]);
    const timeMs = Math.floor(timeValue * 1000);
    return timeMs;
  } catch (error) {
    console.error('[getPrometheusTime] Failed to get Prometheus time, falling back to local time:', error);
    // Fallback to local time if Prometheus query fails
    return Date.now();
  }
}
