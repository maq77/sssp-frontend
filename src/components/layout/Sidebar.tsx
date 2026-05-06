import { useMemo, memo } from "react";
import type { ElementType } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useSecurityStore } from "@/store/securityStore";
import { UserRole } from "@/types";
import {
  LayoutDashboard, Camera, MapPinned, AlertTriangle, Users,
  Settings, Shield, Siren, Wind, ShieldAlert, Activity, Map,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Nav definition ────────────────────────────────────────────────────────────
interface NavItem {
  label:    string;
  path:     string;
  icon:     ElementType;
  roles:    UserRole[];
  badge?:   () => number | null;
  section?: string;
}

const NAV_SECTIONS: { key: string; label: string; roles: UserRole[] }[] = [
  { key: "monitoring",  label: "MONITORING",   roles: [UserRole.Admin, UserRole.Operator] },
  { key: "cameras",    label: "CAMERAS",       roles: [UserRole.Admin, UserRole.Operator] },
  { key: "security",   label: "SECURITY OPS",  roles: [UserRole.Admin, UserRole.Operator] },
  { key: "environment",label: "ENVIRONMENT",   roles: [UserRole.Admin, UserRole.Operator] },
  { key: "system",     label: "SYSTEM",        roles: [UserRole.Admin, UserRole.Operator, UserRole.User] },
];

const NAV_ITEMS: NavItem[] = [
  // Monitoring
  { label: "Dashboard",  path: "/dashboard", icon: LayoutDashboard, roles: [UserRole.Operator, UserRole.Admin], section: "monitoring" },
  { label: "Admin",      path: "/admin",     icon: Shield,          roles: [UserRole.Admin],                   section: "monitoring" },
  { label: "SOC",        path: "/soc",       icon: Activity,        roles: [UserRole.Operator, UserRole.Admin], section: "monitoring" },
  { label: "Map",        path: "/map",       icon: Map,             roles: [UserRole.Operator, UserRole.Admin], section: "monitoring" },

  // Cameras
  { label: "Cameras",  path: "/cameras", icon: Camera,   roles: [UserRole.Operator, UserRole.Admin], section: "cameras" },
  { label: "Zones",    path: "/zones",   icon: MapPinned,roles: [UserRole.Operator, UserRole.Admin], section: "cameras" },

  // Security Ops
  { label: "Alerts",    path: "/alerts",    icon: Siren,        roles: [UserRole.Operator, UserRole.Admin], section: "security" },
  { label: "Incidents", path: "/incidents", icon: AlertTriangle, roles: [UserRole.Operator, UserRole.Admin], section: "security" },
  { label: "Watchlist", path: "/watchlist", icon: ShieldAlert,  roles: [UserRole.Operator, UserRole.Admin], section: "security" },

  // Environment
  { label: "Environment", path: "/environment", icon: Wind, roles: [UserRole.Operator, UserRole.Admin], section: "environment" },

  // System
  { label: "Users",    path: "/users",    icon: Users,    roles: [UserRole.Operator, UserRole.Admin], section: "system" },
  { label: "Settings", path: "/settings", icon: Settings, roles: [UserRole.Admin, UserRole.Operator, UserRole.User], section: "system" },

  // User-only
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: [UserRole.User], section: "monitoring" },
];

function isActive(currentPath: string, itemPath: string) {
  return currentPath === itemPath || currentPath === `/app${itemPath}` || currentPath.startsWith(`/app${itemPath}/`);
}

// ── Workspace header ──────────────────────────────────────────────────────────
const WorkspaceHeader = memo(({ collapsed }: { collapsed: boolean }) => (
  <div className="px-3 pt-3 pb-2">
    <div className="rounded-xl border border-border/50 bg-surface-1 px-3 py-2.5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-bold text-sm leading-tight truncate">SSSP</div>
            <div className="text-[10px] text-muted-foreground truncate">Security Platform</div>
          </div>
        )}
      </div>
    </div>
  </div>
));
WorkspaceHeader.displayName = "WorkspaceHeader";

