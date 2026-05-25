import { useState } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Users, MapPin, FileWarning, Calendar,
  Clock, Bell, Settings, Shield, FileText, ChevronLeft,
  ChevronRight, LogOut, ShieldCheck, UserCog
} from "lucide-react";
import authService from "@/services/authService";
import logo from "@/assets/logo.png";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { path: "/dashboard/guards", label: "Guard Management", icon: Users, permission: "guard" },
  { path: "/dashboard/managers", label: "Manager Management", icon: UserCog, permission: "manager" },
  { path: "/dashboard/sites", label: "Site Management", icon: MapPin, permission: "site" },
  { path: "/dashboard/incidents", label: "Incidents", icon: FileWarning, permission: "incident" },
  { path: "/dashboard/scheduling", label: "Scheduling", icon: Calendar, permission: "scheduling" },
  { path: "/dashboard/compliance", label: "Compliance", icon: ShieldCheck, permission: "compliance" },
  { path: "/dashboard/hours", label: "Hours & Attendance", icon: Clock, permission: "hour" },
  { path: "/dashboard/reports", label: "Reports & Export", icon: FileText, permission: "report" },
  { path: "/dashboard/notifications", label: "Notifications", icon: Bell, permission: "notification" },
  { path: "/dashboard/roles", label: "Roles & Permissions", icon: Shield, permission: "role" },
  { path: "/dashboard/settings", label: "Settings", icon: Settings, permission: "setting" },
];

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const navigate = useNavigate();

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const permissions = user?.permissions || [];

  const filteredNavItems = navItems.filter((item) => {
    if (user?.role === "admin") return true;
    return (
      permissions.includes(item.permission) ||
      permissions.includes(`view_${item.permission}`)
    );
  });

  const handleLogout = async () => {
    await authService.logout();
    localStorage.removeItem("securepro_auth");
    navigate("/");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={`relative flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ${collapsed ? "w-[72px]" : "w-64"
          }`}
      >
        {/* Logo */}
        {/* Header */}
        {/* Floating Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-5 -right-3 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 focus:outline-none"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        <div className="border-b border-sidebar-border shrink-0">
          {/* Logo + Title + Toggle beside text */}
          <div
            className={`flex items-center h-16 ${collapsed ? "justify-center px-2" : "px-4"
              }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center bg-white rounded-lg p-1.5 w-10 h-10 shrink-0 shadow-sm border border-sidebar-border/30">
                <img
                  src={logo}
                  alt="SecurePro Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-sidebar-foreground tracking-wide truncate">
                    Ram Investigative
                  </span>
                  <span className="text-sm font-bold text-sidebar-foreground tracking-wide truncate">
                    Group Inc.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                } ${collapsed ? "justify-center" : ""}`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="px-2 py-3 border-t border-sidebar-border space-y-1">
          <button
            onClick={() => setShowLogoutDialog(true)}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ${collapsed ? "justify-center" : ""
              }`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>

        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              This will end your current session and you will need to sign in again to access the dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DashboardLayout;
