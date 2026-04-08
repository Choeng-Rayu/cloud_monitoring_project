import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { logActivity } from "@/lib/activityLogger";

const SETTINGS_FILE = path.join(process.cwd(), "data", "settings.json");

interface Settings {
  prometheus: {
    url: string;
    scrapeInterval: string;
  };
  grafana: {
    url: string;
  };
  notifications: {
    email: boolean;
    slack: boolean;
    browser: boolean;
  };
  thresholds: {
    cpu: number;
    memory: number;
    disk: number;
  };
  updatedAt: string;
}

const defaultSettings: Settings = {
  prometheus: {
    url: "http://192.168.122.101:9090",
    scrapeInterval: "5s",
  },
  grafana: {
    url: "http://192.168.122.101:3000",
  },
  notifications: {
    email: false,
    slack: false,
    browser: true,
  },
  thresholds: {
    cpu: 80,
    memory: 85,
    disk: 90,
  },
  updatedAt: new Date().toISOString(),
};

async function loadSettings(): Promise<Settings> {
  try {
    const data = await fs.readFile(SETTINGS_FILE, "utf-8");
    return { ...defaultSettings, ...JSON.parse(data) };
  } catch {
    return defaultSettings;
  }
}

async function saveSettings(settings: Settings): Promise<void> {
  await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

export async function GET() {
  try {
    const settings = await loadSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to load settings:", error);
    return NextResponse.json(defaultSettings);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const currentSettings = await loadSettings();
    
    const newSettings: Settings = {
      ...currentSettings,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    await saveSettings(newSettings);

    // Determine what changed for the log
    const changedFields: string[] = [];
    if (JSON.stringify(currentSettings.prometheus) !== JSON.stringify(newSettings.prometheus)) {
      changedFields.push("prometheus");
    }
    if (JSON.stringify(currentSettings.grafana) !== JSON.stringify(newSettings.grafana)) {
      changedFields.push("grafana");
    }
    if (JSON.stringify(currentSettings.notifications) !== JSON.stringify(newSettings.notifications)) {
      changedFields.push("notifications");
    }
    if (JSON.stringify(currentSettings.thresholds) !== JSON.stringify(newSettings.thresholds)) {
      changedFields.push("thresholds");
    }

    await logActivity({
      type: "settings",
      action: "settings_saved",
      details: `Settings saved successfully${changedFields.length > 0 ? ` (changed: ${changedFields.join(", ")})` : ""}`,
      status: "success",
      metadata: { changedFields, thresholds: newSettings.thresholds },
    });

    return NextResponse.json({ success: true, settings: newSettings });
  } catch (error) {
    console.error("Failed to save settings:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await logActivity({
      type: "error",
      action: "settings_save_failed",
      details: `Failed to save settings: ${errorMessage}`,
      status: "error",
      metadata: { error: errorMessage },
    });
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
