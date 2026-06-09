import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/config/api";
import { guards, Site } from "@/data/dummyData";
import { Plus, MapPin, Users, ShieldCheck, Trash2, AlertCircle, User, Locate, Search, Filter, Mail, Phone, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import EntityCard from "@/components/common/EntityCard";
import EntityDialog from "@/components/common/EntityDialog";
import FormField from "@/components/common/FormField";
import StateMessage from "@/components/common/StateMessage";
import SelectDropdown from "@/components/common/SelectDropdown";
import { Button } from "@/components/ui/button";

const normalizeSitesResponse = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (response.data && !Array.isArray(response.data)) {
    return response.data.site || response.data.sites || response.data.items || response.data.results || [];
  }
  return response.site || response.sites || response.items || response.results || [];
};

const normalizeSite = (site: any, index: number): Site => ({
  id: String(site.id || site._id || `S${String(index + 1).padStart(3, "0")}`),
  name: String(site.name || "Unnamed Site"),
  address: String(site.address || site.location || "No Address"),
  guards: Array.isArray(site.guards) ? site.guards.map(String) : [],
  manager: String(site.managerid || site.manager || site.managerName || "Unassigned"),
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
  name: String(manager.name || "Unknown Manager"),
  isVerified: manager.isVerified === true || manager.verified === true || manager.verified === "true" || manager.isVerified === "true",
});

