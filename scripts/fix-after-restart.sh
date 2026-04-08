#!/bin/bash
# Fix script to run after computer restart
# Fixes VM clock skew and Prometheus TSDB corruption

set -e

PASSWORD="rayuchoengrayu"
VMS=("192.168.122.101" "192.168.122.102" "192.168.122.103")
VM_NAMES=("VM1" "VM2" "VM3")

echo "========================================"
echo "  VM Restart Fix Script"
echo "========================================"
echo ""

# Check if VMs are reachable
echo "[1/4] Checking VM connectivity..."
for i in "${!VMS[@]}"; do
    if ping -c 1 -W 2 "${VMS[$i]}" &>/dev/null; then
        echo "  ✓ ${VM_NAMES[$i]} (${VMS[$i]}) - reachable"
    else
        echo "  ✗ ${VM_NAMES[$i]} (${VMS[$i]}) - NOT reachable"
        echo ""
        echo "ERROR: ${VM_NAMES[$i]} is not reachable."
        echo "Please start all VMs in GNOME Boxes and wait ~30 seconds, then run this script again."
        exit 1
    fi
done
echo ""

# Fix time on all VMs
echo "[2/4] Fixing time on all VMs..."
CURRENT_DATE=$(date)
for i in "${!VMS[@]}"; do
    echo "  Syncing ${VM_NAMES[$i]}..."
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 rayu@"${VMS[$i]}" \
        "echo '$PASSWORD' | sudo -S timedatectl set-ntp false 2>/dev/null; \
         echo '$PASSWORD' | sudo -S date -s '$CURRENT_DATE' >/dev/null 2>&1" && \
        echo "  ✓ ${VM_NAMES[$i]} time synced" || \
        echo "  ✗ ${VM_NAMES[$i]} time sync failed"
done
echo ""

# Clear Prometheus TSDB and restart
echo "[3/4] Clearing Prometheus TSDB and restarting..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no rayu@192.168.122.101 \
    "echo '$PASSWORD' | sudo -S systemctl stop prometheus 2>/dev/null; \
     echo '$PASSWORD' | sudo -S rm -rf /var/lib/prometheus/data/* 2>/dev/null; \
     echo '$PASSWORD' | sudo -S systemctl start prometheus 2>/dev/null"
echo "  ✓ Prometheus TSDB cleared and restarted"
echo ""

# Wait for Prometheus to be ready
echo "[4/4] Waiting for Prometheus to be ready..."
sleep 5
if curl -s http://192.168.122.101:9090/-/healthy | grep -q "Healthy"; then
    echo "  ✓ Prometheus is healthy"
else
    echo "  ⚠ Prometheus may still be starting, check manually"
fi
echo ""

# Summary
echo "========================================"
echo "  Fix Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Start the dashboard:"
echo "     cd ~/cloud_monitoring_project/dashboard && npm run dev"
echo ""
echo "  2. Open in browser:"
echo "     http://localhost:3000"
echo ""
echo "  3. Verify targets are UP:"
echo "     curl -s http://192.168.122.101:9090/api/v1/targets | grep -o '\"health\":\"[^\"]*\"' | sort | uniq -c"
echo ""
