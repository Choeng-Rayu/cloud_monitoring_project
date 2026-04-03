#!/bin/bash
# Cloud Monitoring Demo Startup Script
# Run this before your presentation!

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       ☁️  Cloud Monitoring Demo - Startup Script             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}[Step 1/4]${NC} Checking VM connectivity..."
echo ""

check_vm() {
    local name=$1
    local ip=$2
    if ping -c 1 -W 2 $ip &>/dev/null; then
        echo -e "  ${GREEN}✅${NC} $name ($ip) - Online"
        return 0
    else
        echo -e "  ${RED}❌${NC} $name ($ip) - Offline"
        return 1
    fi
}

VM1_OK=false
VM2_OK=false
VM3_OK=false

check_vm "VM1 (Monitoring Server)" "192.168.122.101" && VM1_OK=true
check_vm "VM2 (Target Node)" "192.168.122.102" && VM2_OK=true
check_vm "VM3 (Target Node)" "192.168.122.103" && VM3_OK=true

echo ""

if [ "$VM1_OK" = false ] || [ "$VM2_OK" = false ] || [ "$VM3_OK" = false ]; then
    echo -e "${RED}⚠️  Some VMs are not running!${NC}"
    echo ""
    echo "Please start the VMs in GNOME Boxes:"
    echo "  1. Open GNOME Boxes"
    echo "  2. Click on each Ubuntu VM to start it"
    echo "  3. Wait 30-60 seconds for them to boot"
    echo "  4. Run this script again"
    echo ""
    exit 1
fi

echo -e "${CYAN}[Step 2/4]${NC} Checking services..."
echo ""

check_service() {
    local name=$1
    local url=$2
    if curl -s --connect-timeout 3 "$url" &>/dev/null; then
        echo -e "  ${GREEN}✅${NC} $name - Running"
        return 0
    else
        echo -e "  ${RED}❌${NC} $name - Not responding"
        return 1
    fi
}

check_service "Prometheus" "http://192.168.122.101:9090/-/healthy"
check_service "Grafana" "http://192.168.122.101:3000/api/health"
check_service "Node Exporter (VM2)" "http://192.168.122.102:9100/metrics"
check_service "Node Exporter (VM3)" "http://192.168.122.103:9100/metrics"

echo ""
echo -e "${CYAN}[Step 3/4]${NC} Checking Prometheus targets..."
echo ""

curl -s http://192.168.122.101:9090/api/v1/targets 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for target in data.get('data', {}).get('activeTargets', []):
        status = '🟢' if target['health'] == 'up' else '🔴'
        print(f\"  {status} {target['labels'].get('instance')} - {target['health'].upper()}\")
except:
    print('  Unable to check targets')
" 2>/dev/null || echo "  Unable to check targets"

echo ""
echo -e "${CYAN}[Step 4/4]${NC} Starting Dashboard..."
echo ""

cd /home/rayu/cloud_monitoring_project/dashboard

echo "Starting Next.js development server..."
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    🎉 DEMO READY!                            ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║                                                              ║"
echo "║  Dashboard:   http://localhost:3000                          ║"
echo "║  Prometheus:  http://192.168.122.101:9090                    ║"
echo "║  Grafana:     http://192.168.122.101:3000                    ║"
echo "║                                                              ║"
echo "║  Press Ctrl+C to stop the dashboard                         ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

npm run dev