const SiteManagement = () => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const permissions = user?.permissions || [];
  const isAdmin = user?.role === "admin";

  const hasViewPermission = isAdmin || permissions.includes("view_site") || permissions.includes("site");
  const hasCreatePermission = isAdmin || permissions.includes("create_site") || permissions.includes("site");
  const hasEditPermission = isAdmin || permissions.includes("edit_site") || permissions.includes("site");
  const hasDeletePermission = isAdmin || permissions.includes("delete_site") || permissions.includes("site");

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", address: "", manager: "", status: "active" as "active" | "inactive", lat: "", lng: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [deletingSite, setDeletingSite] = useState<Site | null>(null);
  const [viewingGuardsSite, setViewingGuardsSite] = useState<Site | null>(null);
  const [guardSearch, setGuardSearch] = useState("");


  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const {
    data: siteList = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["sites", debouncedSearch],
    queryFn: async () => {
      const params: any = {};
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      const response = await api.sites.list(params);
      return normalizeSitesResponse(response.data).map(normalizeSite);
    },
  });

  const { data: managersList = [] } = useQuery({
    queryKey: ["managers", "select"],
    queryFn: async () => {
      const response = await api.managers.list();
      return normalizeManagersResponse(response.data).map(normalizeManager);
    },
  });

  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");

  const filtered = useMemo(() => {
    return siteList.filter((s) => {
      const matchStatus =
        statusFilter === "all" ||
        s.status === statusFilter;

      const matchManager =
        managerFilter === "all" ||
        (managerFilter === "unassigned" && (!s.manager || s.manager === "Unassigned" || s.manager === "Unassigned Manager")) ||
        String(s.manager).toLowerCase() === managerFilter.toLowerCase();

      return matchStatus && matchManager;
    });
  }, [siteList, statusFilter, managerFilter]);

  const isNotFound = isError && ((error as any)?.response?.status === 404 || (error as any)?.message?.includes("404"));
  const showLoader = isLoading && filtered.length > 0;
  const showEmpty = filtered.length === 0 || isNotFound;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast({ title: "Success", description: "Site created successfully." });
      setOpen(false);
      setForm({ name: "", address: "", manager: "", status: "active", lat: "", lng: "" });
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || "Failed to create site.";
      setErrors(prev => ({ ...prev, form: errMsg }));
    }
  });

  const updateSiteMutation = useMutation({
    mutationFn: async (payload: { id: string; managerid?: string; status?: string }) => {
      const { id, ...data } = payload;
      const response = await api.sites.update(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast({ title: "Success", description: "Site updated successfully." });
      setOpen(false);
      setEditingSite(null);
      setForm({ name: "", address: "", manager: "", status: "active", lat: "", lng: "" });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast({ title: "Success", description: "Site deleted successfully." });
      setDeletingSite(null);
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
    if (!form.manager.trim()) {
      newErrors.manager = "Manager selection is required";
    }
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

    const payload = {
      name: form.name,
      address: form.address,
      managerid: form.manager,
      status: form.status,
      latitude: form.lat ? Number(form.lat) : null,
      longitude: form.lng ? Number(form.lng) : null
    };

    if (editingSite) {
      updateSiteMutation.mutate({
        id: editingSite.id,
        managerid: form.manager,
        status: form.status
      });
    } else {
      createSiteMutation.mutate(payload);
    }
  };

  const handleEditClick = (site: Site) => {
    setEditingSite(site);
    setForm({
      name: site.name,
      address: site.address,
      manager: site.manager,
      status: site.status as "active" | "inactive",
      lat: String(site.lat),
      lng: String(site.lng),
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

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sites..."
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "default" : "secondary"}
          >
            <Filter className="w-4 h-4" />Filters
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 p-4 bg-secondary/35 border border-border rounded-xl">
            {/* Status Filter */}
            <div className="w-40">
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Status</label>
              <SelectDropdown
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                placeholder="All Statuses"
                className="h-[32px] text-xs py-0 mb-0"
              />
            </div>

            {/* Manager Filter */}
            <div className="w-48">
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Assigned Manager</label>
              <SelectDropdown
                value={managerFilter}
                onChange={setManagerFilter}
                options={[
                  { value: "all", label: "All Managers" },
                  { value: "unassigned", label: "Unassigned" },
                  ...managersList.map((m: any) => ({ value: m.id, label: m.name })),
                ]}
                placeholder="All Managers"
                className="h-[32px] text-xs py-0 mb-0"
              />
            </div>

            {/* Clear Filters Button */}
            <Button
              onClick={() => {
                setStatusFilter("all");
                setManagerFilter("all");
              }}
              variant="outline"
              size="sm"
              className="mt-5"
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>
      <EntityDialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (!val) {
            setEditingSite(null);
            setForm({ name: "", address: "", manager: "", status: "active", lat: "", lng: "" });
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
            disabled={!!editingSite}
            className={`w-full px-3 py-2 bg-secondary border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${errors.name ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
              }`}
            placeholder="e.g. Corporate Tower B"
          />
        </FormField>
        <FormField label="Address" required error={errors.address}>
          <input
            value={form.address}
            onChange={e => {
              setForm(f => ({ ...f, address: e.target.value }));
              if (errors.address) setErrors(prev => ({ ...prev, address: undefined }));
            }}
            disabled={!!editingSite}
            className={`w-full px-3 py-2 bg-secondary border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${errors.address ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
              }`}
            placeholder="e.g. 100 Park Ave, New York, NY"
          />
        </FormField>
        <FormField label="Manager" required error={errors.manager}>
          <SelectDropdown
            value={form.manager}
            onChange={val => {
              setForm(f => ({ ...f, manager: val }));
              if (errors.manager) setErrors(prev => ({ ...prev, manager: undefined }));
            }}
            options={managersList.map(m => ({ value: m.id, label: m.name }))}
            placeholder="Select a manager"
          />
        </FormField>
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
          {filtered.map(site => (
            <EntityCard
              key={site.id}
              title={site.name}
              badge={{
                label: site.status,
                className: site.status === "active" ? "status-badge-active" : "status-badge-inactive"
              }}
              details={[
                { icon: MapPin, content: site.address },
                { icon: Users, content: `${siteGuardCounts[site.id] ?? site.guards.length} guards assigned` },
              ]}
              footerRight={
                <span className="text-xs text-muted-foreground">Manager: {managersList.find(m => m.id === site.manager)?.name || site.manager}</span>
              }
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
              footerContent={(siteGuardIdsMap.get(site.id) && siteGuardIdsMap.get(site.id)!.size > 0) ? (
                <div
                  onClick={() => setViewingGuardsSite(site)}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <div className="flex -space-x-2 transition-transform group-hover:scale-105 duration-200">
                    {Array.from(siteGuardIdsMap.get(site.id)!).slice(0, 5).map(gId => {
                      const g = guardList.find(gu => String(gu.id) === String(gId));

                      let avatarContent: React.ReactNode;
                      if (g?.profilePhoto) {
                        avatarContent = <img src={g.profilePhoto} alt={g.name || "Guard"} className="w-full h-full object-cover rounded-full" />;
                      } else {
                        avatarContent = g ? (g.name ? g.name.split(" ").map((n: string) => n[0].toUpperCase()).join("") : "") : String(gId).slice(0, 2).toUpperCase();
                      }

                      return (
                        <div key={gId} className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold border-2 border-card overflow-hidden shadow-sm">
                          {avatarContent}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-primary transition-colors duration-200 underline decoration-dotted underline-offset-2">
                    Click to view guards
                  </span>
                </div>
              ) : null}
            />
          ))}
        </div>
      )}

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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingSite && deleteSiteMutation.mutate(deletingSite.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSiteMutation.isPending ? "Deleting..." : "Delete Site"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Viewing Assigned Guards Dialog */}
      <Dialog open={!!viewingGuardsSite} onOpenChange={(val) => {
        if (!val) {
          setViewingGuardsSite(null);
          setGuardSearch("");
        }
      }}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-background">
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

            return (
              <div className="flex flex-col">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-4 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <DialogTitle className="text-lg font-bold text-foreground">Assigned Guards</DialogTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Active Guard Roster for {viewingGuardsSite.name}</p>
                  </div>

                  {/* Search Bar on top */}
                  <div className="relative w-full md:w-72 mr-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground mr-6" />
                    <input
                      value={guardSearch}
                      onChange={(e) => setGuardSearch(e.target.value)}
                      placeholder="Search assigned guards..."
                      className="w-full pl-9 pr-3 py-1.5 bg-secondary border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

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
                        let avatarContent: React.ReactNode;
                        if (g.profilePhoto) {
                          avatarContent = <img src={g.profilePhoto} alt={g.name || "Guard"} className="w-full h-full object-cover rounded-full" />;
                        } else {
                          avatarContent = g.name ? g.name.split(" ").map((n: string) => n[0].toUpperCase()).join("") : String(g.id).slice(0, 2).toUpperCase();
                        }

                        // Status styling
                        const statusColors = {
                          "on-duty": "bg-success text-success-foreground border-success/30",
                          "break": "bg-warning text-warning-foreground border-warning/30",
                          "off-duty": "bg-muted text-muted-foreground border-muted-foreground/10",
                        };

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
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold border-2 border-card overflow-hidden shrink-0">
                                  {avatarContent}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-foreground truncate">{g.name}</p>
                                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">ID: {g.id}</p>
                                </div>
                              </div>

                              {/* Duty Status Badge */}
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[g.status as keyof typeof statusColors] || statusColors["off-duty"]}`}>
                                {g.status || "off-duty"}
                              </span>
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

                <div className="px-6 py-4 bg-secondary/20 border-t border-border/50 flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setViewingGuardsSite(null);
                      setGuardSearch("");
                    }}
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

export default SiteManagement;
