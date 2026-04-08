# VM Restart Guide

## What Happens After Computer Restart?

When you turn off and turn on your computer, the VMs may experience **clock skew** (incorrect system time). This causes:

1. **Prometheus TSDB corruption** - Metrics stored with wrong timestamps
2. **Dashboard shows no data** - Queries for "now" find no matching data
3. **Targets appear "down"** - Even though services are running

## Quick Fix (Run This After Restart)

### Option 1: Run the fix script
```bash
cd ~/cloud_monitoring_project
./scripts/fix-after-restart.sh
```

### Option 2: Manual Steps

#### Step 1: Start the VMs
Open **GNOME Boxes** and start all 3 VMs (VM1, VM2, VM3).

#### Step 2: Wait for VMs to boot
Wait ~30 seconds for all VMs to fully boot.

#### Step 3: Fix time on all VMs
```bash
# Fix VM1 time
sshpass -p "rayuchoengrayu" ssh -o StrictHostKeyChecking=no rayu@192.168.122.101 \
  "echo 'rayuchoengrayu' | sudo -S timedatectl set-ntp false && echo 'rayuchoengrayu' | sudo -S date -s '$(date)'"

# Fix VM2 time
sshpass -p "rayuchoengrayu" ssh -o StrictHostKeyChecking=no rayu@192.168.122.102 \
  "echo 'rayuchoengrayu' | sudo -S timedatectl set-ntp false && echo 'rayuchoengrayu' | sudo -S date -s '$(date)'"

# Fix VM3 time
sshpass -p "rayuchoengrayu" ssh -o StrictHostKeyChecking=no rayu@192.168.122.103 \
  "echo 'rayuchoengrayu' | sudo -S timedatectl set-ntp false && echo 'rayuchoengrayu' | sudo -S date -s '$(date)'"
```

#### Step 4: Clear Prometheus TSDB and restart
```bash
sshpass -p "rayuchoengrayu" ssh -o StrictHostKeyChecking=no rayu@192.168.122.101 \
  "echo 'rayuchoengrayu' | sudo -S systemctl stop prometheus && \
   echo 'rayuchoengrayu' | sudo -S rm -rf /var/lib/prometheus/data/* && \
   echo 'rayuchoengrayu' | sudo -S systemctl start prometheus"
```

#### Step 5: Start the dashboard
```bash
cd ~/cloud_monitoring_project/dashboard
npm run dev
```

#### Step 6: Verify everything works
```bash
# Check all targets are UP
curl -s http://192.168.122.101:9090/api/v1/targets | grep -o '"health":"[^"]*"' | sort | uniq -c
```

## Verification Checklist

After running the fix:

- [ ] All 3 VMs are running in GNOME Boxes
- [ ] `ping 192.168.122.101` responds
- [ ] `curl http://192.168.122.101:9090/-/healthy` returns "Healthy"
- [ ] Dashboard at http://localhost:3000 shows all nodes as "up"
- [ ] Metrics are updating (CPU/Memory values change)

## Preventing Future Issues

The root cause is that GNOME Boxes VMs don't sync time properly with the host. To minimize issues:

1. **Always shut down VMs gracefully** before turning off computer
2. **Consider disabling NTP** on VMs if it syncs to wrong time source
3. **Run the fix script** immediately after starting VMs

## Troubleshooting

### VMs not reachable after restart
```bash
# Check if libvirt network is active
virsh net-list --all

# If default network is inactive, start it
sudo virsh net-start default
```

### Prometheus won't start
```bash
# Check logs
sshpass -p "rayuchoengrayu" ssh rayu@192.168.122.101 \
  "echo 'rayuchoengrayu' | sudo -S journalctl -u prometheus -n 50"
```

### Dashboard shows "Loading..." forever
1. Check browser console for errors (F12)
2. Verify API is responding: `curl http://localhost:3000/api/nodes`
3. Restart the dashboard: `cd dashboard && npm run dev`
