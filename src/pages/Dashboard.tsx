import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, API_BASE_URL } from "@/config/api";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const resolveImageUrl = (pathOrData: string | undefined | null) => {
  if (!pathOrData) return undefined;
  if (pathOrData.startsWith("data:") || pathOrData.startsWith("http:") || pathOrData.startsWith("https:")) {
    return pathOrData;
  }
  const cleanPath = pathOrData.replace(/\\/g, "/");
  const host = API_BASE_URL.replace("/api/v1", "");
  if (cleanPath.startsWith("uploads/")) {
    return `${host}/${cleanPath}`;
  }
  return `${host}/uploads/${encodeURIComponent(cleanPath)}`;
};
import KpiCards from "@/features/dashboard/components/KpiCards";
import HoursSummary from "@/features/dashboard/components/HoursSummary";
import LiveMapView from "@/features/dashboard/components/LiveMapView";
import GuardStatusPanel from "@/features/dashboard/components/GuardStatusPanel";
import RecentIncidents from "@/features/dashboard/components/RecentIncidents";
import ComplianceAlerts from "@/features/dashboard/components/ComplianceAlerts";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Maximize2 } from "lucide-react";
import { dashboardService, DashboardKpis } from "@/services/dashboardService";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedGuardId, setSelectedGuardId] = useState<string | null>(null);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const {
    data: kpis = null,
    isLoading: loading,
    error: kpiError,
  } = useQuery<DashboardKpis>({
    queryKey: ["dashboard", "kpis"],
    queryFn: () => dashboardService.getKpis(),
    refetchInterval: 30000, // refresh every 30 s to keep Hours Summary live
    staleTime: 20000,
  });

  const error = kpiError ? (kpiError as any).message || "Failed to load dashboard data" : null;

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const permissions = user?.permissions || [];
  const isAdmin = user?.role === "admin";

  const hasGuardCreate = isAdmin || permissions.includes("create_guard") || permissions.includes("guard");
  const hasSchedulingCreate = isAdmin || permissions.includes("create_scheduling") || permissions.includes("scheduling");

  const { data: guardStatusList = [] } = useQuery({
    queryKey: ["dashboard", "guard-status"],
    queryFn: () => dashboardService.getGuardStatus(),
    refetchInterval: 10000,
  });

  const { data: siteList = [] } = useQuery({
    queryKey: ["sites", "dashboard"],
    queryFn: async () => {
      const res = await api.sites.list();
      const raw = res.data as any;
      let list: any[] = [];
      if (Array.isArray(raw)) list = raw;
      else if (Array.isArray(raw?.data)) list = raw.data;
      else if (raw?.data && typeof raw.data === "object") {
        list = raw.data.sites || raw.data.site || raw.data.items || raw.data.results || [];
      } else {
        list = raw?.sites || raw?.site || raw?.items || raw?.results || [];
      }
      return (Array.isArray(list) ? list : []).map((s: any) => ({
        id: String(s.id || s._id),
        name: String(s.name || "Unknown Site"),
        lat: Number(s.lat ?? s.latitude ?? 0),
        lng: Number(s.lng ?? s.longitude ?? 0),
        geofenceRadius: s.geofenceRadius,
        status: s.status,
      }));
    },
    staleTime: 60000,
  });

  return (
    <div className="p-6 space-y-6 max-w-full">
      {/* Header */}
      <div className="module-page-header">
        <div>
          <h1 className="module-page-title">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {user?.name || user?.role || "User"}</p>
        </div>
        <div className="flex gap-2">
          {hasGuardCreate && (
            <Button onClick={() => navigate("/dashboard/guards")} size="sm">Add Guard</Button>
          )}
          {hasSchedulingCreate && (
            <Button onClick={() => navigate("/dashboard/scheduling")} size="sm" variant="secondary">Create Schedule</Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
          Error: {error}
        </div>
      )}

      <KpiCards kpis={kpis} loading={loading} />
      <HoursSummary kpis={kpis} loading={loading} />

      {/* Map & Guard Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 relative group flex flex-col min-h-[400px] hud-panel hud-corners-container overflow-hidden rounded-xl">
          <LiveMapView selectedGuardId={selectedGuardId} onSelectGuard={setSelectedGuardId} guards={guardStatusList} sites={siteList} />
          <button
            onClick={() => setMapFullscreen(true)}
            className="absolute top-12 right-3 z-10 p-2 bg-card/90 border border-border rounded-lg shadow-md hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
            title="Expand Map"
          >
            <Maximize2 className="w-4 h-4 text-foreground" />
          </button>
        </div>
        <div className="hud-panel hud-corners-container overflow-hidden rounded-xl">
          <GuardStatusPanel selectedGuardId={selectedGuardId} onSelectGuard={setSelectedGuardId} guards={guardStatusList} />
        </div>
      </div>

      <RecentIncidents />
      <ComplianceAlerts />

      {/* Fullscreen Map Dialog */}
      <Dialog open={mapFullscreen} onOpenChange={setMapFullscreen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden">
          <div className="h-full flex">
            {/* Map area */}
            <div className="flex-1 relative flex flex-col">
              <LiveMapView selectedGuardId={selectedGuardId} onSelectGuard={setSelectedGuardId} guards={guardStatusList} sites={siteList} />
            </div>
            {/* Guard real-time panel */}
            <div className="w-80 border-l border-border bg-card overflow-y-auto">
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Real-Time Guard Data</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Live status from GPS tracking</p>
              </div>
              <div className="divide-y divide-border">
                {guardStatusList.map((guard) => (
                  <button
                    key={guard.id}
                    onClick={() => setSelectedGuardId(guard.id)}
                    className={`w-full text-left p-3 hover:bg-accent/50 transition-colors ${selectedGuardId === guard.id ? "bg-accent" : ""}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <Avatar className="w-9 h-9 border border-primary/10">
                          <AvatarImage src={resolveImageUrl(guard.profilePhoto)} alt={guard.name} className="object-cover" />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold flex items-center justify-center h-full w-full">
                            {guard.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${guard.geofenceAlert ? "bg-destructive" : guard.status === "on-duty" ? "bg-success" : "bg-muted-foreground"
                          }`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{guard.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{guard.site}</p>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                      <span className="text-muted-foreground">Status</span>
                      <span className={`font-medium text-right ${guard.geofenceAlert ? "text-destructive" : guard.status === "on-duty" ? "text-success" : "text-muted-foreground"}`}>
                        {guard.geofenceAlert ? "⚠ Alert" : guard.status}
                      </span>
                      <span className="text-muted-foreground">Last seen</span>
                      <span className="text-foreground text-right">{guard.lastSeen}</span>
                      <span className="text-muted-foreground">Hours</span>
                      <span className="text-foreground text-right">{guard.hoursThisWeek}h / {guard.scheduledHours}h</span>
                      <span className="text-muted-foreground">GPS</span>
                      <span className="text-foreground text-right">{guard.lat.toFixed(4)}, {guard.lng.toFixed(4)}</span>
                    </div>
                  </button>
                ))}

              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
