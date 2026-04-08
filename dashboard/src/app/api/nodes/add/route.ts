import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { initialNodes } from "@/config/nodes";
import { logActivity } from "@/lib/activityLogger";

const execAsync = promisify(exec);

interface AddNodeRequest {
  name: string;
  hostname: string;
  ip: string;
  port: number;
  sshUsername: string;
  sshPassword: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AddNodeRequest = await request.json();
    const { name, hostname, ip, port, sshUsername, sshPassword } = body;

    // Validate input
    if (!name || !ip || !sshUsername || !sshPassword) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const nodePort = port || 9100;

    // Check for duplicate IP in initialNodes (config)
    const existsInConfig = initialNodes.some(node => node.ip === ip);
    if (existsInConfig) {
      return NextResponse.json(
        { error: `A node with IP ${ip} already exists in the initial configuration` },
        { status: 400 }
      );
    }

    // Check for duplicate IP in dynamically added nodes (nodes.json)
    const nodesFile = path.join(process.cwd(), "data", "nodes.json");
    try {
      const data = await fs.readFile(nodesFile, "utf-8");
      const existingNodes = JSON.parse(data);
      const existsInDynamic = existingNodes.some((node: any) => node.ip === ip);
      if (existsInDynamic) {
        return NextResponse.json(
          { error: `A node with IP ${ip} has already been added dynamically` },
          { status: 400 }
        );
      }
    } catch {
      // File doesn't exist yet, which is fine
    }

    const steps = [];

    // Step 1: Test SSH connectivity
    steps.push({ step: 1, message: "Testing SSH connection..." });
    try {
      const testCmd = `timeout 10 sshpass -p "${sshPassword}" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 ${sshUsername}@${ip} "echo 'Connected'"`;
      await execAsync(testCmd, { timeout: 15000 });
      steps.push({ step: 1, message: "SSH connection successful", status: "success" });
    } catch {
      return NextResponse.json(
        { error: "SSH connection failed. Check credentials and IP.", steps },
        { status: 400 }
      );
    }

    // Step 2: Install Node Exporter
    steps.push({ step: 2, message: "Installing Node Exporter..." });
    const installScript = `
      # Check if already installed
      if systemctl is-active --quiet node_exporter 2>/dev/null; then
        echo "Already installed"
        exit 0
      fi

      # Create user
      useradd --no-create-home --shell /bin/false node_exporter 2>/dev/null || true

      # Download and install
      cd /tmp
      wget -q https://github.com/prometheus/node_exporter/releases/download/v1.8.2/node_exporter-1.8.2.linux-amd64.tar.gz
      tar xzf node_exporter-1.8.2.linux-amd64.tar.gz
      cp node_exporter-1.8.2.linux-amd64/node_exporter /usr/local/bin/
      chown node_exporter:node_exporter /usr/local/bin/node_exporter

      # Create systemd service
      cat > /etc/systemd/system/node_exporter.service << 'EOF'
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

      # Start service
      systemctl daemon-reload
      systemctl start node_exporter
      systemctl enable node_exporter

      # Open firewall if ufw is active
      ufw allow ${nodePort}/tcp 2>/dev/null || true

      # Cleanup
      rm -rf /tmp/node_exporter-*
    `;

