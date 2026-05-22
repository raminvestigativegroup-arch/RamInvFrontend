import { useState } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Users, MapPin, FileWarning, Calendar,
  Clock, Bell, Settings, Shield, FileText, ChevronLeft,
  ChevronRight, LogOut, ShieldCheck, UserCog
} from "lucide-react";
import authService from "@/services/authService";
import logo from "@/assets/logo.png";

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
  const navigate = useNavigate();

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const permissions = user?.permissions || [];

  const filteredNavItems = navItems.filter((item) => {
    if (user?.role === "admin") return true;
    return permissions.includes(item.permission);
  });

  const handleLogout = async () => {
    await authService.logout();
    localStorage.removeItem("securepro_auth");
    navigate("/");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ${collapsed ? "w-[72px]" : "w-64"
          }`}
      >
        {/* Logo */}
        {/* Header */}
        <div className="border-b border-sidebar-border shrink-0">
          {/* Logo + Title + Toggle beside text */}
          <div
            className={`flex items-center h-16 px-4 ${collapsed ? "justify-center" : "justify-between"
              }`}
          >
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="SecurePro Logo"
                className="w-18 h-11 object-cover shrink-0"
              />
              {!collapsed && (
                <div className="flex items-center gap-5">
                  <span className="text-lg font-bold text-xs text-sidebar-primary-foreground">
                    Ram Investigative Group
                  </span>
                </div>
              )}
            </div>

            {!collapsed && (
              <div className="flex items-center">
                {/* Button next to text when sidebar open */}
                <button
                  onClick={() => setCollapsed(true)}
                  className="p-1.5 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Button below logo when sidebar collapsed */}
          {collapsed && (
            <div className="p-2 pt-0 flex justify-center">
              <button
                onClick={() => setCollapsed(false)}
                className="flex items-center justify-center w-10 h-10 rounded-lg text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
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
            onClick={handleLogout}
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
    </div>
  );
};

export default DashboardLayout;
