#!/bin/bash
# Grafana Installation Script for VM1
# Run this script with sudo on VM1

set -e

echo "=============================================="
echo "  Grafana Installation Script"
echo "=============================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (use sudo)" 
   exit 1
fi

echo "[1/5] Installing prerequisites..."
apt update
apt install -y apt-transport-https software-properties-common wget gnupg2

echo "[2/5] Adding Grafana GPG key..."
mkdir -p /etc/apt/keyrings/
wget -q -O - https://apt.grafana.com/gpg.key | gpg --dearmor | tee /etc/apt/keyrings/grafana.gpg > /dev/null

echo "[3/5] Adding Grafana repository..."
echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" | tee /etc/apt/sources.list.d/grafana.list

echo "[4/5] Installing Grafana..."
apt update
apt install -y grafana

echo "[5/5] Enabling and starting Grafana service..."
systemctl daemon-reload
systemctl enable grafana-server
systemctl start grafana-server

echo ""
echo "=============================================="
echo "  Installation Complete!"
echo "=============================================="
echo ""
echo "Service Status:"
systemctl status grafana-server --no-pager -l

echo ""
echo "✅ Grafana is running on port 3000"
echo ""
echo "Access Grafana:"
echo "   URL: http://$(hostname -I | awk '{print $2}'):3000"
echo "   Username: admin"
echo "   Password: admin (change on first login!)"
echo ""
echo "Next Steps:"
echo "   1. Open Grafana in your browser"
echo "   2. Login with admin/admin"
echo "   3. Go to Configuration → Data Sources → Add Prometheus"
echo "   4. Set URL: http://localhost:9090"
echo "   5. Click 'Save & Test'"
echo "   6. Import Dashboard ID: 1860 (Node Exporter Full)"
