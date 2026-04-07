# Cloud Monitoring Project

Prometheus + Grafana + Node Exporter monitoring stack on GNOME Boxes VMs.

## Architecture

```
VM2 :9100 ──┐
             ├──► Prometheus :9090 ──► Grafana :3000 ──► Browser
VM3 :9100 ──┘
```


| VM | IP | Components | Ports |
|----|-----|------------|-------|
| VM1 | 192.168.122.101 | Prometheus, Grafana | 9090, 3000 |
| VM2 | 192.168.122.102 | Node Exporter | 9100 |
| VM3 | 192.168.122.103 | Node Exporter | 9100 |

## Quick Start

### Phase 1: Setup Libvirt Network (Host Machine)

```bash
cd ~/cloud_monitoring_project
chmod +x scripts/setup/setup_libvirt_network.sh
./scripts/setup/setup_libvirt_network.sh
```

### Phase 2: Create VMs (Manual)
See [docs/PHASE2_GNOME_BOXES_SETUP.md](docs/PHASE2_GNOME_BOXES_SETUP.md) for detailed GNOME Boxes setup instructions.

### Phase 3: Install Node Exporter (VM2 & VM3)

Copy script to each target VM and run:
```bash
# On VM2 and VM3
chmod +x install_node_exporter.sh
sudo ./install_node_exporter.sh
```

### Phase 4: Install Prometheus (VM1)

```bash
# On VM1
chmod +x install_prometheus.sh
sudo ./install_prometheus.sh
```

### Phase 5: Install Grafana (VM1)

```bash
# On VM1
chmod +x install_grafana.sh
sudo ./install_grafana.sh
```

### Phase 6: Configure Dashboard

1. Open Grafana: http://192.168.122.101:3000
2. Login: admin / admin
3. Add Data Source → Prometheus → URL: http://localhost:9090
4. Import Dashboard → ID: `1860` (Node Exporter Full)

### Phase 7: Test

```bash
# On VM1
./test_connectivity.sh

# On VM2 or VM3
./stress_test.sh
```

## Project Structure

```
├── scripts/
│   ├── setup/
│   │   └── setup_libvirt_network.sh
│   ├── vm1/
│   │   ├── install_prometheus.sh
│   │   └── install_grafana.sh
│   ├── vm2_vm3/
│   │   └── install_node_exporter.sh
│   └── testing/
│       ├── test_connectivity.sh
│       └── stress_test.sh
├── configs/
│   ├── libvirt/
│   │   └── default-network.xml
│   ├── netplan/
│   │   ├── vm1-netplan.yaml
│   │   ├── vm2-netplan.yaml
│   │   └── vm3-netplan.yaml
│   └── prometheus/
│       └── prometheus.yml
└── docs/
    ├── PHASE2_VM_SETUP.md
    └── PHASE2_GNOME_BOXES_SETUP.md
```

## Checklist

- [ ] Libvirt network configured (192.168.122.0/24)
- [ ] VMs created in GNOME Boxes (VM1, VM2, VM3)
- [ ] Static IPs assigned and verified
- [ ] Node Exporter running on VM2 & VM3
- [ ] Prometheus running on VM1
- [ ] Prometheus targets showing UP
- [ ] Grafana installed and accessible
- [ ] Prometheus data source added
- [ ] Dashboard imported (ID: 1860)
- [ ] Stress test confirms live data

## Troubleshooting

### Node Exporter not reachable
```bash
sudo systemctl status node_exporter
sudo ss -tlnp | grep 9100
sudo ufw allow 9100/tcp
```

### Prometheus targets DOWN
```bash
curl http://192.168.122.102:9100/metrics
sudo journalctl -u prometheus -n 50
```

### Grafana won't start
```bash
sudo journalctl -u grafana-server -n 50
```

### Libvirt network not active
```bash
virsh net-list --all
sudo virsh net-start default
sudo virsh net-autostart default
```

## Services

| Service | Command |
|---------|---------|
| Node Exporter | `sudo systemctl {start\|stop\|status} node_exporter` |
| Prometheus | `sudo systemctl {start\|stop\|status} prometheus` |
| Grafana | `sudo systemctl {start\|stop\|status} grafana-server` |
