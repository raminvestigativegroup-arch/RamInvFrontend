import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/config/api";
import { sites, Manager } from "@/data/dummyData";
import { Plus, MoreVertical, Mail, Phone, MapPin, User, ShieldCheck, Trash2, AlertCircle, Image, Upload } from "lucide-react";
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

const normalizeManager = (manager: any, index: number): Manager => ({
  id: String(manager.id || manager._id || `M${String(index + 1).padStart(3, "0")}`),
  name: String(manager.name || manager.fullName || "Unnamed Manager"),
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
});

const ManagerManagement = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", phoneNumber: "", roleId: "", selectedSites: [] as string[], status: "active" as "active" | "inactive", licenseExpiry: "2027-01-01", image: "" });
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [deletingManager, setDeletingManager] = useState<Manager | null>(null);
  const [verifyingManager, setVerifyingManager] = useState<Manager | null>(null);
  const [isVerifiedChecked, setIsVerifiedChecked] = useState(false);

  const queryClient = useQueryClient();


  const {
    data: managerList = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["managers", "full-list"],
    queryFn: async () => {
      const response = await api.managers.list();
      return normalizeManagersResponse(response.data as ManagerApiResponse).map(normalizeManager);
    },
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managers"] });
      toast({ title: "Success", description: "Manager created successfully." });
      setOpen(false);
      setForm({ name: "", email: "", phoneNumber: "", roleId: "", selectedSites: [], status: "active", licenseExpiry: "2027-01-01", image: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create manager.",
        variant: "destructive"
      });
    }
  });

  const updateManagerMutation = useMutation({
    mutationFn: async (payload: { id: string; name?: string; phoneNumber?: string; status?: string; licenseExpiry?: string; verified?: string; image?: string }) => {
      const { id, ...data } = payload;
      const response = await api.managers.update(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managers"] });
      toast({ title: "Success", description: "Manager updated successfully." });
      setOpen(false);
      setEditingManager(null);
      setForm({ name: "", email: "", phoneNumber: "", roleId: "", selectedSites: [], status: "active", licenseExpiry: "2027-01-01", image: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update manager.",
        variant: "destructive"
      });
    }
  });

  const deleteManagerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.managers.delete(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managers"] });
      toast({ title: "Success", description: "Manager deleted successfully." });
      setDeletingManager(null);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast({ title: "Validation Error", description: "Name and email are required.", variant: "destructive" });
      return;
    }

    const payload: any = {
      name: form.name,
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
        name: form.name,
        phoneNumber: form.phoneNumber,
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
      name: mgr.name,
      email: mgr.email,
      phoneNumber: mgr.phoneNumber,
      roleId: mgr.role === "Site Manager" ? "1" : mgr.role === "Regional Manager" ? "2" : "", // Fallback
      selectedSites: mgr.sites,
      status: mgr.status as "active" | "inactive",
      licenseExpiry: mgr.licenseExpiry,
      image: "" // Managers usually don't have avatar strings in this mockup
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

  return (
    <div className="p-6 space-y-6">
      <div className="module-page-header">
        <div>
          <h1 className="module-page-title">Manager Management</h1>
          <p className="text-sm text-muted-foreground">{managerList.length} managers</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />Add Manager
        </button>
      </div>
      <EntityDialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (!val) setEditingManager(null);
        }}
        title={editingManager ? "Update Manager Profile" : "Add New Manager"}
        onSubmit={handleSubmit}
        isLoading={createManagerMutation.isPending || updateManagerMutation.isPending}
        submitLabel={editingManager ? (updateManagerMutation.isPending ? "Updating..." : "Update Profile") : (createManagerMutation.isPending ? "Creating..." : "Add Manager")}
      >

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
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. John Smith" />
        </FormField>
        <FormField label="Email" required>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            disabled={!!editingManager}
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="e.g. john@securepro.com"
          />
        </FormField>
        <FormField label="Phone">
          <input value={form.phoneNumber} onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. +1 555-0300" />
        </FormField>
        <FormField label="Role">
          {editingManager ? (
            <input
              value={editingManager.role}
              disabled
              className="w-full px-3 mb-1 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground opacity-50 cursor-not-allowed"
            />
          ) : (
            <select
              value={form.roleId}
              onChange={e => setForm(f => ({ ...f, roleId: e.target.value }))}
              className="w-full px-3 mb-1 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a role</option>
              {rolesList.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          )}
        </FormField>
        {/* <FormField label="Assigned Sites">
          <div className="flex flex-wrap gap-2">
            {sites.filter(s => s.status === "active").map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSite(s.name)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  form.selectedSites.includes(s.name)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-secondary-foreground border-border hover:bg-muted"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </FormField>
        <FormField label="License Expiry">
          <input type="date" value={form.licenseExpiry} onChange={e => setForm(f => ({ ...f, licenseExpiry: e.target.value }))} className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </FormField> */}
      </EntityDialog>

      {isLoading && (
        <div className="bg-card rounded-xl border border-border p-6 text-sm text-muted-foreground">
          Loading managers...
        </div>
      )}

      {isError && (
        <div className="bg-card rounded-xl border border-destructive/40 p-6 text-sm text-destructive">
          Failed to load managers{error instanceof Error ? `: ${error.message}` : "."}
        </div>
      )}

      {!isLoading && !isError && managerList.length === 0 && (
        <div className="bg-card rounded-xl border border-border p-6 text-sm text-muted-foreground">
          No managers found.
        </div>
      )}

      {!isLoading && !isError && managerList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {managerList.map(mgr => (
            <EntityCard
              key={mgr.id}
              title={mgr.name}
              subtitle={mgr.role}
              avatar={{
                text: mgr.name.split(" ").map(n => n[0]).join(""),
                src: mgr.avatar?.startsWith("data:") ? mgr.avatar : undefined
              }}
              details={[
                { icon: Mail, content: mgr.email },
                { icon: Phone, content: mgr.phoneNumber },
                ...mgr.sites.map(site => ({ icon: MapPin, content: site }))
              ]}
              footerLeft={
                <span className={mgr.status === "active" ? "status-badge-active" : "status-badge-inactive"}>{mgr.status}</span>
              }
              footerMiddle={
                <span className={mgr.isVerified ? "status-badge-active" : "status-badge-inactive"}>
                  {mgr.isVerified ? "Verified" : "Not Verified"}
                </span>
              }
              footerRight={
                <span className="text-xs text-muted-foreground">License: {mgr.licenseExpiry}</span>
              }
              menuItems={[
                {
                  label: "Profile Update",
                  icon: User,
                  onClick: () => handleEditClick(mgr)
                },
                {
                  label: "Document Verify",
                  icon: ShieldCheck,
                  onClick: () => setVerifyingManager(mgr)
                },
                {
                  label: "Delete Account",
                  icon: Trash2,
                  variant: "destructive",
                  onClick: () => setDeletingManager(mgr)
                },
              ]}

            />
          ))}
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
              Are you sure you want to delete <strong>{deletingManager?.name}</strong>? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingManager && deleteManagerMutation.mutate(deletingManager.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteManagerMutation.isPending ? "Deleting..." : "Delete Account"}
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!isVerifiedChecked || updateManagerMutation.isPending}
              onClick={() => {
                if (verifyingManager) {
                  updateManagerMutation.mutate({ id: verifyingManager.id, verified: "true" });
                  setVerifyingManager(null);
                  setIsVerifiedChecked(false);
                }
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {updateManagerMutation.isPending ? "Verifying..." : "Verify Manager"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};


export default ManagerManagement;
