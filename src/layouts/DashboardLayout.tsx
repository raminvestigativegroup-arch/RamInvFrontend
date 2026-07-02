import { useState, useEffect } from "react";
import { NavLink, useNavigate, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, MapPin, FileWarning, Calendar,
  Clock, Bell, Settings, Shield, FileText, ChevronLeft,
  ChevronRight, LogOut, ShieldCheck, UserCog, Camera,
} from "lucide-react";
import authService from "@/services/authService";
import logoImg from "@/assets/logo.png";
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
  { path: "/dashboard/guard-photos", label: "Guard Photos", icon: Camera, permission: "guard" },
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
  const { pathname } = useLocation();

  const [user, setUser] = useState(() => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const userStr = localStorage.getItem("user");
      setUser(userStr ? JSON.parse(userStr) : null);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("user-localstorage-changed", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("user-localstorage-changed", handleStorageChange);
    };
  }, []);

  const isCompliant =
    user?.role === "admin" ||
    (user?.securityLicenceUploaded && user?.stateIdUploaded);

  useEffect(() => {
    if (!user) {
      navigate("/", { replace: true });
      return;
    }
    if (user && !isCompliant && pathname !== "/dashboard/compliance") {
      navigate("/dashboard/compliance", { replace: true });
    }
  }, [user, isCompliant, pathname, navigate]);

  const permissions = user?.permissions || [];

  const filteredNavItems = navItems.filter((item) => {
    if (user?.role === "admin") return true;

    // If not compliant, only show Compliance page
    if (!isCompliant) {
      return item.permission === "compliance";
    }

    return (
      permissions.includes(item.permission) ||
      permissions.includes(`view_${item.permission}`)
    );
  });

  const hasSettingsPermission =
    isCompliant && (
      user?.role === "admin" ||
      permissions.includes("setting") ||
      permissions.includes("view_setting")
    );

  const handleLogout = async () => {
    await authService.logout();
    localStorage.removeItem("securepro_auth");
    navigate("/");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={`relative flex flex-col bg-sidebar border-r border-sidebar-border text-sidebar-foreground transition-all duration-300 ${collapsed ? "w-[72px]" : "w-64"
          }`}
      >
        {/* Floating Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-5 -right-3.5 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-primary hover:bg-secondary transition-all duration-200 focus:outline-none"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        {/* Logo Header — centered */}
        <div
          className={`shrink-0 flex flex-col items-center justify-center py-1.5 border-b border-sidebar-border ${collapsed ? "px-0 w-full" : "px-3"}`}
        >
          <img
            src={logoImg}
            alt="RAM Investigative Group Inc."
            className={`object-contain transition-all duration-300 ${collapsed ? "h-9 w-9" : "h-[72px] w-auto max-w-[155px]"
              }`}
          />
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {/* NAVIGATION label */}
          {/* <div
            className={`px-3 text-[10px] font-bold tracking-widest uppercase select-none mb-2 transition-all duration-300 overflow-hidden whitespace-nowrap ${collapsed ? "max-h-0 opacity-0 py-0" : "max-h-8 opacity-100 py-1"
              }`}
            style={{ color: "rgba(100, 116, 139, 0.6)" }}
          >
            Navigation
          </div> */}

          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                `flex items-center rounded-lg text-sm font-medium transition-all duration-150 ${collapsed ? "justify-center px-0 w-10 h-10 mx-auto gap-0" : "gap-3 px-3 py-2.5"
                } ${isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span
                className={`transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${collapsed ? "max-w-0 opacity-0 ml-0 w-0" : "max-w-[200px] opacity-100"
                  }`}
              >
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div
          className="px-2 py-3 space-y-0.5 border-t border-sidebar-border"
        >
          {hasSettingsPermission && (
            <NavLink
              to="/dashboard/settings"
              className={({ isActive }) =>
                `flex items-center rounded-lg text-sm font-medium transition-all duration-150 ${collapsed ? "justify-center px-0 w-10 h-10 mx-auto gap-0" : "gap-3 px-3 py-2.5"
                } ${isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`
              }
              title={collapsed ? "Settings" : undefined}
            >
              <Settings className="w-5 h-5 shrink-0" />
              <span
                className={`transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${collapsed ? "max-w-0 opacity-0 ml-0 w-0" : "max-w-[200px] opacity-100"
                  }`}
              >
                Settings
              </span>
            </NavLink>
          )}
          <button
            onClick={() => setShowLogoutDialog(true)}
            className={`flex items-center rounded-lg text-sm font-medium transition-all duration-150 ${collapsed ? "justify-center px-0 w-10 h-10 mx-auto gap-0" : "gap-3 px-3 py-2.5 w-full"
              } text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span
              className={`transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${collapsed ? "max-w-0 opacity-0 ml-0 w-0" : "max-w-[200px] opacity-100"
                }`}
            >
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
              This will end your current session and you will need to sign in again to access the
              dashboard.
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
