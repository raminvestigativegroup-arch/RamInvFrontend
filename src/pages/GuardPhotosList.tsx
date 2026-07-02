import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, API_BASE_URL } from "@/config/api";
import { Search, Mail, Phone, MapPin, Camera, Loader2, Users } from "lucide-react";
import StateMessage from "@/components/common/StateMessage";
import SelectDropdown from "@/components/common/SelectDropdown";
import TablePagination from "@/components/common/TablePagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const normalizeGuardsResponse = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];

  if (Array.isArray(response.data)) return response.data;
  if (response.data && typeof response.data === "object" && !Array.isArray(response.data)) {
    const dataObj = response.data;
    if (Array.isArray(dataObj.guards)) return dataObj.guards;
    if (Array.isArray(dataObj.items)) return dataObj.items;
    if (Array.isArray(dataObj.results)) return dataObj.results;
  }
  if (Array.isArray(response.guards)) return response.guards;
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(response.results)) return response.results;
  return [];
};

const normalizeGuard = (guard: any, index: number): any => {
  const firstName = String(guard.firstName || "");
  const middleName = String(guard.middleName || "");
  const lastName = String(guard.lastName || "");
  const name = String(guard.name || [firstName, middleName, lastName].filter(Boolean).join(" ") || guard.fullName || "Unnamed Guard");
  return {
    id: String(guard.id || guard._id || `G${String(index + 1).padStart(3, "0")}`),
    name,
    firstName,
    middleName,
    lastName,
    email: String(guard.email || ""),
    phoneNumber: String(guard.phoneNumber || guard.mobile || ""),
    site: String(guard.site || guard.siteName || "Unassigned"),
    status: guard.status === "on-duty" || guard.status === "break" ? guard.status : "off-duty",
    profilePhoto: String(guard.profilePhoto || guard.avatar || ""),
    isVerified: guard.isVerified === true || guard.verified === true || guard.verified === "true" || guard.isVerified === "true",
  };
};

