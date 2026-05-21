import { useState } from "react";
import { guards } from "@/data/dummyData";
import { AlertTriangle, MapPinned } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GuardStatusPanelProps {
  selectedGuardId?: string | null;
  onSelectGuard?: (guardId: string) => void;
}

const GuardStatusPanel = ({ selectedGuardId, onSelectGuard }: GuardStatusPanelProps) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = guards.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.site.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground mb-2">Guard Status</h2>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search guards..."
          className="w-full px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="overflow-y-auto flex-1" style={{ maxHeight: "340px" }}>
        {filtered.map((guard) => (
          <div
            key={guard.id}
            className={`px-3 py-2.5 border-b border-border cursor-pointer transition-colors ${
              selectedGuardId === guard.id ? "bg-accent" : "hover:bg-secondary/50"
            }`}
            onClick={() => onSelectGuard?.(guard.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{guard.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">Site: {guard.site}</p>
                {guard.geofenceAlert ? (
                  <div className="flex items-center gap-1 mt-0.5">
                    <AlertTriangle className="w-3 h-3 text-destructive" />
                    <span className="text-[11px] text-destructive font-medium">Outside area</span>
                  </div>
                ) : guard.status !== "off-duty" ? (
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPinned className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">{guard.lastSeen}</span>
                  </div>
                ) : guard.nextShift ? (
                  <p className="text-[11px] text-muted-foreground mt-0.5">Next: {guard.nextShift}</p>
                ) : null}
              </div>
              <div className="shrink-0">
                {guard.geofenceAlert ? (
                  <span className="status-badge-danger text-[10px] !px-1.5 !py-0.5">Alert</span>
                ) : guard.status === "on-duty" ? (
                  <span className="status-badge-active text-[10px] !px-1.5 !py-0.5">On Duty</span>
                ) : guard.status === "break" ? (
                  <span className="status-badge-warning text-[10px] !px-1.5 !py-0.5">Break</span>
                ) : (
                  <span className="status-badge-inactive text-[10px] !px-1.5 !py-0.5">Off Duty</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GuardStatusPanel;
