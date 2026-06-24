import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, API_BASE_URL } from "@/config/api";
import { sites, Manager } from "@/data/dummyData";
import { Plus, MoreVertical, Mail, Phone, MapPin, User, ShieldCheck, Trash2, AlertCircle, Image, Upload, UserCog, Search, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import FormField from "@/components/common/FormField";
import StateMessage from "@/components/common/StateMessage";
import SelectDropdown from "@/components/common/SelectDropdown";
import { Button } from "@/components/ui/button";

type ManagerApiResponse =
  | Manager[]
  | {
    data?: Manager[] | { managers?: Manager[]; items?: Manager[]; results?: Manager[] };
    managers?: Manager[];
    items?: Manager[];
    results?: Manager[];

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

const normalizeManagersResponse = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (response.data && !Array.isArray(response.data)) {
    return response.data.managers || response.data.items || response.data.results || [];
  }
  return response.managers || response.items || response.results || [];
};

const normalizeManager = (manager: any, index: number): Manager => {
  const firstName = String(manager.firstName || "");
  const middleName = String(manager.middleName || "");
  const lastName = String(manager.lastName || "");
  const name = String(manager.name || [firstName, middleName, lastName].filter(Boolean).join(" ") || manager.fullName || "Unnamed Manager");
  return {
    id: String(manager.id || manager._id || `M${String(index + 1).padStart(3, "0")}`),
    name,
    firstName,
    middleName,
    lastName,
    email: String(manager.email || ""),
    phoneNumber: String(manager.phoneNumber || manager.mobile || ""),
    role: String(manager.role || "Site Manager"),
    sites: Array.isArray(manager.sites)
      ? manager.sites.map(String)
      : manager.site
        ? [String(manager.site)]
        : [],
    status: manager.status === "inactive" ? "inactive" : "active",
    licenseExpiry: String(manager.licenseExpiry || manager.license_expiry || "N/A"),
    avatar: String(manager.profilePhoto || manager.avatar || ""),
    isVerified: manager.isVerified === true || manager.verified === true || manager.verified === "true" || manager.isVerified === "true",
    roleId: manager.roleId ? String(manager.roleId) : undefined,
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
  const personDocs = documents.filter((doc: any) => doc.ownerId === personId && doc.ownerType === "Manager");
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

const ManagerManagement = () => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const permissions = user?.permissions || [];
  const isAdmin = user?.role === "admin";

  const hasViewPermission = isAdmin || permissions.includes("view_manager") || permissions.includes("manager");
  const hasCreatePermission = isAdmin || permissions.includes("create_manager") || permissions.includes("manager");
  const hasEditPermission = isAdmin || permissions.includes("edit_manager") || permissions.includes("manager");
  const hasDeletePermission = isAdmin || permissions.includes("delete_manager") || permissions.includes("manager");

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState({ firstName: "", middleName: "", lastName: "", email: "", phoneNumber: "", roleId: "", selectedSites: [] as string[], status: "active" as "active" | "inactive", licenseExpiry: "2027-01-01", image: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [deletingManager, setDeletingManager] = useState<Manager | null>(null);
  const [verifyingManager, setVerifyingManager] = useState<Manager | null>(null);
  const [isVerifiedChecked, setIsVerifiedChecked] = useState(false);

  const queryClient = useQueryClient();


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
    data: managerList = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["managers", debouncedSearch],
    queryFn: async () => {
      const params: any = {};
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      const response = await api.managers.list(params);
      return normalizeManagersResponse(response.data as ManagerApiResponse).map(normalizeManager);
    },
  });

  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

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
          name: s.name || "Unnamed Site",
          managerIds: s.managerIds || [],
          managers: s.managers || [],
          manager: s.manager || s.managerid
        }));
      } catch (e) {
        return [];
      }
    }
  });

  const { data: guardList = [] } = useQuery({
    queryKey: ["guards"],
    queryFn: async () => {
      try {
        const response = await api.guards.list();
        const raw = response.data as any;
        let list: any[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (Array.isArray(raw?.data)) list = raw.data;
        else if (raw?.data && typeof raw.data === 'object') {
          list = raw.data.guards || raw.data.items || raw.data.results || [];
        } else {
          list = raw?.guards || raw?.items || raw?.results || [];
        }
        return list;
      } catch (e) {
        return [];
      }
    }
  });

  const filtered = useMemo(() => {
    return managerList.filter((m) => {
      const matchVerified =
        verifiedFilter === "all" ||
        (verifiedFilter === "verified" && m.isVerified) ||
        (verifiedFilter === "unverified" && !m.isVerified);
      const matchStatus =
        statusFilter === "all" ||
        m.status === statusFilter;
      return matchVerified && matchStatus;
    });
  }, [managerList, verifiedFilter, statusFilter]);

  const isNotFound = isError && ((error as any)?.response?.status === 404 || (error as any)?.message?.includes("404"));
  const showLoader = isLoading;
  const showEmpty = !isLoading && (filtered.length === 0 || isNotFound);
  const showError = isError && !isNotFound;

  const { data: rolesList = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await api.roles.list();
      return normalizeRolesResponse(response.data).map(normalizeRole);
    },
  });

  const createManagerMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.managers.create(payload);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["managers"] });
      toast({ title: "Success", description: "Manager created successfully." });
      setOpen(false);
      setForm({ firstName: "", middleName: "", lastName: "", email: "", phoneNumber: "", roleId: "", selectedSites: [], status: "active", licenseExpiry: "2027-01-01", image: "" });
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || "Failed to create manager.";
      setErrors(prev => ({ ...prev, form: errMsg }));
    }
  });

  const updateManagerMutation = useMutation({
    mutationFn: async (payload: { id: string; firstName?: string; middleName?: string; lastName?: string; phoneNumber?: string; roleId?: string; status?: string; licenseExpiry?: string; verified?: string; image?: string }) => {
      const { id, ...data } = payload;
      const response = await api.managers.update(id, data);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["managers"] });
      toast({ title: "Success", description: "Manager updated successfully." });
      setOpen(false);
      setEditingManager(null);
      setVerifyingManager(null);
      setIsVerifiedChecked(false);
      setForm({ firstName: "", middleName: "", lastName: "", email: "", phoneNumber: "", roleId: "", selectedSites: [], status: "active", licenseExpiry: "2027-01-01", image: "" });
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || "Failed to update manager.";
      setErrors(prev => ({ ...prev, form: errMsg }));
    }
  });

  const deleteManagerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.managers.delete(id);
      return response.data;
    },
    onSuccess: async (data, id) => {
      queryClient.setQueriesData({ queryKey: ["managers"] }, (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.filter((m: any) => m.id !== id);
      });
      setDeletingManager(null);
      toast({ title: "Success", description: "Manager deleted successfully." });
      await queryClient.invalidateQueries({ queryKey: ["managers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete manager.",
        variant: "destructive"
      });
    }
  });


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
    if (!editingManager) {
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
    if (!form.roleId.trim()) {
      newErrors.roleId = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload: any = {
      firstName: form.firstName,
      middleName: form.middleName,
      lastName: form.lastName,
      email: form.email,
      phoneNumber: form.phoneNumber,
      roleId: form.roleId,
      status: form.status,
      licenseExpiry: form.licenseExpiry,
      profilePhoto: form.image
    };

    if (editingManager) {
      const updatePayload = {
        id: editingManager.id,
        firstName: form.firstName,
        middleName: form.middleName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber,
        roleId: form.roleId,
        status: form.status,
        licenseExpiry: form.licenseExpiry,
        profilePhoto: form.image
      };
      updateManagerMutation.mutate(updatePayload);
    } else {
      createManagerMutation.mutate(payload);
    }
  };

  const handleEditClick = (mgr: Manager) => {
    setEditingManager(mgr);
    setForm({
      firstName: mgr.firstName || "",
      middleName: mgr.middleName || "",
      lastName: mgr.lastName || "",
      email: mgr.email,
      phoneNumber: mgr.phoneNumber,
      roleId: mgr.role === "Site Manager" ? "1" : mgr.role === "Regional Manager" ? "2" : "", // Fallback
      selectedSites: mgr.sites,
      status: mgr.status as "active" | "inactive",
      licenseExpiry: mgr.licenseExpiry,
      image: resolveImageUrl(mgr.avatar) || ""
    });
    setOpen(true);
  };


  const toggleSite = (siteName: string) => {
    setForm(f => ({
      ...f,
      selectedSites: f.selectedSites.includes(siteName)
        ? f.selectedSites.filter(s => s !== siteName)
        : [...f.selectedSites, siteName],
    }));
  };

  if (!hasViewPermission) {
    return (
      <div className="p-6">
        <StateMessage
          type="error"
          title="Access Denied"
          message="You do not have permission to view Manager Management."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="module-page-header">
        <div>
          <h1 className="module-page-title">Manager Management</h1>
          <p className="text-sm text-muted-foreground">{managerList.length} managers</p>
        </div>
        {hasCreatePermission && (
          <Button
            onClick={() => setOpen(true)}
          >
            <Plus className="w-4 h-4" />Add Manager
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
            placeholder="Search managers..."
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
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All Accounts" },
              { value: "active", label: "Active Only" },
              { value: "inactive", label: "Inactive Only" },
            ]}
            placeholder="Account State"
            className="w-full sm:w-[135px]"
          />

          {(verifiedFilter !== "all" || statusFilter !== "all") && (
            <Button
              onClick={() => {
                setVerifiedFilter("all");
                setStatusFilter("all");
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
            setEditingManager(null);
            setForm({ firstName: "", middleName: "", lastName: "", email: "", phoneNumber: "", roleId: "", selectedSites: [], status: "active", licenseExpiry: "2027-01-01", image: "" });
          }
          setErrors({});
        }}
        title={editingManager ? "Update Manager Profile" : "Add New Manager"}
        onSubmit={handleSubmit}
        isLoading={createManagerMutation.isPending || updateManagerMutation.isPending}
        submitLabel={editingManager ? (updateManagerMutation.isPending ? "Updating..." : "Update Profile") : (createManagerMutation.isPending ? "Creating..." : "Add Manager")}
      >

        {errors.form && (
          <div className="p-3 mb-4 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
            {errors.form}
          </div>
        )}
        <FormField label="Profile Photo">
          <div
            onClick={() => document.getElementById('manager-image-upload')?.click()}
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
              id="manager-image-upload"
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
            onChange={e => {
              setForm(f => ({ ...f, email: e.target.value }));
              if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
            }}
            disabled={!!editingManager}
            className={`w-full px-3 py-2 bg-secondary border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${errors.email ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
              }`}
            placeholder="e.g. john@securepro.com"
          />
        </FormField>
        <FormField label="Phone" required error={errors.phoneNumber}>
          <input
            value={form.phoneNumber}
            onChange={e => {
              setForm(f => ({ ...f, phoneNumber: e.target.value }));
              if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: undefined }));
            }}
            className={`w-full px-3 py-2 bg-secondary border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 ${errors.phoneNumber ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
              }`}
            placeholder="e.g. +1 555-0300"
          />
        </FormField>
        <FormField label="Role" required error={errors.roleId}>
          <SelectDropdown
            value={form.roleId}
            onChange={val => {
              setForm(f => ({ ...f, roleId: val }));
              if (errors.roleId) setErrors(prev => ({ ...prev, roleId: undefined }));
            }}
            options={rolesList.map(role => ({ value: role.id, label: role.name }))}
            placeholder="Select a role"
            className={errors.roleId ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"}
          />
        </FormField>
        {/* <FormField label="Assigned Sites">
          <div className="flex flex-wrap gap-2">
            {sites.filter(s => s.status === "active").map(s => (
              <Button
                key={s.id}
                type="button"
                onClick={() => toggleSite(s.name)}
                variant={form.selectedSites.includes(s.name) ? "default" : "outline"}
                size="sm"
                className="h-7 px-2.5 rounded-full text-xs"
              >
                {s.name}
              </Button>
            ))}
          </div>
        </FormField>
        <FormField label="License Expiry">
          <input type="date" value={form.licenseExpiry} onChange={e => setForm(f => ({ ...f, licenseExpiry: e.target.value }))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </FormField> */}
      </EntityDialog>

      {showLoader && (
        <StateMessage type="loading" message="Loading managers..." />
      )}

      {showError && (
        <StateMessage
          type="error"
          title="Failed to load managers"
          message={error instanceof Error ? error.message : undefined}
        />
      )}

      {!showLoader && !showError && showEmpty && (
        <StateMessage
          type="empty"
          title="Manager not found"
          message="Create a new manager to get started."
          icon={UserCog}
        />
      )}

      {!showLoader && !showError && !showEmpty && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(mgr => {
            const { complianceStatus, licenseExpiry } = getComplianceDetails(mgr.id, rawDocuments);

            const assignedSites = siteList.filter((s: any) =>
              s.managerIds?.some((id: any) => String(id) === String(mgr.id)) ||
              s.managers?.some((m: any) => String(m.id) === String(mgr.id)) ||
              String(s.manager) === String(mgr.id)
            );

            const assignedGuards = guardList.filter((g: any) => String(g.managerId) === String(mgr.id));

            return (
              <EntityCard
                key={mgr.id}
                title={mgr.name}
                subtitle={mgr.role}
                avatar={{
                  text: mgr.name.split(" ").filter(Boolean).map(n => n[0]).join(""),
                  src: resolveImageUrl(mgr.avatar)
                }}
                details={[
                  { icon: Mail, content: mgr.email },
                  { icon: Phone, content: mgr.phoneNumber },
                  ...assignedSites.map(s => ({ icon: MapPin, content: s.name }))
                ]}
                footerLeft={
                  <span className={mgr.status === "active" ? "status-badge-active" : "status-badge-inactive"}>{mgr.status}</span>
                }
                footerMiddle={
                  <span className={mgr.isVerified ? "status-badge-active" : "status-badge-inactive"}>
                    {mgr.isVerified ? "Verified" : "Not Verified"}
                  </span>
                }
                menuItems={[
                  ...(hasEditPermission ? [
                    {
                      label: "Profile Update",
                      icon: User,
                      onClick: () => handleEditClick(mgr)
                    },
                    {
                      label: "Document Verify",
                      icon: ShieldCheck,
                      onClick: () => setVerifyingManager(mgr)
                    }
                  ] : []),
                  ...(hasDeletePermission ? [
                    {
                      label: "Delete Account",
                      icon: Trash2,
                      variant: "destructive",
                      onClick: () => setDeletingManager(mgr)
                    }
                  ] : [])
                ]}
                footerContent={
                  <div className="flex flex-col gap-2.5 w-full">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${complianceStatus === "valid" ? "text-success" : complianceStatus === "expiring" ? "text-warning" : complianceStatus === "expired" ? "text-destructive" : "text-muted-foreground"}`}>
                        License: {complianceStatus}
                      </span>
                      <span className="text-xs text-muted-foreground">Exp: {licenseExpiry}</span>
                    </div>
                    {assignedGuards.length > 0 && (
                      <div className="flex items-center gap-2 mt-1 border-t border-border/50 pt-2">
                        <div className="flex -space-x-1.5">
                          {assignedGuards.slice(0, 5).map((g: any) => {
                            let avatarContent: React.ReactNode;
                            if (g.profilePhoto) {
                              avatarContent = <img src={g.profilePhoto} alt={g.name} className="w-full h-full object-cover rounded-full" />;
                            } else {
                              avatarContent = g.name ? g.name.split(" ").filter(Boolean).map((n: string) => n[0].toUpperCase()).join("") : "G";
                            }
                            return (
                              <div key={g.id} className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold border border-card overflow-hidden shadow-xs">
                                {avatarContent}
                              </div>
                            );
                          })}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {assignedGuards.length} guard(s) scheduled
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
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingManager} onOpenChange={(val) => !val && setDeletingManager(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <AlertDialogTitle>Delete Manager Account?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingManager?.name}</strong>? This action cannot be undone and will remove all associated data. Note that this manager cannot be deleted if they are currently assigned to any sites or upcoming/active schedules.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={deleteManagerMutation.isPending}>
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={() => deletingManager && deleteManagerMutation.mutate(deletingManager.id)}
                loading={deleteManagerMutation.isPending}
              >
                Delete Account
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Verification Dialog */}
      <AlertDialog open={!!verifyingManager} onOpenChange={(val) => {
        if (!val) {
          setVerifyingManager(null);
          setIsVerifiedChecked(false);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <AlertDialogTitle>Verify Manager Documents</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Please confirm that you have verified all required documents for <strong>{verifyingManager?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg border border-border mt-2">
            <input
              type="checkbox"
              id="verify-manager-check"
              checked={isVerifiedChecked}
              onChange={(e) => setIsVerifiedChecked(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
            <label htmlFor="verify-manager-check" className="text-sm font-medium cursor-pointer select-none">
              I confirm that documents are verified and authentic
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={updateManagerMutation.isPending}>
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                disabled={!isVerifiedChecked}
                onClick={() => {
                  if (verifyingManager) {
                    updateManagerMutation.mutate({ id: verifyingManager.id, verified: "true" });
                  }
                }}
                loading={updateManagerMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Verify Manager
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};


export default ManagerManagement;
