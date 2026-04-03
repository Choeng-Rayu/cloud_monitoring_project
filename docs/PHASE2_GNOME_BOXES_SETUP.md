# Phase 2: GNOME Boxes VM Setup Guide

This guide covers creating VMs using GNOME Boxes on Ubuntu with libvirt/KVM.

## Prerequisites

- GNOME Boxes installed (`sudo apt install gnome-boxes`)
- Ubuntu Server 24.04 LTS ISO downloaded
- At least 8GB RAM available

## Step 0: Setup Libvirt Network (ONE TIME)

Before creating VMs, ensure the libvirt default network is configured:

```bash
cd ~/cloud_monitoring_project
chmod +x scripts/setup/setup_libvirt_network.sh
./scripts/setup/setup_libvirt_network.sh
```

This creates the NAT network (192.168.122.0/24) that VMs will use.

## Step 1: Create VM1 (Monitoring Server)

### 1.1 Create New VM in GNOME Boxes

1. Open **GNOME Boxes**
2. Click **+** (New) button
3. Select **Operating System Image File**
4. Browse to your Ubuntu Server 24.04 ISO
5. Click **Next**
6. Set resources:
   - Memory: 2 GB (2048 MB)
   - Storage: 20 GB
7. Click **Create**

### 1.2 Install Ubuntu Server

1. Boot the VM and follow the Ubuntu installer
2. Choose language, keyboard layout
3. For network: Leave DHCP for now (we'll configure static IP later)
4. Configure storage (use entire disk)
5. Set username/password (remember these!)
6. **Enable OpenSSH server** when prompted
7. Complete installation and reboot

### 1.3 Configure Static IP

After first boot, login and configure the network:

```bash
# Check your interface name (usually enp1s0)
ip link show

# Find existing netplan config
ls /etc/netplan/

# Edit the netplan config (filename may vary)
sudo nano /etc/netplan/50-cloud-init.yaml
```

Replace contents with:
```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp1s0:
      dhcp4: no
      addresses:
        - 192.168.122.101/24
      routes:
        - to: default
          via: 192.168.122.1
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
```

Apply and verify:
```bash
sudo netplan apply
ip addr show enp1s0
# Should show 192.168.122.101
```

## Step 2: Clone or Create VM2 and VM3

### Option A: Clone VM1 (Faster)

GNOME Boxes doesn't have a built-in clone feature, but you can:

1. **Shutdown VM1**
2. **Copy the disk image:**
   ```bash
   cp ~/.local/share/gnome-boxes/images/your-vm1-image ~/.local/share/gnome-boxes/images/vm2-node
   cp ~/.local/share/gnome-boxes/images/your-vm1-image ~/.local/share/gnome-boxes/images/vm3-node
   ```
3. **Import in GNOME Boxes:**
   - Click + → Operating System Image File
   - Select the copied image
   - It will create a new VM

### Option B: Create Fresh VMs

Repeat Step 1 for VM2 and VM3.

### Configure VM2 Network

Edit netplan and set IP to `192.168.122.102`:

```bash
sudo nano /etc/netplan/50-cloud-init.yaml
```

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp1s0:
      dhcp4: no
      addresses:
        - 192.168.122.102/24
      routes:
        - to: default
          via: 192.168.122.1
      nameservers:
        addresses:
          - 8.8.8.8
```

```bash
sudo netplan apply
```

### Configure VM3 Network

Same process, but use IP `192.168.122.103`

## Step 3: Verify Connectivity

### From your host machine:
```bash
ping 192.168.122.101
ping 192.168.122.102
ping 192.168.122.103
```

### From VM1:
```bash
ping 192.168.122.102
ping 192.168.122.103
```

### SSH Access from host:
```bash
ssh username@192.168.122.101
ssh username@192.168.122.102
ssh username@192.168.122.103
```

## Troubleshooting

### VMs not getting network connectivity

1. Check libvirt network is running:
   ```bash
   virsh net-list --all
   # Should show 'default' as 'active'
   
   # If not active:
   sudo virsh net-start default
   ```

2. Check virbr0 interface on host:
   ```bash
   ip addr show virbr0
   # Should show 192.168.122.1
   ```

### Can't SSH to VMs

1. Check firewall on VM:
   ```bash
   sudo ufw status
   sudo ufw allow ssh
   ```

2. Ensure SSH is running:
   ```bash
   sudo systemctl status ssh
   sudo systemctl start ssh
   ```

### Interface name is different

Check actual interface name:
```bash
ip link show
```

Common names: `enp1s0`, `ens3`, `eth0`

Update your netplan config to match.

## Summary

After completing this phase:

| VM | Role | IP | Status |
|----|------|-----|--------|
| VM1 | Monitoring Server | 192.168.122.101 | Ready |
| VM2 | Target Node | 192.168.122.102 | Ready |
| VM3 | Target Node | 192.168.122.103 | Ready |

**Next**: Proceed to Phase 3 - Install Node Exporter
