# Cloud Monitoring Project - Presentation Slides

## Slide 1: Title Slide
**Text:**
- VM Monitoring System
- Real-time Virtual Machine Infrastructure Monitoring
- [Your Name]
- [Date]

**IMAGE INSTRUCTION:**
Take a clean screenshot of the Next.js custom dashboard (CloudWatch dashboard) showing the overall monitoring interface. Ensure all VM metrics are displaying data with activity. Crop to show the most visually appealing section with multiple VM metrics visible.

**Design Notes:**
Use a dark/tech theme background. Position title on left, dashboard screenshot on right (50/50 split).

---

## Slide 2: The Problem
**Text:**
- Managing multiple VMs without centralized monitoring
- Manual SSH logins to check each VM's health
- No real-time visibility into resource usage
- Difficult to track performance trends across VMs

**IMAGE INSTRUCTION:**
Create or use a simple graphic showing:
- Option 1: Screenshot of GNOME Boxes interface showing multiple VMs (VM1, VM2, VM3) without monitoring
- Option 2: Terminal screenshot showing manual `top` or `htop` command on a single VM
- Option 3: Icon-based illustration showing scattered VMs with question marks indicating unknown status

**Design Notes:**
Use red/warning colors to emphasize the pain points. Keep it dramatic but professional.

---

## Slide 3: The Solution
**Text:**
- Dual dashboard approach: Next.js + Grafana
- Real-time metrics from all VMs
- Automated data collection with Prometheus
- Open-source, zero-cost solution

**IMAGE INSTRUCTION:**
Take a screenshot showing both dashboards:
- Top half: Next.js custom dashboard (CloudWatch) showing VM overview
- Bottom half: Grafana dashboard with detailed metrics
Alternatively, take two separate screenshots and arrange side-by-side. Ensure both show live data from VM1, VM2, VM3.

**Design Notes:**
This should contrast with Slide 2 - show how clean and unified your solution is. Highlight the dual-dashboard approach.

---

## Slide 4: System Architecture
**Text:**
- VMs: Ubuntu VMs in GNOME Boxes (libvirt)
- Data Collection: Node Exporter on each VM
- Time-Series DB: Prometheus
- Visualization: Grafana + Next.js Dashboard

**IMAGE INSTRUCTION:**
Create or screenshot an architecture diagram showing:
1. GNOME Boxes virtualization layer at the bottom
2. Three Ubuntu VMs (VM1: 192.168.122.101, VM2: 192.168.122.102, VM3: 192.168.122.103)
3. Node Exporter running on each VM (port 9100)
4. Prometheus server (VM1) collecting metrics via libvirt network (192.168.122.0/24)
5. Grafana (VM1) visualizing Prometheus data
6. Next.js Dashboard (host machine) fetching from Prometheus
Use arrows to show data flow. If you have a diagram file, screenshot it. Otherwise, create a simple flowchart.

**Design Notes:**
Use different colors for each component. Show the libvirt network as a connecting layer. Add icons for Ubuntu, Prometheus, Grafana, Next.js logos.

---

## Slide 5: Technology Stack
**Text:**
- **Virtualization:** GNOME Boxes / libvirt
- **OS:** Ubuntu Server (VM1, VM2, VM3)
- **Monitoring:** Prometheus + Node Exporter
- **Visualization:** Grafana + Next.js (React)
- **Cost:** $0 (completely free & open-source)

**IMAGE INSTRUCTION:**
Create a grid/collage of technology logos:
- GNOME Boxes / libvirt logo
- Ubuntu logo
- Prometheus logo
- Grafana logo
- Next.js logo
- Node.js logo
Download official logos from each project's website. Arrange in a clean grid layout (2 rows x 3 columns).

**Design Notes:**
Equal-sized logo boxes with transparent or white backgrounds. Add tech name under each logo.

---

## Slide 6: Deployment Process
**Text:**
- Bash installation scripts for automation
- VM creation with GNOME Boxes/libvirt
- Scripted installation of Prometheus, Grafana, Node Exporter
- Simple, reproducible setup process

**IMAGE INSTRUCTION:**
Take screenshots showing:
1. Terminal output of bash installation script running (showing package installation on VM)
2. Terminal output showing successful Prometheus/Grafana service startup
3. Optional: Screenshot of GNOME Boxes showing all 3 VMs running
Combine into a single image with labels. Show successful completion with green checkmarks/success messages visible (e.g., "systemctl status prometheus" showing active/running).

**Design Notes:**
Use terminal screenshots with dark background. Highlight key success messages like "Active: active (running)" in green.

---

## Slide 7: Custom Dashboard - Next.js View
**Text:**
- Custom-built Next.js dashboard (CloudWatch)
- VM-specific metrics display
- Clean, modern React interface
- Real-time data from Prometheus API

**IMAGE INSTRUCTION:**
Take a full-screen screenshot of your Next.js custom dashboard showing:
- All three VMs (VM1, VM2, VM3) with their metrics
- CPU usage percentages
- Memory usage stats
- Network statistics
- Any custom visualizations you built
Ensure the data is current and all VMs are showing active metrics (not "N/A" or loading states).
Capture at 1920x1080 resolution if possible for clarity.