// ── User card ─────────────────────────────────────────────────────────────────
const UserCard = memo(({ collapsed, user }: { collapsed: boolean; user: any }) => (
  <div className="p-3 border-t border-border/40">
    <div className="rounded-xl border border-border/50 bg-surface-1 p-2.5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {(user?.fullName?.charAt(0) || "U").toUpperCase()}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-semibold text-xs truncate">{user?.fullName || "User"}</div>
            <div className="text-[10px] text-muted-foreground capitalize">
              {user?.role === UserRole.Admin ? "Administrator" : user?.role === UserRole.Operator ? "Operator" : "User"}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
));
UserCard.displayName = "UserCard";

// ── Nav item ──────────────────────────────────────────────────────────────────
const SidebarNavItem = memo(({
  item, active, collapsed, onNavigate, badge,
}: {
  item: NavItem; active: boolean; collapsed: boolean; onNavigate?: () => void; badge?: number | null;
}) => (
  <NavLink
    to={item.path}
    onClick={onNavigate}
    className={cn(
      "group relative flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-150",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
      active
        ? "bg-primary/15 text-primary border border-primary/20 shadow-sm"
        : "text-muted-foreground hover:text-foreground hover:bg-surface-3"
    )}
    aria-current={active ? "page" : undefined}
    title={collapsed ? item.label : undefined}
  >
    <item.icon className={cn("w-4 h-4 shrink-0 transition-colors", active ? "text-primary" : "group-hover:text-foreground")} />

    {!collapsed && (
      <span className="text-sm font-medium truncate flex-1">{item.label}</span>
    )}

    {/* Badge */}
    {!collapsed && badge != null && badge > 0 && (
      <span className="min-w-[18px] h-[18px] rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 flex items-center justify-center border border-red-500/30">
        {badge > 99 ? "99+" : badge}
      </span>
    )}

    {active && (
      <motion.div
        layoutId="sidebar-active-dot"
        className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    )}
  </NavLink>
));
SidebarNavItem.displayName = "SidebarNavItem";

// ── Sidebar ───────────────────────────────────────────────────────────────────
export const Sidebar = memo(({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) => {
  const user     = useAuthStore(s => s.user);
  const storm    = useSecurityStore(s => s.storm);
  const location = useLocation();

  const visibleItems = useMemo(() => {
    if (!user) return [];
    return NAV_ITEMS.filter(item => item.roles.includes(user.role));
  }, [user]);

  const visibleSections = useMemo(() => {
    if (!user) return [];
    return NAV_SECTIONS.filter(s => s.roles.includes(user.role));
  }, [user]);

  if (!user) return null;

  return (
    <div className="h-full w-full border-r border-border/40 bg-card/80 supports-[backdrop-filter]:bg-card/60 supports-[backdrop-filter]:backdrop-blur-xl flex flex-col overflow-hidden">
      <WorkspaceHeader collapsed={collapsed} />

      {/* Storm mode banner */}
      {storm && !collapsed && (
        <div className="mx-3 mb-2 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/25 text-red-400 text-[10px] font-bold uppercase tracking-wider text-center animate-threat-pulse">
          Storm Mode Active
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-none px-2 py-1">
        {visibleSections.map(section => {
          const sectionItems = visibleItems.filter(i => i.section === section.key && i.roles.includes(user.role));
          if (sectionItems.length === 0) return null;
          return (
            <div key={section.key} className="mb-3">
              {!collapsed && (
                <div className="px-3 py-1.5 text-[9px] font-bold tracking-widest text-muted-foreground/50 uppercase select-none">
                  {section.label}
                </div>
              )}
              <div className="space-y-0.5">
                {sectionItems.map(item => (
                  <SidebarNavItem
                    key={item.path}
                    item={item}
                    active={isActive(location.pathname, item.path)}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                    badge={item.badge ? item.badge() : null}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* User-only items (no section label) */}
        {user.role === UserRole.User && (
          <div className="space-y-0.5">
            {visibleItems.map(item => (
              <SidebarNavItem
                key={item.path}
                item={item}
                active={isActive(location.pathname, item.path)}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </nav>

      <UserCard collapsed={collapsed} user={user} />
    </div>
  );
});

Sidebar.displayName = "Sidebar";
