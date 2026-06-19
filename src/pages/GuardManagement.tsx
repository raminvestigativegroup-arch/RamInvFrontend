import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, API_BASE_URL } from "@/config/api";
import { sites, Guard } from "@/data/dummyData";
import { Search, Plus, Filter, MoreVertical, Mail, Phone, User, ShieldCheck, Trash2, AlertCircle, Image, Upload, Users, Loader2, FileText, Calendar, MapPin, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useToast } from "@/hooks/use-toast";
import EntityCard from "@/components/common/EntityCard";
import EntityDialog from "@/components/common/EntityDialog";
import SelectDropdown from "@/components/common/SelectDropdown";
import FormField from "@/components/common/FormField";
import StateMessage from "@/components/common/StateMessage";
import { Button } from "@/components/ui/button";

type GuardApiResponse =
  | Guard[]
  | {
    data?: Guard[] | { guards?: Guard[]; items?: Guard[]; results?: Guard[] };
    guards?: Guard[];
    items?: Guard[];
    results?: Guard[];
  };

type RawRecord = Record<string, unknown>;

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const normalizeGuardsResponse = (response: unknown): RawRecord[] => {
  if (Array.isArray(response)) return response as RawRecord[];
  if (!response || typeof response !== "object") return [];

  const obj = response as Record<string, unknown>;
  if (Array.isArray(obj.data)) return obj.data as RawRecord[];
  if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
    const dataObj = obj.data as Record<string, unknown>;
    if (Array.isArray(dataObj.guards)) return dataObj.guards as RawRecord[];
    if (Array.isArray(dataObj.items)) return dataObj.items as RawRecord[];
    if (Array.isArray(dataObj.results)) return dataObj.results as RawRecord[];
  }
  if (Array.isArray(obj.guards)) return obj.guards as RawRecord[];
  if (Array.isArray(obj.items)) return obj.items as RawRecord[];
  if (Array.isArray(obj.results)) return obj.results as RawRecord[];
  return [];
};

const normalizeRolesResponse = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (response.data && !Array.isArray(response.data)) {
    return response.data.roles || response.data.role || response.data.items || response.data.results || [];
  }
  return response.roles || response.role || response.items || response.results || [];
};

const normalizeRole = (role: any): any => ({
  id: String(role.id || role._id || ""),
  name: String(role.name || "Unknown Role"),
});

const normalizeGuard = (guard: RawRecord, index: number): any => {
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
    licenseExpiry: String(guard.licenseExpiry || guard.license_expiry || "N/A"),
    complianceStatus:
      guard.complianceStatus === "expiring" || guard.complianceStatus === "expired"
        ? guard.complianceStatus
        : "valid",
    lastSeen: String(guard.lastSeen || "Never"),
    lat: Number(guard.lat || 0),
    lng: Number(guard.lng || 0),
    profilePhoto: String(guard.profilePhoto || guard.avatar || ""),
    hoursThisWeek: Number(guard.hoursThisWeek || 0),
    scheduledHours: Number(guard.scheduledHours || 0),
    isVerified: guard.isVerified === true || guard.verified === true || guard.verified === "true" || guard.isVerified === "true",
    roleId: String(guard.roleId || ""),
    managerId: String(guard.managerId || ""),
    manager: guard.manager || null,
  };
};

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

const getComplianceDetails = (personId: string, documents: any[]) => {
  const personDocs = documents.filter((doc: any) => doc.ownerId === personId && doc.ownerType === "Guard");
  if (personDocs.length === 0) {
    return { complianceStatus: "N/A", licenseExpiry: "N/A" };
  }

  let licenseDoc = personDocs.find((doc: any) =>
    (doc.name || "").toLowerCase().includes("license")
  );
  if (!licenseDoc) {
    licenseDoc = personDocs[0];
  }

  let status = "valid";
  let expiryDateStr = "N/A";

  if (licenseDoc) {
    expiryDateStr = licenseDoc.expiryDate || "N/A";
    if (licenseDoc.expiryDate) {
      const expDate = new Date(licenseDoc.expiryDate);
      if (!isNaN(expDate.getTime())) {
        expiryDateStr = expDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      } else {
        expiryDateStr = String(licenseDoc.expiryDate).split("T")[0];
      }

      const today = new Date();
      const diffMs = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        status = "expired";
      } else if (diffDays <= 30) {
        status = "expiring";
      } else {
        status = "valid";
      }
    }
  }

  return { complianceStatus: status, licenseExpiry: expiryDateStr };
};

