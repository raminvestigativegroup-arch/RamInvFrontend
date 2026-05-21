import { useState } from "react";
import { incidents } from "@/data/dummyData";
import { useNavigate } from "react-router-dom";
import { Eye, Sparkles, X, Camera, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

  const selected = viewIncident ? incidents.find(i => i.id === viewIncident) : null;
  const aiSelected = aiIncident ? incidents.find(i => i.id === aiIncident) : null;

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
          <table className="w-full">
            <thead>
              <tr className="bg-secondary">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Time</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Guard</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Location</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Type</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Priority</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Action</th>
              </tr>
            </thead>
            <tbody>
              {incidents.slice(0, 5).map((inc) => (
                <tr key={inc.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {inc.date === "2026-02-25" ? `Today, ${inc.time}` : `Yesterday, ${inc.time}`}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{inc.guard}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{inc.site}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{inc.type}</td>
                  <td className="px-4 py-3">
                    <span className={`priority-${inc.priority}`}>{inc.priority.charAt(0).toUpperCase() + inc.priority.slice(1)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
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
                <div><span className="text-muted-foreground">Guard:</span> <span className="font-medium">{selected.guard}</span></div>
                <div><span className="text-muted-foreground">Site:</span> <span className="font-medium">{selected.site}</span></div>
                <div><span className="text-muted-foreground">Time:</span> <span className="font-medium">{selected.date} {selected.time}</span></div>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm text-muted-foreground">{selected.description}</p>
              </div>
              {selected.hasPhotos && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Camera className="w-4 h-4" />Photos attached (3)
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
                <p className="text-sm text-foreground leading-relaxed">{aiSummaries[aiSelected.id] || "AI summary is being generated..."}</p>
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
