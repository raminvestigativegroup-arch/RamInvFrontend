import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/config/api";
import { Shield, Plus, Edit, Check, X, UserCog, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EntityDialog from "@/components/common/EntityDialog";
import StateMessage from "@/components/common/StateMessage";
import FormField from "@/components/common/FormField";
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


interface PermissionRecord {
  uuid: string;
  roleId: string;
  permission: string[];
}

interface Role {
  id: string;
  name: string;
  permissions?: PermissionRecord[];
}

const AVAILABLE_PERMISSIONS = [
  { key: "webLogin", label: "Web Login Access", desc: "Allow users with this role to log in to the web dashboard" },
  { key: "dashboard", label: "Dashboard", desc: "Access the main analytics dashboard and KPIs" },
  { key: "guard", label: "Guard Management", desc: "Access guard profiles and duty registration" },
  { key: "manager", label: "Manager Management", desc: "Configure manager access and notifications" },
  { key: "site", label: "Site Management", desc: "Manage site geofencing and assignments" },
  { key: "incident", label: "Incident Management", desc: "View and update security incident logs" },
  { key: "scheduling", label: "Scheduling", desc: "Manage duty schedules and guard shifts" },
  { key: "compliance", label: "Compliance", desc: "Verify documentation and certifications" },
  { key: "hour", label: "Hours Tracking", desc: "Monitor clock-in/out and timesheets" },
  { key: "report", label: "Reports", desc: "Generate and download analytics reports" },
  { key: "notification", label: "Notifications", desc: "Send alerts and broadcast updates" },
  { key: "role", label: "Roles & Permissions", desc: "Configure user permissions and system access" },
  { key: "setting", label: "System Settings", desc: "System configurations and global settings" },
];

const normalizeRoles = (resData: any): Role[] => {
  if (!resData) return [];
  if (Array.isArray(resData)) return resData;
  if (Array.isArray(resData.data)) return resData.data;
  if (resData.roles && Array.isArray(resData.roles)) return resData.roles;
  return [];
};

const hasPermission = (role: Role, permKey: string): boolean => {
  if (!role || !role.permissions || !Array.isArray(role.permissions)) return false;
  return role.permissions.some((p: any) =>
    Array.isArray(p.permission) && p.permission.includes(permKey)
  );
};

const RolesPermissions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  // Forms state
  const [newRoleName, setNewRoleName] = useState("");
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);


  // Fetch Roles
  const {
    data: rolesList = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["roles", "full-list"],
    queryFn: async () => {
      const response = await api.roles.list();
      return normalizeRoles(response.data);
    },
  });

  // Create Role Mutation
  const createRoleMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await api.roles.create({ name });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Success", description: "Role created successfully." });
      setCreateModalOpen(false);
      setNewRoleName("");
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to create role.",
        variant: "destructive",
      });
    },
  });

  // Update Role Mutation
  const updateRoleMutation = useMutation({
    mutationFn: async (payload: { id: string; name: string }) => {
      const response = await api.roles.update(payload.id, { name: payload.name });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Success", description: "Role name updated successfully." });
      setCreateModalOpen(false);
      setEditingRole(null);
      setNewRoleName("");
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update role.",
        variant: "destructive",
      });
    },
  });

  // Delete Role Mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.roles.delete(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Success", description: "Role deleted successfully." });
      setDeletingRole(null);
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete role.",
        variant: "destructive",
      });
    },
  });



  // Assign Permissions Mutation
  const assignPermissionsMutation = useMutation({
    mutationFn: async (payload: { roleId: string; permission: string[] }) => {
      const response = await api.roles.assignPermissions(payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Success", description: "Permissions updated successfully." });
      setAssignModalOpen(false);
      setSelectedRole(null);
      setSelectedPermissions([]);
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to assign permissions.",
        variant: "destructive",
      });
    },
  });

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      toast({ title: "Validation Error", description: "Role name is required.", variant: "destructive" });
      return;
    }
    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, name: newRoleName.trim() });
    } else {
      createRoleMutation.mutate(newRoleName.trim());
    }
  };

  const handleOpenEditRoleModal = (role: Role) => {
    setEditingRole(role);
    setNewRoleName(role.name);
    setCreateModalOpen(true);
  };


  const handleOpenAssignModal = (role: Role) => {
    setSelectedRole(role);
    // Extract existing permission keys for this role
    const currentPermissions: string[] = [];
    if (role.permissions && Array.isArray(role.permissions)) {
      role.permissions.forEach((p) => {
        if (Array.isArray(p.permission)) {
          currentPermissions.push(...p.permission);
        }
      });
    }
    setSelectedPermissions(currentPermissions);
    setAssignModalOpen(true);
  };

  const handleTogglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleAssignPermissions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    assignPermissionsMutation.mutate({
      roleId: selectedRole.id,
      permission: selectedPermissions,
    });
  };

  const isNotFound = isError && ((error as any)?.response?.status === 404 || (error as any)?.message?.includes("404"));
  const showLoader = isLoading && rolesList.length === 0;
  const showEmpty = rolesList.length === 0 || isNotFound;
  const showError = isError && !isNotFound;

  return (
    <div className="p-6 space-y-6">
      <div className="module-page-header">
        <div>
          <h1 className="module-page-title">Roles & Permissions</h1>
          <p className="text-sm text-muted-foreground">Define access levels and module permissions</p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />Create Role
        </button>
      </div>

      {showLoader && (
        <StateMessage type="loading" message="Loading roles & permissions..." />
      )}

      {showError && (
        <StateMessage
          type="error"
          title="Failed to load roles"
          message={error instanceof Error ? error.message : undefined}
        />
      )}

      {!showLoader && !showError && showEmpty && (
        <StateMessage
          type="empty"
          title="No Roles Found"
          message="Create a new role to begin defining permissions."
          icon={UserCog}
          onRetry={() => setCreateModalOpen(true)}
          retryLabel="Create Role"
        />
      )}

      {!showLoader && !showError && !showEmpty && rolesList.length > 0 && (
        <>
          {/* Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {rolesList.map(role => (
              <div key={role.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground capitalize">{role.name}</p>
                      {/* <p className="text-xs text-muted-foreground">ID: {role.id.substring(0, 8)}...</p> */}
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenAssignModal(role)}
                    className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-md transition-colors"
                    title="Edit Permissions"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {AVAILABLE_PERMISSIONS.map(perm => {
                    const active = hasPermission(role, perm.key);
                    return (
                      <span
                        key={perm.key}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-all ${active
                          ? "bg-success/10 text-success border border-success/20"
                          : "bg-secondary/40 text-muted-foreground/60 border border-transparent"
                          }`}
                      >
                        {perm.label}
                      </span>
                    );
                  })}
                </div>
                <div className="mt-4 pt-3 border-t border-border flex justify-end gap-2">
                  <button
                    onClick={() => handleOpenEditRoleModal(role)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1.5 hover:bg-primary/5 rounded-md"
                    title="Edit Role Name"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Role Name</span>
                  </button>
                  <button
                    onClick={() => setDeletingRole(role)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1.5 hover:bg-destructive/5 rounded-md"
                    title="Delete Role"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Role</span>
                  </button>
                </div>
              </div>


            ))}
          </div>

          {/* Permission Matrix */}
          <div className="data-table overflow-x-auto bg-card rounded-xl border border-border">
            <div className="p-5 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Permission Matrix</h2>
            </div>
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3.5">MODULE</th>
                  {rolesList.map(r => (
                    <th key={r.id} className="text-center text-xs font-semibold text-muted-foreground px-4 py-3.5 capitalize">{r.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AVAILABLE_PERMISSIONS.map(perm => (
                  <tr key={perm.key} className="border-b border-border hover:bg-muted/35 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-foreground">{perm.label}</td>
                    {rolesList.map(r => (
                      <td key={r.id} className="text-center px-4 py-3.5">
                        {hasPermission(r, perm.key) ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-success/10">
                            <Check className="w-4 h-4 text-success" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-destructive/10">
                            <X className="w-4 h-4 text-destructive/70" />
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Create/Edit Role Modal */}
      <EntityDialog
        open={createModalOpen}
        onOpenChange={(val) => {
          setCreateModalOpen(val);
          if (!val) {
            setEditingRole(null);
            setNewRoleName("");
          }
        }}
        title={editingRole ? "Update Role" : "Create New Role"}
        onSubmit={handleCreateRole}
        submitLabel={
          editingRole
            ? (updateRoleMutation.isPending ? "Updating..." : "Update Role")
            : (createRoleMutation.isPending ? "Creating..." : "Create Role")
        }
        isLoading={createRoleMutation.isPending || updateRoleMutation.isPending}
      >
        <FormField label="Role Name" required>

          <input
            type="text"
            placeholder="e.g. Head Guard"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            className="w-full px-3 py-2 mb-1 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />

        </FormField>
      </EntityDialog>


      {/* Assign Permissions Modal */}
      <EntityDialog
        open={assignModalOpen}
        onOpenChange={(val) => {
          setAssignModalOpen(val);
          if (!val) setSelectedRole(null);
        }}
        title={selectedRole ? `Assign Permissions: ${selectedRole.name}` : "Assign Permissions"}
        onSubmit={handleAssignPermissions}
        submitLabel={assignPermissionsMutation.isPending ? "Saving..." : "Save Permissions"}
        isLoading={assignPermissionsMutation.isPending}
        maxWidth="sm:max-w-lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          {AVAILABLE_PERMISSIONS.map((perm) => {
            const isChecked = selectedPermissions.includes(perm.key);
            return (
              <label
                key={perm.key}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${isChecked
                  ? "bg-primary/5 border-primary/25 text-foreground font-medium"
                  : "bg-card border-border hover:bg-muted/30 text-muted-foreground"
                  }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleTogglePermission(perm.key)}
                  className="w-4 h-4 mt-0.5 text-primary focus:ring-primary border-border rounded cursor-pointer"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{perm.label}</span>
                  <span className="text-xs text-muted-foreground/80 font-normal leading-normal">{perm.desc}</span>
                </div>
              </label>
            );
          })}
        </div>
      </EntityDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingRole} onOpenChange={(val) => !val && setDeletingRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <AlertDialogTitle>Delete Role?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to delete the role <strong>{deletingRole?.name}</strong>? This action cannot be undone and will remove all associated permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingRole && deleteRoleMutation.mutate(deletingRole.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRoleMutation.isPending ? "Deleting..." : "Delete Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

  );
};

export default RolesPermissions;
