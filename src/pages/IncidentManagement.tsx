import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/config/api";
import { Search, Download, Sparkles, Camera, X, CalendarDays, Loader2, AlertCircle, MoreVertical, CheckCircle2, Clock, AlertTriangle, FileWarning } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import StateMessage from "@/components/common/StateMessage";
import SelectDropdown from "@/components/common/SelectDropdown";

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
}

const normalizeIncidentsResponse = (response: any): Incident[] => {
  if (!response) return [];
  // The user confirmed the data is in the "incidents" key
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
  
  // Parse date and time from ISO string "2026-05-07T10:30:00.000Z"
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
    // Use the 'solved' string field as the source of truth for status
    status: (data.solved === "resolved" || data.solved === "in-progress" || data.solved === "open") 
      ? data.solved 
      : (data.status || "open"),
    date,
    time,
    description: String(data.description || "No description provided."),
    hasPhotos: Boolean(data.image || data.hasPhotos),
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

const IncidentManagement = () => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const permissions = user?.permissions || [];
  const isAdmin = user?.role === "admin";

  const hasViewPermission = isAdmin || permissions.includes("view_incident") || permissions.includes("incident");
  const hasCreatePermission = isAdmin || permissions.includes("create_incident") || permissions.includes("incident");
  const hasEditPermission = isAdmin || permissions.includes("edit_incident") || permissions.includes("incident");
  const hasDeletePermission = isAdmin || permissions.includes("delete_incident") || permissions.includes("incident");

  const [search, setSearch] = useState("");
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [guardFilter, setGuardFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [aiIncidentId, setAiIncidentId] = useState<string | null>(null);
  const [aiActiveTab, setAiActiveTab] = useState<"refined" | "original">("refined");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: refinedData, isLoading: isRefining, isError: isRefineError } = useQuery({
    queryKey: ["incidents", aiIncidentId, "refine"],
    queryFn: async () => {
      if (!aiIncidentId) return null;
      const response = await api.incidents.refine(aiIncidentId);
      return response.data; // expects { success: true, original: string, refined: string }
    },
    enabled: !!aiIncidentId,
    retry: 1
  });

  const applyRefinedDescriptionMutation = useMutation({
    mutationFn: (data: { id: string; description: string }) =>
      api.incidents.update(data.id, { description: data.description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["incidents", selectedIncidentId] });
      setAiIncidentId(null);
      toast({ title: "AI Refinement Saved", description: "Incident description has been updated with the refined report." });
    },
    onError: (err: any) => {
      toast({
        title: "Error saving report",
        description: err.response?.data?.message || "Failed to update incident.",
        variant: "destructive"
      });
    }
  });

  const { data: incidentList = [], isLoading, isError, error } = useQuery({
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
      // Simple normalization for guard name mapping
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

  const { data: selectedIncident, isLoading: isDetailsLoading } = useQuery({
    queryKey: ["incidents", selectedIncidentId],
    queryFn: async () => {
      if (!selectedIncidentId) return null;
      try {
        const response = await api.incidents.getById(selectedIncidentId);
        const item = response.data?.data || response.data?.incident || response.data?.item || response.data;
        if (!item || typeof item !== 'object') return null;
        return normalizeIncident(item, 0);
      } catch (err) {
        console.error("Failed to fetch incident detail:", err);
        throw err;
      }
    },
    enabled: !!selectedIncidentId,
    retry: 1
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: string; status: string }) => 
      api.incidents.update(data.id, { 
        solved: data.status 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      toast({ title: "Status Updated", description: "Incident status has been successfully updated." });
    },
    onError: (err: any) => {
      toast({ 
        title: "Error", 
        description: err.response?.data?.message || "Failed to update incident status.", 
        variant: "destructive" 
      });
    }
  });

  const filtered = useMemo(() => {
    return incidentList.filter((i) => {
      const matchSearch = i.title.toLowerCase().includes(search.toLowerCase()) || 
                          i.guard.toLowerCase().includes(search.toLowerCase());
      const matchPriority = priorityFilter === "all" || i.priority === priorityFilter;
      const matchSite = siteFilter === "all" || i.site === siteFilter;
      const matchGuard = guardFilter === "all" || i.guard === guardFilter;
      const matchDate = dateFilter === "all" || i.date === dateFilter;
      return matchSearch && matchPriority && matchSite && matchGuard && matchDate;
    });
  }, [incidentList, search, priorityFilter, siteFilter, guardFilter, dateFilter]);

  const isNotFound = isError && ((error as any)?.response?.status === 404 || (error as any)?.message?.includes("404"));
  const showLoader = isLoading && filtered.length > 0;
  const showEmpty = filtered.length === 0 || isNotFound;
  const showError = isError && !isNotFound;

  const aiSelected = aiIncidentId ? incidentList.find((i) => i.id === aiIncidentId) : null;

  const uniqueDates = useMemo(() => [...new Set(incidentList.map((i) => i.date))].sort().reverse(), [incidentList]);
  const guardIds = useMemo(() => [...new Set(incidentList.map((i) => i.guard))].sort(), [incidentList]);
  const siteNames = useMemo(() => [...new Set(incidentList.map((i) => i.site))].sort(), [incidentList]);

  const activeFilters = [priorityFilter, siteFilter, guardFilter, dateFilter].filter((f) => f !== "all").length;

  if (!hasViewPermission) {
    return (
      <div className="p-6">
        <StateMessage
          type="error"
          title="Access Denied"
          message="You do not have permission to view Incident Management."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="module-page-header">
        <div>
          <h1 className="module-page-title">Incident Management</h1>
          <p className="text-sm text-muted-foreground">{incidentList.length} total incidents · {filtered.length} shown</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors">
          <Download className="w-4 h-4" />Export PDF
        </button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search incidents..." className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          {activeFilters > 0 && (
            <button
              onClick={() => { setPriorityFilter("all"); setSiteFilter("all"); setGuardFilter("all"); setDateFilter("all"); }}
              className="text-xs text-destructive hover:underline"
            >
              Clear {activeFilters} filter(s)
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Priority */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-1">Priority:</span>
            {["all", "high", "medium", "low"].map((p) => (
              <button key={p} onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${priorityFilter === p ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}>
                {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {/* Date */}
          <div className="w-36">
            <SelectDropdown
              value={dateFilter}
              onChange={setDateFilter}
              options={[{ value: "all", label: "All Dates" }, ...uniqueDates.map((d) => ({ value: d, label: d }))]}
              placeholder="All Dates"
              className="h-[32px] mb-0 text-xs"
            />
          </div>

          {/* Site */}
          <div className="w-36">
            <SelectDropdown
              value={siteFilter}
              onChange={setSiteFilter}
              options={[{ value: "all", label: "All Sites" }, ...siteNames.map((s) => ({ value: s, label: s }))]}
              placeholder="All Sites"
              className="h-[32px] mb-0 text-xs"
            />
          </div>

          {/* Guard */}
          <div className="w-36">
            <SelectDropdown
              value={guardFilter}
              onChange={setGuardFilter}
              options={[{ value: "all", label: "All Guards" }, ...guardIds.map((id) => ({ value: id, label: guardMap[id] || id }))]}
              placeholder="All Guards"
              className="h-[32px] mb-0 text-xs"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Incident List */}
        <div className={`${selectedIncident ? "w-1/2" : "w-full"} transition-all`}>
          <div className="data-table">
            {showLoader && (
              <StateMessage type="loading" message="Loading incidents..." className="p-4" />
            )}
            {showError && (
              <StateMessage
                type="error"
                title="Failed to load incidents"
                message={error instanceof Error ? error.message : undefined}
                className="p-4"
              />
            )}
            {!showLoader && !showError && showEmpty && (
              <StateMessage
                type="empty"
                title="Incident not found"
                message="Create a new incident to get started."
                icon={FileWarning}
                className="p-4"
              />
            )}
            {!showLoader && !showError && !showEmpty && (
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary">
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">INCIDENT</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">SITE</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">GUARD</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">PRIORITY</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">STATUS</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">DATE</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inc) => (
                    <tr key={inc.id} className={`border-b border-border cursor-pointer transition-colors ${selectedIncidentId === inc.id ? "bg-accent" : "hover:bg-secondary/50"}`} onClick={() => setSelectedIncidentId(inc.id)}>
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-foreground">{inc.title}</p>
                        <p className="text-xs text-muted-foreground">{inc.type}</p>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{inc.site}</td>
                      <td className="px-5 py-3 text-sm text-foreground">{guardMap[inc.guard] || inc.guard}</td>
                      <td className="px-5 py-3"><span className={`priority-${inc.priority}`}>{inc.priority.toUpperCase()}</span></td>
                      <td className="px-5 py-3">
                        <span className={
                          inc.status === "resolved" ? "status-badge-active" : 
                          inc.status === "open" ? "status-badge-danger" : 
                          "status-badge-warning"
                        }>
                          {inc.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground whitespace-nowrap">{inc.date}<br /><span className="text-xs">{inc.time}</span></td>
                      <td className="px-5 py-3 text-right">
                        {hasEditPermission ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <button className="p-1 hover:bg-secondary rounded-lg transition-colors">
                                <MoreVertical className="w-4 h-4 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: inc.id, status: 'open' }); }}>
                                <AlertTriangle className="w-4 h-4 mr-2 text-destructive" /> Mark Open
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: inc.id, status: 'in-progress' }); }}>
                                <Clock className="w-4 h-4 mr-2 text-warning" /> In Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: inc.id, status: 'resolved' }); }}>
                                <CheckCircle2 className="w-4 h-4 mr-2 text-success" /> Resolved
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedIncidentId && (
          <div className="w-1/2 bg-card rounded-xl border border-border p-6 min-h-[400px] flex flex-col">
            {isDetailsLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <p className="text-sm">Loading details...</p>
              </div>
            ) : selectedIncident ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">{selectedIncident.title}</h3>
                  <button onClick={() => setSelectedIncidentId(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`priority-${selectedIncident.priority}`}>{selectedIncident.priority.toUpperCase()}</span>
                    <div className="relative w-32">
                      <SelectDropdown
                        value={selectedIncident.status}
                        onChange={(val) => updateStatusMutation.mutate({ id: selectedIncident.id, status: val })}
                        options={[
                          { value: "open", label: "Open" },
                          { value: "in-progress", label: "In-Progress" },
                          { value: "resolved", label: "Resolved" },
                        ]}
                        disabled={!hasEditPermission}
                        className={`status-badge-${selectedIncident.status === 'resolved' ? 'active' : selectedIncident.status === 'open' ? 'danger' : 'warning'} h-[28px] py-0 mb-0`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Type:</span> <span className="text-foreground font-medium">{selectedIncident.type}</span></div>
                    <div><span className="text-muted-foreground">Guard:</span> <span className="text-foreground font-medium">{guardMap[selectedIncident.guard] || selectedIncident.guard}</span></div>
                    <div><span className="text-muted-foreground">Site:</span> <span className="text-foreground font-medium">{selectedIncident.site}</span></div>
                    <div><span className="text-muted-foreground">Date:</span> <span className="text-foreground font-medium">{selectedIncident.date} {selectedIncident.time}</span></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Description</p>
                    <p className="text-sm text-muted-foreground">{selectedIncident.description}</p>
                  </div>
                  {selectedIncident.hasPhotos && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Camera className="w-4 h-4" />Photos attached (3)
                    </div>
                  )}
                  <div className="pt-4 border-t border-border flex gap-3 mt-auto">
                    <button onClick={() => setAiIncidentId(selectedIncident.id)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
                      <Sparkles className="w-4 h-4" />AI Summary
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-muted">
                      <Download className="w-4 h-4" />Export PDF
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <AlertCircle className="w-6 h-6 mb-2" />
                <p className="text-sm">Failed to load incident details.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Summary Dialog */}
      <Dialog open={!!aiIncidentId} onOpenChange={(open) => !open && setAiIncidentId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-primary" />AI Report Refiner
            </DialogTitle>
          </DialogHeader>
          {aiSelected && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground">{aiSelected.title}</p>
                <p className="text-xs text-muted-foreground">{aiSelected.site} · {aiSelected.date} {aiSelected.time}</p>
              </div>

              {isRefining ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mb-2 text-primary" />
                  <p className="text-sm">Gemini AI is refining raw notes...</p>
                </div>
              ) : isRefineError ? (
                <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Failed to refine report with AI.</span>
                </div>
              ) : (
                <>
                  {/* Tab Selector */}
                  <div className="flex border-b border-border">
                    <button
                      onClick={() => setAiActiveTab("refined")}
                      className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                        aiActiveTab === "refined" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                      }`}
                    >
                      AI Refined
                    </button>
                    <button
                      onClick={() => setAiActiveTab("original")}
                      className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                        aiActiveTab === "original" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                      }`}
                    >
                      Original Notes
                    </button>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                    {aiActiveTab === "refined" ? refinedData?.refined : refinedData?.original}
                  </div>

                  <div className="flex gap-2">
                    <span className={`priority-${aiSelected.priority}`}>{aiSelected.priority.toUpperCase()}</span>
                    <span className={aiSelected.status === "resolved" ? "status-badge-active" : "status-badge-danger"}>{aiSelected.status}</span>
                  </div>

                  {aiActiveTab === "refined" && refinedData?.refined && (
                    <button
                      onClick={() =>
                        applyRefinedDescriptionMutation.mutate({
                          id: aiSelected.id,
                          description: refinedData.refined,
                        })
                      }
                      disabled={applyRefinedDescriptionMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary text-primary-foreground font-medium rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {applyRefinedDescriptionMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Approve & Update Description
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IncidentManagement;
