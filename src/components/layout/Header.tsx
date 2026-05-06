import { useEffect, useRef, useState, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import {
  ShieldCheck,
  Bell,
  Search,
  Menu,
  User,
  Settings,
  LogOut,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useMediaQuery } from "./useMediaQuery";

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  onToggleDesktopCollapse: () => void;
  isDesktopCollapsed: boolean;
}

// Memoized logo section
const LogoSection = memo(() => (
  <motion.div
    className="flex items-center gap-3 min-w-0"
    initial={{ opacity: 0, x: -12 }}
    animate={{ opacity: 1, x: 0 }}
  >
    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
      <ShieldCheck className="w-6 h-6 text-white" />
    </div>

    <div className="min-w-0 hidden sm:block">
      <h1 className="text-lg font-bold leading-tight gradient-text truncate">
        SSSP
      </h1>
      <p className="text-xs text-muted-foreground truncate">
        Smart Security Platform
      </p>
    </div>
  </motion.div>
));
LogoSection.displayName = "LogoSection";

// Memoized system status
const SystemStatus = memo(() => (
  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20">
    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
    <span className="text-xs font-medium text-green-400">
      System Active
    </span>
  </div>
));
SystemStatus.displayName = "SystemStatus";

// Memoized user menu dropdown
const UserMenuDropdown = memo(({ 
  user, 
  onLogout 
}: { 
  user: any; 
  onLogout: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: -10, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -10, scale: 0.98 }}
    className="
      absolute right-0 mt-2 w-60
      bg-card
      border border-border
      rounded-2xl shadow-xl overflow-hidden
    "
    role="menu"
  >
    <div className="p-3 border-b border-border">
      <p className="font-medium">{user?.fullName || "User"}</p>
      <p className="text-sm text-muted-foreground truncate">
        {user?.email || ""}
      </p>
    </div>

    <div className="p-2">
      <button
        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-accent/40 transition text-left"
        role="menuitem"
      >
        <User className="w-4 h-4" />
        <span className="text-sm">Profile</span>
      </button>

      <button
        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-accent/40 transition text-left"
        role="menuitem"
      >
        <Settings className="w-4 h-4" />
        <span className="text-sm">Settings</span>
      </button>

      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-destructive/15 text-destructive transition text-left"
        role="menuitem"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-sm">Logout</span>
      </button>
    </div>
  </motion.div>
));
UserMenuDropdown.displayName = "UserMenuDropdown";

export const Header = memo(({
  onOpenMobileSidebar,
  onToggleDesktopCollapse,
  isDesktopCollapsed,
}: HeaderProps) => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState(3);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const handleCloseMenu = useCallback(() => setShowUserMenu(false), []);
  const handleToggleMenu = useCallback(() => setShowUserMenu(v => !v), []);
  const handleClearNotifications = useCallback(() => setNotifications(0), []);

  const handleLogout = useCallback(() => {
    logout();
    setShowUserMenu(false);
  }, [logout]);

  const onMenuClick = useCallback(() => {
    if (isDesktop) onToggleDesktopCollapse();
    else onOpenMobileSidebar();
  }, [isDesktop, onOpenMobileSidebar, onToggleDesktopCollapse]);

  // Close menu on outside click
  useEffect(() => {
    if (!showUserMenu) return;

    const onPointerDown = (e: PointerEvent) => {
      const el = menuRef.current;
      if (el && !el.contains(e.target as Node)) handleCloseMenu();
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showUserMenu, handleCloseMenu]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseMenu();

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        onMenuClick();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onMenuClick, handleCloseMenu]);

  return (
    <header
      className="
        sticky top-0 z-50
        border-b border-border
        bg-card/85
        supports-[backdrop-filter]:bg-card/60 supports-[backdrop-filter]:backdrop-blur-xl
        shadow-[0_1px_0_rgba(255,255,255,0.04)]
      "
    >
      <a
        href="#main-content"
        className="
          sr-only focus:not-sr-only
          absolute left-3 top-3 z-[60]
          rounded-lg bg-background px-3 py-2 text-sm
          border border-border
        "
      >
        Skip to content
      </a>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-xl hover:bg-accent/40 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label={isDesktop ? "Toggle sidebar collapse" : "Open sidebar"}
            >
              {isDesktop ? (
                isDesktopCollapsed ? (
                  <PanelLeftOpen className="w-5 h-5" />
                ) : (
                  <PanelLeftClose className="w-5 h-5" />
                )
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            <LogoSection />
          </div>

          {/* Center - Search */}
          <div className="hidden lg:flex flex-1 max-w-xl justify-center px-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search… (Ctrl/⌘ + K)"
                className="
                  w-full pl-10 pr-14 py-2 rounded-xl
                  bg-background/60 border border-border
                  text-sm
                  outline-none
                  focus:ring-2 focus:ring-primary/40
                  transition
                "
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground border border-border rounded-md px-2 py-1 hidden xl:block">
                Ctrl K
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 shrink-0">
            <SystemStatus />

            <button
              className="relative p-2 rounded-xl hover:bg-accent/40 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label="Notifications"
              onClick={handleClearNotifications}
            >
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold text-white flex items-center justify-center"
                >
                  {notifications}
                </motion.span>
              )}
            </button>

            <div className="relative" ref={menuRef}>
              <button
                onClick={handleToggleMenu}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-accent/40 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
                aria-haspopup="menu"
                aria-expanded={showUserMenu}
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>

                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium leading-tight">
                    {user?.fullName || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground leading-tight">
                    {user?.role ?? "Operator"}
                  </p>
                </div>

                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {showUserMenu && (
                <UserMenuDropdown user={user} onLogout={handleLogout} />
              )}
            </div>
          </div>
        </div>

        {/* Mobile search row */}
        <div className="lg:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search…"
              className="
                w-full pl-10 pr-4 py-2 rounded-xl
                bg-background/60 border border-border
                text-sm
                outline-none
                focus:ring-2 focus:ring-primary/40
              "
            />
          </div>
        </div>
      </div>
    </header>
  );
});