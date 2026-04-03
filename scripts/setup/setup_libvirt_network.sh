#!/bin/bash
# Setup libvirt default network for GNOME Boxes
# Run this on your HOST machine (not inside VMs)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
NETWORK_XML="${PROJECT_ROOT}/configs/libvirt/default-network.xml"

echo "=============================================="
echo "  Libvirt Network Setup for GNOME Boxes"
echo "=============================================="

# Check if running as regular user (virsh works with user session)
echo "[1/4] Checking existing networks..."
if virsh net-info default &>/dev/null; then
    echo "Default network already exists. Checking status..."
    if virsh net-list | grep -q "default.*active"; then
        echo "Default network is already active"
    else
        echo "Starting default network..."
        sudo virsh net-start default
        sudo virsh net-autostart default
    fi
else
    echo "[2/4] Creating default network..."
    if [[ -f "$NETWORK_XML" ]]; then
        sudo virsh net-define "$NETWORK_XML"
    else
        # Create a basic default network
        sudo virsh net-define /dev/stdin <<EOF
<network>
  <name>default</name>
  <forward mode="nat"/>
  <bridge name="virbr0" stp="on" delay="0"/>
  <ip address="192.168.122.1" netmask="255.255.255.0">
    <dhcp>
      <range start="192.168.122.100" end="192.168.122.200"/>
    </dhcp>
  </ip>
</network>
EOF
    fi
    
    echo "[3/4] Starting network..."
    sudo virsh net-start default
    
    echo "[4/4] Setting network to autostart..."
    sudo virsh net-autostart default
fi

echo ""
echo "Network Status:"
virsh net-list --all
echo ""
echo "Network Details:"
virsh net-info default
echo ""
echo "Network setup complete!"
echo ""
echo "Your VMs will get IPs in range: 192.168.122.100 - 192.168.122.200"
echo "Gateway (host): 192.168.122.1"
