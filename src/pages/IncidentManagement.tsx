import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/config/api";
import TablePagination from "@/components/common/TablePagination";
import { Download, Sparkles, Camera, X, AlertCircle, MoreVertical, CheckCircle2, Clock, AlertTriangle, FileWarning, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import StateMessage from "@/components/common/StateMessage";
import SelectDropdown from "@/components/common/SelectDropdown";
import DateSelect from "@/components/common/DateSelect";
import TableToolbar from "@/components/common/TableToolbar";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/common/UserAvatar";
import { formatUTCTime, formatUTCDate } from "@/lib/dateUtils";
import { downloadIncidentReportPDF } from "@/lib/incidentPdfGenerator";
interface Incident {
  id: string;
  title: string;
  type: string;
  site: string;
  guard: string;
  guardDetails?: {
    id: string;
    name: string;
    profilePhoto: string | null;
  } | null;
  priority: "high" | "medium" | "low" | "critical";
  status: "open" | "in-progress" | "resolved";
  date: string;
  time: string;
  description: string;
  hasPhotos?: boolean;
  images?: string[];
  pdfUrl?: string | null;
  isRefinedByAdmin?: boolean;
}

const resolveImageUrl = (pathOrData: string | undefined | null) => {
  if (!pathOrData) return "";
  if (pathOrData.startsWith("data:") || pathOrData.startsWith("http:") || pathOrData.startsWith("https:")) {
    return pathOrData;
  }
  const cleanPath = pathOrData.replace(/\\/g, "/");
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:4001/api/v1";
  const host = apiBase.replace("/api/v1", "");
  if (cleanPath.startsWith("uploads/")) {
    return `${host}/${cleanPath}`;
  }
  return `${host}/uploads/${encodeURIComponent(cleanPath)}`;
};

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
      date = formatUTCDate(d.toISOString());
      time = formatUTCTime(d.toISOString());
    }
  } else if (data.createdAt) {
    const d = new Date(data.createdAt);
    if (!isNaN(d.getTime())) {
      date = formatUTCDate(d.toISOString());
      time = formatUTCTime(d.toISOString());
    }
  }

  let images: string[] = [];
  if (data.image) {
    if (typeof data.image === 'string') {
      try {
        const parsed = JSON.parse(data.image);
        if (Array.isArray(parsed)) {
          images = parsed;
        } else if (parsed) {
          images = [String(parsed)];
        }
      } catch (e) {
        if (data.image.startsWith('[') && data.image.endsWith(']')) {
          images = data.image.slice(1, -1).split(',').map((s: string) => s.trim().replace(/^["']|["']$/g, ''));
        } else {
          images = data.image.split(',').map((s: string) => s.trim());
        }
      }
    } else if (Array.isArray(data.image)) {
      images = data.image;
    }
  }

  const hasPhotos = Boolean(data.image || data.hasPhotos || images.length > 0);
  let finalImages = images.length > 0 ? images.map(img => resolveImageUrl(img)) : [];
  if (hasPhotos && finalImages.length === 0) {
    finalImages = [
      "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80"
    ];
  }

  let guardDetails = null;
  if (data.guard && typeof data.guard === 'object') {
    const firstName = data.guard.firstName || "";
    const lastName = data.guard.lastName || "";
    guardDetails = {
      id: String(data.guard.id || ""),
      name: `${firstName} ${lastName}`.trim() || data.guard.email || "Unknown Guard",
      profilePhoto: data.guard.profilePhoto || null,
    };
  }

  return {
    id: String(data.id || data._id || `INC${String(index + 1).padStart(3, "0")}`),
    title: String(data.incidentType || data.title || "General Incident"),
    type: String(data.incidentType || data.type || "Security"),
    site: String(data.site || "Unknown Site"),
    guard: String(data.guardId || data.guard || "Unknown Guard"),
    guardDetails,
    priority: (data.priority === "high" || data.priority === "medium" || data.priority === "low" || data.priority === "critical") ? data.priority : "medium",
    // Use the 'solved' string field as the source of truth for status
    status: (data.solved === "resolved" || data.solved === "in-progress" || data.solved === "open")
      ? data.solved
      : (data.status || "open"),
    date,
    time,
    description: String(data.description || "No description provided."),
    hasPhotos,
    images: finalImages,
    pdfUrl: data.pdfUrl || null,
    isRefinedByAdmin: Boolean(data.isRefinedByAdmin),
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [guardFilter, setGuardFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [aiIncidentId, setAiIncidentId] = useState<string | null>(null);
  const [aiActiveTab, setAiActiveTab] = useState<"refined" | "original">("refined");
  const [deletingIncident, setDeletingIncident] = useState<Incident | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, priorityFilter, siteFilter, guardFilter, dateFilter]);

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
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["incidents"] }),
        queryClient.invalidateQueries({ queryKey: ["incidents", selectedIncidentId] })
      ]);
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

  const { data: guardList = [] } = useQuery({
    queryKey: ["guards"],
    queryFn: async () => {
      const response = await api.guards.list();
      // Simple normalization for guard name mapping
      const raw = response.data?.data || response.data?.guards || response.data?.items || (Array.isArray(response.data) ? response.data : []);
      return (Array.isArray(raw) ? raw : []).map(g => ({
        id: String(g.id || g._id),
        name: String(g.name || g.fullName || "Unknown Guard"),
        profilePhoto: g.profilePhoto || null
      }));
    }
  });

  const { data: siteList = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const response = await api.sites.list();
      const raw = response.data as any;
      let list: any[] = [];
      if (Array.isArray(raw)) list = raw;
      else if (Array.isArray(raw?.data)) list = raw.data;
      else if (raw?.data && typeof raw.data === 'object') {
        list = raw.data.site || raw.data.sites || raw.data.items || raw.data.results || [];
      } else {
        list = raw?.site || raw?.sites || raw?.items || raw?.results || [];
      }
      return (Array.isArray(list) ? list : []).map(s => ({
        id: String(s.id || s._id),
        name: String(s.name || "Unknown Site")
      }));
    }
  });

  const { data: incidentData = { incidents: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1, pageSize: limit } }, isLoading, isError, error } = useQuery({
    queryKey: ["incidents", debouncedSearch, priorityFilter, siteFilter, guardFilter, dateFilter, page],
    queryFn: async () => {
      const params: any = {
        page,
        limit,
      };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (priorityFilter !== "all") params.priority = priorityFilter;
      if (siteFilter !== "all") {
        const selectedSite = siteList.find(s => s.name === siteFilter);
        params.siteId = selectedSite ? selectedSite.id : siteFilter;
      }
      if (guardFilter !== "all") {
        params.guardId = guardFilter;
      }
      if (dateFilter !== "all") params.date = dateFilter;

      const response = await api.incidents.list(params);
      const rawData = response.data?.data || response.data || {};
      const normalizedList = normalizeIncidentsResponse(rawData);
      const incidents = normalizedList.map((inc, index) => normalizeIncident(inc, index));
      const paginationObj = rawData.pagination || {
        totalItems: incidents.length,
        totalPages: Math.max(1, Math.ceil(incidents.length / limit)),
        currentPage: page,
        pageSize: limit
      };
      return { incidents, pagination: paginationObj };
    },
    enabled: hasViewPermission,
  });

  const incidentList = incidentData.incidents;
  const pagination = incidentData.pagination;



  const guardMap = useMemo(() => {
    return guardList.reduce((acc, g) => {
      acc[g.id] = g;
      return acc;
    }, {} as Record<string, { id: string; name: string; profilePhoto: string | null }>);
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
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["incidents"] }),
        queryClient.invalidateQueries({ queryKey: ["incidents", selectedIncidentId] })
      ]);
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.incidents.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      if (selectedIncidentId === deletingIncident?.id) setSelectedIncidentId(null);
      setDeletingIncident(null);
      toast({ title: "Incident Deleted", description: "The incident has been permanently removed." });
    },
    onError: (err: any) => {
      toast({
        title: "Delete Failed",
        description: err.response?.data?.message || "Failed to delete the incident.",
        variant: "destructive"
      });
    }
  });

  const filtered = incidentList;

  const isNotFound = isError && ((error as any)?.response?.status === 404 || (error as any)?.message?.includes("404"));
  const showLoader = isLoading;
  const showEmpty = !isLoading && (filtered.length === 0 || isNotFound);
  const showError = isError && !isNotFound;

  const aiSelected = aiIncidentId ? incidentList.find((i) => i.id === aiIncidentId) : null;

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
        <Button variant="secondary">
          <Download className="w-4 h-4" />Export PDF
        </Button>
      </div>

      {/* Search, Filters and Sort Toolbar */}
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search incidents..."
        hasActiveFilters={activeFilters > 0}
        onResetFilters={() => {
          setPriorityFilter("all");
          setSiteFilter("all");
          setGuardFilter("all");
          setDateFilter("all");
        }}
      >
        <SelectDropdown
          value={priorityFilter}
          onChange={setPriorityFilter}
          options={[
            { value: "all", label: "All Priorities" },
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Low" },
            { value: "critical", label: "Critical" }
          ]}
          placeholder="Priority"
          className="w-full sm:w-[130px]"
        />
        <div className="w-full sm:w-[150px]">
          <DateSelect
            value={dateFilter === "all" ? "" : dateFilter}
            onChange={(val) => setDateFilter(val || "all")}
            placeholder="All Dates"
            className="mb-1"
            isFilter={true}
          />
        </div>
        <SelectDropdown
          value={siteFilter}
          onChange={setSiteFilter}
          options={[{ value: "all", label: "All Sites" }, ...siteList.map((s) => ({ value: s.name, label: s.name }))]}
          placeholder="Site"
          className="w-full sm:w-[140px]"
        />
        <SelectDropdown
          value={guardFilter}
          onChange={setGuardFilter}
          options={[{ value: "all", label: "All Guards" }, ...guardList.map((g) => ({ value: g.id, label: g.name }))]}
          placeholder="Guard"
          className="w-full sm:w-[140px]"
        />
      </TableToolbar>

      <div className="flex gap-6">
        {/* Incident List */}
        <div className={`${selectedIncident ? "w-1/2" : "w-full"} transition-all`}>
          <DataTable
            columns={[
              { key: "incident", label: "Incident" },
              { key: "site", label: "Site" },
              { key: "guard", label: "Guard" },
              { key: "priority", label: "Priority" },
              { key: "status", label: "Status" },
              { key: "date", label: "Date" },
              { key: "actions", label: "Actions", align: "right" },
            ]}
            data={filtered}
            isLoading={showLoader}
            isError={showError}
            isEmpty={showEmpty}
            loadingMessage="Loading incidents..."
            emptyTitle="Incident not found"
            emptyMessage="Create a new incident to get started."
            emptyIcon={FileWarning}
            renderRow={(inc) => (
              <tr
                key={inc.id}
                className={`cursor-pointer ${selectedIncidentId === inc.id ? "bg-accent/60" : ""}`}
                onClick={() => setSelectedIncidentId(inc.id)}
              >
                <td>
                  <p className="font-medium text-foreground">{inc.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{inc.type}</p>
                </td>
                <td className="text-muted-foreground">{inc.site}</td>
                <td>
                  {(() => {
                    const guardObj = inc.guardDetails || guardMap[inc.guard];
                    const guardName = guardObj ? guardObj.name : inc.guard;
                    const guardPhoto = guardObj ? guardObj.profilePhoto : null;
                    return (
                      <div className="flex items-center gap-2">
                        <UserAvatar src={guardPhoto} name={guardName} size="sm" />
                        <span>{guardName}</span>
                      </div>
                    );
                  })()}
                </td>
                <td><span className={`priority-${inc.priority}`}>{inc.priority.toUpperCase()}</span></td>
                <td>
                  <Badge variant={inc.status === "resolved" ? "success" : inc.status === "open" ? "danger" : "warning"} showDot>
                    {inc.status}
                  </Badge>
                </td>
                <td className="text-muted-foreground whitespace-nowrap">
                  {inc.date}<br /><span className="text-xs">{inc.time}</span>
                </td>
                <td className="text-right">
                  {hasEditPermission ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={updateStatusMutation.isPending}>
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: inc.id, status: 'open' }); }}>
                          <AlertTriangle className="w-4 h-4 mr-2 text-destructive" /> Mark Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: inc.id, status: 'in-progress' }); }}>
                          <Clock className="w-4 h-4 mr-2 text-warning" /> In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: inc.id, status: 'resolved' }); }}>
                          <CheckCircle2 className="w-4 h-4 mr-2 text-success" /> Resolved
                        </DropdownMenuItem>
                        {hasDeletePermission && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); setDeletingIncident(inc); }}
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            )}
          />
          <TablePagination
            page={page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            limit={limit}
            onPageChange={setPage}
            itemLabel="incidents"
            className="mt-4 rounded-xl border border-border bg-card"
          />
        </div>

        {/* Detail Panel */}
        {selectedIncidentId && (
          <div className="w-1/2 bg-card rounded-xl border border-border p-6 min-h-[400px] flex flex-col">
            {isDetailsLoading ? (
              <StateMessage type="loading" message="Loading details..." inline className="m-auto" />
            ) : selectedIncident ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">{selectedIncident.title}</h3>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedIncidentId(null)} className="text-muted-foreground hover:text-foreground h-8 w-8"><X className="w-5 h-5" /></Button>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`priority-${selectedIncident.priority}`}>{selectedIncident.priority.toUpperCase()}</span>
                    {selectedIncident.pdfUrl && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold py-1 px-2.5 rounded-full bg-primary/10 text-primary">
                        <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                        Refined by {selectedIncident.isRefinedByAdmin ? 'Admin' : 'Manager'}
                      </div>
                    )}
                    <div className="relative w-32">
                      <SelectDropdown
                        value={selectedIncident.status}
                        onChange={(val) => updateStatusMutation.mutate({ id: selectedIncident.id, status: val })}
                        options={[
                          { value: "open", label: "Open" },
                          { value: "in-progress", label: "In-Progress" },
                          { value: "resolved", label: "Resolved" },
                        ]}
                        disabled={!hasEditPermission || updateStatusMutation.isPending}
                        variant={selectedIncident.status === 'resolved' ? 'success' : selectedIncident.status === 'open' ? 'destructive' : 'warning'}
                        className="h-[28px] py-0 mb-0 font-semibold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Type:</span> <span className="text-foreground font-medium">{selectedIncident.type}</span></div>
                    <div>
                      {(() => {
                        const guardObj = selectedIncident.guardDetails || guardMap[selectedIncident.guard];
                        const guardName = guardObj ? guardObj.name : selectedIncident.guard;
                        const guardPhoto = guardObj ? guardObj.profilePhoto : null;
                        return (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Guard:</span>
                            <UserAvatar src={guardPhoto} name={guardName} size="sm" />
                            <span className="text-foreground font-medium">{guardName}</span>
                          </div>
                        );
                      })()}
                    </div>
                    <div><span className="text-muted-foreground">Site:</span> <span className="text-foreground font-medium">{selectedIncident.site}</span></div>
                    <div><span className="text-muted-foreground">Date:</span> <span className="text-foreground font-medium">{selectedIncident.date} {selectedIncident.time}</span></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Description</p>
                    <p className="text-sm text-muted-foreground">{selectedIncident.description}</p>
                  </div>
                  {selectedIncident.hasPhotos && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <Camera className="w-3.5 h-3.5 text-primary" />
                        Photos attached ({selectedIncident.images?.length || 0})
                      </div>
                      {selectedIncident.images && selectedIncident.images.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {selectedIncident.images.map((imgUrl, idx) => (
                            <a
                              key={idx}
                              href={imgUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted hover:opacity-90 transition-opacity group cursor-zoom-in"
                            >
                              <img
                                src={imgUrl}
                                alt={`Incident attachment ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground italic">
                          Photos are referenced but path is unavailable.
                        </div>
                      )}
                    </div>
                  )}
                  <div className="pt-4 border-t border-border flex gap-3 mt-auto">
                    {!selectedIncident.isRefinedByAdmin && (
                      <Button onClick={() => setAiIncidentId(selectedIncident.id)} size="sm">
                        <Sparkles className="w-4 h-4" />AI Summary
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        if (selectedIncident?.pdfUrl) {
                          window.open(selectedIncident.pdfUrl, '_blank');
                        } else {
                          setIsPdfGenerating(true);
                          try {
                            await downloadIncidentReportPDF(selectedIncident.description, selectedIncident.title);
                          } catch (err) {
                            toast({
                              title: "PDF Error",
                              description: "Failed to generate PDF. Please try again.",
                              variant: "destructive",
                            });
                          } finally {
                            setIsPdfGenerating(false);
                          }
                        }
                      }}
                      disabled={isPdfGenerating}
                    >
                      {isPdfGenerating ? (
                        <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full inline-block" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Export PDF
                    </Button>
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
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />AI Report Refiner
            </DialogTitle>
          </DialogHeader>
          {aiSelected && (
            <DialogBody>
              <div>
                <p className="text-sm font-semibold text-foreground">{aiSelected.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{aiSelected.site} · {aiSelected.date} {aiSelected.time}</p>
              </div>

              {isRefining ? (
                <StateMessage type="loading" message="OpenAI GPT is refining your report..." className="py-6" />
              ) : isRefineError ? (
                <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Failed to refine report with AI.</span>
                </div>
              ) : (
                <>
                  {/* Tab Selector */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setAiActiveTab("refined")}
                      variant={aiActiveTab === "refined" ? "default" : "secondary"}
                      size="sm"
                      className="rounded-full"
                    >
                      AI Refined
                    </Button>
                    <Button
                      onClick={() => setAiActiveTab("original")}
                      variant={aiActiveTab === "original" ? "default" : "secondary"}
                      size="sm"
                      className="rounded-full"
                    >
                      Original Notes
                    </Button>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                    {aiActiveTab === "refined" ? refinedData?.refined : refinedData?.original}
                  </div>

                  <div className="flex gap-2">
                    <span className={`priority-${aiSelected.priority}`}>{aiSelected.priority.toUpperCase()}</span>
                    <Badge variant={aiSelected.status === "resolved" ? "success" : "danger"} showDot>{aiSelected.status}</Badge>
                  </div>
                </>
              )}
            </DialogBody>
          )}
          {aiSelected && aiActiveTab === "refined" && refinedData?.refined && !isRefining && !isRefineError && (
            <DialogFooter>
              <Button
                variant="secondary"
                size="sm"
                disabled={isPdfGenerating}
                onClick={async () => {
                  setIsPdfGenerating(true);
                  try {
                    if (refinedData?.pdfUrl) {
                      window.open(refinedData.pdfUrl, '_blank');
                    } else {
                      await downloadIncidentReportPDF(refinedData.refined, aiSelected.title);
                    }
                  } catch (err) {
                    toast({
                      title: "PDF Error",
                      description: "Failed to generate PDF. Please try again.",
                      variant: "destructive",
                    });
                  } finally {
                    setIsPdfGenerating(false);
                  }
                }}
                className="gap-2"
              >
                {isPdfGenerating ? (
                  <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full inline-block" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download PDF
              </Button>
              <Button
                onClick={() =>
                  applyRefinedDescriptionMutation.mutate({
                    id: aiSelected.id,
                    description: refinedData.refined,
                  })
                }
                loading={applyRefinedDescriptionMutation.isPending}
                className="gap-2"
              >
                {!applyRefinedDescriptionMutation.isPending && <CheckCircle2 className="w-4 h-4" />}
                Approve & Update Description
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingIncident} onOpenChange={(open) => !open && setDeletingIncident(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <AlertDialogTitle>Delete Incident?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{" "}
              <strong>{deletingIncident?.title}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={deleteMutation.isPending}>Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={() => deletingIncident && deleteMutation.mutate(deletingIncident.id)}
                loading={deleteMutation.isPending}
              >
                Delete Incident
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default IncidentManagement;
