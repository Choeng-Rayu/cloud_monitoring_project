#!/bin/bash
# Node Exporter Installation Script for VM2 & VM3
# Run this script with sudo on both VM2 and VM3

set -e

NODE_EXPORTER_VERSION="1.8.2"
DOWNLOAD_URL="https://github.com/prometheus/node_exporter/releases/download/v${NODE_EXPORTER_VERSION}/node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz"

echo "=============================================="
echo "  Node Exporter Installation Script"
echo "  Version: ${NODE_EXPORTER_VERSION}"
echo "=============================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (use sudo)" 
   exit 1
fi

echo "[1/7] Creating node_exporter user..."
id node_exporter &>/dev/null || useradd --no-create-home --shell /bin/false node_exporter

echo "[2/7] Downloading Node Exporter v${NODE_EXPORTER_VERSION}..."
cd /tmp
wget -q --show-progress ${DOWNLOAD_URL} -O node_exporter.tar.gz

echo "[3/7] Extracting archive..."
tar xzf node_exporter.tar.gz

echo "[4/7] Installing binary to /usr/local/bin..."
cp node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64/node_exporter /usr/local/bin/
chown node_exporter:node_exporter /usr/local/bin/node_exporter

echo "[5/7] Creating systemd service..."
cat > /etc/systemd/system/node_exporter.service << 'EOF'
[Unit]
Description=Node Exporter
Documentation=https://prometheus.io/docs/guides/node-exporter/
After=network.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

echo "[6/7] Enabling and starting Node Exporter service..."
systemctl daemon-reload
systemctl enable node_exporter
systemctl start node_exporter

echo "[7/7] Cleaning up..."
rm -rf /tmp/node_exporter.tar.gz /tmp/node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64

echo ""
echo "=============================================="
echo "  Installation Complete!"
echo "=============================================="
echo ""
echo "Service Status:"
systemctl status node_exporter --no-pager -l

echo ""
echo "Verification: curl http://localhost:9100/metrics | head"
curl -s http://localhost:9100/metrics | head -5

echo ""
echo "✅ Node Exporter is running on port 9100"
echo "   Test from another machine: curl http://$(hostname -I | awk '{print $2}'):9100/metrics"
