import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, API_BASE_URL } from "@/config/api";
import { Plus, MapPin, Users, ShieldCheck, Trash2, AlertCircle, User, UserCheck, Search, Mail, Phone, Calendar, Clock, CalendarClockIcon, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
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
import EntityCard from "@/components/common/EntityCard";
import EntityDialog from "@/components/common/EntityDialog";
import DetailsDialog from "@/components/common/DetailsDialog";
import TablePagination from "@/components/common/TablePagination";
import FormField from "@/components/common/FormField";
import StateMessage from "@/components/common/StateMessage";
import SelectDropdown from "@/components/common/SelectDropdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDateOnly } from "@/lib/dateUtils";
import { UserAvatar } from "@/components/common/UserAvatar";

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

const normalizeSitesResponse = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (response.data && !Array.isArray(response.data)) {
    return response.data.site || response.data.sites || response.data.items || response.data.results || [];
  }
  return response.site || response.sites || response.items || response.results || [];
};

const normalizeSite = (site: any, index: number): any => ({
  id: String(site.id || site._id || `S${String(index + 1).padStart(3, "0")}`),
  name: String(site.name || "Unnamed Site"),
  address: String(site.address || site.location || "No Address"),
  guards: Array.isArray(site.guards) ? site.guards.map(String) : [],
  manager: String(site.managerid || site.manager || site.managerName || "Unassigned"),
  managerid: site.managerid || null,
  managerIds: site.managerIds || [],
  managers: site.managers || [],
  status: site.status === "inactive" ? "inactive" : "active",
  lat: Number(site.lat ?? site.latitude ?? 0),
  lng: Number(site.lng ?? site.longitude ?? 0),
});

const normalizeManagersResponse = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (response.data && !Array.isArray(response.data)) {
    return response.data.managers || response.data.items || response.data.results || [];
  }
  return response.managers || response.items || response.results || [];
};

const normalizeManager = (manager: any): any => ({
  id: String(manager.id || manager._id || ""),
  name: String(manager.name || `${manager.firstName || ""} ${manager.lastName || ""}`.trim() || "Unknown Manager"),
  isVerified: manager.isVerified === true || manager.verified === true || manager.verified === "true" || manager.isVerified === "true",
  profilePhoto: manager.profilePhoto || null,
});

