import { useState, useMemo, useEffect } from "react";
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
  ArrowLeftIcon,
  ArrowRightIcon,
  LogIn,
  LogOut,
  Coffee,
  ShieldOff
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/config/api";
import StateMessage from "@/components/common/StateMessage";
import SelectDropdown from "@/components/common/SelectDropdown";
import DateSelect from "@/components/common/DateSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
    <div className="p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/20 min-h-screen text-slate-900 dark:text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            Hours & Attendance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Site-centric dashboard tracking shift coverage, scheduled hours, and attendance KPIs.
          </p>
        </div>
        <div className="flex gap-2.5 w-full sm:w-auto">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-500">Start Date</span>
            <DateSelect value={customStartDate} onChange={setCustomStartDate} />
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-500">End Date</span>
            <DateSelect value={customEndDate} onChange={setCustomEndDate} />
          </div>
        </div>
      )}

      {/* Key KPI Metrics Grid — always visible, shows 0s while loading */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-1 hover:border-slate-300 transition-colors">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Sites</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary.totalSites}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-1 hover:border-slate-300 transition-colors">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Scheduled Hours</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary.totalScheduled}h</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-1 hover:border-slate-300 transition-colors">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Completed Hours</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{summary.totalWorked}h</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-1 hover:border-slate-300 transition-colors">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Remaining Hours</span>
          <p className="text-2xl font-bold text-amber-500 mt-1">{summary.remainingHours}h</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-1 hover:border-slate-300 transition-colors">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Overall Attendance</span>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{summary.overallAttendancePct}%</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-1 hover:border-slate-300 transition-colors">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Active Guards</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{summary.activeGuards}</p>
        </div>
      </div>

      {/* Search, Filters and Sort Toolbar — always visible */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by site, client, or supervisor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-[38px] rounded-lg text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
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
        </div>
      </div>

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
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Site & Client</th>
                      <th className="px-6 py-4">Supervisor</th>
                      <th className="px-6 py-4 text-right">Guards</th>
                      <th className="px-6 py-4 text-center">Hours (Completed/Scheduled)</th>
                      <th className="px-6 py-4 text-right">Remaining</th>
                      <th className="px-6 py-4 text-right">Attendance</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {processedSites.map((site: any, index: number) => (
                      <tr
                        key={site.id || index}
                        onClick={() => setSelectedSite(site)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/10 transition-colors cursor-pointer text-sm font-medium"
                      >
                        {/* Site Name and Client */}
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-900 dark:text-white text-sm block">{site.name}</span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                              {site.client}
                            </span>
                          </div>
                        </td>

                        {/* Supervisor name */}
                        <td className="px-6 py-4 text-slate-650 dark:text-slate-300">
                          {site.manager}
                        </td>

                        {/* Assigned guards count */}
                        <td className="px-6 py-4 text-right font-semibold text-slate-700 dark:text-slate-200">
                          {site.totalGuardsAssigned}
                        </td>

                        {/* Hours coverage status (Direct value, no progress bar) */}
                        <td className="px-6 py-4 text-center">
                          {formatHoursText(site.completedHours, site.totalScheduledHours)}
                        </td>

                        {/* Remaining hours */}
                        <td className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                          {site.remainingHours}h
                        </td>

                        {/* Attendance Rate */}
                        <td className="px-6 py-4 text-right">
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
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            site.status === "active"
                              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${site.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                            {site.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* View action button */}
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary/90 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs flex gap-1 items-center ml-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSite(site);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {response?.pagination && totalItems > 0 && (
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      variant="outline"
                      onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                      disabled={page === 1}
                      className="px-3 h-8 text-xs font-semibold rounded-lg"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={page === totalPages}
                      className="px-3 h-8 text-xs font-semibold rounded-lg"
                    >
                      Next
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{Math.min(totalItems, (page - 1) * limit + 1)}</span> to{" "}
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{Math.min(totalItems, page * limit)}</span> of{" "}
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{totalItems}</span> sites
                      </p>
                    </div>
                    <div className="flex gap-1.5 items-center font-medium">
                      <Button
                        variant="outline"
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                        className="px-2.5 h-8 text-xs font-semibold rounded-lg text-slate-650 dark:text-slate-300"
                      >
                        <ArrowLeftIcon />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className="px-3 h-8 text-xs font-semibold rounded-lg text-slate-650 dark:text-slate-300"
                      >
                        Previous
                      </Button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => Math.abs(p - page) <= 1 || p === 1 || p === totalPages)
                        .map((p, idx, arr) => {
                          const showDots = idx > 0 && p - arr[idx - 1] > 1;
                          return (
                            <div key={p} className="flex items-center gap-1.5">
                              {showDots && <span className="text-slate-400 px-1 text-xs font-semibold">...</span>}
                              <Button
                                variant={page === p ? "default" : "outline"}
                                onClick={() => setPage(p)}
                                className={`w-8 h-8 p-0 text-xs font-bold rounded-lg ${page === p
                                  ? "bg-primary text-white border-primary"
                                  : "text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800"
                                  }`}
                              >
                                {p}
                              </Button>
                            </div>
                          );
                        })}

                      <Button
                        variant="outline"
                        onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={page === totalPages}
                        className="px-3 h-8 text-xs font-semibold rounded-lg text-slate-650 dark:text-slate-300"
                      >
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setPage(totalPages)}
                        disabled={page === totalPages}
                        className="px-2.5 h-8 text-xs font-semibold rounded-lg text-slate-650 dark:text-slate-300"
                      >
                        <ArrowRightIcon />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center flex flex-col items-center justify-center gap-2 shadow-sm">
              <ShieldAlert className="w-8 h-8 text-slate-300 animate-pulse" />
              <span className="font-semibold text-slate-900 dark:text-white text-sm">No matching sites found</span>
              <span className="text-xs text-slate-400">Adjust your search or filter options.</span>
            </div>
          )}

          {/* Premium Details Modal */}
          <Dialog open={!!activeSelectedSite} onOpenChange={(open) => { if (!open) { setSelectedSite(null); setSelectedModalManagerId(null); } }}>
            {activeSelectedSite && (
              <DialogContent className="max-w-7xl max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl">

                {/* Modal Header */}
                <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="space-y-1">
                      <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        {activeSelectedSite.name}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {activeSelectedSite.address}
                      </DialogDescription>
                    </div>

                    <div className="flex gap-2 items-center mr-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${activeSelectedSite.status === "active"
                        ? 'bg-emerald-500/5 text-emerald-600 border border-emerald-500/10'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                        {activeSelectedSite.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </DialogHeader>

                {/* Scrollable Container */}
                <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
                  {/* Site KPIs Summary Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                    <div className="space-y-1 md:border-r border-slate-200/50 dark:border-slate-800/50 pr-0 md:pr-4">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" /> Scheduled
                      </span>
                      <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{activeSelectedSite.totalScheduledHours}h</p>
                    </div>

                    <div className="space-y-1 md:border-r border-slate-200/50 dark:border-slate-800/50 pl-0 md:pl-4 pr-0 md:pr-4">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-500" /> Completed
                      </span>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">{activeSelectedSite.completedHours}h</p>
                    </div>

                    <div className="space-y-1 md:border-r border-slate-200/50 dark:border-slate-800/50 pl-0 md:pl-4 pr-0 md:pr-4">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-amber-500" /> Remaining
                      </span>
                      <p className="text-lg font-bold text-amber-500 mt-1">{activeSelectedSite.remainingHours}h</p>
                    </div>

                    <div className="space-y-1 pl-0 md:pl-4">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-indigo-500" /> Attendance
                      </span>
                      <p className={`text-lg font-bold mt-1 ${activeSelectedSite.attendancePct >= 90 ? 'text-emerald-500' : activeSelectedSite.attendancePct >= 75 ? 'text-amber-500' : 'text-rose-500'
                        }`}>
                        {activeSelectedSite.attendancePct}%
                      </p>
                    </div>
                  </div>

                  {/* Supervisor & Operational Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Supervisor Details card */}
                    <div className="p-5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 mb-4">
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
                          <div className="max-h-[320px] overflow-y-auto  space-y-4">
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
                                  className={`cursor-pointer rounded-xl border transition-all duration-200 p-4  flex flex-row justify-between
                ${isSelected
                                      ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
                                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
                                    }`}
                                >
                                  {/* Top Section */}
                                  <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full overflow-hidden border border-primary/20 bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                                      {mgr.name?.charAt(0).toUpperCase() || "U"}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <h5 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                        {mgr.name}
                                      </h5>
                                    </div>
                                  </div>

                                  {/* Contact Info */}
                                  <div className=" space-y-2 text-xs text-slate-600 dark:text-slate-400">
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-4 h-4 shrink-0 text-slate-400" />
                                      <span className="truncate">
                                        {mgr.email || "No email assigned"}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <Phone className="w-4 h-4 shrink-0 text-slate-400" />
                                      <span>
                                        {mgr.phoneNumber || "No phone assigned"}
                                      </span>
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
                    <div className="p-5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                      <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />
                        Operational Shift Overview
                      </h4>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/5 text-indigo-500 rounded-xl">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 flex-1">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400 font-medium block">Total Completed</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{activeSelectedSite.completedShifts} / {activeSelectedSite.scheduledShifts} shifts</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400 font-medium block">Guards Assigned</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{activeSelectedSite.totalGuardsAssigned} guards</span>
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

                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs bg-white dark:bg-slate-950">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            <th className="px-4 py-3">Guard</th>
                            <th className="px-4 py-3 text-center">Live Status</th>
                            <th className="px-4 py-3 text-center">Clock In</th>
                            <th className="px-4 py-3 text-center">Clock Out</th>
                            <th className="px-4 py-3 text-center">Hours (Done/Sched)</th>
                            <th className="px-4 py-3 text-right">Attendance</th>
                            <th className="px-4 py-3 text-right">Shifts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {(() => {
                            const filtered = selectedModalManagerId
                              ? (activeSelectedSite.guardsDetail || []).filter((g: any) => String(g.managerId) === String(selectedModalManagerId))
                              : (activeSelectedSite.guardsDetail || []);

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={6} className="text-center py-12 text-slate-400">
                                    No guard assignments registered for this period {selectedModalManagerId ? "for the selected manager" : ""}.
                                  </td>
                                </tr>
                              );
                            }

                            return filtered.map((guard: any, index: number) => {
                              const formatTime = (ts: string | null) => formatUTCTime(ts);

                              const statusConfig: Record<string, { icon: React.ReactNode; cls: string; dot: string }> = {
                                'Clocked In':  { icon: <LogIn className="w-3 h-3" />,   cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500 animate-pulse' },
                                'On Break':    { icon: <Coffee className="w-3 h-3" />,   cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800',     dot: 'bg-amber-400 animate-pulse' },
                                'Clocked Out': { icon: <LogOut className="w-3 h-3" />,  cls: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800',       dot: 'bg-blue-400' },
                                'Off Duty':    { icon: <ShieldOff className="w-3 h-3" />, cls: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700', dot: 'bg-slate-400' },
                              };
                              const sc = statusConfig[guard.status] || statusConfig['Off Duty'];

                              return (
                                <tr key={guard.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-colors">
                                  {/* Name with initials avatar */}
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <div className="relative">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-[11px] font-bold shadow-xs">
                                          {guard.avatar}
                                        </div>
                                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-950 ${sc.dot}`} />
                                      </div>
                                      <span className="font-semibold text-slate-900 dark:text-white">{guard.name}</span>
                                    </div>
                                  </td>

                                  {/* Live Status Badge */}
                                  <td className="px-4 py-3 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.cls}`}>
                                      {sc.icon}
                                      {guard.status || 'Off Duty'}
                                    </span>
                                  </td>

                                  {/* Clock In */}
                                  <td className="px-4 py-3 text-center">
                                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                      <LogIn className="w-3 h-3" />
                                      {formatTime(guard.clockIn)}
                                    </span>
                                  </td>

                                  {/* Clock Out */}
                                  <td className="px-4 py-3 text-center">
                                    <span className={`inline-flex items-center gap-1 font-semibold ${
                                      guard.clockOut ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                                    }`}>
                                      <LogOut className="w-3 h-3" />
                                      {formatTime(guard.clockOut)}
                                    </span>
                                  </td>

                                  {/* Completed / Scheduled Hours */}
                                  <td className="px-4 py-3 text-center">
                                    {formatHoursText(guard.completedHours, guard.assignedHours)}
                                  </td>

                                  {/* Attendance Rate */}
                                  <td className="px-4 py-3 text-right">
                                    <span className={`font-bold text-xs ${
                                      guard.attendancePct >= 90 ? 'text-emerald-500' : guard.attendancePct >= 75 ? 'text-amber-500' : 'text-rose-500'
                                    }`}>
                                      {guard.attendancePct}%
                                    </span>
                                  </td>

                                  {/* Completed vs missed shifts */}
                                  <td className="px-4 py-3 text-right">
                                    <span className="font-semibold text-slate-700 dark:text-slate-350">{guard.completedShifts} done</span>
                                    {guard.missedShifts > 0 && (
                                      <span className="text-rose-500 font-semibold ml-1">({guard.missedShifts} missed)</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Close modal action button */}
                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedSite(null)}
                    className="px-4 h-9 text-xs font-semibold rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    Close Details
                  </Button>
                </div>
              </DialogContent>
            )}
          </Dialog>
        </>
      )
      }
    </div >
  );
};

export default HoursTracking;
