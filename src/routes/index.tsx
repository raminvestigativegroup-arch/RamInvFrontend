import { Routes, Route } from "react-router-dom";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import DashboardLayout from "@/layouts/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import GuardManagement from "@/pages/GuardManagement";
import ManagerManagement from "@/pages/ManagerManagement";
import SiteManagement from "@/pages/SiteManagement";
import IncidentManagement from "@/pages/IncidentManagement";
import Scheduling from "@/pages/Scheduling";
import Compliance from "@/pages/Compliance";
import HoursTracking from "@/pages/HoursTracking";
import Notifications from "@/pages/Notifications";
import Reports from "@/pages/Reports";
import RolesPermissions from "@/pages/RolesPermissions";
import SystemSettings from "@/pages/SystemSettings";
import NotFound from "@/pages/NotFound";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="guards" element={<GuardManagement />} />
        <Route path="managers" element={<ManagerManagement />} />
        <Route path="sites" element={<SiteManagement />} />
        <Route path="incidents" element={<IncidentManagement />} />
        <Route path="scheduling" element={<Scheduling />} />
        <Route path="compliance" element={<Compliance />} />
        <Route path="hours" element={<HoursTracking />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="roles" element={<RolesPermissions />} />
        <Route path="settings" element={<SystemSettings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
