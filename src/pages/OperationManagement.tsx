import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, API_BASE_URL } from "@/config/api";
import { Search, Plus, Mail, Phone, User, Trash2, Loader2, UserCheck, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EntityCard from "@/components/common/EntityCard";
import EntityDialog from "@/components/common/EntityDialog";
import TablePagination from "@/components/common/TablePagination";
import SelectDropdown from "@/components/common/SelectDropdown";
import FormField from "@/components/common/FormField";
import StateMessage from "@/components/common/StateMessage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const normalizeUsersResponse = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.data)) return response.data;
  if (response?.data && Array.isArray(response.data.data)) return response.data.data;
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

const OperationManagement = () => {
  const userStr = localStorage.getItem("user");
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const permissions = currentUser?.permissions || [];
  const isAdmin = currentUser?.role === "admin";

  const hasViewPermission = isAdmin || permissions.includes("view_operation") || permissions.includes("operation");
  const hasCreatePermission = isAdmin || permissions.includes("create_operation") || permissions.includes("operation");
  const hasEditPermission = isAdmin || permissions.includes("edit_operation") || permissions.includes("operation");
  const hasDeletePermission = isAdmin || permissions.includes("delete_operation") || permissions.includes("operation");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    roleId: "",
    phone: "",
    image: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [deletingUser, setDeletingUser] = useState<any | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter]);

  const queryClient = useQueryClient();

  // Fetch roles list
  const { data: rolesList = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await api.roles.list();
      return normalizeRolesResponse(response.data).map(normalizeRole);
    },
    enabled: hasViewPermission,
  });

  // Fetch operation users
  const {
    data: usersData = { users: [] },
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["operationUsers", debouncedSearch, roleFilter],
    queryFn: async () => {
      const response = await api.operation.list();
      const list = normalizeUsersResponse(response.data);
      return { users: list };
    },
    enabled: hasViewPermission,
  });

  const allUsers = usersData.users;

  // Client-side search and filtering for smooth responsive UX
  const filteredUsers = useMemo(() => {
    return allUsers.filter((user: any) => {
      const matchesSearch =
        !debouncedSearch ||
        user.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        user.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        user.phone?.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesRole = roleFilter === "all" || String(user.roleId) === String(roleFilter);

      return matchesSearch && matchesRole;
    });
  }, [allUsers, debouncedSearch, roleFilter]);

  // Paginated chunk
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredUsers.slice(start, start + limit);
  }, [filteredUsers, page]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / limit));

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.operation.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["operationUsers"] });
      setOpen(false);
      resetForm();
      toast({ title: "User Created", description: "The new operation user has been created successfully. Credentials have been sent to their email." });
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || "Failed to create user. Please try again.";
      setErrors((prev) => ({ ...prev, form: errMsg }));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: Partial<typeof form> }) =>
      api.operation.update(data.id, data.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["operationUsers"] });
      setOpen(false);
      setEditingUser(null);
      resetForm();
      toast({ title: "User Updated", description: "User details have been updated successfully." });
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.message || "Failed to update user. Please try again.";
      setErrors((prev) => ({ ...prev, form: errMsg }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.operation.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["operationUsers"] });
      setDeletingUser(null);
      toast({ title: "User Deleted", description: "The user has been removed successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setForm({
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      roleId: "",
      phone: "",
      image: "",
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!form.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        newErrors.email = "Invalid email format";
      }
    }

    if (!form.roleId) {
      newErrors.roleId = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingUser) {
      const payload: Partial<typeof form> = {
        firstName: form.firstName,
        middleName: form.middleName,
        lastName: form.lastName,
        email: form.email,
        roleId: form.roleId,
        phone: form.phone,
        image: form.image,
      };
      updateMutation.mutate({ id: editingUser.id, payload });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEditClick = (user: any) => {
    setEditingUser(user);
    setForm({
      firstName: user.firstName || "",
      middleName: user.middleName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      roleId: String(user.roleId || ""),
      phone: user.phone || "",
      image: user.profilePhoto ? resolveImageUrl(user.profilePhoto) || "" : "",
    });
    setOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((f) => ({ ...f, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!hasViewPermission) {
    return (
      <div className="p-6">
        <StateMessage
          type="error"
          title="Access Denied"
          message="You do not have permission to view Operation Management."
        />
      </div>
    );
  }

  const roleOptions = [
    { value: "all", label: "All Roles" },
    ...rolesList.map((r) => ({ value: r.id, label: r.name })),
  ];

  const dialogRoleOptions = rolesList.map((r) => ({ value: r.id, label: r.name }));

  return (
    <div className="p-6 space-y-6">
      <div className="module-page-header">
        <div>
          <h1 className="module-page-title">Operation Management</h1>
          <p className="text-sm text-muted-foreground">{filteredUsers.length} users configured</p>
        </div>
        {hasCreatePermission && (
          <Button onClick={() => { resetForm(); setEditingUser(null); setOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />Add User
          </Button>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="pl-9 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 h-[38px] rounded-lg text-sm w-full placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end items-center">
          <SelectDropdown
            value={roleFilter}
            onChange={setRoleFilter}
            options={roleOptions}
            placeholder="Filter by Role"
            className="w-full sm:w-[180px]"
          />

          {(roleFilter !== "all" || search) && (
            <Button
              onClick={() => {
                setRoleFilter("all");
                setSearch("");
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

      {isLoading && <StateMessage type="loading" message="Loading users..." />}

      {isError && (
        <StateMessage
          type="error"
          title="Failed to load users"
          message={error instanceof Error ? error.message : "An error occurred."}
        />
      )}

      {!isLoading && !isError && paginatedUsers.length === 0 && (
        <StateMessage
          type="empty"
          title="No users found"
          message="Create a new web user with dynamic role to get started."
          icon={UserCheck}
        />
      )}

      {!isLoading && !isError && paginatedUsers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedUsers.map((user) => {
            const roleObj = rolesList.find((r) => String(r.id) === String(user.roleId));
            const isSelf = user.id === currentUser?.id;

            return (
              <EntityCard
                key={user.id}
                title={user.name}
                subtitle={roleObj?.name || "No Role Assigned"}
                avatar={{
                  text: getInitials(user.name),
                  src: resolveImageUrl(user.profilePhoto),
                }}
                details={[
                  { icon: Mail, content: user.email },
                  user.phone && { icon: Phone, content: user.phone },
                ].filter(Boolean) as any}
                footerLeft={
                  isSelf && (
                    <Badge variant="success" showDot>
                      You
                    </Badge>
                  )
                }
                menuItems={[
                  hasEditPermission && {
                    label: "Edit User",
                    icon: User,
                    onClick: () => handleEditClick(user),
                  },
                  hasDeletePermission && !isSelf && {
                    label: "Delete User",
                    icon: Trash2,
                    variant: "destructive",
                    onClick: () => setDeletingUser(user),
                  },
                ].filter(Boolean) as any}
              />
            );
          })}
        </div>
      )}

      {!isLoading && !isError && filteredUsers.length > limit && (
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={filteredUsers.length}
          limit={limit}
          onPageChange={setPage}
          itemLabel="users"
          className="mt-6 rounded-xl border border-border bg-card"
        />
      )}

      {/* Add / Edit Dialog */}
      <EntityDialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (!val) {
            setEditingUser(null);
            resetForm();
          }
        }}
        title={editingUser ? "Edit User Profile" : "Create New User"}
        onSubmit={handleSubmit}
        submitLabel={
          editingUser
            ? updateMutation.isPending
              ? "Saving..."
              : "Save Changes"
            : createMutation.isPending
            ? "Creating..."
            : "Create User"
        }
        isLoading={createMutation.isPending || updateMutation.isPending}
      >
        {errors.form && (
          <div className="p-3 mb-4 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
            {errors.form}
          </div>
        )}

        <div className="space-y-4">
          <FormField label="Profile Photo">
            <div
              onClick={() => document.getElementById("operation-image-upload")?.click()}
              className="w-full h-32 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden group relative"
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
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mx-auto mb-2">
                    <Upload className="w-5 h-5 text-slate-500" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Click to upload photo</p>
                </div>
              )}
              <input
                id="operation-image-upload"
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
                onClick={(e) => {
                  e.stopPropagation();
                  setForm((f) => ({ ...f, image: "" }));
                }}
                className="mt-2 text-xs text-destructive hover:underline font-medium p-0 h-auto shadow-none"
              >
                Remove photo
              </Button>
            )}
          </FormField>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="First Name" required error={errors.firstName}>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => {
                  setForm((f) => ({ ...f, firstName: e.target.value }));
                  if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }));
                }}
                placeholder="e.g. John"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 h-[38px] rounded-lg text-sm px-3 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </FormField>
            <FormField label="Middle Name">
              <input
                type="text"
                value={form.middleName}
                onChange={(e) => setForm((f) => ({ ...f, middleName: e.target.value }))}
                placeholder="e.g. M."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 h-[38px] rounded-lg text-sm px-3 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </FormField>
            <FormField label="Last Name" required error={errors.lastName}>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => {
                  setForm((f) => ({ ...f, lastName: e.target.value }));
                  if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: undefined }));
                }}
                placeholder="e.g. Smith"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 h-[38px] rounded-lg text-sm px-3 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </FormField>
          </div>

          <FormField label="Email Address" required error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="e.g. john@example.com"
              disabled={!!editingUser}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 h-[38px] rounded-lg text-sm px-3 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
          </FormField>

          <FormField label="Role Assignment" required error={errors.roleId}>
            <SelectDropdown
              value={form.roleId}
              onChange={(val) => setForm((f) => ({ ...f, roleId: val }))}
              options={dialogRoleOptions}
              placeholder="Select User Role"
              className="w-full"
            />
          </FormField>

          <FormField label="Phone Number" error={errors.phone}>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="e.g. +1 (555) 019-2834"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 h-[38px] rounded-lg text-sm px-3 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </FormField>
        </div>
      </EntityDialog>

      {/* Delete Confirmation Alert Dialog */}
      {deletingUser && (
        <EntityDialog
          open={!!deletingUser}
          onOpenChange={(val) => {
            if (!val) setDeletingUser(null);
          }}
          title="Confirm Delete"
          onSubmit={(e) => {
            e.preventDefault();
            deleteMutation.mutate(deletingUser.id);
          }}
          submitLabel={deleteMutation.isPending ? "Deleting..." : "Delete User"}
          isLoading={deleteMutation.isPending}
          variant="destructive"
        >
          <div className="py-2 text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{deletingUser.name}</span>? This action is
            permanent and cannot be undone.
          </div>
        </EntityDialog>
      )}
    </div>
  );
};

export default OperationManagement;