const GuardManagement = () => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const permissions = user?.permissions || [];
  const isAdmin = user?.role === "admin";

  const hasViewPermission = isAdmin || permissions.includes("view_guard") || permissions.includes("guard");
  const hasCreatePermission = isAdmin || permissions.includes("create_guard") || permissions.includes("guard");
  const hasEditPermission = isAdmin || permissions.includes("edit_guard") || permissions.includes("guard");
  const hasDeletePermission = isAdmin || permissions.includes("delete_guard") || permissions.includes("guard");

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    site: sites[0]?.name || "",
    licenseExpiry: "2027-01-01",
    image: "",
    roleType: "",
    managerId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingGuard, setEditingGuard] = useState<any | null>(null);
  const [deletingGuard, setDeletingGuard] = useState<Guard | null>(null);
  const [verifyingGuard, setVerifyingGuard] = useState<Guard | null>(null);
  const [isVerifiedChecked, setIsVerifiedChecked] = useState(false);
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [imageError, setImageError] = useState(false);


  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch compliance documents
  const { data: rawDocuments = [] } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const response = await api.documents.list();
      const data = response.data?.data || response.data || {};
      const docs = Array.isArray(data) ? data : (Array.isArray(data.documents) ? data.documents : (data.id ? [data] : []));
      return docs;
    },
  });

  const {
    data: guardList = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["guards", debouncedSearch],
    queryFn: async () => {
      const params: any = {};
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      const response = await api.guards.list(params);
      return normalizeGuardsResponse(response.data as GuardApiResponse).map(normalizeGuard);
    },
    enabled: hasViewPermission,
  });

  const { data: rolesList = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await api.roles.list();
      return normalizeRolesResponse(response.data).map(normalizeRole);
    },
    enabled: hasViewPermission,
  });

  const { data: rawManagers = [] } = useQuery({
    queryKey: ["managers", "all"],
    queryFn: async () => {
      const response = await api.managers.list();
      return response.data?.data || response.data || [];
    },
  });

  const managersList = useMemo(() => {
    const rawList = Array.isArray(rawManagers) ? rawManagers : ((rawManagers as any).managers || []);
    return rawList.map((m: any) => ({
      id: m.id,
      name: `${m.firstName || m.name || ""} ${m.lastName || ""}`.trim() || "Unknown Manager"
    }));
  }, [rawManagers]);

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: { firstName: string; middleName?: string; lastName: string; email: string; phoneNumber: string; roleType: string; profilePhoto?: string; managerId?: string }) =>
      api.guards.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guards"] });
      setOpen(false);
      setForm({ firstName: "", middleName: "", lastName: "", email: "", phoneNumber: "", site: sites[0]?.name || "", licenseExpiry: "2027-01-01", image: "", roleType: "", managerId: "" });
      toast({ title: "Guard Added", description: "The new guard has been registered successfully." });
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || "Failed to add guard. Please try again.";
      setErrors(prev => ({ ...prev, form: errMsg }));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; firstName?: string; middleName?: string; lastName?: string; phoneNumber?: string; roleType?: string; verified?: string; profilePhoto?: string; managerId?: string | null }) =>
      api.guards.update(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guards"] });
      setOpen(false);
      setEditingGuard(null);
      setForm({ firstName: "", middleName: "", lastName: "", email: "", phoneNumber: "", site: sites[0]?.name || "", licenseExpiry: "2027-01-01", image: "", roleType: "", managerId: "" });
      toast({ title: "Guard Updated", description: "The guard information has been updated successfully." });
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || "Failed to update guard. Please try again.";
      setErrors(prev => ({ ...prev, form: errMsg }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.guards.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guards"] });
      setDeletingGuard(null);
      toast({ title: "Guard Deleted", description: "The guard has been removed successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete guard. Please try again.",
        variant: "destructive",
      });
    },
  });


  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [complianceFilter, setComplianceFilter] = useState("all");

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

  const [viewingSchedulesGuard, setViewingSchedulesGuard] = useState<{ guard: Guard; assignments: any[] } | null>(null);

  // Fetch active scheduling entries
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

  const filtered = useMemo(() => {
    return guardList.filter((g) => {
      const matchVerified =
        verifiedFilter === "all" ||
        (verifiedFilter === "verified" && g.isVerified) ||
        (verifiedFilter === "unverified" && !g.isVerified);

      const assignments = getGuardAssignments(g.id);
      const uniqueSiteNames = Array.from(new Set(assignments.map(a => a.siteName.toLowerCase())));

      const matchSite =
        siteFilter === "all" ||
        (siteFilter === "unassigned" && uniqueSiteNames.length === 0) ||
        uniqueSiteNames.includes(siteFilter.toLowerCase());

      const matchCompliance =
        complianceFilter === "all" ||
        g.complianceStatus === complianceFilter;
      return matchVerified && matchSite && matchCompliance;
    });
  }, [guardList, verifiedFilter, siteFilter, complianceFilter, scheduleRaw, siteList]);

  const isNotFound = isError && ((error as any)?.response?.status === 404 || (error as any)?.message?.includes("404"));
  const showLoader = isLoading;
  const showEmpty = !isLoading && (filtered.length === 0 || isNotFound);
  const showError = isError && !isNotFound;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(f => ({ ...f, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!form.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!editingGuard) {
      if (!form.email.trim()) {
        newErrors.email = "Email is required";
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
          newErrors.email = "Invalid email format";
        }
      }
    }
    if (!form.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else {
      const phoneRegex = /^[+\d\s\-()]+$/;
      if (!phoneRegex.test(form.phoneNumber)) {
        newErrors.phoneNumber = "Invalid format";
      }
    }
    if (!form.roleType.trim()) {
      newErrors.roleType = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingGuard) {
      updateMutation.mutate({
        id: editingGuard.id,
        firstName: form.firstName,
        middleName: form.middleName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber,
        roleType: form.roleType,
        profilePhoto: form.image,
        managerId: form.managerId || null,
      });
    } else {
      createMutation.mutate({
        firstName: form.firstName,
        middleName: form.middleName,
        lastName: form.lastName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        roleType: form.roleType || "guard",
        profilePhoto: form.image,
        managerId: form.managerId || null,
      });
    }
  };

  const handleEditClick = (guard: any) => {
    setEditingGuard(guard);
    setForm({
      firstName: guard.firstName || "",
      middleName: guard.middleName || "",
      lastName: guard.lastName || "",
      email: guard.email,
      phoneNumber: guard.phoneNumber,
      site: guard.site,
      licenseExpiry: guard.licenseExpiry,
      image: resolveImageUrl(guard.profilePhoto) || "",
      roleType: rolesList.find((r: any) => r.id === guard.roleId)?.name || "",
      managerId: guard.managerId || "",
    });
    setOpen(true);
  };


  if (!hasViewPermission) {
    return (
      <div className="p-6">
        <StateMessage
          type="error"
          title="Access Denied"
          message="You do not have permission to view Guard Management."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="module-page-header">
        <div>
          <h1 className="module-page-title">Guard Management</h1>
          <p className="text-sm text-muted-foreground">{guardList.length} guards registered</p>
        </div>
        {hasCreatePermission && (
          <Button
            onClick={() => setOpen(true)}
          >
            <Plus className="w-4 h-4" />Add Guard
          </Button>
        )}
      </div>

      {/* Search, Filters and Sort Toolbar */}
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

      {showLoader && (
        <StateMessage type="loading" message="Loading guards..." />
      )}

      {showError && (
        <StateMessage
          type="error"
          title="Failed to load guards"
          message={error instanceof Error ? error.message : undefined}
        />
      )}

      {!showLoader && !showError && showEmpty && (
        <StateMessage
          type="empty"
          title="Guard not found"
          message="Create a new guard to get started."
          icon={Users}
        />
      )}

      {!showLoader && !showError && !showEmpty && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((guard) => {
            const { complianceStatus, licenseExpiry } = getComplianceDetails(guard.id, rawDocuments);
            const assignments = getGuardAssignments(guard.id);
            const uniqueSiteNames = Array.from(new Set(assignments.map(a => a.siteName)));
            const siteText = uniqueSiteNames.length > 0 ? uniqueSiteNames.join(", ") : "Unassigned";

            return (
              <EntityCard
                key={guard.id}
                title={guard.name}
                subtitle={rolesList.find((r: any) => r.id === guard.roleId)?.name || "Guard"}
                avatar={{
                  text: getInitials(guard.name),
                  src: resolveImageUrl(guard.profilePhoto)
                }}
                details={[
                  { icon: Mail, content: guard.email },
                  { icon: Phone, content: guard.phoneNumber },
                  { icon: MapPin, content: siteText },
                  { icon: User, content: guard.manager ? `Manager: ${guard.manager.name || `${guard.manager.firstName || ""} ${guard.manager.lastName || ""}`.trim()}` : "No Manager Assigned" },
                ]}
                footerLeft={undefined}
                footerMiddle={
                  <span className={guard.isVerified ? "status-badge-active" : "status-badge-inactive"}>
                    {guard.isVerified ? "Verified" : "Not Verified"}
                  </span>
                }
                footerRight={
                  <span className={guard.status === "on-duty" ? "status-badge-active" : guard.status === "break" ? "status-badge-warning" : "status-badge-inactive"}>
                    {guard.status === "on-duty" ? "On Duty" : guard.status === "break" ? "Break" : "Off Duty"}
                  </span>
                }
                menuItems={[
                  hasEditPermission && {
                    label: "Profile Update",
                    icon: User,
                    onClick: () => handleEditClick(guard)
                  },
                  hasEditPermission && {
                    label: "Document Verify",
                    icon: ShieldCheck,
                    onClick: () => setVerifyingGuard(guard)
                  },
                  hasDeletePermission && {
                    label: "Delete Account",
                    icon: Trash2,
                    variant: "destructive",
                    onClick: () => setDeletingGuard(guard)
                  },
                ].filter(Boolean) as any}
                footerContent={
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${complianceStatus === "valid" ? "text-success" : complianceStatus === "expiring" ? "text-warning" : complianceStatus === "expired" ? "text-destructive" : "text-muted-foreground"}`}>
                        License: {complianceStatus}
                      </span>
                      <span className="text-xs text-muted-foreground">Exp: {licenseExpiry}</span>
                    </div>
                    {assignments.length > 0 && (
                      <>
                        {/* Site chips — visible at a glance */}
                        {/* <div className="flex flex-wrap gap-1">
                          {uniqueSiteNames.slice(0, 3).map(site => (
                            <span key={site} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold border border-primary/20 truncate max-w-[100px]">
                              {site}
                            </span>
                          ))}
                          {uniqueSiteNames.length > 3 && (
                            <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-[10px] font-semibold border border-border">
                              +{uniqueSiteNames.length - 3} more
                            </span>
                          )}
                        </div> */}
                        {/* Schedule trigger */}
                        <div
                          onClick={() => setViewingSchedulesGuard({ guard, assignments })}
                          className="flex items-center gap-1 cursor-pointer group"
                        >
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground transition-colors duration-200 group-hover:text-primary" />
                          <span className="text-[10px] font-semibold text-muted-foreground transition-colors duration-200 underline decoration-dotted underline-offset-2 group-hover:text-primary">
                            View {assignments.length} Schedule{assignments.length !== 1 ? "s" : ""} across {uniqueSiteNames.length} site{uniqueSiteNames.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                }
              />
            );
          })}
        </div>
      )}

      {/* Add/Edit Guard Dialog */}
      <EntityDialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (!val) {
            setEditingGuard(null);
            setForm({ firstName: "", middleName: "", lastName: "", email: "", phoneNumber: "", site: sites[0]?.name || "", licenseExpiry: "2027-01-01", image: "", roleType: "", managerId: "" });
          }
          setErrors({});
        }}
        title={editingGuard ? "Update Guard Profile" : "Add New Guard"}
        onSubmit={handleSubmit}
        submitLabel={editingGuard ? (updateMutation.isPending ? "Updating..." : "Update Profile") : (createMutation.isPending ? "Adding..." : "Add Guard")}
      >

        {errors.form && (
          <div className="p-3 mb-4 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
            {errors.form}
          </div>
        )}
        <FormField label="Profile Photo">
          <div
            onClick={() => document.getElementById('guard-image-upload')?.click()}
            className="w-full h-32 bg-secondary border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden group relative"
          >
            {form.image ? (
              <>
                <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground font-medium">Click to upload photo</p>
              </div>
            )}
            <input
              id="guard-image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          {form.image && (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setForm(f => ({ ...f, image: "" })); }}
              className="mt-2 text-xs text-destructive hover:underline font-medium p-0 h-auto shadow-none"
            >
              Remove photo
            </Button>
          )}
        </FormField>

        <div className="grid grid-cols-3 gap-3">
          <FormField label="First Name" required error={errors.firstName}>
            <input
              value={form.firstName}
              onChange={(e) => {
                setForm((f) => ({ ...f, firstName: e.target.value }));
                if (errors.firstName) setErrors(prev => ({ ...prev, firstName: undefined }));
              }}
              placeholder="e.g. John"
              className={`w-full px-3 py-2 bg-secondary border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 ${errors.firstName ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
                }`}
            />
          </FormField>
          <FormField label="Middle Name">
            <input
              value={form.middleName}
              onChange={(e) => setForm((f) => ({ ...f, middleName: e.target.value }))}
              placeholder="e.g. M."
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </FormField>
          <FormField label="Last Name" required error={errors.lastName}>
            <input
              value={form.lastName}
              onChange={(e) => {
                setForm((f) => ({ ...f, lastName: e.target.value }));
                if (errors.lastName) setErrors(prev => ({ ...prev, lastName: undefined }));
              }}
              placeholder="e.g. Smith"
              className={`w-full px-3 py-2 bg-secondary border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 ${errors.lastName ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
                }`}
            />
          </FormField>
        </div>
        <FormField label="Email" required error={errors.email}>
          <input
            type="email"
            value={form.email}
            onChange={(e) => {
              setForm((f) => ({ ...f, email: e.target.value }));
              if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
            }}
            placeholder="e.g. john@securepro.com"
            disabled={!!editingGuard}
            className={`w-full px-3 py-2 bg-secondary border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${errors.email ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
              }`}
          />
        </FormField>
        <FormField label="Phone" required error={errors.phoneNumber}>
          <input
            value={form.phoneNumber}
            onChange={(e) => {
              setForm((f) => ({ ...f, phoneNumber: e.target.value }));
              if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: undefined }));
            }}
            placeholder="e.g. +1 555-0100"
            className={`w-full px-3 py-2 bg-secondary border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 ${errors.phoneNumber ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
              }`}
          />
        </FormField>
        <FormField label="Role" required error={errors.roleType}>
          <SelectDropdown
            value={form.roleType}
            onChange={val => {
              setForm(f => ({ ...f, roleType: val }));
              if (errors.roleType) setErrors(prev => ({ ...prev, roleType: undefined }));
            }}
            options={rolesList.map(role => ({ value: role.name, label: role.name }))}
            placeholder="Select a role"
            className={errors.roleType ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"}
          />
        </FormField>
        
        {/* <FormField label="Assigned Site">
          <select value={form.site} onChange={(e) => setForm((f) => ({ ...f, site: e.target.value }))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
            {sites.filter((s) => s.status === "active").map((s) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </FormField> */}
        {/* <FormField label="License Expiry">
          <input type="date" value={form.licenseExpiry} onChange={(e) => setForm((f) => ({ ...f, licenseExpiry: e.target.value }))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </FormField> */}
      </EntityDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingGuard} onOpenChange={(val) => !val && setDeletingGuard(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <AlertDialogTitle>Delete Guard Account?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingGuard?.name}</strong>? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingGuard && deleteMutation.mutate(deletingGuard.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Verification Dialog (Document Details Modal) */}
      <Dialog open={!!verifyingGuard} onOpenChange={(val) => {
        if (!val) {
          setVerifyingGuard(null);
          setIsVerifiedChecked(false);
          setSelectedDocIndex(0);
          setImageError(false);
        }
      }}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-background">
          {verifyingGuard && (() => {
            const guardDocs = rawDocuments.filter((doc: any) => doc.ownerId === verifyingGuard.id && doc.ownerType === "Guard");
            const selectedDoc = guardDocs[selectedDocIndex];

            return (
              <div className="flex flex-col">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-4 border-b border-border/50 flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-lg font-bold text-foreground">Document Details</DialogTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Verification & Compliance Record for {verifyingGuard.name}</p>
                  </div>
                  {verifyingGuard.isVerified && (
                    <span className="status-badge-active mt-6">
                      Verified Guard
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-0 min-h-[400px]">
                  {/* Left Column: Documents List */}
                  <div className="col-span-1 md:col-span-4 border-r border-border/50 p-4 space-y-3 bg-secondary/10">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Guard Documents</h3>
                    {guardDocs.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        No compliance documents uploaded yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {guardDocs.map((doc: any, idx: number) => {
                          let status = "expired";
                          const expiry = doc.expiryDate ? new Date(doc.expiryDate) : null;
                          const today = new Date();
                          if (expiry) {
                            const diffTime = expiry.getTime() - today.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            if (diffDays > 30) {
                              status = "valid";
                            } else if (diffDays > 0) {
                              status = "expiring";
                            }
                          }

                          return (
                            <button
                              key={doc.id || idx}
                              type="button"
                              onClick={() => {
                                setSelectedDocIndex(idx);
                                setImageError(false);
                              }}
                              className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${selectedDocIndex === idx
                                ? "bg-primary/10 border-primary/30 text-foreground font-semibold"
                                : "bg-card border-border hover:bg-secondary/40 text-muted-foreground"
                                }`}
                            >
                              <div className="truncate pr-2">
                                <p className="text-xs font-bold text-foreground truncate">{doc.name}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Exp: {doc.expiryDate || "N/A"}</p>
                              </div>
                              <span className={`w-2 h-2 rounded-full shrink-0 ${status === "valid" ? "bg-success" : status === "expiring" ? "bg-warning" : "bg-destructive"
                                }`} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Selected Document Preview & Details */}
                  <div className="col-span-1 md:col-span-8 p-6 flex flex-col justify-between">
                    {selectedDoc ? (
                      <div className="space-y-4">
                        <div className="relative aspect-[16/9] w-full bg-secondary/50 rounded-2xl overflow-hidden border border-border">
                          {selectedDoc.documentImage && !imageError ? (
                            <img
                              src={resolveImageUrl(selectedDoc.documentImage)}
                              alt={selectedDoc.name}
                              className="w-full h-full object-contain"
                              onError={() => setImageError(true)}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/20">
                              <FileText className="w-10 h-10 opacity-30 mb-2" />
                              <p className="text-xs font-semibold">No document preview</p>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-secondary/30 rounded-xl border border-border/50">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">Document Type</p>
                            <p className="text-sm font-bold text-foreground mt-0.5">{selectedDoc.name}</p>
                          </div>
                          <div className="p-3 bg-secondary/30 rounded-xl border border-border/50">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">Expiration Date</p>
                            <p className="text-sm font-bold text-foreground mt-0.5">{selectedDoc.expiryDate || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-12">
                        <ShieldCheck className="w-12 h-12 opacity-20 mb-3" />
                        <p className="text-sm font-medium">Select a document from the left to view details</p>
                      </div>
                    )}

                    {/* Verification Action Panel */}
                    <div className="mt-6 pt-4 border-t border-border flex flex-col gap-4">
                      <div className="flex items-center gap-3 p-3 bg-secondary/40 rounded-xl border border-border">
                        <input
                          type="checkbox"
                          id="verify-check-modal"
                          checked={isVerifiedChecked}
                          onChange={(e) => setIsVerifiedChecked(e.target.checked)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                        />
                        <label htmlFor="verify-check-modal" className="text-xs font-semibold cursor-pointer select-none text-foreground">
                          I confirm that documents are verified and authentic
                        </label>
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setVerifyingGuard(null);
                            setIsVerifiedChecked(false);
                            setSelectedDocIndex(0);
                            setImageError(false);
                          }}
                          size="sm"
                        >
                          Cancel
                        </Button>
                        <Button
                          disabled={!isVerifiedChecked || updateMutation.isPending}
                          onClick={() => {
                            updateMutation.mutate({ id: verifyingGuard.id, verified: "true" });
                            setVerifyingGuard(null);
                            setIsVerifiedChecked(false);
                            setSelectedDocIndex(0);
                            setImageError(false);
                          }}
                          size="sm"
                          className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
                        >
                          {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                          {updateMutation.isPending ? "Verifying..." : "Verify Guard"}
                        </Button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Viewing Guard Schedules Dialog */}
      <Dialog open={!!viewingSchedulesGuard} onOpenChange={(val) => !val && setViewingSchedulesGuard(null)}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-background">
          {viewingSchedulesGuard && (() => {
            const { guard, assignments } = viewingSchedulesGuard;

            // Group assignments by site name
            const bySite = assignments.reduce((acc: Record<string, any[]>, a: any) => {
              const key = a.siteName;
              if (!acc[key]) acc[key] = [];
              acc[key].push(a);
              return acc;
            }, {} as Record<string, any[]>);

            const siteNames = Object.keys(bySite);
            const totalShifts = assignments.length;

            return (
              <div className="flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5 border-b border-border/50">
                  <DialogTitle className="text-lg font-bold text-foreground">Guard Schedule Overview</DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{guard.name}</p>
                  {/* Summary chips */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                      <MapPin className="w-3 h-3" />
                      {siteNames.length} Site{siteNames.length !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-foreground text-xs font-semibold border border-border">
                      <Calendar className="w-3 h-3" />
                      {totalShifts} Active Schedule{totalShifts !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Per-site sections */}
                <div className="p-6 max-h-[480px] overflow-y-auto space-y-6">
                  {siteNames.map((siteName) => {
                    const siteShifts = bySite[siteName];
                    const firstShift = siteShifts[0];
                    return (
                      <div key={siteName}>
                        {/* Site heading */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-foreground truncate">{siteName}</h4>
                            {firstShift?.siteAddress && (
                              <p className="text-[10px] text-muted-foreground truncate">{firstShift.siteAddress}</p>
                            )}
                          </div>
                          <span className="ml-auto shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                            {siteShifts.length} shift{siteShifts.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* Shift cards for this site */}
                        <div className="space-y-2 pl-3 border-l-2 border-primary/20">
                          {siteShifts.map((shift: any, idx: number) => (
                            <div
                              key={shift.scheduleId || idx}
                              className="p-3 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors flex items-center gap-3"
                            >
                              {/* Shift number badge */}
                              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </div>

                              {/* Dates */}
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                                <Calendar className="w-3 h-3 text-primary shrink-0" />
                                <span className="truncate">
                                  {new Date(shift.startDate + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                  {shift.endDate && shift.endDate !== shift.startDate && (
                                    <> – {new Date(shift.endDate + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</>
                                  )}
                                </span>
                              </div>

                              {/* Times */}
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                                <Clock className="w-3 h-3 text-primary" />
                                <span className="font-medium text-foreground">{shift.shiftStart} – {shift.shiftEnd}</span>
                              </div>

                              {/* Status badge */}
                              <span className={`ml-auto shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${shift.status === "in-progress" || shift.status === "started"
                                ? "bg-success/10 text-success border-success/20"
                                : shift.status === "missed"
                                  ? "bg-destructive/10 text-destructive border-destructive/20"
                                  : "bg-muted text-muted-foreground border-muted-foreground/10"
                                }`}>
                                {shift.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="px-6 py-4 bg-secondary/20 border-t border-border/50 flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setViewingSchedulesGuard(null)}
                    size="sm"
                  >
                    Close
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default GuardManagement;
