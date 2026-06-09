import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/config/api";
import { useNavigate } from "react-router-dom";
import { Eye, Sparkles, X, Camera, Download, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Incident {
  id: string;
  title: string;
  type: string;
  site: string;
  guard: string;
  priority: "high" | "medium" | "low";
  status: "open" | "in-progress" | "resolved";
  date: string;
  time: string;
  description: string;
  hasPhotos?: boolean;
  action: string;
}

const normalizeIncidentsResponse = (response: any): any[] => {
  if (!response) return [];
  const list = response.incidents || (response.data && response.data.incidents) || [];
  if (Array.isArray(list)) return list;
  
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  const data = response.data || response;
  return data.incidents || data.items || data.results || data.data || [];
};

const normalizeIncident = (inc: any, index: number): Incident => {
  if (!inc) return {} as Incident;
  const data = inc.data || inc;
  
  let date = "N/A";
  let time = "N/A";
  if (data.time) {
    const d = new Date(data.time);
    if (!isNaN(d.getTime())) {
      date = d.toISOString().split('T')[0];
      time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  } else if (data.createdAt) {
    const d = new Date(data.createdAt);
    if (!isNaN(d.getTime())) {
      date = d.toISOString().split('T')[0];
      time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  return {
    id: String(data.id || data._id || `INC${String(index + 1).padStart(3, "0")}`),
    title: String(data.incidentType || data.title || "General Incident"),
    type: String(data.incidentType || data.type || "Security"),
    site: String(data.site || "Unknown Site"),
    guard: String(data.guardId || data.guard || "Unknown Guard"),
    priority: (data.priority === "high" || data.priority === "medium" || data.priority === "low") ? data.priority : "medium",
    status: (data.solved === "resolved" || data.solved === "in-progress" || data.solved === "open") 
      ? data.solved 
      : (data.status || "open"),
    date,
    time,
    description: String(data.description || "No description provided."),
    hasPhotos: Boolean(data.image || data.hasPhotos),
    action: String(data.action || "No action specified"),
  };
};

const aiSummaries: Record<string, string> = {
  INC001: "An unauthorized individual attempted entry at the east entrance of Downtown Office Complex at 08:30 AM. The guard on duty (James Wilson) intercepted and denied access. Photos were captured. The individual did not have valid credentials. Recommended follow-up: review access protocols and enhance east entrance monitoring.",
  INC002: "Fire alarm triggered on the 3rd floor of Tech Park Campus at 07:15 AM. Maria Santos initiated evacuation procedures. Fire department responded and confirmed a false alarm caused by a malfunctioning smoke detector. No injuries or damage. Sensor has been flagged for maintenance.",
  INC003: "A vehicle parked in Lot B of Mall Central was found with a broken window at 11:45 PM. Sarah Johnson documented the damage with photos and notified the vehicle owner. No suspects identified. Surveillance footage from Lot B cameras has been preserved for review.",
  INC004: "An unattended package was discovered near the loading dock of Harbor Warehouse at 09:20 PM. Lisa Patel cordoned off the area per protocol. Package was inspected and found to be a misplaced delivery. Area cleared at 10:15 PM. Recommended: improve dock delivery tracking.",
  INC005: "A visitor slipped on a wet floor in the Residential Tower A lobby at 03:00 PM. Emily Davis administered first aid (minor bruise). Wet floor signs were not visible. Maintenance has been notified. Incident report filed with building management.",
  INC006: "Two individuals gained access through a secure door at Downtown Office Complex by following an authorized employee at 01:30 PM. Michael Brown identified and escorted them out. Both were visiting the wrong floor. Tailgating prevention training recommended.",
  INC007: "CCTV Camera 14 in Tech Park Campus Sector C went offline at 10:00 AM. David Kim reported the issue. Preliminary check suggests a power supply failure. Maintenance ticket created. Temporary mobile camera deployed as backup.",
};

const RecentIncidents = () => {
  const navigate = useNavigate();
  const [viewIncident, setViewIncident] = useState<string | null>(null);
  const [aiIncident, setAiIncident] = useState<string | null>(null);

  const { data: incidentList = [], isLoading } = useQuery({
    queryKey: ["incidents"],
    queryFn: async () => {
      const response = await api.incidents.list();
      const rawData = response.data;
      const normalizedList = normalizeIncidentsResponse(rawData);
      return normalizedList.map((inc, index) => normalizeIncident(inc, index));
    }
  });

  const { data: guardList = [] } = useQuery({
    queryKey: ["guards"],
    queryFn: async () => {
      const response = await api.guards.list();
      const raw = response.data?.data || response.data?.guards || response.data?.items || (Array.isArray(response.data) ? response.data : []);
      return (Array.isArray(raw) ? raw : []).map(g => ({
        id: String(g.id || g._id),
        name: String(g.name || g.fullName || "Unknown Guard")
      }));
    }
  });

  const guardMap = useMemo(() => {
    return guardList.reduce((acc, g) => {
      acc[g.id] = g.name;
      return acc;
    }, {} as Record<string, string>);
  }, [guardList]);

  const selected = viewIncident ? incidentList.find(i => i.id === viewIncident) : null;
  const aiSelected = aiIncident ? incidentList.find(i => i.id === aiIncident) : null;

  return (
    <>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Recent Incidents</h2>
          <button onClick={() => navigate("/dashboard/incidents")} className="text-xs text-primary font-medium hover:underline">
            View All →
          </button>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : incidentList.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No recent incidents.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30 border-b border-border/80">
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-4 py-3">Time</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-4 py-3">Guard</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-4 py-3">Location</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-4 py-3">Type</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-4 py-3">Priority</th>
                  <th className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-4 py-3 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody>
                {incidentList.slice(0, 5).map((inc) => (
                  <tr key={inc.id} className="border-b border-border hover:bg-primary/[0.015] transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {inc.date} · {inc.time}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{guardMap[inc.guard] || inc.guard}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{inc.site}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{inc.type}</td>
                    <td className="px-4 py-3">
                      <span className={`priority-${inc.priority}`}>{inc.priority.charAt(0).toUpperCase() + inc.priority.slice(1)}</span>
                    </td>
                    <td className="px-4 py-3 text-right pr-6">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setViewIncident(inc.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-primary text-primary-foreground rounded text-xs font-medium hover:opacity-90 transition-opacity"
                        >
                          <Eye className="w-3.5 h-3.5" />View
                        </button>
                        <button
                          onClick={() => setAiIncident(inc.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary text-secondary-foreground border border-border rounded text-xs font-medium hover:bg-muted transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />AI Summary
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* View Report Dialog */}
      <Dialog open={!!viewIncident} onOpenChange={open => !open && setViewIncident(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <span className={`priority-${selected.priority}`}>{selected.priority.toUpperCase()}</span>
                <span className={selected.status === "resolved" ? "status-badge-active" : selected.status === "open" ? "status-badge-danger" : "status-badge-warning"}>{selected.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Type:</span> <span className="font-medium">{selected.type}</span></div>
                <div><span className="text-muted-foreground">Guard:</span> <span className="font-medium">{guardMap[selected.guard] || selected.guard}</span></div>
                <div><span className="text-muted-foreground">Site:</span> <span className="font-medium">{selected.site}</span></div>
                <div><span className="text-muted-foreground">Time:</span> <span className="font-medium">{selected.date} {selected.time}</span></div>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm text-muted-foreground">{selected.description}</p>
              </div>
              {selected.hasPhotos && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Camera className="w-4 h-4" />Photos attached
                </div>
              )}
              <div className="flex gap-2 pt-2 border-t border-border">
                <button onClick={() => { setViewIncident(null); setAiIncident(selected.id); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90">
                  <Sparkles className="w-3.5 h-3.5" />AI Summary
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium hover:bg-muted">
                  <Download className="w-3.5 h-3.5" />Export PDF
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Summary Dialog */}
      <Dialog open={!!aiIncident} onOpenChange={open => !open && setAiIncident(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-primary" />AI Incident Summary
            </DialogTitle>
          </DialogHeader>
          {aiSelected && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground">{aiSelected.title}</p>
                <p className="text-xs text-muted-foreground">{aiSelected.site} · {aiSelected.date} {aiSelected.time}</p>
              </div>
              <div className="bg-accent rounded-lg p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  {aiSummaries[aiSelected.id] || 
                    `AI Incident Summary: A ${aiSelected.priority} priority ${aiSelected.type} incident occurred at ${aiSelected.site} on ${aiSelected.date} at ${aiSelected.time}. The guard on duty, ${guardMap[aiSelected.guard] || aiSelected.guard}, reported the following: "${aiSelected.description}". The immediate action taken was: "${aiSelected.action}". Recommendations: Review security presence at ${aiSelected.site} and monitor for similar occurrences.`}
                </p>
              </div>
              <div className="flex gap-2">
                <span className={`priority-${aiSelected.priority}`}>{aiSelected.priority.toUpperCase()}</span>
                <span className={aiSelected.status === "resolved" ? "status-badge-active" : "status-badge-danger"}>{aiSelected.status}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RecentIncidents;