**Design Notes:**
This is your custom development showcase. Highlight the modern UI/UX you built with Next.js.

---

## Slide 8: Real-time Monitoring - Grafana View
**Text:**
- Detailed time-series visualizations
- Historical data analysis
- Multi-VM comparison graphs
- 15-second metric refresh rate

**IMAGE INSTRUCTION:**
Take a full-screen screenshot of your Grafana dashboard showing:
1. Set time range to "Last 6 hours" or "Last 24 hours" for good data visualization
2. Ensure panels show data from all VMs (VM1, VM2, VM3)
3. CPU usage graph with visible activity/trends
4. Memory usage graph showing historical patterns
5. Network traffic or disk I/O metrics
6. Include the auto-refresh indicator (top-right corner)
Optional: Show a panel with queries filtering by VM instance labels.

**Design Notes:**
Show the power of Grafana's visualization. Use the dark theme. Ensure graphs show interesting data patterns, not flat lines.

---

## Slide 9: Results & Metrics
**Text:**
- 3 VMs monitored simultaneously
- 15-second metric collection interval
- 15-day metric retention in Prometheus
- Network: 192.168.122.0/24 (libvirt)

**IMAGE INSTRUCTION:**
Create a composite image showing:
1. Screenshot of Prometheus targets page (Status > Targets) showing all 3 VM endpoints "UP" in green:
   - VM1:9100 (192.168.122.101:9100)
   - VM2:9100 (192.168.122.102:9100)
   - VM3:9100 (192.168.122.103:9100)
2. Screenshot of Grafana or Next.js dashboard showing all VMs with active metrics
3. Optional: Terminal screenshot showing `virsh net-list` or `virsh list --all` displaying all VMs running
Arrange these 2-3 screenshots in a grid or side-by-side layout.

**Design Notes:**
Use green highlights for success metrics. Include the libvirt network details. Show all VMs in "UP" or "running" state.

---

## Slide 10: Conclusion & Future Work
**Text:**
**Achievements:**
- Local VM monitoring system deployed
- Dual dashboard solution (Next.js + Grafana)
- Zero-cost, fully open-source stack
- Automated deployment with bash scripts

**Future Enhancements:**
- Add alerting rules (email/Slack notifications)
- Expand to monitor Docker containers
- Add custom metrics and application monitoring
- Mobile-responsive dashboard

**IMAGE INSTRUCTION:**
Create a split-screen or two-section visual:
Left side: Screenshot of both dashboards running (Next.js + Grafana in browser tabs or side-by-side)
Right side: Icons or simple graphics representing future features:
- Bell icon (alerting)
- Docker logo (container monitoring)
- Mobile phone icon (responsive design)
- Chart/graph icon (custom metrics)
Can be a simple mockup or icon arrangement.

**Design Notes:**
Keep it aspirational and forward-looking. Use blue/green colors for optimism. Show the completed project prominently.

---

## Additional Presentation Tips

### Before Taking Screenshots:
1. **Ensure VMs are running:**
   - Start all 3 VMs in GNOME Boxes (VM1, VM2, VM3)
   - Verify services are running: `systemctl status prometheus grafana-server node_exporter`
   - Check VM connectivity: `ping 192.168.122.101`, `ping 192.168.122.102`, `ping 192.168.122.103`

2. **Clean up your dashboards:**
   - Next.js dashboard: Ensure it's running (`npm run dev` or `npm start`)
   - Grafana: Remove any test panels, ensure consistent color schemes
   - Set appropriate time ranges for visual data

3. **Browser preparation:**
   - Use full-screen mode (F11)
   - Hide bookmarks bar
   - Close unnecessary tabs
   - Use 1920x1080 resolution if possible

4. **Data preparation:**
   - Ensure metrics are actively being collected from all 3 VMs
   - Run some test commands on VMs to generate CPU/network activity for more interesting graphs:
     - SSH into a VM and run: `stress-ng --cpu 2 --timeout 30s` (if installed)
     - Or: `dd if=/dev/zero of=/tmp/testfile bs=1M count=1024`
   - Verify all panels show data (no "No data" or "N/A" messages)

### Screenshot Tools:
- Linux: `gnome-screenshot`, Flameshot, or Spectacle
- Use PNG format for quality
- Compress images if file size is too large

### Grafana Settings for Screenshots:
- Set theme to Dark (looks more professional)
- Enable kiosk mode for clean screenshots: Add `?kiosk` to URL
- Set appropriate time range: Last 6 hours or Last 24 hours
- Refresh dashboard before capturing

### Terminal Screenshots:
- Use a terminal with good color support (GNOME Terminal, Terminator)
- Set font size to 12-14 for readability
- Capture successful command outputs showing green checkmarks
- Useful commands to screenshot:
  - `virsh list --all` (shows all VMs running)
  - `virsh net-list` (shows libvirt network)
  - `systemctl status prometheus`
  - `systemctl status grafana-server`
  - `curl http://192.168.122.101:9100/metrics | head` (shows Node Exporter working)

---

## File Naming Convention
Save your screenshots as:
- `slide-01-dashboard-main.png`
- `slide-02-problem-illustration.png`
- `slide-03-solution-overview.png`
- etc.

This will help you organize and insert them into your presentation software easily.
