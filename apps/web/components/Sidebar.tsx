"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  Lightbulb,
  FlaskConical,
  Mail,
  FileText,
  Bot,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Portfolio Overview", icon: LayoutDashboard },
  { href: "/companies", label: "Company Deep Dives", icon: Building2 },
  { href: "/benchmarks", label: "Benchmarking", icon: BarChart3 },
  { href: "/insights", label: "Insights Feed", icon: Lightbulb },
  { href: "/workbench", label: "Analytics Workbench", icon: FlaskConical },
  { href: "/email", label: "Email Center", icon: Mail },
  { href: "/reports", label: "Reports Gallery", icon: FileText },
  { href: "/agents", label: "Agent Activity", icon: Bot },
];

interface SidebarProps {
  onClose?: () => void;
  className?: string;
}

export function Sidebar({ onClose, className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-64"
      } flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out shrink-0 relative ${className} lg:flex`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <Image src="/logo.png" alt="Pinnacle AI" width={40} height={40} className="w-full h-full object-contain" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in-up">
              <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight">
                Pinnacle AI
              </h1>
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
                Intelligence Platform
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose?.()}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon
                className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                  isActive
                    ? "text-sidebar-primary"
                    : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                }`}
              />
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary animate-pulse-glow" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors z-10"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        {!collapsed && (
          <div className="text-[10px] text-muted-foreground">
            <p>Pinnacle Equity Group</p>
            <p className="text-primary">10 Portfolio Companies • $1.2B Rev</p>
          </div>
        )}
      </div>
    </aside>
  );
}