const GuardPhotosList = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [complianceFilter, setComplianceFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, verifiedFilter, siteFilter, complianceFilter]);

  const { data: siteList = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      try {
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
        return (Array.isArray(list) ? list : []).map((s: any) => ({
          id: s.id || s._id,
          name: s.name || "Unnamed Site"
        }));
      } catch (e) {
        return [];
      }
    }
  });

  const { data: scheduleRaw = [] } = useQuery({
    queryKey: ["scheduling", "all"],
    queryFn: async () => {
      try {
        const response = await api.scheduling.list();
        const raw = response.data as any;
        const list = Array.isArray(raw) ? raw : (raw?.data || raw?.schedules || raw?.items || []);
        return Array.isArray(list) ? list : [];
      } catch (e) {
        return [];
      }
    }
  });

  const getGuardAssignments = (guardId: string) => {
    const guardSchedules = scheduleRaw.filter((s: any) => {
      const ids = Array.isArray(s.guardIds) ? s.guardIds.map(String) : (s.guardId ? [String(s.guardId)] : []);
      return ids.includes(String(guardId)) && (s.status === "scheduled" || s.status === "in-progress" || s.status === "started");
    });

    return guardSchedules.map((s: any) => {
      const siteObj = siteList.find((site: any) => String(site.id) === String(s.siteId));
      return {
        scheduleId: s.id,
        siteName: siteObj ? siteObj.name : "Unknown Site",
        siteAddress: siteObj ? siteObj.address : "",
        startDate: s.startDate,
        endDate: s.endDate,
        shiftStart: s.shiftStart ? s.shiftStart.substring(0, 5) : "",
        shiftEnd: s.shiftEnd ? s.shiftEnd.substring(0, 5) : "",
        status: s.status,
      };
    });
  };

  const {
    data: guardData = { guards: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1, pageSize: limit } },
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["guards-photos-list", debouncedSearch, verifiedFilter, siteFilter, complianceFilter, page],
    queryFn: async () => {
      const params: any = {
        page,
        limit,
      };
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      if (verifiedFilter !== "all") {
        params.verified = verifiedFilter === "verified" ? "true" : "false";
      }
      if (siteFilter !== "all") {
        params.siteId = siteFilter;
      }
      if (complianceFilter !== "all") {
        params.complianceStatus = complianceFilter;
      }
      const response = await api.guards.list(params);
      const rawData = response.data?.data || response.data || {};
      const normalizedList = normalizeGuardsResponse(rawData);
      const guards = normalizedList.map(normalizeGuard);
      const paginationObj = rawData.pagination || {
        totalItems: guards.length,
        totalPages: Math.max(1, Math.ceil(guards.length / limit)),
        currentPage: page,
        pageSize: limit,
      };
      return { guards, pagination: paginationObj };
    },
  });

  const { guards, pagination } = guardData;

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="module-page-header">
        <div>
          <h1 className="module-page-title">Guard Clock-In Photos</h1>
          <p className="text-sm text-muted-foreground">
            Select a guard to review their clock-in verification photos timeline by date.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guards..."
            className="pl-9 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 h-[38px] rounded-lg text-sm w-full placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end items-center">
          <SelectDropdown
            value={verifiedFilter}
            onChange={setVerifiedFilter}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "verified", label: "Verified Only" },
              { value: "unverified", label: "Unverified Only" },
            ]}
            placeholder="Status"
            className="w-full sm:w-[135px]"
          />

          <SelectDropdown
            value={siteFilter}
            onChange={setSiteFilter}
            options={[
              { value: "all", label: "All Sites" },
              { value: "unassigned", label: "Unassigned" },
              ...siteList.map((s: any) => ({ value: s.name, label: s.name })),
            ]}
            placeholder="Assigned Site"
            className="w-full sm:w-[150px]"
          />

          <SelectDropdown
            value={complianceFilter}
            onChange={setComplianceFilter}
            options={[
              { value: "all", label: "All Compliance" },
              { value: "valid", label: "Valid License" },
              { value: "expiring", label: "Expiring Soon" },
              { value: "expired", label: "Expired License" },
            ]}
            placeholder="Compliance"
            className="w-full sm:w-[150px]"
          />

          {(verifiedFilter !== "all" || siteFilter !== "all" || complianceFilter !== "all") && (
            <Button
              onClick={() => {
                setVerifiedFilter("all");
                setSiteFilter("all");
                setComplianceFilter("all");
              }}
              variant="ghost"
              size="sm"
              className="text-xs h-[38px] font-semibold text-slate-500 hover:text-slate-700"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading && (
        <StateMessage type="loading" message="Loading guards list..." />
      )}

      {isError && (
        <StateMessage
          type="error"
          title="Failed to load guards"
          message={error instanceof Error ? error.message : "Error connecting to the API."}
        />
      )}

      {!isLoading && !isError && guards.length === 0 && (
        <StateMessage
          type="empty"
          title="No Guards Found"
          message="No guards matching the search criteria."
          icon={Users}
        />
      )}

      {!isLoading && !isError && guards.length > 0 && (
        <>
          <div className="data-table">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary/50 border-b border-border">
                    <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Guard</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Email</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Phone</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Assigned Site</th>
                    <th className="text-center text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Duty Status</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {guards.map((guard: any) => {
                    const profilePhotoUrl = resolveImageUrl(guard.profilePhoto);
                    const assignments = getGuardAssignments(guard.id);
                    const uniqueSiteNames = Array.from(new Set(assignments.map(a => a.siteName)));
                    const siteText = uniqueSiteNames.length > 0 ? uniqueSiteNames.join(", ") : "Unassigned";
                    return (
                      <tr
                        key={guard.id}
                        onClick={() => navigate(`/dashboard/guard-photos/${guard.id}`)}
                        className="hover:bg-secondary/30 transition-colors cursor-pointer text-sm font-medium"
                      >
                        {/* Guard Avatar & Name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border border-border shrink-0">
                              <AvatarImage src={profilePhotoUrl} alt={guard.name} className="object-cover" />
                              <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold flex items-center justify-center h-full w-full">
                                {getInitials(guard.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-bold text-foreground text-sm block hover:text-primary transition-colors">
                              {guard.name}
                            </span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-5 py-4 text-muted-foreground text-xs">
                          {guard.email || "-"}
                        </td>

                        {/* Phone */}
                        <td className="px-5 py-4 text-muted-foreground text-xs">
                          {guard.phoneNumber || "-"}
                        </td>

                        {/* Assigned Site */}
                        <td className="px-5 py-4 text-muted-foreground text-xs">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{siteText}</span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <Badge
                            variant={
                              guard.status === "on-duty"
                                ? "success"
                                : guard.status === "break"
                                ? "warning"
                                : "inactive"
                            }
                            className="h-5 text-[10px]"
                            showDot
                          >
                            {guard.status === "on-duty" ? "On Duty" : guard.status === "break" ? "Break" : "Off Duty"}
                          </Badge>
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary hover:bg-secondary font-semibold text-xs flex gap-1 items-center ml-auto"
                            onClick={() => navigate(`/dashboard/guard-photos/${guard.id}`)}
                          >
                            <Camera className="w-3.5 h-3.5" /> View Photos
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <TablePagination
            page={page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            limit={limit}
            onPageChange={setPage}
            itemLabel="guards"
            className="mt-6 rounded-xl border border-border bg-card"
          />
        </>
      )}
    </div>
  );
};

export default GuardPhotosList;
