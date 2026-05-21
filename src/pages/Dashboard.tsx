import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import KpiCards from "@/features/dashboard/components/KpiCards";
import HoursSummary from "@/features/dashboard/components/HoursSummary";
import LiveMapView from "@/features/dashboard/components/LiveMapView";
import GuardStatusPanel from "@/features/dashboard/components/GuardStatusPanel";
import RecentIncidents from "@/features/dashboard/components/RecentIncidents";
import ComplianceAlerts from "@/features/dashboard/components/ComplianceAlerts";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Maximize2 } from "lucide-react";
import { guards } from "@/data/dummyData";
import { dashboardService, DashboardKpis } from "@/services/dashboardService";

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedGuardId, setSelectedGuardId] = useState<string | null>(null);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchKpis = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getKpis();
        if (active) {
          setKpis(data);
          setError(null);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || "Failed to load dashboard data");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchKpis();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="p-5 space-y-5 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, Admin · Feb 25, 2026</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate("/dashboard/guards")} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">+ Add Guard</button>
          <button onClick={() => navigate("/dashboard/scheduling")} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors">Create Schedule</button>
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
        <div className="lg:col-span-2 relative group">
          <LiveMapView selectedGuardId={selectedGuardId} onSelectGuard={setSelectedGuardId} />
          <button
            onClick={() => setMapFullscreen(true)}
            className="absolute top-12 right-3 z-10 p-2 bg-card/90 border border-border rounded-lg shadow-md hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
            title="Expand Map"
          >
            <Maximize2 className="w-4 h-4 text-foreground" />
          </button>
        </div>
        <div>
          <GuardStatusPanel selectedGuardId={selectedGuardId} onSelectGuard={setSelectedGuardId} />
        </div>
      </div>

      <RecentIncidents />
      <ComplianceAlerts />

      {/* Fullscreen Map Dialog */}
      <Dialog open={mapFullscreen} onOpenChange={setMapFullscreen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden">
          <div className="h-full flex">
            {/* Map area */}
            <div className="flex-1 relative">
              <LiveMapView selectedGuardId={selectedGuardId} onSelectGuard={setSelectedGuardId} />
              <style>{`.h-\\[340px\\] { height: 100% !important; }`}</style>
            </div>
            {/* Guard real-time panel */}
            <div className="w-80 border-l border-border bg-card overflow-y-auto">
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Real-Time Guard Data</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Live status from GPS tracking</p>
              </div>
              <div className="divide-y divide-border">
                {guards.map((guard) => (
                  <button
                    key={guard.id}
                    onClick={() => setSelectedGuardId(guard.id)}
                    className={`w-full text-left p-3 hover:bg-accent/50 transition-colors ${selectedGuardId === guard.id ? "bg-accent" : ""}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          {guard.avatar}
                        </div>
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
