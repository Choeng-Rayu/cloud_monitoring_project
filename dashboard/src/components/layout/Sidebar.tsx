"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Server, 
  Plus, 
  Settings, 
  Bell,
  Activity,
  BarChart3,
  Cloud,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Nodes", href: "/nodes", icon: Server },
  { name: "Add Node", href: "/nodes/add", icon: Plus },
  { name: "Metrics", href: "/metrics", icon: BarChart3 },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Logs", href: "/logs", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-800 bg-zinc-950">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-zinc-800 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
            <Cloud className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">CloudWatch</h1>
            <p className="text-xs text-zinc-500">Monitoring System</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-cyan-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Status */}
        <div className="border-t border-zinc-800 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-zinc-900 p-3">
            <div className="relative">
              <Activity className="h-5 w-5 text-emerald-400" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-200">System Status</p>
              <p className="text-xs text-emerald-400">All systems operational</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
