# Add Node to Monitoring Guide

This guide explains how to add new servers/VMs to your monitoring dashboard using the built-in Add Node wizard.

## Features

✅ **Fully Automated** - Installs Node Exporter, configures Prometheus, and updates the dashboard  
✅ **Real-time Progress** - Shows installation progress with 5 steps  
✅ **Idempotent** - Safe to run multiple times on the same server  
✅ **Persistent** - Nodes are saved and survive dashboard restarts  
✅ **Live Metrics** - Immediately starts collecting CPU, memory, disk, and network metrics  

## Prerequisites

Before adding a node, ensure:

1. **SSH Access**: You have SSH credentials (username & password) for the target server
2. **Ubuntu/Debian**: Target server runs Ubuntu or Debian Linux (tested on Ubuntu 24.04)
3. **Sudo Access**: The SSH user has sudo privileges
4. **Network Access**: The monitoring server (VM1) can reach the target on port 9100
5. **Clean State**: Port 9100 is not already in use by another service

## How to Add a Node

### Option 1: Using the Dashboard UI (Recommended)

1. **Open the Dashboard**
   - Navigate to http://localhost:3000
   - Click **"Nodes"** in the sidebar
   - Click **"Add Node"** button

2. **Step 1: Enter Node Details**
   - **Name**: Descriptive name (e.g., "Production Web Server")
   - **Hostname**: Server hostname (optional, for display)
   - **IP Address**: Server IP address
   - **Port**: Leave as 9100 (default for Node Exporter)
   - Click **Continue**

3. **Step 2: SSH Credentials**
   - **SSH Username**: Username with sudo access (e.g., "root", "ubuntu", "rayu")
   - **SSH Password**: Password for the SSH user
   - ✅ **Auto-install Node Exporter**: Keep checked
   - Click **Install Node**

4. **Step 3: Installation Progress**
   Watch the real-time progress as the system:
   1. 🔑 Connects to node via SSH
   2. 📥 Downloads Node Exporter
   3. 💻 Installs Node Exporter
   4. ⚙️ Configures systemd service
   5. ▶️ Adds target to Prometheus

5. **Step 4: Success!**
   - View the node details
   - Click **"Go to Dashboard"** to see your new node

### Option 2: Using the API Directly

For automation or scripting:

```bash
curl -X POST http://localhost:3000/api/nodes/add \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Server",
    "hostname": "server1",
    "ip": "192.168.1.100",
    "port": 9100,
    "sshUsername": "root",
    "sshPassword": "your-password"
  }'
```

**Response on success:**
```json
{
  "success": true,
  "message": "Node added successfully",
  "node": {
    "id": "node-1775632611809",
    "name": "My Server",
    "hostname": "server1",
    "ip": "192.168.1.100",
    "port": 9100,
    "status": "up",
    "role": "target",
    "addedAt": "2026-04-08T07:16:51.812Z"
  },
  "steps": [...]
}
```

## What Happens Under the Hood

When you add a node, the system automatically:

1. **SSH Connection**
   - Tests SSH connectivity with your credentials
   - Verifies sudo access

2. **Node Exporter Installation** (on target server)
   - Creates `node_exporter` system user
   - Downloads Node Exporter v1.8.2 from GitHub
   - Installs to `/usr/local/bin/node_exporter`
   - Creates systemd service file
   - Enables and starts the service
   - Opens firewall port 9100 (if ufw is active)

3. **Prometheus Configuration** (on VM1)
   - Backs up current Prometheus config
   - Adds new target to the `nodes` job
   - Reloads Prometheus (no restart needed)

4. **Dashboard Configuration**
   - Saves node metadata to `data/nodes.json`
   - Node appears immediately in the dashboard

## Verification

After adding a node, verify it's working:

### 1. Check Node Status in Dashboard
- Node card should show status: **"up"** with a green indicator
- Metrics (CPU, Memory, Disk) should be displayed

### 2. Verify Prometheus Targets
Open http://192.168.122.101:9090/targets and look for your node's IP:port - it should show **UP** in blue.

### 3. Check Node Exporter Directly
```bash
curl http://YOUR_NODE_IP:9100/metrics | head
```

Should return metrics starting with `# HELP` and `# TYPE`.

### 4. Query Metrics
```bash
curl -s "http://192.168.122.101:9090/api/v1/query?query=up{instance='YOUR_NODE_IP:9100'}" | grep "value"
```

Should return `"value":[TIMESTAMP,"1"]` indicating the target is up.

## Troubleshooting

### SSH Connection Failed
**Error**: "SSH connection failed. Check credentials and IP."

**Solutions**:
- Verify IP address is correct and reachable: `ping YOUR_NODE_IP`
- Check SSH credentials are correct
- Ensure SSH service is running on target: `sudo systemctl status ssh`
- Check firewall allows SSH (port 22): `sudo ufw status`

### Node Exporter Installation Failed
**Error**: "Failed to install Node Exporter"

**Solutions**:
- Check if user has sudo access: `sudo whoami`
- Verify internet connectivity on target server
- Check available disk space: `df -h`
- Ensure port 9100 is not already in use: `sudo ss -tlnp | grep 9100`

### Node Shows "down" in Dashboard
**Possible Causes**:
1. **Firewall blocking port 9100**:
   ```bash
   # On target server
   sudo ufw allow 9100/tcp
   sudo ufw reload
   ```

2. **Node Exporter service not running**:
   ```bash
   # On target server
   sudo systemctl status node_exporter
   sudo systemctl start node_exporter
   ```

