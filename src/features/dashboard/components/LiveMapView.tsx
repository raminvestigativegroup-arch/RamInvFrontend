import { useState, useEffect, useRef } from "react";
import { guards } from "@/data/dummyData";
import { Search, LocateFixed } from "lucide-react";
import SelectDropdown from "@/components/common/SelectDropdown";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";

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
  sites?: { id: string | number; name: string; lat?: number; lng?: number; latitude?: number; longitude?: number; geofenceRadius?: number; status?: string }[];
}

const LiveMapView = ({ onSelectGuard, selectedGuardId, guards: dynamicGuards, sites: dynamicSites }: LiveMapViewProps) => {
  const { loaded, error: loadError } = useGoogleMaps();
  const [siteFilter, setSiteFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const activeGuardsList = dynamicGuards || guards;

  // Refs for Google Map
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const siteMarkersRef = useRef<any[]>([]);
  const circlesRef = useRef<any[]>([]);

  // Normalise whatever shape the backend returns into { id, name, lat, lng, geofenceRadius }
  const activeSites = (dynamicSites && dynamicSites.length > 0 ? dynamicSites : [])
    .map(s => ({
      id: s.id,
      name: s.name,
      lat: Number(s.lat ?? s.latitude ?? 0),
      lng: Number(s.lng ?? s.longitude ?? 0),
      geofenceRadius: s.geofenceRadius,
      status: s.status,
    }))
    .filter(s => !s.status || s.status === "active");

  const siteOptions = [
    { value: "all", label: "All Sites" },
    ...activeSites.map(s => ({ value: s.name, label: s.name })),
  ];

  const filteredGuards = activeGuardsList.filter(g => {
    const showByStatus = g.status !== "off-duty" || g.geofenceAlert;
    const showBySite = siteFilter === "all" || g.site === siteFilter;
    return showByStatus && showBySite;
  });

  const guardsToShow = [...filteredGuards];
  if (selectedGuardId && !guardsToShow.some(g => String(g.id) === String(selectedGuardId))) {
    const selectedG = activeGuardsList.find(g => String(g.id) === String(selectedGuardId));
    if (selectedG) {
      guardsToShow.push(selectedG);
    }
  }


  const searchResults = searchQuery.length > 0
    ? activeGuardsList.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const handleSearchSelect = (guard: any) => {
    setSearchQuery("");
    onSelectGuard?.(guard.id);
  };

  // Google Maps setup
  useEffect(() => {
    if (!loaded || !mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 30.7333, lng: 76.7794 },
      zoom: 12,
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      styles: [
        {
          featureType: "administrative",
          elementType: "geometry",
          stylers: [{ visibility: "off" }]
        }
      ]
    });
  }, [loaded]);

  // Update Markers, Circles and Pan/Zoom when data changes
  useEffect(() => {
    if (!loaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    siteMarkersRef.current.forEach(m => m.setMap(null));
    siteMarkersRef.current = [];

    circlesRef.current.forEach(c => c.setMap(null));
    circlesRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasAnyPoint = false;

    // 1. Add Site Markers and Geofence Circles
    const sitesToShow = activeSites.filter(s => siteFilter === "all" || s.name === siteFilter);
    sitesToShow.forEach(site => {
      if (!site.lat || !site.lng) return;
      const position = { lat: site.lat, lng: site.lng };
      bounds.extend(position);
      hasAnyPoint = true;

      const siteMarker = new window.google.maps.Marker({
        position,
        map,
        title: site.name,
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          fillColor: "#3b82f6",
          fillOpacity: 0.9,
          strokeColor: "#ffffff",
          strokeWeight: 1.5,
          scale: 6
        }
      });
      siteMarkersRef.current.push(siteMarker);

      if (site.geofenceRadius) {
        const circle = new window.google.maps.Circle({
          map,
          center: position,
          radius: site.geofenceRadius,
          fillColor: "#3b82f6",
          fillOpacity: 0.08,
          strokeColor: "#3b82f6",
          strokeOpacity: 0.35,
          strokeWeight: 1.5,
          clickable: false
        });
        circlesRef.current.push(circle);
      }
    });

    // 2. Add Guard Markers
    guardsToShow.forEach((guard, index) => {
      const assignedSite = activeSites.find(s => s.name === guard.site);
      const offsetAngle = index * (2 * Math.PI / 8);
      const offsetDist = 0.0003;
      
      const guardLat = assignedSite && assignedSite.lat && assignedSite.lng
        ? assignedSite.lat + Math.sin(offsetAngle) * offsetDist
        : Number(guard.lat ?? guard.latitude);
      const guardLng = assignedSite && assignedSite.lat && assignedSite.lng
        ? assignedSite.lng + Math.cos(offsetAngle) * offsetDist
        : Number(guard.lng ?? guard.longitude);

      if (!guardLat || !guardLng) return;
      const position = { lat: guardLat, lng: guardLng };
      bounds.extend(position);
      hasAnyPoint = true;

      const color = getMarkerColor(guard);
      const isSelected = String(selectedGuardId) === String(guard.id);

      const marker = new window.google.maps.Marker({
        position,
        map,
        title: guard.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1.0,
          strokeColor: isSelected ? "#facc15" : "#ffffff",
          strokeWeight: isSelected ? 3 : 2,
          scale: isSelected ? 10 : 8
        },
        zIndex: isSelected ? 999 : 10
      });

      marker.addListener("click", () => {
        onSelectGuard?.(guard.id);
      });

      markersRef.current.push(marker);
    });

    // 3. Pan and Zoom center handling
    if (selectedGuardId) {
      const selGuard = activeGuardsList.find(g => String(g.id) === String(selectedGuardId));
      if (selGuard) {
        const assignedSite = activeSites.find(s => s.name === selGuard.site);
        const targetLat = assignedSite && assignedSite.lat && assignedSite.lng
          ? assignedSite.lat
          : Number(selGuard.lat ?? selGuard.latitude);
        const targetLng = assignedSite && assignedSite.lat && assignedSite.lng
          ? assignedSite.lng
          : Number(selGuard.lng ?? selGuard.longitude);

        if (targetLat && targetLng) {
          map.panTo({ lat: targetLat, lng: targetLng });
          map.setZoom(15);
        }
      }
    } else if (hasAnyPoint) {
      map.fitBounds(bounds);
      const listener = window.google.maps.event.addListenerOnce(map, "idle", () => {
        if (map.getZoom() > 15) {
          map.setZoom(14);
        }
      });
    }
  }, [loaded, guardsToShow, activeSites, siteFilter, selectedGuardId, activeGuardsList]);

  // Fallback calculations for mockup map if Google Maps isn't loaded
  const center = selectedGuardId
    ? (() => {
      const g = activeGuardsList.find(g => String(g.id) === String(selectedGuardId));
      if (g) {
        const assignedSite = activeSites.find(s => s.name === g.site);
        if (assignedSite && assignedSite.lat && assignedSite.lng) {
          return `${assignedSite.lat},${assignedSite.lng}`;
        }
        return `${g.lat ?? g.latitude},${g.lng ?? g.longitude}`;
      }
      return "30.7333,76.7794";
    })()
    : "30.7333,76.7794";

  const mapSrc = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d${selectedGuardId ? "3000" : "50000"}!2d${center.split(",")[1]}!3d${center.split(",")[0]}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus!4v1`;

  const selectedGuard = selectedGuardId
    ? activeGuardsList.find(g => String(g.id) === String(selectedGuardId))
    : null;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col h-full">
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
              options={siteOptions}
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

      {/* Map display */}
      <div className="relative flex-1 min-h-0">
        {loaded ? (
          // Real Google Map
          <div ref={mapRef} className="w-full h-full" />
        ) : (
          // Mockup Iframe Fallback
          <>
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
              {guardsToShow.map((guard, index) => {
                const baseLat = parseFloat(center.split(",")[0]);
                const baseLng = parseFloat(center.split(",")[1]);
                const latRange = selectedGuardId ? 0.01 : 0.06;
                const lngRange = selectedGuardId ? 0.015 : 0.09;

                const assignedSite = activeSites.find(s => s.name === guard.site);
                const offsetAngle = index * (2 * Math.PI / 8);
                const offsetDist = 0.0003;
                const gLat = assignedSite && assignedSite.lat && assignedSite.lng
                  ? assignedSite.lat + Math.sin(offsetAngle) * offsetDist
                  : Number(guard.lat ?? guard.latitude ?? 0);
                const gLng = assignedSite && assignedSite.lat && assignedSite.lng
                  ? assignedSite.lng + Math.cos(offsetAngle) * offsetDist
                  : Number(guard.lng ?? guard.longitude ?? 0);

                const top = 50 - ((gLat - baseLat) / latRange) * 40;
                const left = 50 + ((gLng - baseLng) / lngRange) * 40;

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
                    <div
                      className={`rounded-full border-2 transition-all ${isSelected ? "w-5 h-5 border-yellow-400 shadow-lg" : "w-3.5 h-3.5 border-white shadow-md"}`}
                      style={{ backgroundColor: color }}
                    />
                  </div>
                );
              })}

              {/* Site markers */}
              {activeSites.filter(s => siteFilter === "all" || s.name === siteFilter).map(site => {
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
          </>
        )}

        {/* Selected Guard Floating Details Card (Universal Overlay) */}
        {selectedGuard && (
          <div className="absolute bottom-4 left-4 bg-popover/90 backdrop-blur-md border border-border rounded-xl shadow-2xl p-4 z-50 max-w-xs pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="font-semibold text-sm text-foreground">{selectedGuard.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Site: {selectedGuard.site}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Status: <span className={selectedGuard.geofenceAlert ? "text-destructive font-medium" : selectedGuard.status === "on-duty" ? "text-success font-medium" : ""}>{getStatusLabel(selectedGuard)}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Last seen: {selectedGuard.lastSeen}</p>
                {selectedGuard.geofenceAlert && (
                  <p className="text-destructive font-semibold mt-1 text-xs">⚠ Outside assigned area</p>
                )}
              </div>
              <button
                onClick={() => onSelectGuard?.("")}
                className="text-[10px] text-muted-foreground hover:text-foreground bg-secondary px-1.5 py-0.5 rounded border border-border"
              >
                Close
              </button>
            </div>
            <a
              href="/dashboard/guards"
              className="text-primary hover:underline text-xs font-semibold mt-3 inline-block"
            >
              View Profile →
            </a>
          </div>
        )}
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
