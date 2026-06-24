import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/config/api";
import { Shield, Plus, Edit, Check, X, UserCog, Trash2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EntityDialog from "@/components/common/EntityDialog";
import StateMessage from "@/components/common/StateMessage";
import FormField from "@/components/common/FormField";
import { Button } from "@/components/ui/button";
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

const PERMISSION_MODULES = [
  {
    title: "General Access",
    permissions: [
      { key: "webLogin", label: "Web Login Access", desc: "Allow users with this role to log in to the web dashboard" },
      { key: "dashboard", label: "Dashboard", desc: "Access the main analytics dashboard and KPIs" },
    ]
  },
  {
    title: "Guard Management",
    baseKey: "guard",
    actions: [
      { action: "create", label: "Create Guard", desc: "Register new guard accounts" },
      { action: "view", label: "View Guard", desc: "View lists and profiles of guards" },
      { action: "edit", label: "Edit Guard", desc: "Update profiles and verify documents" },
      { action: "delete", label: "Delete Guard", desc: "Remove guard profiles from the system" },
    ]
  },
  {
    title: "Manager Management",
    baseKey: "manager",
    actions: [
      { action: "create", label: "Create Manager", desc: "Register new manager accounts" },
      { action: "view", label: "View Manager", desc: "View lists and profiles of managers" },
      { action: "edit", label: "Edit Manager", desc: "Update manager settings and assignments" },
      { action: "delete", label: "Delete Manager", desc: "Remove manager profiles from the system" },
    ]
  },
  {
    title: "Site Management",
    baseKey: "site",
    actions: [
      { action: "create", label: "Create Site", desc: "Register new sites and configure geofences" },
      { action: "view", label: "View Site", desc: "View site lists and configuration details" },
      { action: "edit", label: "Edit Site", desc: "Modify site geofences and guard assignments" },
      { action: "delete", label: "Delete Site", desc: "Decommission and delete sites" },
    ]
  },
  {
    title: "Incident Management",
    baseKey: "incident",
    actions: [
      { action: "create", label: "Create Incident", desc: "Log new incident reports" },
      { action: "view", label: "View Incident", desc: "Access security incident logs and details" },
      { action: "edit", label: "Edit Incident", desc: "Update or resolve incident tickets" },
      { action: "delete", label: "Delete Incident", desc: "Delete incident records from historical logs" },
    ]
  },
  {
    title: "Scheduling",
    baseKey: "scheduling",
    actions: [
      { action: "create", label: "Create Schedule", desc: "Schedule new guard shifts" },
      { action: "view", label: "View Schedule", desc: "View duty calendars and weekly timelines" },
      { action: "edit", label: "Edit Schedule", desc: "Modify schedules and shift assignments" },
      { action: "delete", label: "Delete Schedule", desc: "Cancel and remove scheduled shifts" },
    ]
  },
  {
    title: "Compliance",
    baseKey: "compliance",
    actions: [
      { action: "create", label: "Create Compliance Document", desc: "Upload and add certification files" },
      { action: "view", label: "View Compliance Documents", desc: "Browse licenses, certifications, and compliance logs" },
      { action: "edit", label: "Edit Compliance Status", desc: "Update document verification status and details" },
      { action: "delete", label: "Delete Compliance Document", desc: "Remove compliance records from the database" },
    ]
  },
  {
    title: "Hours Tracking",
    baseKey: "hour",
    actions: [
      { action: "create", label: "Create Timesheet Record", desc: "Manually log clock-in/out records" },
      { action: "view", label: "View Timesheets", desc: "Monitor worked hours and weekly summaries" },
      { action: "edit", label: "Edit Timesheets", desc: "Adjust check-in/out stamps and hours" },
      { action: "delete", label: "Delete Timesheet Record", desc: "Remove attendance entries" },
    ]
  },
  {
    title: "Reports & Exports",
    baseKey: "report",
    actions: [
      { action: "create", label: "Generate Report", desc: "Compile and build custom reports" },
      { action: "view", label: "View Reports", desc: "Read history and preview generated reports" },
      { action: "edit", label: "Edit Reports", desc: "Configure report templates and parameters" },
      { action: "delete", label: "Delete Report", desc: "Remove reports from the history list" },
    ]
  },
  {
    title: "Notifications",
    baseKey: "notification",
    actions: [
      { action: "create", label: "Send Notification", desc: "Broadcast new notifications and alerts" },
      { action: "view", label: "View Notifications", desc: "Access the sent alerts feed" },
      { action: "edit", label: "Edit Notification", desc: "Modify scheduled broadcasts" },
      { action: "delete", label: "Delete Notification", desc: "Clear notification logs" },
    ]
  },
  {
    title: "Roles & Permissions",
    baseKey: "role",
    actions: [
      { action: "create", label: "Create Role", desc: "Create new user roles" },
      { action: "view", label: "View Roles", desc: "Browse system roles and matrix" },
      { action: "edit", label: "Edit Permissions", desc: "Modify permissions assigned to roles" },
      { action: "delete", label: "Delete Role", desc: "Remove roles from the system database" },
    ]
  },
  {
    title: "System Settings",
    baseKey: "setting",
    actions: [
      { action: "create", label: "Create Setting Override", desc: "Define custom system variables" },
      { action: "view", label: "View Settings", desc: "Access global and system parameters" },
      { action: "edit", label: "Edit Settings", desc: "Modify company details and system settings" },
      { action: "delete", label: "Reset Settings", desc: "Clear custom settings to default value" },
    ]
  }
];

const AVAILABLE_PERMISSIONS = PERMISSION_MODULES.flatMap(mod => {
  if ('permissions' in mod) return mod.permissions;
  return mod.actions.map(act => ({
    key: `${act.action}_${mod.baseKey}`,
    label: act.label,
    desc: act.desc
  }));
});

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
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const permissions = user?.permissions || [];
  const isAdmin = user?.role === "admin";

  const hasViewPermission = isAdmin || permissions.includes("view_role") || permissions.includes("role");
  const hasCreatePermission = isAdmin || permissions.includes("create_role") || permissions.includes("role");
  const hasEditPermission = isAdmin || permissions.includes("edit_role") || permissions.includes("role");
  const hasDeletePermission = isAdmin || permissions.includes("delete_role") || permissions.includes("role");

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
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getModulePermissions = (mod: any) => {
    if ('permissions' in mod) return mod.permissions;
    return mod.actions.map((act: any) => ({
      key: `${act.action}_${mod.baseKey}`,
      label: act.label,
      desc: act.desc
    }));
  };

  const getModuleCheckedState = (mod: any) => {
    const items = getModulePermissions(mod);
    const checkedCount = items.filter((p: any) => selectedPermissions.includes(p.key)).length;
    if (checkedCount === 0) return "none";
    if (checkedCount === items.length) return "all";
    return "partial";
  };

  const handleToggleModuleAll = (mod: any) => {
    const items = getModulePermissions(mod);
    const keys = items.map((p: any) => p.key);
    const state = getModuleCheckedState(mod);
    if (state === "all") {
      setSelectedPermissions(prev => prev.filter(k => !keys.includes(k)));
    } else {
      setSelectedPermissions(prev => {
        const withoutKeys = prev.filter(k => !keys.includes(k));
        return [...withoutKeys, ...keys];
      });
    }
  };

  const toggleModuleExpanded = (title: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const handleSelectAll = () => {
    const allKeys = PERMISSION_MODULES.flatMap(mod => getModulePermissions(mod).map((p: any) => p.key));
    setSelectedPermissions(allKeys);
  };

  const handleClearAll = () => {
    setSelectedPermissions([]);
  };


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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
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
      setErrors({ name: "Role name is required" });
      return;
    }
    setErrors({});
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

    // Get all valid UI permission keys
    const allValidKeys = PERMISSION_MODULES.flatMap(mod =>
      getModulePermissions(mod).map((p: any) => p.key)
    );

    // Filter to only include keys that correspond to UI checkboxes
    const filteredPermissions = currentPermissions.filter((key) => allValidKeys.includes(key));

    setSelectedPermissions(filteredPermissions);
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
  const showLoader = isLoading;
  const showEmpty = !isLoading && (rolesList.length === 0 || isNotFound);
  const showError = isError && !isNotFound;

  if (!hasViewPermission) {
    return (
      <div className="p-6">
        <StateMessage
          type="error"
          title="Access Denied"
          message="You do not have permission to view Roles & Permissions."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="module-page-header">
        <div>
          <h1 className="module-page-title">Roles & Permissions</h1>
          <p className="text-sm text-muted-foreground">Define access levels and module permissions</p>
        </div>
        {hasCreatePermission && (
          <Button
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4" />Create Role
          </Button>
        )}
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
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground capitalize">{role.name}</p>
                      {/* <p className="text-xs text-muted-foreground">ID: {role.id.substring(0, 8)}...</p> */}
                    </div>
                  </div>
                  {hasEditPermission && (
                    <Button
                      onClick={() => handleOpenAssignModal(role)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      title="Edit Permissions"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {AVAILABLE_PERMISSIONS.filter(perm => hasPermission(role, perm.key)).map(perm => (
                    <span
                      key={perm.key}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20"
                    >
                      {perm.label}
                    </span>
                  ))}
                  {AVAILABLE_PERMISSIONS.filter(perm => hasPermission(role, perm.key)).length === 0 && (
                    <span className="text-[10px] text-muted-foreground">No permissions assigned</span>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-border flex justify-end gap-2">
                  {hasEditPermission && (
                    <Button
                      onClick={() => handleOpenEditRoleModal(role)}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-primary transition-colors hover:bg-primary/5 rounded-md px-2"
                      title="Edit Role Name"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Role Name</span>
                    </Button>
                  )}
                  {hasDeletePermission && (
                    <Button
                      onClick={() => setDeletingRole(role)}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors hover:bg-destructive/5 rounded-md px-2"
                      title="Delete Role"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Role</span>
                    </Button>
                  )}
                </div>
              </div>


            ))}
          </div>

          {/* Permission Matrix */}
          <div className="data-table overflow-x-auto bg-card rounded-xl border border-border">
            <div className="p-5 border-b border-border bg-muted">
              <h2 className="text-lg font-semibold text-foreground">Permission Matrix</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Quick overview of permissions granted to each role</p>
            </div>
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3.5">MODULE / PERMISSION</th>
                  {rolesList.map(r => (
                    <th key={r.id} className="text-center text-xs font-semibold text-muted-foreground px-4 py-3.5 capitalize">{r.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_MODULES.map(mod => {
                  const items = getModulePermissions(mod);
                  return (
                    <React.Fragment key={mod.title}>
                      {/* Category Header Row */}
                      <tr className="bg-secondary/20 border-b border-border/80">
                        <td colSpan={rolesList.length + 1} className="px-5 py-2 text-xs font-extrabold uppercase tracking-wider text-primary bg-muted select-none">
                          {mod.title}
                        </td>
                      </tr>

                      {/* Permission Rows */}
                      {items.map(perm => (
                        <tr key={perm.key} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="pl-9 pr-5 py-3 text-sm text-foreground">
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground/90">{perm.label}</span>
                              <span className="text-[11px] text-muted-foreground/80 font-normal leading-normal mt-0.5">{perm.desc}</span>
                            </div>
                          </td>
                          {rolesList.map(r => (
                            <td key={r.id} className="text-center px-4 py-3">
                              {hasPermission(r, perm.key) ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-success/10" title={`${r.name}: Enabled`}>
                                  <Check className="w-3.5 h-3.5 text-success font-bold" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-destructive/5" title={`${r.name}: Disabled`}>
                                  <X className="w-3.5 h-3.5 text-destructive/40" />
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
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
            setErrors({});
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
        <FormField label="Role Name" required error={errors.name}>
          <input
            type="text"
            placeholder="e.g. Head Guard"
            value={newRoleName}
            onChange={(e) => {
              setNewRoleName(e.target.value);
              if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
            }}
            className={`w-full px-3 py-2 bg-secondary border rounded-lg text-sm mb-2 text-foreground focus:outline-none focus:ring-2 ${errors.name ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
              }`}
          />
        </FormField>
      </EntityDialog>


      {/* Assign Permissions Modal */}
      <EntityDialog
        open={assignModalOpen}
        onOpenChange={(val) => {
          setAssignModalOpen(val);
          if (!val) {
            setSelectedRole(null);
            setExpandedModules({});
          }
        }}
        title={selectedRole ? `Assign Permissions: ${selectedRole.name}` : "Assign Permissions"}
        onSubmit={handleAssignPermissions}
        submitLabel={assignPermissionsMutation.isPending ? "Saving..." : "Save Permissions"}
        isLoading={assignPermissionsMutation.isPending}
        maxWidth="sm:max-w-2xl"
      >
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2 py-2">
          {/* Bulk Selection Controls */}
          <div className="flex items-center justify-between pb-3.5 border-b border-border text-xs">
            <span className="font-semibold text-muted-foreground">
              {selectedPermissions.length} / {PERMISSION_MODULES.flatMap(mod => getModulePermissions(mod)).length} permissions selected
            </span>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={handleSelectAll}
                className="text-primary font-bold hover:underline p-0 h-auto shadow-none"
              >
                Select All
              </Button>
              <span className="text-border">|</span>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={handleClearAll}
                className="text-muted-foreground font-semibold hover:underline p-0 h-auto shadow-none"
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Module Accordions */}
          <div className="space-y-3">
            {PERMISSION_MODULES.map((mod) => {
              const items = getModulePermissions(mod);
              const moduleState = getModuleCheckedState(mod);
              const isExpanded = expandedModules[mod.title] ?? false;
              const checkedCount = items.filter((p: any) => selectedPermissions.includes(p.key)).length;

              return (
                <div
                  key={mod.title}
                  className={`border rounded-xl bg-card overflow-hidden transition-all duration-200 shadow-sm ${isExpanded ? "border-primary/25 ring-1 ring-primary/5" : "border-border hover:border-border/80"
                    }`}
                >
                  {/* Module Header */}
                  <div
                    onClick={() => toggleModuleExpanded(mod.title)}
                    className="flex items-center justify-between px-4 py-3 bg-secondary/25 hover:bg-secondary/40 cursor-pointer select-none transition-colors"
                  >
                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={moduleState === "all"}
                        ref={(el) => {
                          if (el) el.indeterminate = moduleState === "partial";
                        }}
                        onChange={() => handleToggleModuleAll(mod)}
                        className="w-4 h-4 text-primary focus:ring-primary border-border rounded cursor-pointer transition-colors"
                      />
                      <span className="text-sm font-semibold text-foreground">{mod.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${moduleState === "all" ? "bg-success/10 text-success border border-success/20" :
                        moduleState === "partial" ? "bg-warning/10 text-warning border border-warning/20" :
                          "bg-secondary text-muted-foreground border border-border"
                        }`}>
                        {checkedCount} / {items.length}
                      </span>
                    </div>

                    <div className="text-muted-foreground">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {/* Collapsible Content */}
                  {isExpanded && (
                    <div className="p-4 bg-background border-t border-border/80 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200">
                      {items.map((perm: any) => {
                        const isChecked = selectedPermissions.includes(perm.key);
                        return (
                          <label
                            key={perm.key}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${isChecked
                              ? "bg-primary/5 border-primary/25 text-foreground font-medium shadow-sm"
                              : "bg-card border-border hover:bg-muted/20 text-muted-foreground"
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
                  )}
                </div>
              );
            })}
          </div>
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
              Are you sure you want to delete the role <strong>{deletingRole?.name}</strong>? This action cannot be undone and will remove all associated permissions. Note that this role cannot be deleted if it is currently assigned to any admins, managers, or guards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={deleteRoleMutation.isPending}>
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={() => deletingRole && deleteRoleMutation.mutate(deletingRole.id)}
                loading={deleteRoleMutation.isPending}
              >
                Delete Role
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

  );
};

export default RolesPermissions;
