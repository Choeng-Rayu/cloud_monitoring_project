# Phase 2: Virtual Machine Setup Guide

This phase **must be done manually** as it requires access to VMware Workstation.

## Prerequisites

- VMware Workstation Pro/Player installed
- Ubuntu Server 22.04 LTS ISO downloaded
- At least 8GB RAM and 60GB disk space available on host

## Step 1: Create VM1 (Base Template)

### 1.1 Create New Virtual Machine

1. Open VMware Workstation
2. Click **File → New Virtual Machine** (or Ctrl+N)
3. Select **Typical (recommended)** → Next
4. Select **Installer disc image file (iso)** → Browse to Ubuntu 22.04 ISO
5. Enter user details:
   - Full name: `cloud-user`
   - Username: `clouduser`
   - Password: (your choice, remember it!)
6. VM Name: `VM1-Monitoring-Server`
7. Disk size: `20 GB`, select **Store as single file**
8. Click **Customize Hardware**:
   - Memory: `2048 MB` (2 GB)
   - Processors: `1`
   - Network Adapter: `NAT` (already set)
9. Click **Finish**

### 1.2 Add Second Network Adapter

1. Right-click VM1 → **Settings**
2. Click **Add** → **Network Adapter** → Finish
3. Set new adapter to **Host-Only**
4. Click **OK**

### 1.3 Install Ubuntu

1. Power on VM1
2. Follow Ubuntu Server installation wizard
3. When asked about network, leave defaults
4. Enable OpenSSH server when prompted
5. Wait for installation to complete
6. Reboot and login

### 1.4 Configure Network

After Ubuntu boots, copy the netplan config:

```bash
# Check your interface names
ip link show

# Edit netplan (adjust interface names if different)
sudo nano /etc/netplan/00-installer-config.yaml
```

Paste content from `configs/netplan/vm1-netplan.yaml`:

```yaml
network:
  version: 2
  ethernets:
    ens33:
      dhcp4: yes
    ens37:
      dhcp4: no
      addresses:
        - 192.168.56.101/24
```

Apply and verify:

```bash
sudo netplan apply
ip addr show ens37
# Should show 192.168.56.101
```

## Step 2: Clone to Create VM2 and VM3

### 2.1 Shutdown VM1

```bash
sudo shutdown now
```

### 2.2 Clone VM1 to Create VM2

1. Right-click VM1 → **Manage** → **Clone**
2. Select **The current state in the virtual machine**
3. Select **Create a full clone**
4. Name: `VM2-Target-Node`
5. Click **Finish**

### 2.3 Clone VM1 to Create VM3

Repeat the process:
1. Right-click VM1 → **Manage** → **Clone**
2. Name: `VM3-Target-Node`
3. Click **Finish**

### 2.4 Configure VM2 Network

1. Power on VM2
2. Edit netplan:

```bash
sudo nano /etc/netplan/00-installer-config.yaml
```

Change IP to `192.168.56.102`:

```yaml
network:
  version: 2
  ethernets:
    ens33:
      dhcp4: yes
    ens37:
      dhcp4: no
      addresses:
        - 192.168.56.102/24
```

Apply:
```bash
sudo netplan apply
```

### 2.5 Configure VM3 Network

Same process, but use IP `192.168.56.103`

## Step 3: Verify Connectivity

From VM1, test connectivity to both nodes:

```bash
ping -c 3 192.168.56.102
ping -c 3 192.168.56.103
```

Expected output:
```
64 bytes from 192.168.56.102: icmp_seq=1 ttl=64 time=0.5 ms
```

## Troubleshooting

### VMs can't ping each other

1. **Check VMware Virtual Network Editor**:
   - Go to **Edit → Virtual Network Editor**
   - Ensure VMnet1 (Host-Only) exists and is enabled
   - Subnet should be `192.168.56.0` with mask `255.255.255.0`

2. **Check interface names**:
   ```bash
   ip link show
   ```
   Adjust netplan if interfaces have different names (e.g., `ens160` instead of `ens37`)

3. **Check netplan syntax**:
   ```bash
   sudo netplan try
   ```
   YAML is indent-sensitive!

### Can't access VM from host browser

Add port forwarding in VMware NAT settings, or use the Host-Only IP directly.

## Summary

After completing this phase, you should have:

| VM | Role | Host-Only IP | Status |
|----|------|--------------|--------|
| VM1 | Monitoring Server | 192.168.56.101 | ✅ Reachable |
| VM2 | Target Node | 192.168.56.102 | ✅ Reachable |
| VM3 | Target Node | 192.168.56.103 | ✅ Reachable |

**Next Step**: Proceed to Phase 3 - Install Node Exporter on VM2 and VM3
