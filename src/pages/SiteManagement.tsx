import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/config/api";
import { guards, Site } from "@/data/dummyData";
import { Plus, MapPin, Users, ShieldCheck, Trash2, AlertCircle, User, Locate, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [deletingSite, setDeletingSite] = useState<Site | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

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

  const filtered = siteList;

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
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create site.",
        variant: "destructive"
      });
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
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update site.",
        variant: "destructive"
      });
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

  const handleAddressBlur = async () => {
    if (!form.address || editingSite) return;

    setIsGeocoding(true);
    try {
      const response = await api.sites.geocode(form.address);
      if (response.data && response.data.success) {
        const { latitude, longitude } = response.data.data;
        setForm(f => ({
          ...f,
          lat: String(latitude),
          lng: String(longitude)
        }));
        toast({ title: "Coordinates Updated", description: "Latitude and Longitude fetched from address." });
      }
    } catch (error) {
      console.error("Geocoding failed", error);
      // Don't show toast for every blur failure to avoid annoyance,
      // but maybe log it or show a subtle hint.
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.address || !form.manager) {
      toast({ title: "Validation Error", description: "Name, address, and manager are required.", variant: "destructive" });
      return;
    }

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
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />Add Site
          </button>
        )}
      </div>

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
        <button className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors">
          <Filter className="w-4 h-4" />Filters
        </button>
      </div>
      <EntityDialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (!val) setEditingSite(null);
        }}
        title={editingSite ? "Update Site Profile" : "Add New Site"}
        onSubmit={handleSubmit}
        isLoading={createSiteMutation.isPending || updateSiteMutation.isPending}
        submitLabel={editingSite ? (updateSiteMutation.isPending ? "Updating..." : "Update Profile") : (createSiteMutation.isPending ? "Creating..." : "Add Site")}
      >
        <FormField label="Site Name" required>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            disabled={!!editingSite}
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="e.g. Corporate Tower B"
          />
        </FormField>
        <FormField label="Address" required>
          <input
            value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            onBlur={handleAddressBlur}
            disabled={!!editingSite || isGeocoding}
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={isGeocoding ? "Fetching coordinates..." : "e.g. 100 Park Ave, New York, NY"}
          />
        </FormField>
        <FormField label="Manager">
          <SelectDropdown
            value={form.manager}
            onChange={val => setForm(f => ({ ...f, manager: val }))}
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
          <FormField label="Latitude (Optional)">
            <input
              value={form.lat}
              onChange={e => setForm(f => ({ ...f, lat: e.target.value }))}
              disabled={!!editingSite}
              className="w-full px-3 mb-1 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Auto-fetched if empty"
            />
          </FormField>
          <FormField label="Longitude (Optional)">
            <input
              value={form.lng}
              onChange={e => setForm(f => ({ ...f, lng: e.target.value }))}
              disabled={!!editingSite}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Auto-fetched if empty"
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
              menuItems={[
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
                    variant: "destructive",
                    onClick: () => setDeletingSite(site)
                  }
                ] : [])
              ]}
              footerContent={(siteGuardIdsMap.get(site.id) && siteGuardIdsMap.get(site.id)!.size > 0) ? (
                <div className="flex -space-x-2">
                  {Array.from(siteGuardIdsMap.get(site.id)!).slice(0, 5).map(gId => {
                    const g = guardList.find(gu => String(gu.id) === String(gId));

                    let avatarContent: React.ReactNode;
                    if (g?.profilePhoto) {
                      avatarContent = <img src={g.profilePhoto} alt={g.name || "Guard"} className="w-full h-full object-cover rounded-full" />;
                    } else {
                      avatarContent = g ? (g.name ? g.name.split(" ").map((n: string) => n[0].toUpperCase()).join("") : "") : String(gId).slice(0, 2).toUpperCase();
                    }

                    return (
                      <div key={gId} className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold border-2 border-card overflow-hidden">
                        {avatarContent}
                      </div>
                    );
                  })}
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
    </div>
  );
};

export default SiteManagement;
