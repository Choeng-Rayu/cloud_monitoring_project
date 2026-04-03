#!/bin/bash
# Prometheus Installation Script for VM1
# Run this script with sudo on VM1

set -e

PROMETHEUS_VERSION="2.52.0"
DOWNLOAD_URL="https://github.com/prometheus/prometheus/releases/download/v${PROMETHEUS_VERSION}/prometheus-${PROMETHEUS_VERSION}.linux-amd64.tar.gz"

echo "=============================================="
echo "  Prometheus Installation Script"
echo "  Version: ${PROMETHEUS_VERSION}"
echo "=============================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (use sudo)" 
   exit 1
fi

echo "[1/9] Creating prometheus user..."
id prometheus &>/dev/null || useradd --no-create-home --shell /bin/false prometheus

echo "[2/9] Creating directories..."
mkdir -p /etc/prometheus
mkdir -p /var/lib/prometheus
chown prometheus:prometheus /var/lib/prometheus

echo "[3/9] Downloading Prometheus v${PROMETHEUS_VERSION}..."
cd /tmp
wget -q --show-progress ${DOWNLOAD_URL} -O prometheus.tar.gz

echo "[4/9] Extracting archive..."
tar xzf prometheus.tar.gz

echo "[5/9] Installing binaries..."
cd prometheus-${PROMETHEUS_VERSION}.linux-amd64
cp prometheus /usr/local/bin/
cp promtool /usr/local/bin/
chown prometheus:prometheus /usr/local/bin/prometheus
chown prometheus:prometheus /usr/local/bin/promtool

echo "[6/9] Installing console templates..."
cp -r consoles /etc/prometheus/
cp -r console_libraries /etc/prometheus/
chown -R prometheus:prometheus /etc/prometheus/

echo "[7/9] Creating Prometheus configuration..."
cat > /etc/prometheus/prometheus.yml << 'EOF'
# Prometheus Configuration
# Monitoring VM2 and VM3 Node Exporters

global:
  scrape_interval: 5s          # How often to scrape targets
  evaluation_interval: 5s      # How often to evaluate rules

# Alertmanager configuration (optional, for future use)
alerting:
  alertmanagers:
    - static_configs:
        - targets: []

# Rule files (optional, for future use)
rule_files: []

# Scrape configurations
scrape_configs:
  # Prometheus self-monitoring
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]
        labels:
          instance: "prometheus-server"

  # Node Exporter targets
  - job_name: "nodes"
    static_configs:
      - targets:
          - "192.168.122.102:9100"   # VM2 - Target Node
          - "192.168.122.103:9100"   # VM3 - Target Node
        labels:
          env: "monitoring-lab"
EOF
chown prometheus:prometheus /etc/prometheus/prometheus.yml

echo "[8/9] Creating systemd service..."
cat > /etc/systemd/system/prometheus.service << 'EOF'
[Unit]
Description=Prometheus Monitoring
Documentation=https://prometheus.io/docs/
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/prometheus \
    --config.file=/etc/prometheus/prometheus.yml \
    --storage.tsdb.path=/var/lib/prometheus/ \
    --web.console.templates=/etc/prometheus/consoles \
    --web.console.libraries=/etc/prometheus/console_libraries \
    --web.listen-address=0.0.0.0:9090 \
    --web.enable-lifecycle
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

echo "[9/9] Enabling and starting Prometheus service..."
systemctl daemon-reload
systemctl enable prometheus
systemctl start prometheus

# Cleanup
rm -rf /tmp/prometheus.tar.gz /tmp/prometheus-${PROMETHEUS_VERSION}.linux-amd64

echo ""
echo "=============================================="
echo "  Installation Complete!"
echo "=============================================="
echo ""

# Validate config
echo "Config Validation:"
promtool check config /etc/prometheus/prometheus.yml

echo ""
echo "Service Status:"
systemctl status prometheus --no-pager -l

echo ""
echo "✅ Prometheus is running on port 9090"
echo "   Access Web UI: http://$(hostname -I | awk '{print $2}'):9090"
echo "   Check targets: http://$(hostname -I | awk '{print $2}'):9090/targets"
