import { useState } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Users, MapPin, FileWarning, Calendar,
  Clock, Bell, Settings, Shield, FileText, ChevronLeft,
  ChevronRight, LogOut, ShieldCheck, UserCog, Briefcase
} from "lucide-react";
import authService from "@/services/authService";
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

  const hasSettingsPermission = user?.role === "admin" || permissions.includes("setting") || permissions.includes("view_setting");
  const canCreateSchedule = user?.role === "admin" || permissions.includes("create_scheduling") || permissions.includes("scheduling");

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
        {/* Floating Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-[22px] -right-3.5 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-sm hover:text-primary hover:bg-secondary transition-all duration-200 focus:outline-none"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        <div className="border-b border-sidebar-border shrink-0">
          {/* Logo + Title */}
          <div className="flex items-center h-[72px] px-5">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex flex-col min-w-0">
                <div className="flex items-baseline text-white">
                  <span className={`font-extrabold tracking-tight leading-none transition-all duration-300 ${collapsed ? "text-[16px]" : "text-[22px]"}`}>
                    RAM
                  </span>
                  <span className={`font-extrabold tracking-tight leading-none transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${collapsed ? "text-[16px] max-w-0 opacity-0 ml-0" : "text-[22px] max-w-[120px] opacity-100 ml-1.5"}`}>
                    Group
                  </span>
                </div>
                <span className={`font-bold text-[#7d85b2] uppercase tracking-wider leading-none transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${collapsed ? "text-[8px] max-h-0 opacity-0 mt-0" : "text-[11px] max-h-5 opacity-100 mt-2"}`}>
                  Investigative Services
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          <div className={`px-3 text-[10px] font-bold tracking-wider text-[#55689e] uppercase select-none transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${collapsed ? "max-h-0 py-0 opacity-0" : "max-h-8 py-2 opacity-100"}`}>
            Navigation
          </div>
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className={`transition-all duration-300 ease-in-out origin-left whitespace-nowrap overflow-hidden ${collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-[200px] opacity-100 ml-1"}`}>
                {item.label}
              </span>
            </NavLink>
          ))}

        </nav>

        {/* Bottom Actions */}
        <div className="px-2 py-3 border-t border-sidebar-border space-y-1">
          {hasSettingsPermission && (
            <NavLink
              to="/dashboard/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`
              }
              title={collapsed ? "Settings" : undefined}
            >
              <Settings className="w-5 h-5 shrink-0" />
              <span className={`transition-all duration-300 ease-in-out origin-left whitespace-nowrap overflow-hidden ${collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-[200px] opacity-100 ml-1"}`}>
                Settings
              </span>
            </NavLink>
          )}
          <button
            onClick={() => setShowLogoutDialog(true)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className={`transition-all duration-300 ease-in-out origin-left whitespace-nowrap overflow-hidden ${collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-[200px] opacity-100 ml-1"}`}>
              Logout
            </span>
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
