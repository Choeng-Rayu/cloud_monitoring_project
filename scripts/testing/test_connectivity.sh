#!/bin/bash
# Connectivity Test Script
# Run from VM1 to verify the monitoring stack

echo "=============================================="
echo "  Cloud Monitoring Connectivity Test"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

check_service() {
    local name=$1
    local url=$2
    
    if curl -s --connect-timeout 5 "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}PASS${NC} - $name ($url)"
        return 0
    else
        echo -e "${RED}FAIL${NC} - $name ($url)"
        return 1
    fi
}

echo "Testing Node Exporters..."
check_service "VM2 Node Exporter" "http://192.168.122.102:9100/metrics"
check_service "VM3 Node Exporter" "http://192.168.122.103:9100/metrics"

echo ""
echo "Testing Prometheus..."
check_service "Prometheus Web UI" "http://192.168.122.101:9090/-/healthy"
check_service "Prometheus API" "http://192.168.122.101:9090/api/v1/targets"

echo ""
echo "Testing Grafana..."
check_service "Grafana Web UI" "http://192.168.122.101:3000/api/health"

echo ""
echo "=============================================="
echo "  Prometheus Target Status"
echo "=============================================="
curl -s http://localhost:9090/api/v1/targets 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for target in data.get('data', {}).get('activeTargets', []):
        state = 'UP' if target['health'] == 'up' else 'DOWN'
        print(f\"  {state} {target['labels'].get('instance', 'unknown')} - {target['health'].upper()}\")
except:
    print('  Unable to parse targets (is Prometheus running?)')
"

echo ""
