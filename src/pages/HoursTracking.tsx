import { useState, useMemo, useEffect, Fragment } from "react";
import {
  Download,
  Loader2,
  Building2,
  Users,
  Clock,
  Calendar,
  Search,
  MapPin,
  TrendingUp,
  ShieldAlert,
  UserCheck,
  Mail,
  Phone,
  Eye,
  CheckCircle,
  FileText,
  MoveLeft,
  ArrowLeft,
  LogIn,
  LogOut,
  Coffee,
  Briefcase,
  ShieldOff,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/config/api";
import StateMessage from "@/components/common/StateMessage";
import SelectDropdown from "@/components/common/SelectDropdown";
import DateSelect from "@/components/common/DateSelect";
import TableToolbar from "@/components/common/TableToolbar";
import TablePagination from "@/components/common/TablePagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { formatUTCTime } from "@/lib/dateUtils";

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

const HoursTracking = () => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const permissions = user?.permissions || [];
  const isAdmin = user?.role === "admin";

  const hasViewPermission = isAdmin || permissions.includes("view_hour") || permissions.includes("hour");
  const hasEditPermission = isAdmin || permissions.includes("edit_hour") || permissions.includes("hour");

  const [period, setPeriod] = useState<"this-week" | "last-week" | "all" | "custom">("this-week");

  // Custom date range state
  const todayStr = new Date().toISOString().split("T")[0];
  const [customStartDate, setCustomStartDate] = useState<string>(todayStr);
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);

  // Filter & Sort States
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "scheduled" | "attendance" | "progress">("name");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery, clientFilter, statusFilter, sortBy, period]);

  // Selected site for modal detail view
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [selectedModalManagerId, setSelectedModalManagerId] = useState<string | null>(null);

  const getDatesForPeriod = (p: typeof period) => {
    if (p === "all") return { startDate: "", endDate: "" };
    if (p === "custom") return { startDate: customStartDate, endDate: customEndDate };

    const now = new Date();
    if (p === "this-week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return {
        startDate: monday.toISOString().split("T")[0],
        endDate: sunday.toISOString().split("T")[0]
      };
    } else {
      // last-week
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
      const monday = new Date(now.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return {
        startDate: monday.toISOString().split("T")[0],
        endDate: sunday.toISOString().split("T")[0]
      };
    }
  };

  const { startDate, endDate } = getDatesForPeriod(period);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["hours-tracking", period, startDate, endDate, debouncedSearchQuery, clientFilter, statusFilter, sortBy, page],
    queryFn: () => api.hoursTracking.list({
      startDate,
      endDate,
      search: debouncedSearchQuery,
      client: clientFilter,
      status: statusFilter,
      sortBy,
      page,
      limit
    }).then(res => res.data),
    enabled: hasViewPermission,
  });

  const summary = response?.summary || {
    totalScheduled: 0,
    totalWorked: 0,
    totalOvertime: 0,
    totalShortage: 0,
    totalSites: 0,
    activeGuards: 0,
    overallAttendancePct: 0,
    remainingHours: 0
  };

  const sitesList = response?.sites || [];

  // Get unique clients for filter dropdown from server response
  const uniqueClients = response?.clients || [];

  // Server-side filtered & sorted sites list
  const processedSites = sitesList;
  const totalPages = response?.pagination?.totalPages || 1;
  const totalItems = response?.pagination?.totalItems || 0;

  // Dynamically update the selectedSite object if data updates
  const activeSelectedSite = useMemo(() => {
    if (!selectedSite) return null;
    if (selectedSite.id) {
      return processedSites.find((s: any) => s.id === selectedSite.id) || selectedSite;
    }
    return selectedSite;
  }, [processedSites, selectedSite]);

  // Direct Completed/Scheduled Hours formater with requested color coding
  const formatHoursText = (completed: number, scheduled: number) => {
    let colorClass = "text-slate-600 dark:text-slate-400"; // default if 0 completed

    if (completed > scheduled) {
      colorClass = "text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 px-2.5 py-1 rounded-lg"; // red if exceeded
    } else if (completed === scheduled && scheduled > 0) {
      colorClass = "text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 px-2.5 py-1 rounded-lg"; // green if completed
    } else if (completed > 0 && completed < scheduled) {
      colorClass = "text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 px-2.5 py-1 rounded-lg"; // yellow if in progress
    } else if (completed === 0 && scheduled > 0) {
      colorClass = "text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 px-2.5 py-1 rounded-lg"; // not started
    }

    return (
      <span className={`inline-flex items-center text-xs tracking-wide ${colorClass}`}>
        {completed}/{scheduled} hours
      </span>
    );
  };

  const exportToCSV = () => {
    if (processedSites.length === 0) return;
    const headers = [
      "SITE",
      "CLIENT",
      "SUPERVISOR",
      "SCHEDULED HOURS",
      "COMPLETED HOURS",
      "REMAINING HOURS",
      "PROGRESS (%)",
      "GUARDS ASSIGNED",
      "ATTENDANCE (%)",
      "COMPLETED SHIFTS",
      "SCHEDULED SHIFTS",
      "STATUS"
    ];

    const rows = processedSites.map((s: any) => [
      s.name,
      s.client,
      s.manager,
      `${s.totalScheduledHours}h`,
      `${s.completedHours}h`,
      `${s.remainingHours}h`,
      `${s.progress}%`,
      s.totalGuardsAssigned,
      `${s.attendancePct}%`,
      s.completedShifts,
      s.scheduledShifts,
      s.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + [headers.join(","), ...rows.map((r: any) => r.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Site_Hours_Attendance_Report_${period}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!hasViewPermission) {
    return (
      <div className="p-6">
        <StateMessage
          type="error"
          title="Access Denied"
          message="You do not have permission to view Hours & Attendance."
        />
      </div>
    );
  }

  const periodOptions = [
    { value: "this-week", label: "This Week" },
    { value: "last-week", label: "Last Week" },
    { value: "all", label: "All Time" },
    { value: "custom", label: "Custom Range" }
  ];

  const clientOptions = [
    { value: "all", label: "All Clients" },
    ...uniqueClients.map(client => ({ value: client, label: client }))
  ];

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" }
  ];

  const sortOptions = [
    { value: "name", label: "Sort: Site Name" },
    { value: "scheduled", label: "Sort: Scheduled Hours" },
    { value: "attendance", label: "Sort: Attendance Rate" },
    { value: "progress", label: "Sort: Progress %" }
  ];

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="module-page-header">
          <div>
            <h1 className="module-page-title">Hours & Attendance</h1>
            <p className="text-sm text-muted-foreground">
              Site-centric dashboard tracking shift coverage, scheduled hours, and attendance KPIs.
            </p>
          </div>
          <div className="flex gap-2.5 items-center">
            <SelectDropdown
              value={period}
              onChange={(val) => setPeriod(val as any)}
              options={periodOptions}
              placeholder="Select period"
              className="w-[140px]"
            />

            {hasEditPermission && (
              <Button
                onClick={exportToCSV}
                disabled={isLoading || processedSites.length === 0}
                className="bg-primary hover:bg-primary/95 text-white flex gap-1.5 items-center px-4 py-2 text-xs font-semibold rounded-lg shadow-sm"
              >
                <Download className="w-4 h-4" /> Export CSV
              </Button>
            )}
          </div>
        </div>

        {/* Date Pickers for Custom Range */}
        {period === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-card rounded-xl border border-border shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Start Date</span>
              <DateSelect value={customStartDate} onChange={setCustomStartDate} />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">End Date</span>
              <DateSelect value={customEndDate} onChange={setCustomEndDate} />
            </div>
          </div>
        )}

        {/* Key KPI Metrics Grid — always visible, shows 0s while loading */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-1 hover:border-border/80 transition-colors">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Sites</span>
            <p className="text-2xl font-bold text-foreground mt-1">{summary.totalSites}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-1 hover:border-border/80 transition-colors">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Scheduled Hours</span>
            <p className="text-2xl font-bold text-foreground mt-1">{summary.totalScheduled}h</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-1 hover:border-border/80 transition-colors">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Completed Hours</span>
            <p className="text-2xl font-bold text-success mt-1">{summary.totalWorked}h</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-1 hover:border-border/80 transition-colors">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Remaining Hours</span>
            <p className="text-2xl font-bold text-amber-500 mt-1">{summary.remainingHours}h</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-1 hover:border-border/80 transition-colors">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Overall Attendance</span>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{summary.overallAttendancePct}%</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-1 hover:border-border/80 transition-colors">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Active Guards</span>
            <p className="text-2xl font-bold text-foreground mt-1">{summary.activeGuards}</p>
          </div>
        </div>

        {/* Search, Filters and Sort Toolbar — always visible */}
        <TableToolbar
          search={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search by site, client, or supervisor..."
        >
          <SelectDropdown
            value={clientFilter}
            onChange={setClientFilter}
            options={clientOptions}
            placeholder="Client filter"
            className="w-full sm:w-[150px]"
          />
          <SelectDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            placeholder="Status filter"
            className="w-full sm:w-[120px]"
          />
          <SelectDropdown
            value={sortBy}
            onChange={(val) => setSortBy(val as any)}
            options={sortOptions}
            placeholder="Sort by"
            className="w-full sm:w-[160px]"
          />
        </TableToolbar>

        {/* Sites Data Table — loading/error/data shown here only */}
        {isLoading ? (
          <StateMessage type="loading" message="Loading hours and attendance..." className="m-4" />
        ) : error ? (
          <StateMessage
            type="error"
            title="Error Loading Data"
            message="Failed to fetch hours and attendance details from the server."
          />
        ) : (
          <>
            {/* Sites Data Table */}
            {processedSites.length > 0 ? (
              <div className="data-table">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-secondary/50 border-b border-border">
                        <th className="w-12 px-4 py-4"></th>
                        <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Site & Client</th>
                        <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Supervisor</th>
                        <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Guards</th>
                        <th className="text-center text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Hours (Completed/Scheduled)</th>
                        <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Remaining</th>
                        <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Attendance</th>
                        <th className="text-center text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Status</th>
                        <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {processedSites.map((site: any, index: number) => {
                        const isExpanded = !!expandedRows[site.id];
                        return (
                          <Fragment key={site.id || index}>
                            <tr
                              onClick={() => toggleRow(site.id)}
                              className={`hover:bg-secondary/30 transition-colors cursor-pointer text-sm font-medium ${isExpanded ? 'bg-secondary/10 border-b-0' : ''
                                }`}
                            >
                              <td className="px-4 py-4 text-center">
                                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ease-in-out ${isExpanded ? 'rotate-90 text-primary' : ''
                                  }`} />
                              </td>
                              {/* Site Name and Client */}
                              <td className="px-5 py-4">
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-foreground text-sm block">{site.name}</span>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                                    {site.client}
                                  </span>
                                </div>
                              </td>

                              {/* Supervisor name */}
                              <td className="px-5 py-4 text-foreground">
                                {site.manager}
                              </td>

                              {/* Assigned guards count */}
                              <td className="px-5 py-4 text-right font-semibold text-foreground">
                                {site.totalGuardsAssigned}
                              </td>

                              {/* Hours coverage status (Direct value, no progress bar) */}
                              <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                {site.deviationReasons && site.deviationReasons.length > 0 ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button className="cursor-help border-b border-dashed border-muted-foreground/50 pb-0.5 outline-none">
                                        {formatHoursText(site.completedHours, site.totalScheduledHours)}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="w-64 p-3 bg-slate-900 text-white border-slate-700 dark:bg-slate-950 dark:border-slate-800 shadow-xl rounded-lg">
                                      <div className="font-semibold mb-1.5 text-[10px] uppercase tracking-wider text-slate-400">Site Deviations Summary</div>
                                      <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-200">
                                        {site.deviationReasons.map((r: string, rIdx: number) => (
                                          <li key={rIdx} className="break-words">{r}</li>
                                        ))}
                                      </ul>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  formatHoursText(site.completedHours, site.totalScheduledHours)
                                )}
                              </td>

                              {/* Remaining hours */}
                              <td className="px-5 py-4 text-right font-semibold text-foreground">
                                {site.remainingHours}h
                              </td>

                              {/* Attendance Rate */}
                              <td className="px-5 py-4 text-right">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${site.attendancePct >= 90
                                  ? 'bg-emerald-500/5 text-emerald-600 border border-emerald-500/10'
                                  : site.attendancePct >= 75
                                    ? 'bg-amber-500/5 text-amber-600 border border-amber-500/10'
                                    : 'bg-rose-500/5 text-rose-600 border border-rose-500/10'
                                  }`}>
                                  {site.attendancePct}%
                                </span>
                              </td>

                              {/* Active/Inactive Status */}
                              <td className="px-5 py-4 text-center">
                                <Badge variant={site.status === "active" ? "success" : "inactive"} showDot>
                                  {site.status === "active" ? "Active" : "Inactive"}
                                </Badge>
                              </td>

                              {/* View action button */}
                              <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-primary hover:text-primary hover:bg-secondary font-semibold text-xs flex gap-1 items-center ml-auto"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSite(site);
                                  }}
                                >
                                  <Eye className="w-3.5 h-3.5" /> View
                                </Button>
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className="bg-secondary/15 dark:bg-slate-900/10 border-b border-border/50">
                                <td colSpan={9} className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                                  <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {/* Site Deviation Summary Panel */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                      <div className="lg:col-span-1 bg-card/65 p-4 rounded-xl border border-border/60 shadow-xs space-y-3">
                                        <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                                          <ShieldAlert className="w-4 h-4 text-amber-500" />
                                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">Site Deviations</span>
                                        </div>
                                        {site.deviationReasons && site.deviationReasons.length > 0 ? (
                                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                            {site.deviationReasons.map((reason: string, idx: number) => {
                                              const isOvertime = reason.toLowerCase().includes('overtime');
                                              return (
                                                <div
                                                  key={idx}
                                                  className={`text-xs px-3 py-2 rounded-lg border flex flex-col gap-0.5 ${isOvertime
                                                      ? 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-100/60 dark:border-rose-900/20 text-rose-700 dark:text-rose-400'
                                                      : 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-100/60 dark:border-amber-900/20 text-amber-700 dark:text-amber-400'
                                                    }`}
                                                >
                                                  <span className="font-semibold text-[10px] uppercase tracking-wider">
                                                    {isOvertime ? 'Overtime Alert' : 'Shortage Alert'}
                                                  </span>
                                                  <span className="font-medium">{reason}</span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <div className="text-xs text-muted-foreground py-6 text-center">
                                            No overtime or shortage deviations logged for this site.
                                          </div>
                                        )}
                                      </div>

                                      {/* Guards Breakdown sub-table */}
                                      <div className="lg:col-span-2 space-y-3">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">Guards Shift Breakdown</span>
                                        </div>
                                        <div className="border border-border/60 rounded-xl overflow-hidden shadow-xs bg-card/40">
                                          <table className="w-full text-xs">
                                            <thead>
                                              <tr className="bg-secondary/40 border-b border-border/50 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                                <th className="px-4 py-2.5 text-left">Guard</th>
                                                <th className="px-4 py-2.5 text-center">Completed/Scheduled</th>
                                                <th className="px-4 py-2.5 text-right">Attendance</th>
                                                <th className="px-4 py-2.5 text-left">Deviation Reasons / Notes</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/40">
                                              {site.guardsDetail && site.guardsDetail.length > 0 ? (
                                                site.guardsDetail.map((g: any, gIdx: number) => {
                                                  return (
                                                    <tr key={g.id || gIdx} className="hover:bg-secondary/20 transition-colors">
                                                      <td className="px-4 py-2.5 font-medium text-foreground">
                                                        <div className="flex items-center gap-2">
                                                          <span className="w-6 h-6 rounded-full bg-secondary border border-border/80 flex items-center justify-center text-[10px] font-bold">
                                                            {g.avatar}
                                                          </span>
                                                          <span>{g.name}</span>
                                                        </div>
                                                      </td>
                                                      <td className="px-4 py-2.5 text-center">
                                                        {g.deviationReasons && g.deviationReasons.length > 0 ? (
                                                          <Tooltip>
                                                            <TooltipTrigger asChild>
                                                              <button className="cursor-help border-b border-dashed border-muted-foreground/50 pb-0.5 outline-none">
                                                                {formatHoursText(g.completedHours, g.assignedHours)}
                                                              </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="w-60 p-2.5 bg-slate-900 text-white border-slate-700 dark:bg-slate-950 dark:border-slate-800 shadow-xl rounded-lg">
                                                              <div className="font-semibold mb-1 text-[10px] uppercase tracking-wider text-slate-400">Shift Deviations</div>
                                                              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-200">
                                                                {g.deviationReasons.map((r: string, rIdx: number) => (
                                                                  <li key={rIdx} className="break-words">{r}</li>
                                                                ))}
                                                              </ul>
                                                            </TooltipContent>
                                                          </Tooltip>
                                                        ) : (
                                                          formatHoursText(g.completedHours, g.assignedHours)
                                                        )}
                                                      </td>
                                                      <td className="px-4 py-2.5 text-right font-semibold">
                                                        <span className={g.attendancePct >= 90 ? 'text-success' : g.attendancePct >= 75 ? 'text-amber-500' : 'text-destructive'}>
                                                          {g.attendancePct}%
                                                        </span>
                                                      </td>
                                                      <td className="px-4 py-2.5 text-left text-muted-foreground text-[11px] max-w-[200px] truncate">
                                                        {g.deviationReasons && g.deviationReasons.length > 0 ? (
                                                          <div className="space-y-0.5">
                                                            {g.deviationReasons.map((r: string, rIdx: number) => (
                                                              <span key={rIdx} className="block truncate font-medium text-slate-600 dark:text-slate-400">
                                                                {r}
                                                              </span>
                                                            ))}
                                                          </div>
                                                        ) : (
                                                          <span className="text-slate-400">-</span>
                                                        )}
                                                      </td>
                                                    </tr>
                                                  );
                                                })
                                              ) : (
                                                <tr>
                                                  <td colSpan={4} className="text-center py-4 text-muted-foreground text-xs">
                                                    No guards registered.
                                                  </td>
                                                </tr>
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {response?.pagination && totalItems > 0 && (
                  <TablePagination
                    page={page}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    limit={limit}
                    onPageChange={setPage}
                    itemLabel="sites"
                  />
                )}
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-12 text-center flex flex-col items-center justify-center gap-2 shadow-sm">
                <ShieldAlert className="w-8 h-8 text-muted-foreground animate-pulse" />
                <span className="font-semibold text-foreground text-sm">No matching sites found</span>
                <span className="text-xs text-muted-foreground">Adjust your search or filter options.</span>
              </div>
            )}

            {/* Premium Details Modal */}
            <Dialog open={!!activeSelectedSite} onOpenChange={(open) => { if (!open) { setSelectedSite(null); setSelectedModalManagerId(null); } }}>
              {activeSelectedSite && (
                <DialogContent className="max-w-7xl">

                  {/* Modal Header */}
                  <DialogHeader>
                    <div className="flex items-start justify-between flex-wrap gap-3 pr-6">
                      <div className="space-y-1">
                        <DialogTitle className="flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-primary" />
                          {activeSelectedSite.name}
                        </DialogTitle>
                        <DialogDescription className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {activeSelectedSite.address}
                        </DialogDescription>
                      </div>
                      <Badge variant={activeSelectedSite.status === "active" ? "success" : "inactive"} showDot>
                        {activeSelectedSite.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </DialogHeader>

                  {/* Scrollable Container */}
                  <DialogBody className="space-y-6">
                    {/* Site KPIs Summary Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Scheduled Card */}
                      <div className="group relative bg-card border border-border/80 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all overflow-hidden pl-5">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/70" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Scheduled
                        </span>
                        <p className="text-xl font-extrabold text-foreground mt-2">{activeSelectedSite.totalScheduledHours}h</p>
                      </div>

                      {/* Completed Card */}
                      <div className="group relative bg-card border border-border/80 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all overflow-hidden pl-5">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-success" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-success" /> Completed
                        </span>
                        <p className="text-xl font-extrabold text-success mt-2">{activeSelectedSite.completedHours}h</p>
                      </div>

                      {/* Remaining Card */}
                      <div className="group relative bg-card border border-border/80 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all overflow-hidden pl-5">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-warning" /> Remaining
                        </span>
                        <p className="text-xl font-extrabold text-warning mt-2">{activeSelectedSite.remainingHours}h</p>
                      </div>

                      {/* Attendance Card */}
                      {(() => {
                        const attendancePct = activeSelectedSite.attendancePct;
                        const attendanceColor = attendancePct >= 90 ? "bg-success" : attendancePct >= 75 ? "bg-warning" : "bg-destructive";
                        const attendanceText = attendancePct >= 90 ? "text-success" : attendancePct >= 75 ? "text-warning" : "text-destructive";
                        return (
                          <div className="group relative bg-card border border-border/80 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all overflow-hidden pl-5">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${attendanceColor}`} />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> Attendance
                            </span>
                            <p className={`text-xl font-extrabold mt-2 ${attendanceText}`}>{attendancePct}%</p>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Supervisor & Operational Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Supervisor Details card */}
                      <div className="p-5 bg-card rounded-xl border border-border shadow-xs">
                        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5 mb-4">
                          <Users className="w-3.5 h-3.5 text-primary" />
                          Assigned Managers
                        </h4>

                        {(() => {
                          const mgrs =
                            activeSelectedSite.managers &&
                              activeSelectedSite.managers.length > 0
                              ? activeSelectedSite.managers
                              : [
                                {
                                  id:
                                    activeSelectedSite.managerId ||
                                    activeSelectedSite.managerid,
                                  name:
                                    activeSelectedSite.manager || "Unassigned",
                                  email: activeSelectedSite.managerEmail,
                                  phoneNumber:
                                    activeSelectedSite.managerPhone,
                                },
                              ].filter((m) => m.name !== "Unassigned");

                          if (mgrs.length === 0) {
                            return (
                              <div className="text-xs text-muted-foreground py-8 text-center">
                                No managers assigned to this site.
                              </div>
                            );
                          }

                          return (
                            <div className="max-h-[320px] overflow-y-auto space-y-3 pr-1">
                              {mgrs.map((mgr: any, idx: number) => {
                                const isSelected =
                                  selectedModalManagerId === String(mgr.id);

                                return (
                                  <div
                                    key={idx}
                                    onClick={() =>
                                      setSelectedModalManagerId(
                                        isSelected ? null : String(mgr.id)
                                      )
                                    }
                                    className={`group relative cursor-pointer rounded-xl border transition-all duration-200 p-4 flex flex-row items-center justify-between overflow-hidden
                                    ${isSelected
                                        ? "bg-card border-primary shadow-sm font-semibold"
                                        : "bg-card/50 border-border hover:bg-secondary/40 text-muted-foreground"
                                      }`}
                                  >
                                    {isSelected && (
                                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                    )}

                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full border border-primary/20 bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                                        {mgr.name?.charAt(0).toUpperCase() || "U"}
                                      </div>
                                      <div className="truncate">
                                        <h5 className="text-sm font-bold text-foreground truncate">
                                          {mgr.name}
                                        </h5>
                                        {/* <p className="text-[10px] text-muted-foreground mt-0.5">Manager ID: {mgr.id || "N/A"}</p> */}
                                      </div>
                                    </div>

                                    <div className="space-y-1 text-[11px] text-right shrink-0">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <span className="truncate text-muted-foreground">{mgr.email || "No email"}</span>
                                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                                      </div>
                                      <div className="flex items-center justify-end gap-1.5">
                                        <span className="text-muted-foreground">{mgr.phoneNumber || "No phone"}</span>
                                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Operational stats card */}
                      <div className="group relative bg-card rounded-xl border border-border p-5 shadow-xs overflow-hidden pl-6">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 mb-4">
                          <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />
                          Operational Shift Overview
                        </h4>
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div className="grid grid-cols-2 gap-4 flex-1">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-muted-foreground font-semibold block uppercase tracking-wider">Total Completed</span>
                              <span className="text-base font-extrabold text-foreground">{activeSelectedSite.completedShifts} / {activeSelectedSite.scheduledShifts} shifts</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-muted-foreground font-semibold block uppercase tracking-wider">Guards Assigned</span>
                              <span className="text-base font-extrabold text-foreground">{activeSelectedSite.totalGuardsAssigned} guards</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Assigned Guards Detail Table */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-primary" />
                          Guards Assignment Details
                        </h4>
                        {selectedModalManagerId && (
                          <button
                            onClick={() => setSelectedModalManagerId(null)}
                            className="text-[10px] text-primary hover:underline font-semibold bg-primary/5 px-2 py-1 rounded-md"
                          >
                            Clear Manager Filter
                          </button>
                        )}
                      </div>

                      <div className="border border-border rounded-xl overflow-hidden shadow-xs bg-card">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-secondary/50 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                              <th className="px-5 py-3.5 text-left">Guard</th>
                              <th className="px-5 py-3.5 text-center">Live Status</th>
                              <th className="px-5 py-3.5 text-center">Clock In</th>
                              <th className="px-5 py-3.5 text-center">Clock Out</th>
                              <th className="px-5 py-3.5 text-center">Hours (Done/Sched)</th>
                              <th className="px-5 py-3.5 text-right">Attendance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {(() => {
                              const filtered = selectedModalManagerId
                                ? (activeSelectedSite.guardsDetail || []).filter((g: any) => String(g.managerId) === String(selectedModalManagerId))
                                : (activeSelectedSite.guardsDetail || []);

                              if (filtered.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                                      No guard assignments registered for this period {selectedModalManagerId ? "for the selected manager" : ""}.
                                    </td>
                                  </tr>
                                );
                              }

                              return filtered.map((guard: any, index: number) => {
                                const formatTime = (ts: string | null) => formatUTCTime(ts);
                                const clockInVal = formatTime(guard.clockIn);
                                const clockOutVal = formatTime(guard.clockOut);
                                const hasClockIn = guard.clockIn && clockInVal && clockInVal !== "-";
                                const hasClockOut = guard.clockOut && clockOutVal && clockOutVal !== "-";

                                const statusDotClass =
                                  guard.status === 'Clocked In' ? 'bg-success animate-pulse' :
                                    guard.status === 'On Break' ? 'bg-warning animate-pulse' :
                                      guard.status === 'Clocked Out' ? 'bg-info' :
                                        'bg-muted-foreground';

                                return (
                                  <tr key={guard.id || index} className="hover:bg-secondary/30 transition-colors">
                                    {/* Name with initials avatar */}
                                    <td className="px-5 py-3.5">
                                      <div className="flex items-center gap-2.5">
                                        <div className="relative">
                                          <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground text-[11px] font-bold shadow-xs">
                                            {guard.avatar}
                                          </div>
                                          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background ${statusDotClass}`} />
                                        </div>
                                        <span className="font-semibold text-foreground">{guard.name}</span>
                                      </div>
                                    </td>

                                    {/* Live Status Badge */}
                                    <td className="px-5 py-3.5 text-center">
                                      <Badge
                                        variant={
                                          guard.status === 'Clocked In' ? 'success' :
                                            guard.status === 'On Break' ? 'warning' :
                                              guard.status === 'Clocked Out' ? 'info' :
                                                'inactive'
                                        }
                                        showDot
                                      >
                                        {guard.status || 'Off Duty'}
                                      </Badge>
                                    </td>

                                    {/* Clock In */}
                                    <td className="px-5 py-3.5 text-center">
                                      {hasClockIn ? (
                                        <span className="inline-flex items-center gap-1 text-success font-semibold">
                                          <LogIn className="w-3 h-3" />
                                          {clockInVal}
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground font-medium">-</span>
                                      )}
                                    </td>

                                    {/* Clock Out */}
                                    <td className="px-5 py-3.5 text-center">
                                      {hasClockOut ? (
                                        <span className="inline-flex items-center gap-1 text-info font-semibold">
                                          <LogOut className="w-3 h-3" />
                                          {clockOutVal}
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground font-medium">-</span>
                                      )}
                                    </td>

                                    {/* Completed / Scheduled Hours */}
                                    <td className="px-5 py-3.5 text-center">
                                      {guard.deviationReasons && guard.deviationReasons.length > 0 ? (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button className="cursor-help border-b border-dashed border-muted-foreground/50 pb-0.5 outline-none font-medium">
                                              {formatHoursText(guard.completedHours, guard.assignedHours)}
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent className="w-60 p-2.5 bg-slate-900 text-white border-slate-700 dark:bg-slate-950 dark:border-slate-800 shadow-xl rounded-lg">
                                            <div className="font-semibold mb-1 text-[10px] uppercase tracking-wider text-slate-400">Shift Deviations</div>
                                            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-200">
                                              {guard.deviationReasons.map((r: string, rIdx: number) => (
                                                <li key={rIdx} className="break-words">{r}</li>
                                              ))}
                                            </ul>
                                          </TooltipContent>
                                        </Tooltip>
                                      ) : (
                                        <span className="font-medium">
                                          {formatHoursText(guard.completedHours, guard.assignedHours)}
                                        </span>
                                      )}
                                    </td>

                                    {/* Attendance Rate */}
                                    <td className="px-5 py-3.5 text-right">
                                      <span className={`font-bold text-xs ${guard.attendancePct >= 90 ? 'text-success' : guard.attendancePct >= 75 ? 'text-amber-500' : 'text-destructive'
                                        }`}>
                                        {guard.attendancePct}%
                                      </span>
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </DialogBody>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedSite(null)}
                    >
                      Close Details
                    </Button>
                  </DialogFooter>
                </DialogContent>
              )}
            </Dialog>
          </>
        )
        }
      </div >
    </TooltipProvider>
  );
};

export default HoursTracking;
