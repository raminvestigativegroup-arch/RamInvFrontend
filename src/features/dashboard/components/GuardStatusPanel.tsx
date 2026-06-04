import { useState } from "react";
import { guards } from "@/data/dummyData";
import { AlertTriangle, MapPinned, Search } from "lucide-react";

interface GuardStatusPanelProps {
  selectedGuardId?: string | null;
  onSelectGuard?: (guardId: string) => void;
  guards?: any[];
}

const GuardStatusPanel = ({ selectedGuardId, onSelectGuard, guards: dynamicGuards }: GuardStatusPanelProps) => {
  const [search, setSearch] = useState("");

  const activeGuardsList = dynamicGuards || guards;

  const filtered = activeGuardsList.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.site.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col h-full shadow-sm">
      <div className="p-4 border-b border-border">
        <h2 className="text-base font-bold text-foreground mb-3">Guard Status</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Quick find personnel..."
            className="w-full pl-8 pr-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 transition-shadow"
          />
        </div>
      </div>
      <div className="overflow-y-auto flex-1" style={{ maxHeight: "350px" }}>
        {filtered.map((guard) => {
          const initials = guard.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <div
              key={guard.id}
              className={`px-4 py-3 border-b border-border cursor-pointer transition-colors flex items-center gap-3 ${
                selectedGuardId === guard.id ? "bg-primary/5" : "hover:bg-secondary/40"
              }`}
              onClick={() => onSelectGuard?.(guard.id)}
            >
              {/* Avatar circle */}
              <div className="w-8 h-8 rounded-full bg-blue-50/80 border border-blue-100/50 flex items-center justify-center shrink-0 text-[11px] font-bold text-primary">
                {initials}
              </div>

              {/* Guard details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-foreground truncate">{guard.name}</p>
                  <div className="shrink-0">
                    {guard.geofenceAlert ? (
                      <span className="bg-red-50 text-red-600 border border-red-100/40 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">Alert</span>
                    ) : guard.status === "on-duty" ? (
                      <span className="bg-blue-50 text-blue-600 border border-blue-100/40 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">On Duty</span>
                    ) : guard.status === "break" ? (
                      <span className="bg-yellow-50 text-yellow-600 border border-yellow-100/40 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">Break</span>
                    ) : (
                      <span className="bg-slate-50 text-slate-500 border border-slate-200/60 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">Off Duty</span>
                    )}
                  </div>
                </div>
                
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">Site: {guard.site}</p>
                
                {guard.geofenceAlert ? (
                  <div className="flex items-center gap-1 mt-0.5 text-red-500">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span className="text-[10px] font-semibold">Outside area</span>
                  </div>
                ) : guard.status !== "off-duty" ? (
                  <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                    <MapPinned className="w-3 h-3 shrink-0 text-muted-foreground/60" />
                    <span className="text-[10px]">{guard.lastSeen}</span>
                  </div>
                ) : guard.nextShift ? (
                  <p className="text-[10px] text-muted-foreground/80 mt-0.5">Next Shift: {guard.nextShift}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GuardStatusPanel;
