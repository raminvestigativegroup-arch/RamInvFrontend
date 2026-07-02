import { useState } from "react";
import { guards } from "@/data/dummyData";
import { AlertTriangle, MapPinned, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/config/api";
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/85" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Quick find personnel..."
            className="w-full pl-9 pr-3 py-2 bg-secondary/80 border border-border/80 rounded-xl text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>
      <div className="overflow-y-auto flex-1" style={{ maxHeight: "350px" }}>
        {filtered.map((guard) => {
          const initials = guard.name
            .split(" ")
            .filter(Boolean)
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <div
              key={guard.id}
              className={`px-4 py-3.5 border-b border-border cursor-pointer transition-all duration-200 flex items-center gap-3 ${selectedGuardId === guard.id ? "bg-primary/[0.03] border-l-4 border-l-primary pl-3" : "hover:bg-secondary/40 border-l-4 border-l-transparent"
                }`}
              onClick={() => onSelectGuard?.(guard.id)}
            >
              <Avatar className="w-9 h-9 border border-primary/10 shrink-0">
                <AvatarImage src={resolveImageUrl(guard.profilePhoto)} alt={guard.name} className="object-cover" />
                <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold flex items-center justify-center h-full w-full">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Guard details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-foreground truncate">{guard.name}</p>
                  <div className="shrink-0">
                    {guard.geofenceAlert ? (
                      <Badge variant="danger" showDot>Alert</Badge>
                    ) : guard.status === "on-duty" ? (
                      <Badge variant="success" showDot>On Duty</Badge>
                    ) : guard.status === "break" ? (
                      <Badge variant="warning" showDot>Break</Badge>
                    ) : (
                      <Badge variant="inactive" showDot>Off Duty</Badge>
                    )}
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground truncate mt-0.5">Site: {guard.site}</p>

                {guard.geofenceAlert ? (
                  <div className="flex items-center gap-1 mt-1 text-red-500">
                    <AlertTriangle className="w-3 h-3 shrink-0 animate-bounce" />
                    <span className="text-[10px] font-semibold">Outside area</span>
                  </div>
                ) : guard.status !== "off-duty" ? (
                  <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                    <MapPinned className="w-3 h-3 shrink-0 text-muted-foreground/60" />
                    <span className="text-[10px]">{guard.lastSeen}</span>
                  </div>
                ) : guard.nextShift ? (
                  <p className="text-[10px] text-muted-foreground/80 mt-1">Next Shift: {guard.nextShift}</p>
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