    try {
      const installCmd = `sshpass -p "${sshPassword}" ssh -o StrictHostKeyChecking=no ${sshUsername}@${ip} "sudo bash -s" << 'ENDSSH'\n${installScript}\nENDSSH`;
      await execAsync(installCmd, { timeout: 60000 });
      steps.push({ step: 2, message: "Node Exporter installed successfully", status: "success" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return NextResponse.json(
        { error: "Failed to install Node Exporter: " + errorMessage, steps },
        { status: 500 }
      );
    }

    // Step 3: Verify Node Exporter is accessible
    steps.push({ step: 3, message: "Verifying Node Exporter..." });
    try {
      const verifyCmd = `curl -s --connect-timeout 5 http://${ip}:${nodePort}/metrics | head -1`;
      await execAsync(verifyCmd, { timeout: 10000 });
      steps.push({ step: 3, message: "Node Exporter is accessible", status: "success" });
    } catch {
      return NextResponse.json(
        { error: "Node Exporter installed but not accessible on port " + nodePort, steps },
        { status: 500 }
      );
    }

    // Step 4: Update Prometheus config on VM1
    steps.push({ step: 4, message: "Updating Prometheus configuration..." });

    try {
      // Use Python with PyYAML for reliable YAML manipulation
      const prometheusCmd = `sshpass -p "rayuchoengrayu" ssh -o StrictHostKeyChecking=no rayu@192.168.122.101 "bash -s" << 'EOFPROM'
# Backup current config
echo "rayuchoengrayu" | sudo -S cp /etc/prometheus/prometheus.yml /etc/prometheus/prometheus.yml.bak

# Check if target already exists
if grep -q "${ip}:${nodePort}" /etc/prometheus/prometheus.yml; then
  echo "Target already exists in Prometheus config"
else
  # Use Python for reliable YAML manipulation
  echo "rayuchoengrayu" | sudo -S python3 << 'PYSCRIPT'
import yaml

config_file = '/etc/prometheus/prometheus.yml'
new_target = '${ip}:${nodePort}'
node_name = '${name}'

# Read current config
with open(config_file, 'r') as f:
    config = yaml.safe_load(f)

# Find the nodes job and add the new target
for job in config.get('scrape_configs', []):
    if job.get('job_name') == 'nodes':
        targets = job['static_configs'][0]['targets']
        if new_target not in targets:
            targets.append(new_target)
            print(f'Added {new_target} to targets')
        else:
            print(f'{new_target} already exists')
        break

# Write updated config with proper formatting
with open(config_file, 'w') as f:
    yaml.dump(config, f, default_flow_style=False, sort_keys=False)

print('Config updated successfully')
PYSCRIPT
  echo "Target added to Prometheus config"
fi

# Reload Prometheus
echo "rayuchoengrayu" | sudo -S systemctl reload prometheus
echo "Prometheus reloaded"
EOFPROM`;
      const result = await execAsync(prometheusCmd, { timeout: 30000 });
      console.log("Prometheus update result:", result.stdout);
      steps.push({ step: 4, message: "Prometheus configuration updated", status: "success" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Prometheus update error:", errorMessage);
      // Don't fail completely - node is still saved locally
      steps.push({ step: 4, message: `Warning: Prometheus update issue - ${errorMessage}`, status: "warning" });
    }

    // Step 5: Save node to persistent storage
    steps.push({ step: 5, message: "Saving node configuration..." });
    try {
      const nodesFile = path.join(process.cwd(), "data", "nodes.json");
      await fs.mkdir(path.dirname(nodesFile), { recursive: true });
      
      let nodes = [];
      try {
        const data = await fs.readFile(nodesFile, "utf-8");
        nodes = JSON.parse(data);
      } catch {
        // File doesn't exist yet
      }

      const newNode = {
        id: `node-${Date.now()}`,
        name,
        hostname,
        ip,
        port: nodePort,
        status: "up",
        role: "target",
        addedAt: new Date().toISOString(),
      };

      nodes.push(newNode);
      await fs.writeFile(nodesFile, JSON.stringify(nodes, null, 2));
      steps.push({ step: 5, message: "Node configuration saved", status: "success" });

      await logActivity({
        type: "node",
        action: "node_added",
        details: `Node "${name}" (${ip}:${nodePort}) added to monitoring`,
        status: "success",
        metadata: { nodeId: newNode.id, name, ip, port: nodePort },
      });

      return NextResponse.json({
        success: true,
        message: "Node added successfully",
        node: newNode,
        steps,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await logActivity({
        type: "error",
        action: "node_add_failed",
        details: `Failed to add node: ${errorMessage}`,
        status: "error",
        metadata: { ip, error: errorMessage },
      });
      return NextResponse.json(
        { error: "Failed to save node config: " + errorMessage, steps },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logActivity({
      type: "error",
      action: "node_add_failed",
      details: `Failed to add node: ${errorMessage}`,
      status: "error",
      metadata: { error: errorMessage },
    });
    return NextResponse.json(
      { error: "Internal server error: " + errorMessage },
      { status: 500 }
    );
  }
}
