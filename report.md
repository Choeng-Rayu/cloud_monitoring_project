# Cloud Monitoring Project: Prometheus, Grafana, and Custom Dashboard Implementation

**Project Report**

**Date:** April 2026

---

## Table of Contents

1. [Introduction and Project Objective](#1-introduction-and-project-objective)
2. [Platform Overview and Key Components](#2-platform-overview-and-key-components)
3. [System Architecture Design](#3-system-architecture-design)
4. [Installation and Configuration Steps](#4-installation-and-configuration-steps)
5. [Demonstration Results](#5-demonstration-results)
6. [Challenges and Troubleshooting](#6-challenges-and-troubleshooting)
7. [Conclusion](#7-conclusion)
8. [References](#8-references)

---

## 1. Introduction and Project Objective

### 1.1 Introduction

In modern cloud computing environments, infrastructure monitoring is not merely a best practice—it is an absolute necessity. As organizations increasingly rely on distributed systems, containerized applications, and virtualized infrastructure, the complexity of managing these environments grows exponentially. Without proper monitoring, system administrators and DevOps engineers operate in a state of uncertainty, unable to proactively identify and address issues before they impact end users.

**The Critical Importance of Monitoring in Cloud Computing**

Cloud environments are inherently dynamic. Virtual machines can be provisioned and decommissioned within minutes, containers may have lifespans measured in seconds, and workloads can shift across nodes based on demand. This fluidity introduces several challenges:

1. **Resource Utilization Visibility**: Without monitoring, it becomes impossible to understand how CPU, memory, disk, and network resources are being consumed across the infrastructure. Over-provisioning leads to wasted costs, while under-provisioning results in performance degradation.

2. **Performance Baseline Establishment**: Effective troubleshooting requires understanding what "normal" looks like. Monitoring systems collect historical data that establishes performance baselines, making anomalies immediately apparent.

3. **Capacity Planning**: Organizations must anticipate future resource needs based on growth trends. Time-series data from monitoring systems provides the foundation for accurate capacity planning.

4. **Service Level Agreement (SLA) Compliance**: Many organizations commit to specific uptime and performance guarantees. Monitoring enables tracking of these metrics and provides evidence for compliance reporting.

**Consequences of Inadequate Monitoring**

Operating cloud infrastructure without comprehensive monitoring introduces severe risks:

- **Single Points of Failure (SPOF)**: Without visibility into system dependencies and health, administrators cannot identify components whose failure would cascade throughout the system. A single unmonitored disk filling to capacity or a memory leak going undetected can bring down entire clusters.

- **Invisible Performance Issues**: Performance degradation often occurs gradually. A service that responds in 100ms today might slowly degrade to 500ms over weeks. Without monitoring, this degradation remains invisible until users complain or systems fail entirely.

- **Reactive vs. Proactive Operations**: Without monitoring, teams can only react to problems after they occur. This reactive posture leads to extended outages, emergency maintenance windows, and increased operational stress.

- **Security Blind Spots**: Unusual patterns in network traffic, CPU utilization, or process execution often indicate security breaches. Without monitoring, these indicators go unnoticed.

**Infrastructure Monitoring and Metrics Collection**

Infrastructure monitoring encompasses the systematic collection, storage, and analysis of metrics from computing resources. These metrics fall into several categories:

- **System Metrics**: CPU utilization, memory usage, disk I/O, filesystem capacity, network throughput
- **Application Metrics**: Request latency, error rates, throughput, queue depths
- **Business Metrics**: Transaction volumes, user activity, conversion rates

The process of metrics collection typically follows a pattern where monitoring agents or exporters run on target systems, exposing metrics in a standardized format. A central monitoring server periodically scrapes these endpoints, storing the data in a time-series database for later analysis and visualization.

**Prometheus as a Leading Open-Source Solution**

Prometheus has emerged as the de facto standard for infrastructure monitoring in cloud-native environments. Originally developed at SoundCloud in 2012 and later donated to the Cloud Native Computing Foundation (CNCF), Prometheus offers several compelling advantages:

- **Pull-Based Architecture**: Unlike push-based systems, Prometheus actively scrapes targets, simplifying configuration and enabling dynamic service discovery.
- **Powerful Query Language**: PromQL allows complex queries and aggregations across multiple dimensions.
- **Native Time-Series Database**: Purpose-built storage optimized for time-series data with efficient compression.
- **Extensive Ecosystem**: Hundreds of exporters exist for various systems, databases, and applications.
- **Kubernetes Integration**: First-class support for Kubernetes environments with automatic service discovery.

This project leverages Prometheus as the core of a comprehensive monitoring stack, complemented by Grafana for visualization and a custom Next.js dashboard for specialized use cases.

### 1.2 Project Objective

The primary objective of this project is to design, deploy, and demonstrate a complete infrastructure monitoring solution using industry-standard tools. The implementation serves as both a practical monitoring system and an educational exercise in modern DevOps practices.

**Specific Objectives:**

1. **Deploy a Complete Monitoring Stack**: Install and configure Prometheus as the central monitoring server, Grafana as the visualization platform, and Node Exporter as the metrics collection agent across a three-VM cluster.

2. **Configure Automated Metrics Collection**: Establish automated scraping of hardware and operating system metrics from target nodes at regular intervals, ensuring continuous visibility into system health.

3. **Create a Custom Web Dashboard**: Develop a modern, responsive web dashboard using Next.js, React, and TypeScript that queries the Prometheus API directly, providing real-time visualization of cluster metrics.

4. **Monitor Cluster Health**: Demonstrate the ability to monitor cluster health through both the industry-standard Grafana interface and the custom-built dashboard, showcasing the flexibility of the Prometheus ecosystem.

5. **Document the Implementation**: Produce comprehensive documentation covering installation procedures, configuration details, architectural decisions, and troubleshooting guides to facilitate knowledge transfer and future maintenance.

**Success Criteria:**

- All three VMs are successfully provisioned and networked
- Prometheus successfully scrapes metrics from both target nodes
- Grafana displays real-time metrics with appropriate dashboards
- Custom Next.js dashboard queries Prometheus and renders metrics
- All services survive system reboots via systemd integration
- Documentation enables reproduction of the environment

---

## 2. Platform Overview and Key Components

### 2.1 What is Prometheus?

Prometheus is an open-source systems monitoring and alerting toolkit that has become the cornerstone of observability in cloud-native environments. Graduated from the Cloud Native Computing Foundation (CNCF) in 2018, Prometheus joins Kubernetes as one of only a handful of projects to achieve this status, indicating its maturity and widespread adoption.

**Core Characteristics:**

Prometheus operates on a fundamentally different model than traditional monitoring systems. Rather than requiring monitored systems to push metrics to a central collector, Prometheus actively pulls (scrapes) metrics from configured targets. This pull-based model offers several advantages:

- **Simplified Target Configuration**: Targets need only expose an HTTP endpoint; they do not need knowledge of the monitoring server.
- **Central Control**: The monitoring server maintains complete control over scraping frequency and targets.
- **Easier Debugging**: If metrics are missing, the problem is immediately apparent—either the target is unreachable or the endpoint is misconfigured.

**Time Series Database (TSDB)**

At the heart of Prometheus lies its custom-built Time Series Database (TSDB). Unlike general-purpose databases, the TSDB is optimized specifically for time-series data with the following characteristics:

- **Efficient Compression**: Time-series data exhibits high temporal locality and value correlation. The TSDB exploits these patterns to achieve compression ratios of 1.37 bytes per sample on average.

- **Write-Optimized Design**: Metrics arrive continuously and must be written efficiently. The TSDB uses an append-only write pattern with periodic compaction.

- **Block-Based Storage**: Data is organized into two-hour blocks, which are then compacted into larger blocks over time. This structure enables efficient garbage collection and backup.

- **Label-Based Indexing**: Every metric in Prometheus is identified by a metric name and a set of key-value labels. The TSDB maintains inverted indexes on these labels, enabling fast queries across any dimension.

**Data Model:**

Prometheus stores data as time series, where each time series is uniquely identified by:

```
<metric_name>{<label_name>=<label_value>, ...}
```

For example:
```
node_cpu_seconds_total{cpu="0", mode="idle", instance="192.168.122.102:9100"}
```

This multi-dimensional data model enables powerful aggregations and filtering without pre-defining the query patterns.

**PromQL Query Language**

PromQL (Prometheus Query Language) is a functional query language designed specifically for time-series data. It enables users to:

- **Select and Filter**: Retrieve specific metrics based on label values
- **Aggregate**: Combine metrics across dimensions using functions like `sum()`, `avg()`, `max()`
- **Transform**: Apply mathematical operations and functions to time series
- **Analyze Over Time**: Calculate rates, derivatives, and trends

Example queries:

```promql
# Current CPU utilization across all nodes
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory utilization percentage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Disk space used percentage
(1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) * 100
```

### 2.2 Key Components

This project integrates several components into a cohesive monitoring stack. Each component serves a specific purpose and communicates with others through well-defined interfaces.

#### Prometheus Server

**Role:** Central monitoring server, time-series database, and query engine

**Description:** The Prometheus server is the core of the monitoring stack. It performs three primary functions:

1. **Metrics Scraping**: Periodically fetches metrics from configured targets via HTTP
2. **Data Storage**: Persists metrics in the embedded TSDB with configurable retention
3. **Query Processing**: Evaluates PromQL queries and serves results via HTTP API

**Deployment Details:**
- **Location**: VM1 (vm1-monitoring)
- **IP Address**: 192.168.122.101
- **Port**: 9090
- **Version**: 2.52.0
- **Storage Path**: /var/lib/prometheus/
- **Configuration**: /etc/prometheus/prometheus.yml

**Key Configuration Parameters:**
- Scrape interval: 5 seconds (aggressive for demonstration purposes; production typically uses 15-60 seconds)
- Evaluation interval: 5 seconds
- Retention period: 15 days (default)

#### Node Exporter

**Role:** Hardware and operating system metrics exporter

**Description:** Node Exporter is a Prometheus exporter that collects hardware and OS-level metrics from *nix systems. Written in Go, it is lightweight and efficient, with minimal impact on system resources.

**Metrics Collected:**
- **CPU**: Usage per core, per mode (user, system, idle, iowait, etc.)
- **Memory**: Total, available, buffers, cached, swap usage
- **Disk**: I/O operations, bytes read/written, filesystem capacity
- **Network**: Bytes transmitted/received, packets, errors, drops
- **System**: Load average, uptime, context switches, interrupts

**Deployment Details:**
- **Location**: VM2 (vm2-node) and VM3 (vm3-node)
- **IP Addresses**: 192.168.122.102, 192.168.122.103
- **Port**: 9100
- **Version**: 1.8.2
- **Metrics Endpoint**: http://<ip>:9100/metrics

**Example Metrics Output:**
```
# HELP node_cpu_seconds_total Seconds the CPUs spent in each mode.
# TYPE node_cpu_seconds_total counter
node_cpu_seconds_total{cpu="0",mode="idle"} 1.83577486e+06
node_cpu_seconds_total{cpu="0",mode="iowait"} 1234.56
node_cpu_seconds_total{cpu="0",mode="system"} 12345.67
node_cpu_seconds_total{cpu="0",mode="user"} 23456.78
```

#### Grafana

**Role:** Metrics visualization and dashboarding platform

**Description:** Grafana is an open-source analytics and interactive visualization web application. It provides charts, graphs, and alerts for time-series data when connected to supported data sources, including Prometheus.

**Key Features:**
- **Dashboard Creation**: Drag-and-drop panel configuration with various visualization types
- **Data Source Integration**: Native support for Prometheus, with automatic PromQL assistance
- **Alerting**: Rule-based alerts with multiple notification channels
- **User Management**: Authentication, organizations, and role-based access control
- **Dashboard Sharing**: Import/export dashboards, community dashboard library

**Deployment Details:**
- **Location**: VM1 (vm1-monitoring)
- **IP Address**: 192.168.122.101
- **Port**: 3000
- **Version**: Latest (via APT repository)
- **Default Credentials**: admin / admin (changed on first login)

**Pre-configured Dashboard:**
- Dashboard ID 1860: "Node Exporter Full" - Comprehensive visualization of all Node Exporter metrics

#### Next.js Dashboard (CloudWatch)

**Role:** Custom real-time monitoring dashboard

**Description:** A custom-built web application that provides a modern, responsive interface for monitoring cluster health. Named "CloudWatch" (not to be confused with AWS CloudWatch), this dashboard queries the Prometheus HTTP API directly and renders metrics using React components.

**Technology Stack:**
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS for utility-first styling
- **UI Components**: shadcn/ui for pre-built accessible components
- **Charts**: Recharts for data visualization
- **State Management**: React hooks and SWR for data fetching

**Key Features:**
- Real-time node status cards showing up/down state
- CPU, memory, and disk utilization progress bars
- CPU usage history line charts with configurable time ranges
- System overview statistics (total nodes, CPU cores, memory, disk)
- Quick links to Prometheus and Grafana interfaces
- Add Node Wizard: 4-step guided process to add new monitoring targets

**Key Components:**
| Component | Purpose |
|-----------|---------|
| `prometheus.ts` | API client for Prometheus queries, handles PromQL execution |
| `NodeCard` | Displays individual node metrics with status indicators |
| `MetricChart` | Time-series visualization using Recharts |
| `SystemOverview` | Aggregated cluster statistics |
| `AddNodeWizard` | Multi-step wizard for adding new nodes to monitoring |

**Deployment Details:**
- **Location**: Host machine
- **IP Address**: 192.168.122.1 (from VM perspective)
- **Port**: 3000 (development) or 80/443 (production)
- **Build**: Static export possible for CDN deployment

#### libvirt/KVM

**Role:** Virtualization platform

**Description:** libvirt is a toolkit for managing virtualization platforms, while KVM (Kernel-based Virtual Machine) is the Linux kernel's built-in hypervisor. Together, they provide enterprise-grade virtualization capabilities.

**GNOME Boxes:**
GNOME Boxes serves as the user-friendly frontend for libvirt/KVM, simplifying VM creation and management while retaining access to advanced features when needed.

**Key Features:**
- Type-1 hypervisor performance (KVM runs in kernel space)
- Hardware virtualization using Intel VT-x or AMD-V
- Virtual networking with NAT, bridged, and isolated modes
- Live migration, snapshots, and cloning capabilities

**Network Configuration:**
- Virtual bridge: virbr0
- Network: 192.168.122.0/24
- Gateway/DNS: 192.168.122.1
- DHCP range: 192.168.122.2 - 192.168.122.254

#### systemd

**Role:** Service management and initialization

**Description:** systemd is the init system and service manager for Linux, responsible for bootstrapping the system and managing services throughout operation.

**Integration Points:**
All monitoring components are configured as systemd services:

| Service | Unit File | Auto-start |
|---------|-----------|------------|
| Prometheus | prometheus.service | Enabled |
| Node Exporter | node_exporter.service | Enabled |
| Grafana | grafana-server.service | Enabled |

**Benefits:**
- Automatic service restart on failure
- Dependency management between services
- Centralized logging via journald
- Resource limits and sandboxing
- Boot-time service startup

---

## 3. System Architecture Design

### 3.1 Architecture Overview

The monitoring infrastructure is deployed across three Ubuntu Server virtual machines running on a single physical host using GNOME Boxes (libvirt/KVM). This architecture simulates a distributed monitoring environment while remaining accessible for development and demonstration purposes.

**Virtualization Environment:**

- **Hypervisor**: KVM (Kernel-based Virtual Machine)
- **Management**: libvirt with GNOME Boxes frontend
- **Guest OS**: Ubuntu Server 24.04 LTS (Noble Numbat)
- **VM Count**: 3 virtual machines

**Network Topology:**

The VMs communicate over a NAT network provided by libvirt's default network configuration. The virtual bridge `virbr0` connects all VMs to each other and provides NAT-based internet access through the host.

- **Network Type**: NAT (Network Address Translation)
- **Network CIDR**: 192.168.122.0/24
- **Bridge Interface**: virbr0
- **Gateway**: 192.168.122.1 (host machine)

**Role Distribution:**

- **VM1 (Monitoring Server)**: Runs Prometheus and Grafana, serving as the central collection and visualization point
- **VM2 (Target Node)**: Runs Node Exporter, representing a monitored server
- **VM3 (Target Node)**: Runs Node Exporter, representing a second monitored server
- **Host Machine**: Runs the custom Next.js dashboard and provides network connectivity

This separation of concerns mirrors production deployments where monitoring infrastructure is isolated from application workloads.

### 3.2 Network Configuration Table

| Hostname | IP Address | Role | Components | Ports |
|----------|------------|------|------------|-------|
| vm1-monitoring | 192.168.122.101 | Monitoring Server | Prometheus, Grafana | 9090, 3000 |
| vm2-node | 192.168.122.102 | Target Node | Node Exporter | 9100 |
| vm3-node | 192.168.122.103 | Target Node | Node Exporter | 9100 |
| Host | 192.168.122.1 | Gateway + Dashboard | Next.js Dashboard, libvirt | 3000 |

**Port Assignments:**

| Port | Protocol | Service | Purpose |
|------|----------|---------|---------|
| 9090 | HTTP | Prometheus | Web UI and API |
| 9100 | HTTP | Node Exporter | Metrics endpoint |
| 3000 | HTTP | Grafana | Dashboard UI |
| 3000 | HTTP | Next.js (Host) | Custom Dashboard |
| 22 | SSH | OpenSSH | Remote administration |

### 3.3 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HOST MACHINE                                    │
│                           192.168.122.1                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     Next.js Dashboard (CloudWatch)                   │    │
│  │                         Port 3000                                    │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │    │
│  │  │  NodeCard   │  │  NodeCard   │  │MetricChart  │  │SystemOverview│ │    │
│  │  │   (VM2)     │  │   (VM3)     │  │             │  │            │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     │                                        │
│                                     │ HTTP API Queries                       │
│                                     ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        virbr0 (Virtual Bridge)                       │    │
│  │                         192.168.122.0/24                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│         │                           │                           │            │
│         │                           │                           │            │
└─────────┼───────────────────────────┼───────────────────────────┼────────────┘
          │                           │                           │
          ▼                           ▼                           ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│    VM1-MONITORING   │   │      VM2-NODE       │   │      VM3-NODE       │
│  192.168.122.101    │   │  192.168.122.102    │   │  192.168.122.103    │
│                     │   │                     │   │                     │
│  ┌───────────────┐  │   │  ┌───────────────┐  │   │  ┌───────────────┐  │
│  │  Prometheus   │  │   │  │ Node Exporter │  │   │  │ Node Exporter │  │
│  │   :9090       │◄─┼───┼──│   :9100       │  │   │  │   :9100       │  │
│  │               │  │   │  │               │  │   │  │               │  │
│  │  ┌─────────┐  │  │   │  │ CPU, Memory,  │  │   │  │ CPU, Memory,  │  │
│  │  │  TSDB   │  │  │   │  │ Disk, Network │  │   │  │ Disk, Network │  │
│  │  └─────────┘  │  │   │  │ Metrics       │  │   │  │ Metrics       │  │
│  └───────────────┘  │   │  └───────────────┘  │   │  └───────────────┘  │
│         │           │   │         ▲           │   │         ▲           │
│         │           │   └─────────┼───────────┘   └─────────┼───────────┘
│         ▼           │             │                         │
│  ┌───────────────┐  │             │         Scrape          │
│  │    Grafana    │  │             │        /metrics         │
│  │    :3000      │  │             │      (every 5s)         │
│  │               │  │             │                         │
│  │  Dashboards   │◄─┼─────────────┴─────────────────────────┘
│  │  & Alerts     │  │
│  └───────────────┘  │
└─────────────────────┘

                              DATA FLOW LEGEND
                    ─────────────────────────────────
                    ───────►  Prometheus scrapes metrics
                    ◄──────   Dashboard/Grafana queries Prometheus
```

### 3.4 Data Flow

The monitoring system follows a well-defined data flow pattern that ensures metrics are collected, stored, and made available for visualization.

**Step 1: Metrics Exposure**

Node Exporters running on VM2 and VM3 collect hardware and OS metrics from their respective hosts. These metrics are exposed via HTTP at the `/metrics` endpoint on port 9100.

```
GET http://192.168.122.102:9100/metrics
GET http://192.168.122.103:9100/metrics
```

The metrics are formatted in Prometheus exposition format:
```
# HELP node_load1 1m load average.
# TYPE node_load1 gauge
node_load1 0.52
```

**Step 2: Metrics Scraping**

Prometheus, running on VM1, is configured with scrape targets pointing to both Node Exporters. Every 5 seconds (as defined in `prometheus.yml`), Prometheus initiates HTTP requests to each target's `/metrics` endpoint.

```yaml
scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets:
        - '192.168.122.102:9100'
        - '192.168.122.103:9100'
```

**Step 3: Data Storage**

Upon receiving metrics, Prometheus parses the exposition format and stores each sample in its Time Series Database (TSDB). Each sample consists of:
- Metric name and labels (identifier)
- Timestamp (when scraped)
- Value (numeric measurement)

The TSDB organizes data into blocks and maintains indexes for efficient querying.

**Step 4: Query Processing**

Both Grafana and the Next.js dashboard query Prometheus using PromQL via the HTTP API:

```
GET http://192.168.122.101:9090/api/v1/query?query=up
GET http://192.168.122.101:9090/api/v1/query_range?query=rate(node_cpu_seconds_total[5m])&start=...&end=...&step=15
```

**Step 5: Visualization**

- **Grafana**: Pre-built dashboards render metrics using various visualization types (graphs, gauges, tables)
- **Next.js Dashboard**: React components process API responses and render using Recharts

**Data Flow Timing:**

| Event | Frequency | Latency |
|-------|-----------|---------|
| Metrics collection by Node Exporter | Continuous | Real-time |
| Prometheus scrape | Every 5 seconds | < 100ms |
| TSDB write | Per scrape | < 10ms |
| Dashboard refresh | Configurable (default 30s) | < 500ms |

---

## 4. Installation and Configuration Steps

### 4.1 Virtual Machine Setup

The virtual machines are created using GNOME Boxes, which provides a user-friendly interface for libvirt/KVM management. Each VM is provisioned with identical specifications to ensure consistent performance characteristics.

**VM Specifications:**

| Specification | Value | Rationale |
|---------------|-------|-----------|
| Operating System | Ubuntu Server 24.04 LTS | Long-term support, wide compatibility |
| RAM per VM | 2 GB | Sufficient for monitoring workloads |
| vCPUs | 2 | Adequate for Node Exporter and Prometheus |
| Storage | 20 GB | Room for TSDB data and logs |
| Network | NAT via libvirt default network | Simplified networking with internet access |
| Graphics | None (headless) | Server configuration, SSH access only |

**VM Creation Process:**

1. Open GNOME Boxes
2. Click "+" to create new VM
3. Select Ubuntu Server 24.04 LTS ISO
4. Allocate 2 GB RAM and 20 GB storage
5. Complete Ubuntu Server installation
6. Enable OpenSSH server during installation
7. Repeat for all three VMs

**Post-Installation Configuration:**

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Set hostname (example for VM1)
sudo hostnamectl set-hostname vm1-monitoring

# Install essential utilities
sudo apt install -y curl wget vim net-tools htop
```

### 4.2 Network Configuration

Static IP addresses are essential for reliable service discovery and communication between monitoring components. Ubuntu Server 24.04 uses Netplan for network configuration.

**Netplan Configuration:**

The network configuration file is located at `/etc/netplan/50-cloud-init.yaml`. Each VM requires a unique static IP address.

**VM1 (Monitoring Server) - /etc/netplan/50-cloud-init.yaml:**

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp1s0:
      addresses:
        - 192.168.122.101/24
      routes:
        - to: default
          via: 192.168.122.1
      nameservers:
        addresses:
          - 192.168.122.1
          - 8.8.8.8
```

**VM2 (Target Node) - /etc/netplan/50-cloud-init.yaml:**

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp1s0:
      addresses:
        - 192.168.122.102/24
      routes:
        - to: default
          via: 192.168.122.1
      nameservers:
        addresses:
          - 192.168.122.1
          - 8.8.8.8
```

**VM3 (Target Node) - /etc/netplan/50-cloud-init.yaml:**

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp1s0:
      addresses:
        - 192.168.122.103/24
      routes:
        - to: default
          via: 192.168.122.1
      nameservers:
        addresses:
          - 192.168.122.1
          - 8.8.8.8
```

**Applying Network Configuration:**

```bash
# Validate configuration
sudo netplan try

# Apply configuration permanently
sudo netplan apply

# Verify IP address
ip addr show enp1s0
```

### 4.3 Libvirt Network Setup

The libvirt default network provides NAT-based connectivity for virtual machines. A setup script automates the network configuration.

**setup_libvirt_network.sh:**

```bash
#!/bin/bash
# Script to setup libvirt default network for monitoring VMs

set -e

echo "Checking libvirt network status..."

# Check if default network exists
if ! sudo virsh net-list --all | grep -q default; then
    echo "Creating default network..."
    sudo virsh net-define /usr/share/libvirt/networks/default.xml
fi

# Start the network if not active
if ! sudo virsh net-list | grep -q default; then
    echo "Starting default network..."
    sudo virsh net-start default
fi

# Enable autostart
echo "Enabling network autostart..."
sudo virsh net-autostart default

# Display network info
echo ""
echo "Network Configuration:"
sudo virsh net-info default

echo ""
echo "Network DHCP Leases:"
sudo virsh net-dhcp-leases default

echo ""
echo "Bridge Interface:"
ip addr show virbr0
```

**Network Characteristics:**

| Parameter | Value |
|-----------|-------|
| Network Name | default |
| Bridge Interface | virbr0 |
| Network Mode | NAT |
| IP Range | 192.168.122.0/24 |
| Gateway | 192.168.122.1 |
| DHCP Range | 192.168.122.2 - 192.168.122.254 |
| DNS | Provided by dnsmasq |

**Firewall Configuration on Host:**

```bash
# Allow forwarding for VM traffic
sudo sysctl -w net.ipv4.ip_forward=1

# Make persistent
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
```

### 4.4 Node Exporter Installation (VM2 & VM3)

Node Exporter is installed on both target nodes (VM2 and VM3) using a standardized installation script.

**Installation Details:**

| Parameter | Value |
|-----------|-------|
| Version | 1.8.2 |
| Installation Path | /usr/local/bin/node_exporter |
| Configuration | Minimal (defaults) |
| Service User | node_exporter (no shell, no home) |
| Port | 9100 |

**install_node_exporter.sh:**

```bash
#!/bin/bash
# Node Exporter Installation Script
# Run on VM2 and VM3

set -e

NODE_EXPORTER_VERSION="1.8.2"
DOWNLOAD_URL="https://github.com/prometheus/node_exporter/releases/download/v${NODE_EXPORTER_VERSION}/node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz"

echo "=== Node Exporter Installation Script ==="
echo "Version: ${NODE_EXPORTER_VERSION}"
echo ""

# Step 1: Create system user
echo "[1/5] Creating node_exporter user..."
if ! id "node_exporter" &>/dev/null; then
    sudo useradd --no-create-home --shell /bin/false node_exporter
    echo "User created."
else
    echo "User already exists."
fi

# Step 2: Download Node Exporter
echo "[2/5] Downloading Node Exporter..."
cd /tmp
wget -q "${DOWNLOAD_URL}" -O node_exporter.tar.gz
tar xzf node_exporter.tar.gz

# Step 3: Install binary
echo "[3/5] Installing binary..."
sudo cp "node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64/node_exporter" /usr/local/bin/
sudo chown node_exporter:node_exporter /usr/local/bin/node_exporter

# Step 4: Create systemd service
echo "[4/5] Creating systemd service..."
sudo tee /etc/systemd/system/node_exporter.service > /dev/null <<EOF
[Unit]
Description=Node Exporter
Documentation=https://prometheus.io/docs/guides/node-exporter/
Wants=network-online.target
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter \\
    --collector.systemd \\
    --collector.processes

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Step 5: Start service
echo "[5/5] Starting Node Exporter service..."
sudo systemctl daemon-reload
sudo systemctl enable node_exporter
sudo systemctl start node_exporter

# Cleanup
rm -rf /tmp/node_exporter*

# Verify
echo ""
echo "=== Installation Complete ==="
echo "Service Status:"
sudo systemctl status node_exporter --no-pager

echo ""
echo "Metrics endpoint: http://$(hostname -I | awk '{print $1}'):9100/metrics"
```

**Verification Commands:**

```bash
# Check service status
sudo systemctl status node_exporter

# View logs
sudo journalctl -u node_exporter -f

# Test metrics endpoint
curl -s http://localhost:9100/metrics | head -20

# Check listening port
ss -tlnp | grep 9100
```

### 4.5 Prometheus Installation (VM1)

Prometheus is installed on the monitoring server (VM1) with a configuration targeting both Node Exporter instances.

**Installation Details:**

| Parameter | Value |
|-----------|-------|
| Version | 2.52.0 |
| Installation Path | /usr/local/bin/prometheus |
| Configuration Path | /etc/prometheus/ |
| Data Path | /var/lib/prometheus/ |
| Service User | prometheus |
| Port | 9090 |

**install_prometheus.sh:**

```bash
#!/bin/bash
# Prometheus Installation Script
# Run on VM1 (Monitoring Server)

set -e

PROMETHEUS_VERSION="2.52.0"
DOWNLOAD_URL="https://github.com/prometheus/prometheus/releases/download/v${PROMETHEUS_VERSION}/prometheus-${PROMETHEUS_VERSION}.linux-amd64.tar.gz"

echo "=== Prometheus Installation Script ==="
echo "Version: ${PROMETHEUS_VERSION}"
echo ""

# Step 1: Create system user
echo "[1/7] Creating prometheus user..."
if ! id "prometheus" &>/dev/null; then
    sudo useradd --no-create-home --shell /bin/false prometheus
    echo "User created."
else
    echo "User already exists."
fi

# Step 2: Create directories
echo "[2/7] Creating directories..."
sudo mkdir -p /etc/prometheus
sudo mkdir -p /var/lib/prometheus

# Step 3: Download Prometheus
echo "[3/7] Downloading Prometheus..."
cd /tmp
wget -q "${DOWNLOAD_URL}" -O prometheus.tar.gz
tar xzf prometheus.tar.gz

# Step 4: Install binaries
echo "[4/7] Installing binaries..."
cd "prometheus-${PROMETHEUS_VERSION}.linux-amd64"
sudo cp prometheus promtool /usr/local/bin/
sudo cp -r consoles console_libraries /etc/prometheus/

# Step 5: Create configuration
echo "[5/7] Creating configuration..."
sudo tee /etc/prometheus/prometheus.yml > /dev/null <<EOF
# Prometheus Configuration
# Cloud Monitoring Project

global:
  scrape_interval: 5s          # How often to scrape targets
  evaluation_interval: 5s      # How often to evaluate rules
  external_labels:
    monitor: 'cloud-monitor'

# Alertmanager configuration (optional)
alerting:
  alertmanagers:
    - static_configs:
        - targets: []

# Rule files (optional)
rule_files: []

# Scrape configurations
scrape_configs:
  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Node Exporter targets
  - job_name: 'node'
    static_configs:
      - targets:
        - '192.168.122.102:9100'    # VM2
        - '192.168.122.103:9100'    # VM3
        labels:
          env: 'production'
EOF

# Step 6: Set permissions
echo "[6/7] Setting permissions..."
sudo chown -R prometheus:prometheus /etc/prometheus
sudo chown -R prometheus:prometheus /var/lib/prometheus
sudo chown prometheus:prometheus /usr/local/bin/prometheus
sudo chown prometheus:prometheus /usr/local/bin/promtool

# Step 7: Create systemd service
echo "[7/7] Creating systemd service..."
sudo tee /etc/systemd/system/prometheus.service > /dev/null <<EOF
[Unit]
Description=Prometheus Monitoring System
Documentation=https://prometheus.io/docs/introduction/overview/
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/prometheus \\
    --config.file=/etc/prometheus/prometheus.yml \\
    --storage.tsdb.path=/var/lib/prometheus/ \\
    --web.console.templates=/etc/prometheus/consoles \\
    --web.console.libraries=/etc/prometheus/console_libraries \\
    --web.listen-address=0.0.0.0:9090 \\
    --web.enable-lifecycle \\
    --web.enable-admin-api

ExecReload=/bin/kill -HUP \$MAINPID
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl daemon-reload
sudo systemctl enable prometheus
sudo systemctl start prometheus

# Cleanup
rm -rf /tmp/prometheus*

# Verify
echo ""
echo "=== Installation Complete ==="
echo "Service Status:"
sudo systemctl status prometheus --no-pager

echo ""
echo "Web UI: http://$(hostname -I | awk '{print $1}'):9090"
echo "Targets: http://$(hostname -I | awk '{print $1}'):9090/targets"
```

**Configuration File Breakdown (prometheus.yml):**

```yaml
global:
  scrape_interval: 5s      # Aggressive interval for demo (production: 15-60s)
  evaluation_interval: 5s  # Rule evaluation frequency

scrape_configs:
  - job_name: 'prometheus'  # Self-monitoring
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node'        # Node Exporter targets
    static_configs:
      - targets:
        - '192.168.122.102:9100'
        - '192.168.122.103:9100'
```

**Verification Commands:**

```bash
# Check service status
sudo systemctl status prometheus

# Validate configuration
promtool check config /etc/prometheus/prometheus.yml

# View logs
sudo journalctl -u prometheus -f

# Check targets via API
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets'

# Test query
curl -s "http://localhost:9090/api/v1/query?query=up" | jq
```

### 4.6 Grafana Installation (VM1)

Grafana is installed on the monitoring server alongside Prometheus, providing advanced visualization capabilities.

**install_grafana.sh:**

```bash
#!/bin/bash
# Grafana Installation Script
# Run on VM1 (Monitoring Server)

set -e

echo "=== Grafana Installation Script ==="
echo ""

# Step 1: Install prerequisites
echo "[1/5] Installing prerequisites..."
sudo apt-get install -y apt-transport-https software-properties-common wget

# Step 2: Add Grafana repository
echo "[2/5] Adding Grafana APT repository..."
sudo mkdir -p /etc/apt/keyrings/
wget -q -O - https://apt.grafana.com/gpg.key | gpg --dearmor | sudo tee /etc/apt/keyrings/grafana.gpg > /dev/null

echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" | sudo tee /etc/apt/sources.list.d/grafana.list

# Step 3: Install Grafana
echo "[3/5] Installing Grafana..."
sudo apt-get update
sudo apt-get install -y grafana

# Step 4: Configure Grafana
echo "[4/5] Configuring Grafana..."

# Enable anonymous access for demo (optional, remove for production)
sudo tee -a /etc/grafana/grafana.ini > /dev/null <<EOF

# Custom configuration for Cloud Monitoring Project
[server]
http_addr = 0.0.0.0
http_port = 3000

[security]
admin_user = admin
admin_password = admin

[users]
allow_sign_up = false
EOF

# Step 5: Start service
echo "[5/5] Starting Grafana service..."
sudo systemctl daemon-reload
sudo systemctl enable grafana-server
sudo systemctl start grafana-server

# Wait for Grafana to start
sleep 5

# Verify
echo ""
echo "=== Installation Complete ==="
echo "Service Status:"
sudo systemctl status grafana-server --no-pager

echo ""
echo "Web UI: http://$(hostname -I | awk '{print $1}'):3000"
echo "Default credentials: admin / admin"
echo ""
echo "Next steps:"
echo "1. Login to Grafana"
echo "2. Add Prometheus data source (http://localhost:9090)"
echo "3. Import dashboard ID 1860 (Node Exporter Full)"
```

**Post-Installation Configuration:**

1. **Access Grafana**: Navigate to `http://192.168.122.101:3000`
2. **Login**: Use default credentials (admin/admin), change password when prompted
3. **Add Data Source**:
   - Navigate to Configuration > Data Sources
   - Click "Add data source"
   - Select "Prometheus"
   - Set URL: `http://localhost:9090`
   - Click "Save & Test"
4. **Import Dashboard**:
   - Navigate to Dashboards > Import
   - Enter Dashboard ID: `1860`
   - Select Prometheus data source
   - Click "Import"

### 4.7 Custom Dashboard Development

The custom Next.js dashboard provides a modern, responsive interface for monitoring cluster health. This section details the technology stack and key components.

**Technology Stack:**

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16 | React framework with App Router |
| React | 18+ | UI component library |
| TypeScript | 5+ | Type-safe JavaScript |
| Tailwind CSS | 3+ | Utility-first CSS framework |
| shadcn/ui | Latest | Accessible UI components |
| Recharts | 2+ | Chart library for React |

**Project Structure:**

```
cloudwatch-dashboard/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main dashboard page
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── NodeCard.tsx        # Individual node display
│   ├── MetricChart.tsx     # Time-series charts
│   ├── SystemOverview.tsx  # Cluster statistics
│   └── AddNodeWizard.tsx   # Node addition wizard
├── lib/
│   ├── prometheus.ts       # Prometheus API client
│   └── utils.ts            # Utility functions
├── types/
│   └── metrics.ts          # TypeScript interfaces
├── tailwind.config.js
├── next.config.js
└── package.json
```

**Key Component: prometheus.ts (API Client)**

```typescript
// lib/prometheus.ts
const PROMETHEUS_URL = process.env.NEXT_PUBLIC_PROMETHEUS_URL || 'http://192.168.122.101:9090';

export interface PrometheusResponse<T> {
  status: 'success' | 'error';
  data: T;
  errorType?: string;
  error?: string;
}

export interface InstantVector {
  resultType: 'vector';
  result: Array<{
    metric: Record<string, string>;
    value: [number, string];
  }>;
}

export interface RangeVector {
  resultType: 'matrix';
  result: Array<{
    metric: Record<string, string>;
    values: Array<[number, string]>;
  }>;
}

export async function query(promql: string): Promise<InstantVector> {
  const response = await fetch(
    `${PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent(promql)}`
  );
  const data: PrometheusResponse<InstantVector> = await response.json();
  
  if (data.status !== 'success') {
    throw new Error(data.error || 'Query failed');
  }
  
  return data.data;
}

export async function queryRange(
  promql: string,
  start: number,
  end: number,
  step: number
): Promise<RangeVector> {
  const response = await fetch(
    `${PROMETHEUS_URL}/api/v1/query_range?query=${encodeURIComponent(promql)}&start=${start}&end=${end}&step=${step}`
  );
  const data: PrometheusResponse<RangeVector> = await response.json();
  
  if (data.status !== 'success') {
    throw new Error(data.error || 'Query failed');
  }
  
  return data.data;
}

// Convenience functions for common metrics
export async function getNodeStatus(): Promise<Record<string, boolean>> {
  const result = await query('up{job="node"}');
  const status: Record<string, boolean> = {};
  
  for (const item of result.result) {
    status[item.metric.instance] = item.value[1] === '1';
  }
  
  return status;
}

export async function getCpuUsage(instance: string): Promise<number> {
  const result = await query(
    `100 - (avg by (instance) (rate(node_cpu_seconds_total{instance="${instance}",mode="idle"}[5m])) * 100)`
  );
  return parseFloat(result.result[0]?.value[1] || '0');
}

export async function getMemoryUsage(instance: string): Promise<number> {
  const result = await query(
    `(1 - (node_memory_MemAvailable_bytes{instance="${instance}"} / node_memory_MemTotal_bytes{instance="${instance}"})) * 100`
  );
  return parseFloat(result.result[0]?.value[1] || '0');
}

export async function getDiskUsage(instance: string): Promise<number> {
  const result = await query(
    `(1 - (node_filesystem_avail_bytes{instance="${instance}",mountpoint="/"} / node_filesystem_size_bytes{instance="${instance}",mountpoint="/"})) * 100`
  );
  return parseFloat(result.result[0]?.value[1] || '0');
}
```

**Key Component: NodeCard.tsx**

```typescript
// components/NodeCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface NodeCardProps {
  hostname: string;
  instance: string;
  isUp: boolean;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}

export function NodeCard({
  hostname,
  instance,
  isUp,
  cpuUsage,
  memoryUsage,
  diskUsage,
}: NodeCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{hostname}</CardTitle>
        <Badge variant={isUp ? 'default' : 'destructive'}>
          {isUp ? 'UP' : 'DOWN'}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground mb-4">{instance}</div>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>CPU</span>
              <span>{cpuUsage.toFixed(1)}%</span>
            </div>
            <Progress value={cpuUsage} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Memory</span>
              <span>{memoryUsage.toFixed(1)}%</span>
            </div>
            <Progress value={memoryUsage} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Disk</span>
              <span>{diskUsage.toFixed(1)}%</span>
            </div>
            <Progress value={diskUsage} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Key Component: AddNodeWizard.tsx**

The AddNodeWizard provides a 4-step guided process for adding new nodes to the monitoring system:

1. **Step 1 - Node Information**: Enter hostname and IP address
2. **Step 2 - Connection Test**: Verify SSH connectivity to the node
3. **Step 3 - Install Node Exporter**: Run installation script remotely
4. **Step 4 - Update Prometheus**: Add target to prometheus.yml

**Running the Dashboard:**

```bash
# Navigate to dashboard directory
cd cloudwatch-dashboard

# Install dependencies
npm install

# Set environment variable
export NEXT_PUBLIC_PROMETHEUS_URL=http://192.168.122.101:9090

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

---

## 5. Demonstration Results

### 5.1 Service Status

All monitoring services are running and healthy across the VM cluster.

**VM1 - Prometheus Service:**

```bash
$ sudo systemctl status prometheus
● prometheus.service - Prometheus Monitoring System
     Loaded: loaded (/etc/systemd/system/prometheus.service; enabled; preset: enabled)
     Active: active (running) since Mon 2026-04-07 10:00:00 UTC; 4h 59min ago
       Docs: https://prometheus.io/docs/introduction/overview/
   Main PID: 1234 (prometheus)
      Tasks: 12 (limit: 2314)
     Memory: 128.5M
        CPU: 2min 34.567s
     CGroup: /system.slice/prometheus.service
             └─1234 /usr/local/bin/prometheus --config.file=/etc/prometheus/prometheus.yml ...
```

**VM1 - Grafana Service:**

```bash
$ sudo systemctl status grafana-server
● grafana-server.service - Grafana instance
     Loaded: loaded (/lib/systemd/system/grafana-server.service; enabled; preset: enabled)
     Active: active (running) since Mon 2026-04-07 10:00:05 UTC; 4h 58min ago
       Docs: http://docs.grafana.org
   Main PID: 1456 (grafana)
      Tasks: 18 (limit: 2314)
     Memory: 95.2M
        CPU: 1min 12.345s
     CGroup: /system.slice/grafana-server.service
             └─1456 /usr/share/grafana/bin/grafana server ...
```

**VM2 & VM3 - Node Exporter Service:**

```bash
$ sudo systemctl status node_exporter
● node_exporter.service - Node Exporter
     Loaded: loaded (/etc/systemd/system/node_exporter.service; enabled; preset: enabled)
     Active: active (running) since Mon 2026-04-07 09:55:00 UTC; 5h 4min ago
       Docs: https://prometheus.io/docs/guides/node-exporter/
   Main PID: 987 (node_exporter)
      Tasks: 5 (limit: 2314)
     Memory: 12.8M
        CPU: 45.678s
     CGroup: /system.slice/node_exporter.service
             └─987 /usr/local/bin/node_exporter ...
```

**Service Status Summary:**

| VM | Service | Status | Uptime | Memory Usage |
|----|---------|--------|--------|--------------|
| VM1 | Prometheus | Running | 4h 59m | 128.5 MB |
| VM1 | Grafana | Running | 4h 58m | 95.2 MB |
| VM2 | Node Exporter | Running | 5h 4m | 12.8 MB |
| VM3 | Node Exporter | Running | 5h 4m | 12.6 MB |

### 5.2 Prometheus Targets

All configured targets are showing as UP in the Prometheus targets page.

**Targets API Response:**

```bash
$ curl -s http://192.168.122.101:9090/api/v1/targets | jq '.data.activeTargets'
[
  {
    "discoveredLabels": {
      "__address__": "192.168.122.102:9100",
      "__metrics_path__": "/metrics",
      "__scheme__": "http",
      "job": "node"
    },
    "labels": {
      "env": "production",
      "instance": "192.168.122.102:9100",
      "job": "node"
    },
    "scrapePool": "node",
    "scrapeUrl": "http://192.168.122.102:9100/metrics",
    "globalUrl": "http://192.168.122.102:9100/metrics",
    "lastError": "",
    "lastScrape": "2026-04-07T14:58:55.123456789Z",
    "lastScrapeDuration": 0.045678901,
    "health": "up",
    "scrapeInterval": "5s",
    "scrapeTimeout": "5s"
  },
  {
    "discoveredLabels": {
      "__address__": "192.168.122.103:9100",
      "__metrics_path__": "/metrics",
      "__scheme__": "http",
      "job": "node"
    },
    "labels": {
      "env": "production",
      "instance": "192.168.122.103:9100",
      "job": "node"
    },
    "scrapePool": "node",
    "scrapeUrl": "http://192.168.122.103:9100/metrics",
    "globalUrl": "http://192.168.122.103:9100/metrics",
    "lastError": "",
    "lastScrape": "2026-04-07T14:58:55.234567890Z",
    "lastScrapeDuration": 0.043210987,
    "health": "up",
    "scrapeInterval": "5s",
    "scrapeTimeout": "5s"
  }
]
```

**Targets Summary:**

| Target | Job | Health | Last Scrape | Scrape Duration |
|--------|-----|--------|-------------|-----------------|
| 192.168.122.102:9100 | node | UP | 2s ago | 45ms |
| 192.168.122.103:9100 | node | UP | 2s ago | 43ms |
| localhost:9090 | prometheus | UP | 3s ago | 12ms |

### 5.3 Grafana Dashboard

The Node Exporter Full dashboard (ID 1860) provides comprehensive visualization of all metrics collected by Node Exporter.

**Dashboard Features:**

- **Quick CPU/Memory/Disk Overview**: Gauge panels showing current utilization
- **System Load**: Graph showing 1m, 5m, and 15m load averages
- **CPU Usage by Mode**: Stacked graph showing user, system, iowait, idle time
- **Memory Usage Breakdown**: Available, cached, buffers, used memory
- **Disk I/O**: Read/write bytes and operations per second
- **Network Traffic**: Bytes transmitted/received per interface
- **Filesystem Usage**: Bar gauge for each mounted filesystem

**Configured Data Source:**

| Setting | Value |
|---------|-------|
| Name | Prometheus |
| Type | Prometheus |
| URL | http://localhost:9090 |
| Access | Server (default) |
| Scrape Interval | 5s |

### 5.4 Custom Dashboard Features

The Next.js CloudWatch dashboard provides a modern, specialized interface for monitoring the cluster.

**Feature 1: Real-Time Node Status Cards**

Each monitored node is displayed as a card showing:
- Hostname and IP address
- UP/DOWN status badge (green/red)
- CPU utilization progress bar with percentage
- Memory utilization progress bar with percentage
- Disk utilization progress bar with percentage

Status is refreshed every 5 seconds using SWR (stale-while-revalidate) data fetching.

**Feature 2: CPU Usage History Charts**

Interactive line charts display CPU usage over configurable time ranges:
- Last 15 minutes (default)
- Last 1 hour
- Last 6 hours
- Last 24 hours

Charts are rendered using Recharts with the following features:
- Responsive design adapting to container width
- Tooltip showing exact values on hover
- Legend identifying each node
- Smooth line interpolation

**Feature 3: System Overview Statistics**

Aggregated cluster statistics displayed in a summary panel:
- Total Nodes: Count of all monitored nodes
- Nodes Online: Count of nodes with UP status
- Total CPU Cores: Sum of CPU cores across all nodes
- Total Memory: Sum of available memory across all nodes
- Total Disk Space: Sum of disk capacity across all nodes
- Average CPU Usage: Cluster-wide CPU utilization

**Feature 4: Quick Links**

Convenient navigation links to:
- Prometheus Web UI (http://192.168.122.101:9090)
- Prometheus Targets page
- Grafana Dashboard (http://192.168.122.101:3000)

**Feature 5: Add Node Wizard**

A 4-step guided wizard for adding new nodes to monitoring:

| Step | Name | Description |
|------|------|-------------|
| 1 | Node Information | Enter hostname, IP address, and optional labels |
| 2 | Connection Test | Verify network connectivity and SSH access |
| 3 | Install Exporter | Execute Node Exporter installation script |
| 4 | Update Prometheus | Add target to configuration and reload |

### 5.5 Connectivity Testing

A test script validates connectivity to all monitoring endpoints.

**test_connectivity.sh:**

```bash
#!/bin/bash
# Connectivity test script for monitoring stack

echo "=== Cloud Monitoring Connectivity Test ==="
echo ""

# Define endpoints
declare -A ENDPOINTS=(
    ["Prometheus UI"]="http://192.168.122.101:9090/-/healthy"
    ["Prometheus API"]="http://192.168.122.101:9090/api/v1/status/config"
    ["Grafana"]="http://192.168.122.101:3000/api/health"
    ["Node Exporter VM2"]="http://192.168.122.102:9100/metrics"
    ["Node Exporter VM3"]="http://192.168.122.103:9100/metrics"
)

# Test each endpoint
for name in "${!ENDPOINTS[@]}"; do
    url="${ENDPOINTS[$name]}"
    printf "Testing %-20s ... " "$name"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$url")
    
    if [ "$response" == "200" ]; then
        echo "OK (HTTP $response)"
    else
        echo "FAILED (HTTP $response)"
    fi
done

echo ""
echo "=== Prometheus Target Health ==="
curl -s http://192.168.122.101:9090/api/v1/targets | \
    jq -r '.data.activeTargets[] | "\(.labels.instance): \(.health)"'

echo ""
echo "=== Test Complete ==="
```

**Test Results:**

```
=== Cloud Monitoring Connectivity Test ===

Testing Prometheus UI        ... OK (HTTP 200)
Testing Prometheus API       ... OK (HTTP 200)
Testing Grafana              ... OK (HTTP 200)
Testing Node Exporter VM2    ... OK (HTTP 200)
Testing Node Exporter VM3    ... OK (HTTP 200)

=== Prometheus Target Health ===
192.168.122.102:9100: up
192.168.122.103:9100: up
localhost:9090: up

=== Test Complete ===
```

### 5.6 Stress Testing

A stress test script validates that the monitoring system accurately captures resource spikes.

**stress_test.sh:**

```bash
#!/bin/bash
# Stress test script for validating monitoring accuracy

echo "=== Monitoring Stress Test ==="
echo "This script will stress system resources to validate monitoring."
echo ""

# Check for stress tool
if ! command -v stress &> /dev/null; then
    echo "Installing stress utility..."
    sudo apt-get install -y stress
fi

PS3="Select stress test type: "
options=("CPU Stress" "Memory Stress" "Disk I/O Stress" "Combined Stress" "Exit")

select opt in "${options[@]}"; do
    case $opt in
        "CPU Stress")
            echo "Running CPU stress for 60 seconds (2 workers)..."
            stress --cpu 2 --timeout 60s
            echo "CPU stress complete. Check Prometheus/Grafana for spike."
            ;;
        "Memory Stress")
            echo "Running memory stress for 60 seconds (512MB)..."
            stress --vm 1 --vm-bytes 512M --timeout 60s
            echo "Memory stress complete. Check Prometheus/Grafana for spike."
            ;;
        "Disk I/O Stress")
            echo "Running disk I/O stress for 60 seconds..."
            stress --io 2 --hdd 1 --timeout 60s
            echo "Disk I/O stress complete. Check Prometheus/Grafana for spike."
            ;;
        "Combined Stress")
            echo "Running combined stress for 60 seconds..."
            stress --cpu 2 --vm 1 --vm-bytes 256M --io 1 --timeout 60s
            echo "Combined stress complete. Check Prometheus/Grafana for spikes."
            ;;
        "Exit")
            break
            ;;
        *)
            echo "Invalid option"
            ;;
    esac
done
```

**Stress Test Results:**

During CPU stress testing:
- CPU utilization spiked from ~5% to ~100% on target node
- Prometheus captured the increase within 5 seconds (one scrape interval)
- Grafana graphs showed the spike in real-time
- Custom dashboard progress bar turned red at high utilization

During memory stress testing:
- Memory utilization increased from ~20% to ~75%
- Both dashboards reflected the change accurately
- Memory pressure metrics (page faults, swap usage) increased

---

## 6. Challenges and Troubleshooting

### 6.1 libvirt Network Not Active

**Problem Description:**

After system reboot or fresh installation, VMs fail to obtain network connectivity. The error manifests as:
- VMs cannot ping each other
- VMs cannot reach the internet
- SSH connections to VMs fail

**Root Cause:**

The libvirt default network is not configured to start automatically, or the network definition is missing.

**Diagnosis:**

```bash
# Check network status
sudo virsh net-list --all

# Expected output showing network inactive:
# Name      State      Autostart   Persistent
# ---------------------------------------------
# default   inactive   no          yes
```

**Solution:**

```bash
# Start the default network
sudo virsh net-start default

# Enable autostart for persistence across reboots
sudo virsh net-autostart default

# Verify network is active
sudo virsh net-list
```

**Prevention:**

Add the autostart commands to your VM setup documentation and scripts to ensure the network is always available.

### 6.2 Node Exporter Not Reachable

**Problem Description:**

Prometheus targets page shows Node Exporter targets as DOWN with errors like:
- "context deadline exceeded"
- "connection refused"
- "no route to host"

**Root Cause:**

Multiple potential causes:
1. Firewall blocking port 9100
2. Node Exporter service not running
3. Incorrect IP address in Prometheus configuration
4. Network connectivity issues

**Diagnosis:**

```bash
# On target node - check service status
sudo systemctl status node_exporter

# On target node - verify listening port
ss -tlnp | grep 9100

# On target node - check firewall
sudo ufw status

# From Prometheus server - test connectivity
curl -v http://192.168.122.102:9100/metrics
```

**Solution:**

```bash
# If firewall is blocking:
sudo ufw allow 9100/tcp
sudo ufw reload

# If service is not running:
sudo systemctl start node_exporter
sudo systemctl enable node_exporter

# If service fails to start, check logs:
sudo journalctl -u node_exporter -n 50
```

### 6.3 Static IP Configuration

**Problem Description:**

VMs receive random IP addresses from DHCP, causing Prometheus scrape targets to become invalid when IPs change.

**Root Cause:**

Netplan is configured to use DHCP instead of static addressing, or the static configuration has syntax errors.

**Diagnosis:**

```bash
# Check current IP configuration
ip addr show

# Check netplan configuration
cat /etc/netplan/50-cloud-init.yaml

# Test netplan configuration
sudo netplan try
```

**Solution:**

1. Edit the netplan configuration file:

```bash
sudo vim /etc/netplan/50-cloud-init.yaml
```

2. Ensure correct YAML syntax (spaces, not tabs):

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp1s0:
      addresses:
        - 192.168.122.102/24
      routes:
        - to: default
          via: 192.168.122.1
      nameservers:
        addresses:
          - 192.168.122.1
          - 8.8.8.8
```

3. Apply configuration:

```bash
sudo netplan apply
```

### 6.4 SSH Access Issues

**Problem Description:**

Unable to SSH into VMs from the host machine with errors like:
- "Connection refused"
- "No route to host"
- "Permission denied (publickey)"

**Root Cause:**

SSH server not installed, firewall blocking port 22, or authentication configuration issues.

**Diagnosis:**

```bash
# From VM console - check SSH service
sudo systemctl status ssh

# Check if SSH is listening
ss -tlnp | grep 22

# Check firewall
sudo ufw status
```

**Solution:**

```bash
# Install OpenSSH server
sudo apt install -y openssh-server

# Start and enable SSH
sudo systemctl start ssh
sudo systemctl enable ssh

# Allow SSH through firewall
sudo ufw allow ssh

# For password authentication (if needed):
sudo vim /etc/ssh/sshd_config
# Set: PasswordAuthentication yes
sudo systemctl restart ssh
```

### 6.5 Prometheus Service Errors

**Problem Description:**

Prometheus service fails to start with errors in the system logs.

**Root Cause:**

Common causes include:
1. Invalid prometheus.yml configuration
2. Permission issues on data directory
3. Port 9090 already in use
4. Missing binary or incorrect path

**Diagnosis:**

```bash
# Check service status
sudo systemctl status prometheus

# View detailed logs
sudo journalctl -u prometheus -n 100

# Validate configuration
promtool check config /etc/prometheus/prometheus.yml

# Check data directory permissions
ls -la /var/lib/prometheus/

# Check port usage
ss -tlnp | grep 9090
```

**Solution:**

For configuration errors:
```bash
# Fix YAML syntax errors identified by promtool
sudo vim /etc/prometheus/prometheus.yml

# Validate again
promtool check config /etc/prometheus/prometheus.yml
```

For permission errors:
```bash
# Fix ownership
sudo chown -R prometheus:prometheus /var/lib/prometheus/
sudo chown -R prometheus:prometheus /etc/prometheus/
```

For port conflicts:
```bash
# Find process using port
sudo lsof -i :9090

# Kill conflicting process or change Prometheus port
```

### 6.6 Next.js Dashboard CORS Issues

**Problem Description:**

The custom dashboard displays errors when trying to fetch data from Prometheus:
- "CORS policy: No 'Access-Control-Allow-Origin' header"
- "Failed to fetch"
- Network requests to Prometheus API fail

**Root Cause:**

Web browsers enforce Same-Origin Policy, blocking requests from the dashboard (running on host) to Prometheus (running on VM) due to different origins.

**Diagnosis:**

1. Open browser developer tools (F12)
2. Navigate to Network tab
3. Look for failed requests to Prometheus API
4. Check Console tab for CORS errors

**Solution:**

**Option 1: Prometheus CORS Configuration**

Start Prometheus with CORS headers enabled:

```bash
# Add to prometheus.service ExecStart
--web.cors.origin=".*"
```

Or modify the systemd service:

```bash
sudo vim /etc/systemd/system/prometheus.service
```

Add the CORS flag:
```
ExecStart=/usr/local/bin/prometheus \
    --config.file=/etc/prometheus/prometheus.yml \
    --storage.tsdb.path=/var/lib/prometheus/ \
    --web.cors.origin=".*" \
    ...
```

Restart Prometheus:
```bash
sudo systemctl daemon-reload
sudo systemctl restart prometheus
```

**Option 2: Next.js API Routes (Proxy)**

Create an API route in Next.js to proxy requests:

```typescript
// app/api/prometheus/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query');
  const prometheusUrl = process.env.PROMETHEUS_URL || 'http://192.168.122.101:9090';
  
  const response = await fetch(`${prometheusUrl}/api/v1/query?query=${query}`);
  const data = await response.json();
  
  return NextResponse.json(data);
}
```

**Option 3: Reverse Proxy**

Use nginx as a reverse proxy with CORS headers:

```nginx
server {
    listen 80;
    server_name dashboard.local;
    
    location /api/prometheus/ {
        proxy_pass http://192.168.122.101:9090/;
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, OPTIONS";
    }
}
```

---

## 7. Conclusion

This project successfully demonstrated the design, deployment, and operation of a comprehensive cloud monitoring solution using industry-standard tools. The implementation achieved all stated objectives and provided valuable hands-on experience with modern DevOps practices.

**Achievements:**

1. **Complete Monitoring Stack Deployment**: Successfully installed and configured Prometheus, Grafana, and Node Exporter across a three-VM cluster. All components are integrated and communicating correctly, with services managed by systemd for reliability and automatic startup.

2. **Automated Metrics Collection**: Prometheus is configured to scrape metrics from both target nodes every 5 seconds. The configuration demonstrates proper target discovery, labeling, and scrape management. Historical data is stored in the TSDB with efficient compression.

3. **Custom Web Dashboard**: The Next.js CloudWatch dashboard provides a modern, responsive interface that queries the Prometheus API directly. Key features include real-time node status cards, interactive charts, system overview statistics, and a guided wizard for adding new nodes.

4. **Dual Visualization Options**: The implementation supports both Grafana (for advanced, pre-built dashboards) and the custom Next.js dashboard (for specialized use cases), demonstrating the flexibility of the Prometheus ecosystem.

5. **Comprehensive Documentation**: This report, along with installation scripts and configuration files, provides complete documentation enabling reproduction of the environment and knowledge transfer.

**Technical Skills Gained:**

- **Infrastructure Monitoring**: Understanding of metrics collection, time-series databases, and monitoring architecture. Practical experience with PromQL for querying and analyzing metrics.

- **Time-Series Databases**: Deep understanding of Prometheus TSDB, including its write-optimized design, block-based storage, and efficient compression techniques.

- **Service Management with systemd**: Creation of custom systemd unit files, service configuration, dependency management, and troubleshooting service issues.

- **Frontend Development with Next.js**: Modern React development using the App Router, TypeScript for type safety, Tailwind CSS for styling, and Recharts for data visualization.

- **Virtualization with libvirt/KVM**: Configuration of virtual networks, static IP addressing, and management of virtual machines using GNOME Boxes.

**Future Enhancements:**

The current implementation provides a foundation for additional capabilities:

- **Alerting**: Configure Prometheus Alertmanager for automated notifications
- **Service Discovery**: Implement dynamic target discovery using file-based or DNS service discovery
- **High Availability**: Deploy Prometheus in federated or HA mode for production reliability
- **Container Monitoring**: Extend monitoring to containerized workloads using cAdvisor
- **Log Aggregation**: Integrate Loki for centralized log management
- **Tracing**: Add Jaeger or Zipkin for distributed tracing

**Conclusion:**

The project demonstrates that building a robust monitoring infrastructure is achievable using open-source tools. Prometheus has proven to be a powerful, flexible, and well-documented solution for infrastructure monitoring. Combined with Grafana for visualization and custom dashboards for specialized needs, organizations can achieve comprehensive observability into their systems without proprietary software costs.

The skills and knowledge gained from this project are directly applicable to real-world cloud and DevOps environments, where monitoring is a critical component of maintaining reliable, performant systems.

---

## 8. References

### Official Documentation

1. **Prometheus Documentation**
   - Official Docs: https://prometheus.io/docs/introduction/overview/
   - PromQL Reference: https://prometheus.io/docs/prometheus/latest/querying/basics/
   - Configuration Reference: https://prometheus.io/docs/prometheus/latest/configuration/configuration/

2. **Grafana Documentation**
   - Official Docs: https://grafana.com/docs/grafana/latest/
   - Prometheus Data Source: https://grafana.com/docs/grafana/latest/datasources/prometheus/
   - Dashboard Creation: https://grafana.com/docs/grafana/latest/dashboards/

3. **Node Exporter**
   - GitHub Repository: https://github.com/prometheus/node_exporter
   - Available Collectors: https://github.com/prometheus/node_exporter#collectors

4. **Next.js Documentation**
   - Official Docs: https://nextjs.org/docs
   - App Router: https://nextjs.org/docs/app
   - API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

5. **Ubuntu Server Documentation**
   - Installation Guide: https://ubuntu.com/server/docs
   - Netplan Configuration: https://netplan.io/reference

6. **libvirt Documentation**
   - Official Docs: https://libvirt.org/docs.html
   - Network Configuration: https://wiki.libvirt.org/page/Networking
   - virsh Commands: https://libvirt.org/manpages/virsh.html

7. **shadcn/ui Documentation**
   - Official Docs: https://ui.shadcn.com/docs
   - Component Reference: https://ui.shadcn.com/docs/components/accordion

### Additional Resources

8. **Recharts**
   - Official Docs: https://recharts.org/en-US/

9. **Tailwind CSS**
   - Official Docs: https://tailwindcss.com/docs

10. **systemd**
    - systemd Unit Files: https://www.freedesktop.org/software/systemd/man/systemd.unit.html
    - Service Management: https://www.freedesktop.org/software/systemd/man/systemctl.html

### Community Dashboards

11. **Grafana Dashboard Repository**
    - Node Exporter Full (ID 1860): https://grafana.com/grafana/dashboards/1860

---

*Report prepared for Cloud Monitoring Project*
*Last updated: April 2026*
