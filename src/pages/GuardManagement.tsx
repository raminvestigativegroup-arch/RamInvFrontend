import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/config/api";
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
  const name = String(guard.name || guard.fullName || "Unnamed Guard");
  return {
    id: String(guard.id || guard._id || `G${String(index + 1).padStart(3, "0")}`),
    name,
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
    profilePhoto: String(guard.profilePhoto || guard.avatar || getInitials(name) || "G"),
    hoursThisWeek: Number(guard.hoursThisWeek || 0),
    scheduledHours: Number(guard.scheduledHours || 0),
    isVerified: guard.isVerified === true || guard.verified === true || guard.verified === "true" || guard.isVerified === "true",
    roleId: String(guard.roleId || ""),
  };
};

const GuardManagement = () => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
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


  const {
    data: guardList = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["guards"],
    queryFn: async () => {
      const response = await api.guards.list();
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
    mutationFn: (data: { name: string; email: string; phoneNumber: string; roleType: string; image?: string }) =>
      api.guards.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guards"] });
      setOpen(false);
      setForm({ name: "", email: "", phoneNumber: "", site: sites[0]?.name || "", licenseExpiry: "2027-01-01", image: "", roleType: "" });
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
    mutationFn: (data: { id: string; name?: string; phoneNumber?: string; roleType?: string; verified?: string; image?: string }) =>
      api.guards.update(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guards"] });
      setOpen(false);
      setEditingGuard(null);
      setForm({ name: "", email: "", phoneNumber: "", site: sites[0]?.name || "", licenseExpiry: "2027-01-01", image: "", roleType: "" });
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


  const filtered = useMemo(
    () =>
      guardList.filter(
        (g) =>
          g.name.toLowerCase().includes(search.toLowerCase()) ||
          g.site.toLowerCase().includes(search.toLowerCase())
      ),
    [guardList, search]
  );

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
    if (!form.name || !form.email) {
      toast({ title: "Validation Error", description: "Name and email are required.", variant: "destructive" });
      return;
    }

    if (editingGuard) {
      updateMutation.mutate({
        id: editingGuard.id,
        name: form.name,
        phoneNumber: form.phoneNumber,
        roleType: form.roleType,
        profilePhoto: form.image,
      });
    } else {
      createMutation.mutate({
        name: form.name,
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
      name: guard.name,
      email: guard.email,
      phoneNumber: guard.phoneNumber,
      site: guard.site,
      licenseExpiry: guard.licenseExpiry,
      image: guard.profilePhoto?.startsWith("data:") ? guard.profilePhoto : "",
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

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search guards..." className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors">
          <Filter className="w-4 h-4" />Filters
        </button>
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
          {filtered.map((guard) => (
            <EntityCard
              key={guard.id}
              title={guard.name}
              subtitle={rolesList.find((r: any) => r.id === guard.roleId)?.name || "Guard"}
              avatar={{
                text: getInitials(guard.name),
                src: guard.profilePhoto?.startsWith("data:") ? guard.profilePhoto : undefined
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
                  <span className={`text-xs font-medium ${guard.complianceStatus === "valid" ? "text-success" : guard.complianceStatus === "expiring" ? "text-warning" : "text-destructive"}`}>
                    License: {guard.complianceStatus}
                  </span>
                  <span className="text-xs text-muted-foreground">Exp: {guard.licenseExpiry}</span>
                </div>
              }
            />
          ))}
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

        <FormField label="Full Name" required>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. John Smith" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </FormField>
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
        <FormField label="Phone">
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
