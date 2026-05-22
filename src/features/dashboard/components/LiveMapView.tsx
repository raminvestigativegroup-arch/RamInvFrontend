import { useState } from "react";
import { guards, sites } from "@/data/dummyData";
import { Search, LocateFixed } from "lucide-react";
import SelectDropdown from "@/components/common/SelectDropdown";

const getMarkerColor = (guard: typeof guards[0]) => {
  if (guard.geofenceAlert) return "#ef4444";
  if (guard.status === "on-duty") return "#22c55e";
  return "#94a3b8";
};

const getStatusLabel = (guard: typeof guards[0]) => {
  if (guard.geofenceAlert) return "Alert";
  return guard.status;
};

interface LiveMapViewProps {
  onSelectGuard?: (guardId: string) => void;
  selectedGuardId?: string | null;
  guards?: any[];
}

const LiveMapView = ({ onSelectGuard, selectedGuardId, guards: dynamicGuards }: LiveMapViewProps) => {
  const [siteFilter, setSiteFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const activeGuardsList = dynamicGuards || guards;

  const siteNames = ["all", ...sites.filter(s => s.status === "active").map(s => s.name)];

  const filteredGuards = activeGuardsList.filter(g => {
    const showByStatus = g.status !== "off-duty" || g.geofenceAlert;
    const showBySite = siteFilter === "all" || g.site === siteFilter;
    return showByStatus && showBySite;
  });

  const searchResults = searchQuery.length > 0
    ? activeGuardsList.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const handleSearchSelect = (guard: any) => {
    setSearchQuery("");
    onSelectGuard?.(guard.id);
  };

  // Build Google Maps Static-style embed URL (no key needed for embed)
  const center = selectedGuardId
    ? (() => {
        const g = activeGuardsList.find(g => g.id === selectedGuardId);
        return g ? `${g.lat},${g.lng}` : "40.73,-73.99";
      })()
    : "40.73,-73.99";

  const zoom = selectedGuardId ? 15 : 12;

  // Use Google Maps embed (free, no API key required)
  const mapSrc = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d${selectedGuardId ? "3000" : "50000"}!2d${center.split(",")[1]}!3d${center.split(",")[0]}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus!4v1`;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border gap-2 flex-wrap">
        <h2 className="text-sm font-semibold text-foreground whitespace-nowrap">Live Guard Locations</h2>
        <div className="flex items-center gap-2 flex-1 justify-end">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search guard..."
              className="pl-8 pr-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary w-40"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-popover border border-border rounded-lg shadow-lg z-[1000] max-h-48 overflow-y-auto">
                {searchResults.map(g => (
                  <button key={g.id} onClick={() => handleSearchSelect(g)} className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors">
                    <span className="font-medium text-foreground">{g.name}</span>
                    <span className="text-muted-foreground ml-2">· {g.site}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Site Filter */}
          <div className="w-40">
            <SelectDropdown
              value={siteFilter}
              onChange={setSiteFilter}
              options={siteNames.map(s => ({ value: s, label: s === "all" ? "All Sites" : s }))}
              placeholder="All Sites"
              className="h-[32px] mb-0"
            />
          </div>
          {/* Reset */}
          <button onClick={() => { onSelectGuard?.(""); setSiteFilter("all"); }} title="Reset view" className="p-1.5 bg-secondary border border-border rounded-lg hover:bg-muted transition-colors">
            <LocateFixed className="w-3.5 h-3.5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Google Maps embed + guard overlay */}
      <div className="relative h-[340px]">
        <iframe
          src={mapSrc}
          className="w-full h-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Live Guard Map"
        />

        {/* Guard marker overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {filteredGuards.map((guard) => {
            // Position guards relative to map center for mockup visualization
            const baseLat = parseFloat(center.split(",")[0]);
            const baseLng = parseFloat(center.split(",")[1]);
            const latRange = selectedGuardId ? 0.01 : 0.06;
            const lngRange = selectedGuardId ? 0.015 : 0.09;

            const top = 50 - ((guard.lat - baseLat) / latRange) * 40;
            const left = 50 + ((guard.lng - baseLng) / lngRange) * 40;

            if (top < 5 || top > 95 || left < 5 || left > 95) return null;

            const isSelected = selectedGuardId === guard.id;
            const color = getMarkerColor(guard);

            return (
              <div
                key={guard.id}
                className="absolute pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group"
                style={{ top: `${top}%`, left: `${left}%` }}
                onClick={() => onSelectGuard?.(guard.id)}
              >
                {/* Marker dot */}
                <div
                  className={`rounded-full border-2 transition-all ${isSelected ? "w-5 h-5 border-yellow-400 shadow-lg" : "w-3.5 h-3.5 border-white shadow-md"}`}
                  style={{ backgroundColor: color }}
                />
                {/* Tooltip on hover / selected */}
                {isSelected && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-popover border border-border rounded-lg shadow-xl p-2.5 z-50 text-xs">
                    <p className="font-semibold text-sm text-foreground">{guard.name}</p>
                    <p className="text-muted-foreground">Site: {guard.site}</p>
                    <p className="text-muted-foreground">
                      Status: <span className={guard.geofenceAlert ? "text-destructive font-medium" : guard.status === "on-duty" ? "text-success font-medium" : ""}>{getStatusLabel(guard)}</span>
                    </p>
                    <p className="text-muted-foreground">Last seen: {guard.lastSeen}</p>
                    {guard.geofenceAlert && <p className="text-destructive font-medium mt-0.5">⚠ Outside assigned area</p>}
                    <a href="/dashboard/guards" className="text-primary underline text-xs mt-1 inline-block pointer-events-auto">View Profile →</a>
                  </div>
                )}
              </div>
            );
          })}

          {/* Site markers */}
          {sites.filter(s => s.status === "active" && (siteFilter === "all" || s.name === siteFilter)).map(site => {
            const baseLat = parseFloat(center.split(",")[0]);
            const baseLng = parseFloat(center.split(",")[1]);
            const latRange = selectedGuardId ? 0.01 : 0.06;
            const lngRange = selectedGuardId ? 0.015 : 0.09;

            const top = 50 - ((site.lat - baseLat) / latRange) * 40;
            const left = 50 + ((site.lng - baseLng) / lngRange) * 40;

            if (top < 5 || top > 95 || left < 5 || left > 95) return null;

            return (
              <div
                key={site.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{ top: `${top}%`, left: `${left}%` }}
              >
                {/* Geofence circle */}
                {site.geofenceRadius && (
                  <div
                    className="absolute rounded-full border border-dashed border-primary/40 bg-primary/5 transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      width: `${Math.min(site.geofenceRadius / (selectedGuardId ? 2 : 8), 120)}px`,
                      height: `${Math.min(site.geofenceRadius / (selectedGuardId ? 2 : 8), 120)}px`,
                      left: "50%",
                      top: "50%",
                    }}
                  />
                )}
                <div className="w-2 h-2 rounded-sm bg-primary/60 border border-primary" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-3 py-2 border-t border-border bg-secondary/50">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> On Duty
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" /> Off Duty
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Alert
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full border border-primary border-dashed inline-block" /> Geofence
        </div>
      </div>
    </div>
  );
};

export default LiveMapView;