3. **Network connectivity issue**:
   ```bash
   # From VM1 or host
   curl http://YOUR_NODE_IP:9100/metrics
   ```

### Duplicate Nodes Appearing
If you accidentally add the same node twice (different name, same IP):

1. **Remove from dashboard**: Delete the duplicate entry from `data/nodes.json`
2. **Remove from Prometheus**: Edit `/etc/prometheus/prometheus.yml` on VM1 and remove duplicate target
3. **Reload Prometheus**: `sudo systemctl reload prometheus`

## Advanced: Manual Node Addition

If the automated installer doesn't work for your environment, you can add nodes manually:

### 1. Install Node Exporter Manually on Target

```bash
# On the target server
wget https://github.com/prometheus/node_exporter/releases/download/v1.8.2/node_exporter-1.8.2.linux-amd64.tar.gz
tar xzf node_exporter-1.8.2.linux-amd64.tar.gz
sudo cp node_exporter-1.8.2.linux-amd64/node_exporter /usr/local/bin/
sudo useradd --no-create-home --shell /bin/false node_exporter
sudo chown node_exporter:node_exporter /usr/local/bin/node_exporter

# Create systemd service
sudo tee /etc/systemd/system/node_exporter.service << EOF
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl daemon-reload
sudo systemctl enable node_exporter
sudo systemctl start node_exporter

# Open firewall
sudo ufw allow 9100/tcp
```

### 2. Add to Prometheus Config on VM1

```bash
# SSH to VM1
ssh rayu@192.168.122.101

# Edit Prometheus config
sudo nano /etc/prometheus/prometheus.yml

# Add your node to the nodes job targets:
- job_name: "nodes"
  static_configs:
    - targets:
        - "192.168.122.102:9100"
        - "192.168.122.103:9100"
        - "YOUR_NODE_IP:9100"   # Your new node

# Reload Prometheus
sudo systemctl reload prometheus
```

### 3. Add to Dashboard Config

Edit `/home/rayu/cloud_monitoring_project/dashboard/data/nodes.json`:

```json
[
  {
    "id": "custom-node-1",
    "name": "My Custom Node",
    "hostname": "server1",
    "ip": "YOUR_NODE_IP",
    "port": 9100,
    "status": "up",
    "role": "target",
    "addedAt": "2026-04-08T12:00:00.000Z"
  }
]
```

## Files and Locations

| Component | Location | Purpose |
|-----------|----------|---------|
| Dashboard Nodes Config | `dashboard/data/nodes.json` | Stores dynamically added nodes |
| Prometheus Config | `/etc/prometheus/prometheus.yml` (VM1) | Defines scrape targets |
| Node Exporter Binary | `/usr/local/bin/node_exporter` (target) | Node Exporter executable |
| Node Exporter Service | `/etc/systemd/system/node_exporter.service` | Systemd service definition |

## Security Considerations

⚠️ **Important Security Notes**:

1. **SSH Passwords**: Passwords are used during installation but NOT stored permanently
2. **Network Exposure**: Port 9100 exposes system metrics - ensure it's only accessible from trusted networks
3. **Firewall Rules**: Consider restricting port 9100 to only allow connections from VM1 (192.168.122.101)
4. **Credentials Storage**: The `nodes.json` file is gitignored to prevent committing credentials
5. **HTTPS**: For production, consider using HTTPS and authentication for the dashboard

### Recommended Firewall Rule (on target servers)

```bash
# Allow Node Exporter only from Prometheus server
sudo ufw allow from 192.168.122.101 to any port 9100
```

## Examples

### Example 1: Add Local VM
```json
{
  "name": "VM4 - Database Server",
  "hostname": "vm4-database",
  "ip": "192.168.122.104",
  "port": 9100,
  "sshUsername": "rayu",
  "sshPassword": "rayuchoengrayu"
}
```

### Example 2: Add DigitalOcean Droplet
```json
{
  "name": "Production API Server",
  "hostname": "api-server-prod",
  "ip": "167.71.194.68",
  "port": 9100,
  "sshUsername": "root",
  "sshPassword": "your-droplet-password"
}
```

### Example 3: Add AWS EC2 Instance
```json
{
  "name": "AWS Web Server",
  "hostname": "web-server-ec2",
  "ip": "54.123.45.67",
  "port": 9100,
  "sshUsername": "ubuntu",
  "sshPassword": "your-ec2-password"
}
```

## FAQ

**Q: Can I add Windows servers?**  
A: Currently only Linux servers are supported. Windows requires a different exporter (windows_exporter).

**Q: What if my server uses SSH keys instead of passwords?**  
A: The current implementation uses sshpass for password authentication. For key-based auth, you'll need to manually install Node Exporter.

**Q: How many nodes can I monitor?**  
A: Prometheus can handle thousands of targets. The dashboard is designed for efficient rendering of dozens to hundreds of nodes.

**Q: Can I remove a node?**  
A: Yes, but currently manual:
1. Remove from `data/nodes.json`
2. Remove from `/etc/prometheus/prometheus.yml` on VM1
3. Reload Prometheus

**Q: Does adding nodes require restarting Prometheus?**  
A: No! Prometheus is reloaded (not restarted), so existing data and metrics are preserved.

**Q: What metrics are collected?**  
A: CPU, memory, disk, network, load average, uptime, and 100+ system metrics. See http://YOUR_NODE:9100/metrics for full list.