const SiteManagement = () => {
  const [suggestions, setSuggestions] = useState<{ description: string; placeId: string }[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Close suggestions on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".autocomplete-container")) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  // Fetch suggestions when address changes
  const fetchSuggestions = async (val: string) => {
    if (val.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const response = await api.sites.autocomplete(val);
      if (response.data?.success && Array.isArray(response.data?.data)) {
        setSuggestions(response.data.data);
        setShowSuggestions(response.data.data.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (err) {
      console.error("Error loading address suggestions:", err);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSelectSuggestion = async (suggestion: { description: string; placeId: string }) => {
    setForm(f => ({ ...f, address: suggestion.description }));
    setSuggestions([]);
    setShowSuggestions(false);

    try {
      const response = await api.sites.placeDetails(suggestion.placeId);
      if (response.data?.success && response.data?.data) {
        const { latitude, longitude } = response.data.data;
        setForm(f => ({
          ...f,
          address: suggestion.description,
          lat: String(latitude ?? ""),
          lng: String(longitude ?? ""),
        }));
      }
    } catch (err) {
      console.error("Error fetching place details:", err);
    }
  };




  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const permissions = user?.permissions || [];
  const isAdmin = user?.role === "admin";

  const hasViewPermission = isAdmin || permissions.includes("view_site") || permissions.includes("site");
  const hasCreatePermission = isAdmin || permissions.includes("create_site") || permissions.includes("site");
  const hasEditPermission = isAdmin || permissions.includes("edit_site") || permissions.includes("site");
  const hasDeletePermission = isAdmin || permissions.includes("delete_site") || permissions.includes("site");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", address: "", manager: "", managerIds: [] as string[], status: "active" as "active" | "inactive", lat: "", lng: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingSite, setEditingSite] = useState<any | null>(null);
  const [deletingSite, setDeletingSite] = useState<any | null>(null);
  const [viewingGuardsSite, setViewingGuardsSite] = useState<any | null>(null);
  const [guardSearch, setGuardSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"guards" | "schedules" | "managers">("managers");
  const [managerSelectOpen, setManagerSelectOpen] = useState(false);
  const [managerSearchQuery, setManagerSearchQuery] = useState("");


  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, managerFilter]);

  const {
    data: siteData = { sites: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1, pageSize: limit } },
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["sites", debouncedSearch, statusFilter, managerFilter, page],
    queryFn: async () => {
      const params: any = {
        page,
        limit,
      };
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (managerFilter !== "all") {
        params.managerId = managerFilter;
      }
      const response = await api.sites.list(params);
      const rawData = response.data?.data || response.data || {};
      const normalizedList = normalizeSitesResponse(rawData);
      const sites = normalizedList.map(normalizeSite);
      const paginationObj = rawData.pagination || {
        totalItems: sites.length,
        totalPages: Math.max(1, Math.ceil(sites.length / limit)),
        currentPage: page,
        pageSize: limit,
      };
      return { sites, pagination: paginationObj };
    },
  });

  const siteList = siteData.sites;
  const pagination = siteData.pagination;

  const { data: managersList = [] } = useQuery({
    queryKey: ["managers", "select"],
    queryFn: async () => {
      const response = await api.managers.list({ fields: "id,firstName,middleName,lastName,verified,profilePhoto" });
      return normalizeManagersResponse(response.data).map(normalizeManager);
    },
  });

  const filtered = siteList;

  const isNotFound = isError && ((error as any)?.response?.status === 404 || (error as any)?.message?.includes("404"));
  const showLoader = isLoading;
  const showEmpty = !isLoading && (filtered.length === 0 || isNotFound);
  const showError = isError && !isNotFound;

  // Fetch Guards (to show avatars/names if available)
  const { data: guardList = [] } = useQuery({
    queryKey: ["guards", "all"],
    queryFn: async () => {
      try {
        const response = await api.guards.list();
        const raw = response.data as any;
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw?.data)) return raw.data;
        if (raw?.data && typeof raw.data === 'object') return raw.data.guards || raw.data.items || raw.data.results || [];
        return raw?.guards || raw?.items || raw?.results || [];
      } catch (e) {
        return [];
      }
    }
  });

  // Fetch active scheduling entries (only scheduled or in-progress)
  const scheduleStatuses = ["scheduled", "in-progress"] as const;
  const { data: scheduleRaw = [] } = useQuery({
    queryKey: ["scheduling", "active"],
    queryFn: async () => {
      try {
        const response = await api.scheduling.list({ status: scheduleStatuses });
        const raw = response.data as any;
        const list = Array.isArray(raw) ? raw : (raw?.data || raw?.schedules || raw?.items || []);
        return Array.isArray(list) ? list : [];
      } catch (e) {
        return [];
      }
    }
  });

  // Compute guard ids per site from schedules (unique) and fallback to site.guards
  const siteGuardIdsMap = (() => {
    const map = new Map<string, Set<string>>();
    // initialize from siteList
    for (const s of siteList) {
      map.set(s.id, new Set<string>(Array.isArray(s.guards) ? s.guards.map(String) : []));
    }

    for (const sch of scheduleRaw) {
      const siteId = sch.siteId || sch.site || sch.siteName;
      if (!siteId) continue;
      // prefer matching normalized site id
      const siteKey = (siteList.find(ss => String(ss.id) === String(siteId)) || { id: String(siteId) }).id;
      if (!map.has(siteKey)) map.set(siteKey, new Set<string>());
      const set = map.get(siteKey)!;
      const guardIds = Array.isArray(sch.guardIds) ? sch.guardIds : (sch.guardId ? [sch.guardId] : []);
      for (const gid of guardIds) set.add(String(gid));
    }

    return map;
  })();

  const siteGuardCounts: Record<string, number> = {};
  for (const [k, v] of siteGuardIdsMap.entries()) siteGuardCounts[k] = v.size;

  const queryClient = useQueryClient();

  const createSiteMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.sites.create(payload);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast({ title: "Success", description: "Site created successfully." });
      setOpen(false);
      setForm({ name: "", address: "", manager: "", managerIds: [], status: "active", lat: "", lng: "" });
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || "Failed to create site.";
      setErrors(prev => ({ ...prev, form: errMsg }));
    }
  });

  const updateSiteMutation = useMutation({
    mutationFn: async (payload: { id: string; managerid?: string; managerIds?: string[]; status?: string }) => {
      const { id, ...data } = payload;
      const response = await api.sites.update(id, data);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast({ title: "Success", description: "Site updated successfully." });
      setOpen(false);
      setEditingSite(null);
      setForm({ name: "", address: "", manager: "", managerIds: [], status: "active", lat: "", lng: "" });
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || "Failed to update site.";
      setErrors(prev => ({ ...prev, form: errMsg }));
    }
  });

  const deleteSiteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.sites.delete(id);
      return response.data;
    },
    onSuccess: async (data, id) => {
      queryClient.setQueriesData({ queryKey: ["sites"] }, (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.filter((s: any) => s.id !== id);
      });
      setDeletingSite(null);
      toast({ title: "Success", description: "Site deleted successfully." });
      await queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete site.",
        variant: "destructive"
      });
    }
  });

  // Note: Automatic geocoding has been removed. Users should enter latitude and longitude manually.

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) {
      newErrors.name = "Site name is required";
    }
    if (!form.address.trim()) {
      newErrors.address = "Address is required";
    }
    // Managers are optional on both create and edit
    if (form.lat.trim()) {
      const latNum = Number(form.lat);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        newErrors.lat = "Latitude must be between -90 and 90";
      }
    }
    if (form.lng.trim()) {
      const lngNum = Number(form.lng);
      if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
        newErrors.lng = "Longitude must be between -180 and 180";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingSite) {
      updateSiteMutation.mutate({
        id: editingSite.id,
        name: form.name,
        address: form.address,
        status: form.status,
        managerIds: form.managerIds,
        latitude: form.lat ? Number(form.lat) : null,
        longitude: form.lng ? Number(form.lng) : null
      } as any);
    } else {
      const payload = {
        name: form.name,
        address: form.address,
        status: form.status,
        managerIds: form.managerIds,
        latitude: form.lat ? Number(form.lat) : null,
        longitude: form.lng ? Number(form.lng) : null
      };
      createSiteMutation.mutate(payload);
    }
  };

  const handleEditClick = (site: any) => {
    setEditingSite(site);
    setForm({
      name: site.name,
      address: site.address,
      manager: site.managerid || site.manager || "",
      managerIds: site.managerIds || [],
      status: site.status as "active" | "inactive",
      lat: String(site.lat ?? ""),
      lng: String(site.lng ?? ""),
    });
    setOpen(true);
  };

  if (!hasViewPermission) {
    return (
      <div className="p-6">
        <StateMessage
          type="error"
          title="Access Denied"
          message="You do not have permission to view Site Management."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="module-page-header">
        <div>
          <h1 className="module-page-title">Site Management</h1>
          <p className="text-sm text-muted-foreground">{siteList.length} sites registered</p>
        </div>
        {hasCreatePermission && (
          <Button
            onClick={() => setOpen(true)}
          >
            <Plus className="w-4 h-4" />Add Site
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
            placeholder="Search sites..."
            className="pl-9 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 h-[38px] rounded-lg text-sm w-full placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end items-center">
          <SelectDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            placeholder="Status"
            className="w-full sm:w-[135px]"
          />

          <SelectDropdown
            value={managerFilter}
            onChange={setManagerFilter}
            options={[
              { value: "all", label: "All Managers" },
              { value: "unassigned", label: "Unassigned" },
              ...managersList.map((m: any) => ({ value: m.id, label: m.name })),
            ]}
            placeholder="Assigned Manager"
            className="w-full sm:w-[160px]"
          />

          {(statusFilter !== "all" || managerFilter !== "all") && (
            <Button
              onClick={() => {
                setStatusFilter("all");
                setManagerFilter("all");
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
      <EntityDialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (!val) {
            setEditingSite(null);
            setForm({ name: "", address: "", manager: "", managerIds: [], status: "active", lat: "", lng: "" });
          }
          setErrors({});
        }}
        title={editingSite ? "Update Site Profile" : "Add New Site"}
        onSubmit={handleSubmit}
        isLoading={createSiteMutation.isPending || updateSiteMutation.isPending}
        submitLabel={editingSite ? (updateSiteMutation.isPending ? "Updating..." : "Update Profile") : (createSiteMutation.isPending ? "Creating..." : "Add Site")}
      >
        {errors.form && (
          <div className="p-3 mb-4 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
            {errors.form}
          </div>
        )}
        <FormField label="Site Name" required error={errors.name}>
          <input
            value={form.name}
            onChange={e => {
              setForm(f => ({ ...f, name: e.target.value }));
              if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
            }}
            className={`w-full px-3 py-2 bg-secondary border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${errors.name ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
              }`}
            placeholder="e.g. Corporate Tower B"
          />
        </FormField>
        <FormField label="Address" required error={errors.address}>
          <div className="autocomplete-container relative">
            <input
              value={form.address}
              onChange={e => {
                const val = e.target.value;
                setForm(f => ({ ...f, address: val }));
                if (errors.address) setErrors(prev => ({ ...prev, address: undefined }));
                fetchSuggestions(val);
              }}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              className={`w-full px-3 py-2 bg-secondary border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${errors.address ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
                }`}
              placeholder="e.g. 100 Park Ave, New York, NY"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-[99999] w-full mt-1 bg-card border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, idx) => (
                  <div
                    key={suggestion.placeId || idx}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="px-4 py-2.5 text-sm text-foreground hover:bg-accent/80 hover:shadow-inner cursor-pointer border-b border-border/40 last:border-b-0 flex items-center gap-2 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{suggestion.description}</span>
                  </div>
                ))}
              </div>
            )}
            {loadingSuggestions && (
              <div className="absolute right-3 top-2.5 text-xs text-muted-foreground animate-pulse">
                Loading...
              </div>
            )}
          </div>
        </FormField>

        <FormField label="Assigned Managers" error={errors.managers}>
          <div
            onClick={() => setManagerSelectOpen(true)}
            className={`w-full min-h-[38px] px-3 py-2 bg-secondary border rounded-lg text-sm text-foreground flex flex-wrap gap-1.5 items-center cursor-pointer hover:border-primary/50 transition-colors ${errors.managers ? "border-destructive focus:ring-destructive/20" : "border-border"
              }`}
          >
            {form.managerIds.length === 0 ? (
              <span className="text-slate-400">Click to assign managers...</span>
            ) : (
              form.managerIds.map(id => {
                const manager = managersList.find((m: any) => m.id === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                  >
                    {manager ? manager.name : id}
                  </span>
                );
              })
            )}
          </div>
        </FormField>
        <Dialog open={managerSelectOpen} onOpenChange={setManagerSelectOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Managers</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  value={managerSearchQuery}
                  onChange={(e) => setManagerSearchQuery(e.target.value)}
                  placeholder="Search managers..."
                  className="pl-9 pr-4 bg-secondary border border-border h-[38px] rounded-lg text-sm w-full placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {managersList.filter((m: any) => m.name.toLowerCase().includes(managerSearchQuery.toLowerCase())).length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No managers found</p>
                  </div>
                ) : (
                  managersList
                    .filter((m: any) => m.name.toLowerCase().includes(managerSearchQuery.toLowerCase()))
                    .map((m: any) => {
                      const isSelected = form.managerIds.includes(m.id);
                      const initials = m.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            setForm(f => {
                              const newIds = isSelected
                                ? f.managerIds.filter(id => id !== m.id)
                                : [...f.managerIds, m.id];
                              return { ...f, managerIds: newIds };
                            });
                            if (errors.managers) setErrors(prev => ({ ...prev, managers: undefined }));
                          }}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-all duration-150 border ${isSelected
                            ? "bg-primary/10 text-primary border-primary/25 font-medium shadow-sm"
                            : "bg-transparent hover:bg-secondary text-foreground border-border"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <UserAvatar src={m.profilePhoto} name={m.name} size="md" />
                            <span className="font-medium text-foreground">{m.name}</span>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                              <Check className="w-3.5 h-3.5 text-primary-foreground stroke-[3]" />
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            </DialogBody>
            <DialogFooter>
              <button
                type="button"
                onClick={() => {
                  setManagerSelectOpen(false);
                  setManagerSearchQuery("");
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
              >
                Done
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <FormField label="Status">
          <SelectDropdown
            value={form.status}
            onChange={val => setForm(f => ({ ...f, status: val as "active" | "inactive" }))}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            placeholder=""
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Latitude (Optional)" error={errors.lat}>
            <input
              value={form.lat}
              onChange={e => {
                setForm(f => ({ ...f, lat: e.target.value }));
                if (errors.lat) setErrors(prev => ({ ...prev, lat: undefined }));
              }}
              className={`w-full px-3 py-2 bg-secondary border rounded-lg text-sm text-foreground mb-2 focus:outline-none focus:ring-2 ${errors.lat ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
                }`}
              placeholder="0.00"
            />
          </FormField>
          <FormField label="Longitude (Optional)" error={errors.lng}>
            <input
              value={form.lng}
              onChange={e => {
                setForm(f => ({ ...f, lng: e.target.value }));
                if (errors.lng) setErrors(prev => ({ ...prev, lng: undefined }));
              }}
              className={`w-full px-3 py-2 bg-secondary border rounded-lg text-sm text-foreground mb-2 focus:outline-none focus:ring-2 ${errors.lng ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
                }`}
              placeholder="0.00"
            />
          </FormField>
        </div>
      </EntityDialog>

      {showLoader && (
        <StateMessage type="loading" message="Loading sites..." />
      )}

      {showError && (
        <StateMessage
          type="error"
          title="Failed to load sites"
          message={error instanceof Error ? error.message : undefined}
        />
      )}

      {!showLoader && !showError && showEmpty && (
        <StateMessage
          type="empty"
          title="Site not found"
          message="Create a new site to get started."
          icon={MapPin}
        />
      )}

      {!showLoader && !showError && !showEmpty && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(site => {
            const activeSchedulesForSite = scheduleRaw.filter((s: any) =>
              String(s.siteId || s.site) === String(site.id) &&
              (s.status === "scheduled" || s.status === "in-progress" || s.status === "started")
            );

            return (
              <EntityCard
                key={site.id}
                title={site.name}
                badge={
                  <Badge variant={site.status === "active" ? "success" : "inactive"} showDot>
                    {site.status}
                  </Badge>
                }
                details={[
                  { icon: MapPin, content: site.address },
                  { icon: Users, content: `${siteGuardCounts[site.id] ?? site.guards.length} guards assigned` },
                  { icon: UserCheck, content: `${site.managers?.length ?? 0} manager(s) assigned` },
                  { icon: Calendar, content: `${activeSchedulesForSite.length} active schedule(s)` },
                ]}

                menuItems={([
                  ...(hasEditPermission ? [
                    {
                      label: "Site Update",
                      icon: MapPin,
                      onClick: () => handleEditClick(site)
                    }
                  ] : []),
                  ...(hasDeletePermission ? [
                    {
                      label: "Delete Site",
                      icon: Trash2,
                      variant: "destructive" as const,
                      onClick: () => setDeletingSite(site)
                    }
                  ] : [])
                ] as any)}
                footerContent={
                  <div className="flex flex-col gap-3 w-full">
                    <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                      {/* Managers row */}
                      {site.managers && site.managers.length > 0 ? (
                        <div
                          onClick={() => {
                            setViewingGuardsSite(site);
                            setActiveTab("managers");
                          }}
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <div className="flex -space-x-2 transition-transform duration-200 group-hover:scale-105">
                            {site.managers.slice(0, 5).map((m: any) => {
                              const initials = m.name
                                ? m.name
                                  .split(" ")
                                  .filter(Boolean)
                                  .map((n: string) => n[0].toUpperCase())
                                  .join("")
                                : "M";

                              return (
                                <Avatar key={m.id} className="w-7 h-7 border-2 border-card">
                                  <AvatarImage src={resolveImageUrl(m.profilePhoto)} alt={m.name} className="object-cover" />
                                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center h-full w-full">{initials}</AvatarFallback>
                                </Avatar>
                              );
                            })}
                            {site.managers.length > 5 && (
                              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-[10px] font-bold border-2 border-card shadow-sm">
                                +{site.managers.length - 5}
                              </div>
                            )}
                          </div>

                          <span className="text-[10px] font-semibold text-muted-foreground transition-colors duration-200 underline decoration-dotted underline-offset-2 group-hover:text-primary">
                            Click to view managers ({site.managers.length})
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">No managers assigned</span>
                      )}

                      {/* Guards row */}
                      {(siteGuardIdsMap.get(site.id) &&
                        siteGuardIdsMap.get(site.id)!.size > 0) ? (
                        <div
                          onClick={() => {
                            setViewingGuardsSite(site);
                            setActiveTab("guards");
                          }}
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <div className="flex -space-x-2 transition-transform duration-200 group-hover:scale-105">
                            {Array.from(siteGuardIdsMap.get(site.id)!)
                              .slice(0, 5)
                              .map((gId) => {
                                const g = guardList.find(
                                  (gu) => String(gu.id) === String(gId)
                                );

                                const initials = g
                                  ? g.name
                                    ? g.name
                                      .split(" ")
                                      .filter(Boolean)
                                      .map((n) => n[0].toUpperCase())
                                      .join("")
                                    : ""
                                  : String(gId).slice(0, 2).toUpperCase();

                                return (
                                  <Avatar key={gId} className="w-7 h-7 border-2 border-card">
                                    <AvatarImage src={resolveImageUrl(g?.profilePhoto)} alt={g?.name} className="object-cover" />
                                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center h-full w-full">{initials}</AvatarFallback>
                                  </Avatar>
                                );
                              })}
                          </div>

                          <span className="text-[10px] font-semibold text-muted-foreground transition-colors duration-200 underline decoration-dotted underline-offset-2 group-hover:text-primary">
                            Click to view guards ({siteGuardIdsMap.get(site.id)!.size})
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">No guards scheduled</span>
                      )}
                    </div>

                    {activeSchedulesForSite.length > 0 && (
                      <div
                        onClick={() => {
                          setViewingGuardsSite(site);
                          setActiveTab("schedules");
                        }}
                        className="flex items-center gap-1.5 cursor-pointer group border-t border-border/50 pt-2.5 mt-1"
                      >
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground transition-colors duration-200 group-hover:text-primary" />
                        <span className="text-[10px] font-semibold text-muted-foreground transition-colors duration-200 underline decoration-dotted underline-offset-2 group-hover:text-primary">
                          View Active Schedules ({activeSchedulesForSite.length})
                        </span>
                      </div>
                    )}
                  </div>
                }
              />
            );
          })}
        </div>
      )}

      <TablePagination
        page={page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        limit={limit}
        onPageChange={setPage}
        itemLabel="sites"
        className="mt-6 rounded-xl border border-border bg-card"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingSite} onOpenChange={(val) => !val && setDeletingSite(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <AlertDialogTitle>Delete Site?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingSite?.name}</strong>? This action cannot be undone and will remove all associated data. Note that this site cannot be deleted if it is currently associated with any upcoming or active duty schedules.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={deleteSiteMutation.isPending}>
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={() => deletingSite && deleteSiteMutation.mutate(deletingSite.id)}
                loading={deleteSiteMutation.isPending}
              >
                Delete Site
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Viewing Assigned Guards Dialog */}
      <DetailsDialog
        open={!!viewingGuardsSite}
        onOpenChange={(val) => {
          if (!val) {
            setViewingGuardsSite(null);
            setGuardSearch("");
            setActiveTab("managers");
          }
        }}
        maxWidth="sm:max-w-4xl"
      >
        {viewingGuardsSite && (() => {
          const assignedIds = Array.from(siteGuardIdsMap.get(viewingGuardsSite.id) || []);
          const assignedGuards = assignedIds
            .map(gId => guardList.find(gu => String(gu.id) === String(gId)))
            .filter(Boolean);

          const filteredGuards = assignedGuards.filter((g: any) => {
            const term = guardSearch.toLowerCase();
            return (
              g.name?.toLowerCase().includes(term) ||
              g.email?.toLowerCase().includes(term) ||
              g.phoneNumber?.toLowerCase().includes(term) ||
              g.id?.toLowerCase().includes(term)
            );
          });

          const assignedManagers = (viewingGuardsSite.managers || []).filter((m: any) => {
            const term = guardSearch.toLowerCase();
            return (
              m.name?.toLowerCase().includes(term) ||
              m.email?.toLowerCase().includes(term) ||
              m.phoneNumber?.toLowerCase().includes(term) ||
              m.id?.toLowerCase().includes(term)
            );
          });

          const siteSchedules = scheduleRaw.filter((s: any) =>
            String(s.siteId || s.site) === String(viewingGuardsSite.id) &&
            (s.status === "scheduled" || s.status === "in-progress" || s.status === "started")
          );

          return (
            <div className="flex flex-col flex-1 min-h-0">
              <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "guards" | "schedules" | "managers")} className="w-full">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pl-6 pr-16 py-4 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <DialogTitle className="text-lg font-bold text-foreground">Site Details</DialogTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{viewingGuardsSite.name}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    {(activeTab === "guards" || activeTab === "managers") && (
                      <div className="relative w-full md:w-56">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                          value={guardSearch}
                          onChange={(e) => setGuardSearch(e.target.value)}
                          placeholder={activeTab === "guards" ? "Search assigned guards..." : "Search assigned managers..."}
                          className="w-full pl-9 pr-3 py-1 bg-secondary border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    )}

                    <TabsList className="bg-secondary/50 rounded-lg p-0.5 border border-border h-8 shrink-0">
                      <TabsTrigger value="managers" className="text-xs py-0.5 px-3 rounded">Managers</TabsTrigger>
                      <TabsTrigger value="guards" className="text-xs py-0.5 px-3 rounded">Guards</TabsTrigger>
                      <TabsTrigger value="schedules" className="text-xs py-0.5 px-3 rounded">Active Schedules</TabsTrigger>
                    </TabsList>
                  </div>
                </div>

                <TabsContent value="managers" className="mt-0">
                  <div className="p-6 max-h-[450px] overflow-y-auto">
                    {assignedManagers.length === 0 ? (
                      <div className="py-12 text-center text-xs text-muted-foreground">
                        {viewingGuardsSite.managers?.length === 0
                          ? "No managers are currently assigned to this site."
                          : "No managers match your search criteria."}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {assignedManagers.map((m: any, index: number) => {

                          return (
                            <div key={m.id || index} className="p-4 rounded-xl border border-border bg-card hover:bg-secondary/20 transition-all flex flex-col justify-between gap-4">
                              <div className="flex items-start justify-between gap-3">
                                {/* Avatar & Name */}
                                <div className="flex items-center gap-3 min-w-0">
                                  <Avatar className="w-10 h-10 border-2 border-card shrink-0">
                                    <AvatarImage src={resolveImageUrl(m.profilePhoto)} alt={m.name} className="object-cover" />
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold flex items-center justify-center h-full w-full">
                                      {m.name ? m.name.split(" ").filter(Boolean).map((n: string) => n[0].toUpperCase()).join("") : "M"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-foreground truncate">{m.name}</p>
                                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">Email: {m.email}</p>
                                  </div>
                                </div>
                                <Badge variant="primary">
                                  Site Manager
                                </Badge>
                              </div>

                              {/* Contact Info */}
                              <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/50 pt-3">
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                                  <span className="truncate">{m.phoneNumber || "No Phone"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                                  <span className="truncate">{m.email || "No Email"}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="guards" className="mt-0">
                  <div className="p-6 max-h-[450px] overflow-y-auto">
                    {filteredGuards.length === 0 ? (
                      <div className="py-12 text-center text-xs text-muted-foreground">
                        {assignedGuards.length === 0
                          ? "No guards are currently assigned to this site."
                          : "No guards match your search criteria."}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredGuards.map((g: any, index) => {

                          // Compliance styling
                          const complianceColors = {
                            "valid": "bg-success/10 text-success border-success/20",
                            "expiring": "bg-warning/10 text-warning border-warning/20",
                            "expired": "bg-destructive/10 text-destructive border-destructive/20",
                          };

                          // Find shift times for this guard at this site
                          const getShiftTimeText = () => {
                            const sch = scheduleRaw.find((s: any) => {
                              const isSiteMatch = String(s.siteId || s.site) === String(viewingGuardsSite.id);
                              const guardIds = Array.isArray(s.guardIds) ? s.guardIds : (s.guardId ? [s.guardId] : []);
                              return isSiteMatch && guardIds.map(String).includes(String(g.id));
                            });
                            if (!sch) return "No Shift Today";
                            return `${sch.shiftStart?.substring(0, 5) || "N/A"} - ${sch.shiftEnd?.substring(0, 5) || "N/A"}`;
                          };

                          return (
                            <div key={g.id || index} className="p-4 rounded-xl border border-border bg-card hover:bg-secondary/20 transition-all flex flex-col justify-between gap-4">
                              <div className="flex items-start justify-between gap-3">
                                {/* Avatar & Name */}
                                <div className="flex items-center gap-3 min-w-0">
                                  <Avatar className="w-10 h-10 border-2 border-card shrink-0">
                                    <AvatarImage src={resolveImageUrl(g.profilePhoto)} alt={g.name} className="object-cover" />
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold flex items-center justify-center h-full w-full">
                                      {g.name ? g.name.split(" ").filter(Boolean).map((n: string) => n[0].toUpperCase()).join("") : String(g.id).slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-foreground truncate">{g.name}</p>
                                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">Email: {g.email}</p>
                                  </div>
                                </div>

                                {/* Duty Status Badge */}
                                <Badge
                                  variant={
                                    g.status === "on-duty"
                                      ? "success"
                                      : g.status === "break"
                                        ? "warning"
                                        : "inactive"
                                  }
                                >
                                  {g.status || "off-duty"}
                                </Badge>
                              </div>

                              {/* Contact & Shift Info */}
                              <div className="space-y-1.5 text-xs text-muted-foreground border-t border-b border-border/50 py-3">
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                                  <span className="truncate">{g.phoneNumber || "No Phone"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                                  <span className="truncate">{g.email || "No Email"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-foreground font-semibold">
                                  <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <span>Shift: {getShiftTimeText()}</span>
                                </div>
                                {(() => {
                                  const guardManager = managersList.find((m: any) => String(m.id) === String(g.managerId));
                                  return (
                                    <div className="flex items-center gap-2 text-foreground font-medium">
                                      <User className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
                                      <span>Manager: {guardManager ? guardManager.name : "Unassigned"}</span>
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Additional Guard Info: Compliance & Hours */}
                              <div className="flex items-center justify-between text-[11px] gap-2">
                                {/* Compliance Status Badge */}
                                <div className="flex items-center gap-1.5">
                                  <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium capitalize ${complianceColors[g.complianceStatus as keyof typeof complianceColors] || complianceColors["valid"]}`}>
                                    {g.complianceStatus || "valid"} Compliance
                                  </span>
                                </div>

                                {/* Hours Tracked */}
                                <div className="text-right">
                                  <span className="text-muted-foreground">Hours: </span>
                                  <span className="font-bold text-foreground">{g.hoursThisWeek || 0}h</span>
                                  <span className="text-muted-foreground text-[10px]"> / {g.scheduledHours || 0}h scheduled</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="schedules" className="mt-0">
                  <div className="p-6 max-h-[450px] overflow-y-auto">
                    {siteSchedules.length === 0 ? (
                      <div className="py-12 text-center text-xs text-muted-foreground">
                        No active schedules for this site.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {siteSchedules.map((sch: any, index: number) => {
                          const schGuardIds = Array.isArray(sch.guardIds) ? sch.guardIds : (sch.guardId ? [sch.guardId] : []);
                          const assignedNames = schGuardIds
                            .map((gId: any) => {
                              const g = guardList.find(gu => String(gu.id) === String(gId));
                              return g ? g.name : "Unknown Guard";
                            })
                            .join(", ");

                          return (
                            <div key={sch.id || index} className="p-4 rounded-xl border border-border bg-card hover:bg-secondary/15 transition-all flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <CalendarClockIcon className="h-4 w-4 text-muted-foreground" />
                                <Badge
                                  variant={
                                    sch.status === "in-progress" || sch.status === "completed"
                                      ? "success"
                                      : sch.status === "missed"
                                        ? "danger"
                                        : "inactive"
                                  }
                                >
                                  {sch.status}
                                </Badge>
                              </div>

                              <div className="space-y-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <span className="text-foreground">
                                    {formatDateOnly(sch.startDate)}
                                    {sch.endDate && sch.endDate !== sch.startDate && (
                                      <> - {formatDateOnly(sch.endDate)}</>
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <span className="text-foreground">
                                    {sch.shiftStart?.substring(0, 5)} - {sch.shiftEnd?.substring(0, 5)}
                                  </span>
                                </div>
                                <div className="flex items-start gap-2 pt-1.5 border-t border-border/50">
                                  <Users className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Guards Assigned</span>
                                    <span className="text-foreground font-semibold mt-0.5">{assignedNames || "No guards assigned"}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          );
        })()}
      </DetailsDialog>
    </div >
  );
};

export default SiteManagement;
