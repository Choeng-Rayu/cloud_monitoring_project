#!/bin/bash
# Stress Test Script for VM2/VM3
# Run on target nodes to generate load and verify monitoring

echo "=============================================="
echo "  Stress Test Script"
echo "=============================================="

# Check if stress is installed
if ! command -v stress &> /dev/null; then
    echo "Installing stress utility..."
    sudo apt update && sudo apt install -y stress
fi

echo ""
echo "Select test type:"
echo "  1) CPU stress (1 core, 60 seconds)"
echo "  2) Memory stress (512MB, 60 seconds)"
echo "  3) Disk I/O stress (60 seconds)"
echo "  4) All combined (30 seconds each)"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo "Starting CPU stress test..."
        stress --cpu 1 --timeout 60
        ;;
    2)
        echo "Starting Memory stress test..."
        stress --vm 1 --vm-bytes 512M --timeout 60
        ;;
    3)
        echo "Starting Disk I/O stress test..."
        stress --io 4 --timeout 60
        ;;
    4)
        echo "Starting combined stress test..."
        echo "[1/3] CPU stress..."
        stress --cpu 1 --timeout 30
        echo "[2/3] Memory stress..."
        stress --vm 1 --vm-bytes 512M --timeout 30
        echo "[3/3] Disk I/O stress..."
        stress --io 4 --timeout 30
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Stress test complete!"
echo "   Check your Grafana dashboard to see the impact."
