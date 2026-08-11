import { Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import DashboardLayout from "@/layouts/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import GuardManagement from "@/pages/GuardManagement";
import GuardPhotosList from "@/pages/GuardPhotosList";
import GuardPhotosDetail from "@/pages/GuardPhotosDetail";
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
import OperationManagement from "@/pages/OperationManagement";
import NotFound from "@/pages/NotFound";

// Merged pages from RamLandingPage
import LandingPage from "@/pages/LandingPage";
import PrivacyPolicy from "@/pages/PrivacyPolicy";

/**
 * Utility to extract subdomain from current hostname.
 * Returns null if on the main domain.
 */
export const getSubdomain = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // If IP address or plain localhost (no dots)
  if (parts.length <= 1 || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return null;
  }
  
  // E.g. app.localhost -> 'app'
  if (hostname.endsWith('.localhost')) {
    return parts.slice(0, -1).join('.');
  }
  
  // Amplify App wildcard check: subdomain.d3svu3lru9i2lg.amplifyapp.com
  if (hostname.includes('amplifyapp.com')) {
    // If it is 'main.d3svu3lru9i2lg.amplifyapp.com', parts are ['main', 'd3svu3lru9i2lg', 'amplifyapp', 'com']
    // base domain is 'd3svu3lru9i2lg.amplifyapp.com' (3 parts)
    if (parts.length > 3) {
      return parts.slice(0, -3).join('.');
    }
    return null;
  }
  
  // Standard domain (e.g. app.securityapp.com -> 'app')
  if (parts.length > 2) {
    return parts.slice(0, -2).join('.');
  }
  
  return null;
};

/**
 * Redirect to the subdomain, preserving route path.
 */
export const redirectToSubdomain = (path: string = "/login") => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    window.location.href = `${protocol}//app.localhost${port}${path}`;
    return;
  }
  
  const parts = hostname.split('.');
  // Standard domain: securityapp.com (2 parts)
  if (parts.length === 2) {
    window.location.href = `${protocol}//app.${hostname}${port}${path}`;
  } else if (hostname.includes('amplifyapp.com') && parts.length === 3) {
    // d3svu3lru9i2lg.amplifyapp.com (3 parts) -> app.d3svu3lru9i2lg.amplifyapp.com
    window.location.href = `${protocol}//app.${hostname}${port}${path}`;
  } else {
    // Fallback or already has subdomain
    window.location.href = `${protocol}//app.${hostname}${port}${path}`;
  }
};

/**
 * Redirect to the main domain, preserving route path.
 */
export const redirectToMainDomain = (path: string = "/") => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';
  
  if (hostname.endsWith('.localhost')) {
    window.location.href = `${protocol}//localhost${port}${path}`;
    return;
  }
  
  const parts = hostname.split('.');
  if (hostname.includes('amplifyapp.com') && parts.length > 3) {
    // Remove the subdomain prefix from amplifyapp.com URL
    window.location.href = `${protocol}//${parts.slice(1).join('.')}${port}${path}`;
  } else if (parts.length > 2) {
    // app.securityapp.com -> securityapp.com
    window.location.href = `${protocol}//${parts.slice(1).join('.')}${port}${path}`;
  } else {
    window.location.href = `${protocol}//${hostname}${port}${path}`;
  }
};

// Helper component to handle redirection when accessing dashboard/login routes on main domain
const MainDomainRedirect = ({ to }: { to: string }) => {
  redirectToSubdomain(to);
  return (
    <div className="flex h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <p className="text-lg font-medium">Redirecting to SecurePro Portal...</p>
      </div>
    </div>
  );
};

// Helper component to handle redirection back to main domain
const SubdomainRedirect = ({ to }: { to: string }) => {
  redirectToMainDomain(to);
  return (
    <div className="flex h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <p className="text-lg font-medium">Redirecting to RAM Investigative Group...</p>
      </div>
    </div>
  );
};

export const AppRoutes = () => {
  const subdomain = getSubdomain();
  const isSubdomain = subdomain !== null && subdomain !== '';
  
  if (isSubdomain) {
    // Subdomain routing logic (e.g., app.localhost or app.domain.com)
    return (
      <Routes>
        {/* On subdomain, root '/' redirects to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="guards" element={<GuardManagement />} />
          <Route path="guard-photos" element={<GuardPhotosList />} />
          <Route path="guard-photos/:guardId" element={<GuardPhotosDetail />} />
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
          <Route path="operation-management" element={<OperationManagement />} />
        </Route>
        {/* If user tries to access privacy-policy on subdomain, redirect to main domain */}
        <Route path="/privacy-policy" element={<SubdomainRedirect to="/privacy-policy" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  } else {
    // Main domain routing logic (e.g., localhost or domain.com)
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        {/* Redirect auth & dashboard requests to the subdomain */}
        <Route path="/login" element={<MainDomainRedirect to="/login" />} />
        <Route path="/forgot-password" element={<MainDomainRedirect to="/forgot-password" />} />
        <Route path="/dashboard/*" element={<MainDomainRedirect to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }
};
