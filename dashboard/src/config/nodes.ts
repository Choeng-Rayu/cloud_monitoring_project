import { VMNode } from '@/types';

export const PROMETHEUS_URL = process.env.NEXT_PUBLIC_PROMETHEUS_URL || 'http://192.168.122.101:9090';
export const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL || 'http://192.168.122.101:3000';

export const initialNodes: VMNode[] = [
  {
    id: 'vm1',
    name: 'VM1 - Monitoring Server',
    hostname: 'vm1-monitoring',
    ip: '192.168.122.101',
    port: 9090,
    status: 'up',
    role: 'monitoring',
  },
  {
    id: 'vm2',
    name: 'VM2 - Target Node',
    hostname: 'vm2-node',
    ip: '192.168.122.102',
    port: 9100,
    status: 'up',
    role: 'target',
  },
  {
    id: 'vm3',
    name: 'VM3 - Target Node',
    hostname: 'vm3-node',
    ip: '192.168.122.103',
    port: 9100,
    status: 'up',
    role: 'target',
  },
];

export const REFRESH_INTERVAL = 5000; // 5 seconds
