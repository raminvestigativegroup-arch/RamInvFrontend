import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, API_BASE_URL } from "@/config/api";
import { sites, Guard } from "@/data/dummyData";
import { Search, Plus, Filter, MoreVertical, Mail, Phone, User, ShieldCheck, Trash2, AlertCircle, Image, Upload, Users } from "lucide-react";
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

const normalizeGuard = (guard: RawRecord, index: number): Guard => {
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
  };
};

const resolveImageUrl = (pathOrData: string | undefined | null) => {
  if (!pathOrData) return undefined;
  if (pathOrData.startsWith("data:") || pathOrData.startsWith("http:") || pathOrData.startsWith("https:")) {
    return pathOrData;
  }
  if (pathOrData.startsWith("uploads/")) {
    const cleanPath = pathOrData.replace(/\\/g, "/");
    const host = API_BASE_URL.replace("/api/v1", "");
    return `${host}/${cleanPath}`;
  }
  return undefined;
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
  });
  const [editingGuard, setEditingGuard] = useState<Guard | null>(null);
  const [deletingGuard, setDeletingGuard] = useState<Guard | null>(null);
  const [verifyingGuard, setVerifyingGuard] = useState<Guard | null>(null);
  const [isVerifiedChecked, setIsVerifiedChecked] = useState(false);


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
  });

  const { data: rolesList = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await api.roles.list();
      return normalizeRolesResponse(response.data).map(normalizeRole);
    },
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: { firstName: string; middleName?: string; lastName: string; email: string; phoneNumber: string; roleType: string; profilePhoto?: string }) =>
      api.guards.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guards"] });
      setOpen(false);
      setForm({ firstName: "", middleName: "", lastName: "", email: "", phoneNumber: "", site: sites[0]?.name || "", licenseExpiry: "2027-01-01", image: "", roleType: "" });
      toast({ title: "Guard Added", description: "The new guard has been registered successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add guard. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; firstName?: string; middleName?: string; lastName?: string; phoneNumber?: string; roleType?: string; verified?: string; profilePhoto?: string }) =>
      api.guards.update(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guards"] });
      setOpen(false);
      setEditingGuard(null);
      setForm({ firstName: "", middleName: "", lastName: "", email: "", phoneNumber: "", site: sites[0]?.name || "", licenseExpiry: "2027-01-01", image: "", roleType: "" });
      toast({ title: "Guard Updated", description: "The guard information has been updated successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update guard. Please try again.",
        variant: "destructive",
      });
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


  const [showFilters, setShowFilters] = useState(false);
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

  const filtered = useMemo(() => {
    return guardList.filter((g) => {
      const matchVerified =
        verifiedFilter === "all" ||
        (verifiedFilter === "verified" && g.isVerified) ||
        (verifiedFilter === "unverified" && !g.isVerified);
      const matchSite =
        siteFilter === "all" ||
        g.site.toLowerCase() === siteFilter.toLowerCase();
      const matchCompliance =
        complianceFilter === "all" ||
        g.complianceStatus === complianceFilter;
      return matchVerified && matchSite && matchCompliance;
    });
  }, [guardList, verifiedFilter, siteFilter, complianceFilter]);

  const isNotFound = isError && ((error as any)?.response?.status === 404 || (error as any)?.message?.includes("404"));
  const showLoader = isLoading && filtered.length > 0;
  const showEmpty = filtered.length === 0 || isNotFound;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) {
      toast({ title: "Validation Error", description: "First name, last name, and email are required.", variant: "destructive" });
      return;
    }

    if (editingGuard) {
      updateMutation.mutate({
        id: editingGuard.id,
        firstName: form.firstName,
        middleName: form.middleName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber,
        roleType: form.roleType,
        profilePhoto: form.image,
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
      });
    }
  };

  const handleEditClick = (guard: Guard) => {
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
    });
    setOpen(true);
  };


  return (
    <div className="p-6 space-y-6">
      <div className="module-page-header">
        <div>
          <h1 className="module-page-title">Guard Management</h1>
          <p className="text-sm text-muted-foreground">{guardList.length} guards registered</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />Add Guard
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search guards..." className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${showFilters ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}
          >
            <Filter className="w-4 h-4" />Filters
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 p-4 bg-secondary/35 border border-border rounded-xl">
            {/* Status / Verification Filter */}
            <div className="w-40">
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Status</label>
              <SelectDropdown
                value={verifiedFilter}
                onChange={setVerifiedFilter}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "verified", label: "Verified Only" },
                  { value: "unverified", label: "Unverified Only" },
                ]}
                placeholder="All Statuses"
                className="h-[32px] text-xs py-0 mb-0"
              />
            </div>

            {/* Site Filter */}
            <div className="w-44">
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Assigned Site</label>
              <SelectDropdown
                value={siteFilter}
                onChange={setSiteFilter}
                options={[
                  { value: "all", label: "All Sites" },
                  { value: "unassigned", label: "Unassigned" },
                  ...siteList.map((s: any) => ({ value: s.name, label: s.name })),
                ]}
                placeholder="All Sites"
                className="h-[32px] text-xs py-0 mb-0"
              />
            </div>

            {/* Compliance Status Filter */}
            <div className="w-40">
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Compliance</label>
              <SelectDropdown
                value={complianceFilter}
                onChange={setComplianceFilter}
                options={[
                  { value: "all", label: "All Compliance" },
                  { value: "valid", label: "Valid License" },
                  { value: "expiring", label: "Expiring Soon" },
                  { value: "expired", label: "Expired License" },
                ]}
                placeholder="All Compliance"
                className="h-[32px] text-xs py-0 mb-0"
              />
            </div>

            {/* Clear Filters Button */}
            {(verifiedFilter !== "all" || siteFilter !== "all" || complianceFilter !== "all") && (
              <button
                onClick={() => {
                  setVerifiedFilter("all");
                  setSiteFilter("all");
                  setComplianceFilter("all");
                }}
                className="mt-5 px-3 py-1.5 bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold rounded-lg transition-colors border border-border"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
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
                ]}
                footerLeft={guard.site}
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
                  {
                    label: "Profile Update",
                    icon: User,
                    onClick: () => handleEditClick(guard)
                  },
                  {
                    label: "Document Verify",
                    icon: ShieldCheck,
                    onClick: () => setVerifyingGuard(guard)
                  },
                  {
                    label: "Delete Account",
                    icon: Trash2,
                    variant: "destructive",
                    onClick: () => setDeletingGuard(guard)
                  },
                ]}
                footerContent={
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${complianceStatus === "valid" ? "text-success" : complianceStatus === "expiring" ? "text-warning" : complianceStatus === "expired" ? "text-destructive" : "text-muted-foreground"}`}>
                      License: {complianceStatus}
                    </span>
                    <span className="text-xs text-muted-foreground">Exp: {licenseExpiry}</span>
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
          if (!val) setEditingGuard(null);
        }}
        title={editingGuard ? "Update Guard Profile" : "Add New Guard"}
        onSubmit={handleSubmit}
        submitLabel={editingGuard ? (updateMutation.isPending ? "Updating..." : "Update Profile") : (createMutation.isPending ? "Adding..." : "Add Guard")}
      >

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
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setForm(f => ({ ...f, image: "" })); }}
              className="mt-2 text-xs text-destructive hover:underline font-medium"
            >
              Remove photo
            </button>
          )}
        </FormField>

        <div className="grid grid-cols-3 gap-3">
          <FormField label="First Name" required>
            <input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="e.g. John" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </FormField>
          <FormField label="Middle Name">
            <input value={form.middleName} onChange={(e) => setForm((f) => ({ ...f, middleName: e.target.value }))} placeholder="e.g. M." className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </FormField>
          <FormField label="Last Name" required>
            <input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} placeholder="e.g. Smith" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </FormField>
        </div>
        <FormField label="Email" required>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="e.g. john@securepro.com"
            disabled={!!editingGuard}
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </FormField>
        <FormField label="Phone" >
          <input value={form.phoneNumber} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} placeholder="e.g. +1 555-0100" className="w-full mb-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </FormField>
        <FormField label="Role">
          <SelectDropdown
            value={form.roleType}
            onChange={val => setForm(f => ({ ...f, roleType: val }))}
            options={rolesList.map(role => ({ value: role.name, label: role.name }))}
            placeholder="Select a role"
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

      {/* Verification Dialog */}
      <AlertDialog open={!!verifyingGuard} onOpenChange={(val) => {
        if (!val) {
          setVerifyingGuard(null);
          setIsVerifiedChecked(false);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <AlertDialogTitle>Verify Guard Documents</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Please confirm that you have verified all required documents for <strong>{verifyingGuard?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg border border-border mt-2">
            <input
              type="checkbox"
              id="verify-check"
              checked={isVerifiedChecked}
              onChange={(e) => setIsVerifiedChecked(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
            <label htmlFor="verify-check" className="text-sm font-medium cursor-pointer select-none">
              I confirm that documents are verified and authentic
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!isVerifiedChecked || updateMutation.isPending}
              onClick={() => {
                if (verifyingGuard) {
                  updateMutation.mutate({ id: verifyingGuard.id, verified: "true" });
                  setVerifyingGuard(null);
                  setIsVerifiedChecked(false);
                }
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {updateMutation.isPending ? "Verifying..." : "Verify Guard"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default GuardManagement;
