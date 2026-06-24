import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, API_BASE_URL } from "@/config/api";
import { Search, Upload, AlertTriangle, CheckCircle, XCircle, Loader2, FileText, Calendar, ShieldCheck, Plus } from "lucide-react";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import StateMessage from "@/components/common/StateMessage";
import SelectDropdown from "@/components/common/SelectDropdown";
import DateSelect from "@/components/common/DateSelect";
import FormField from "@/components/common/FormField";

const normalizeImageUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith("http") || url.startsWith("data:")) return url;

  // Use the API_BASE_URL to determine the server root
  const serverRoot = API_BASE_URL.replace("/api/v1", "");
  const cleanUrl = url.startsWith("/") ? url.slice(1) : url;

  // Handle filenames without paths
  if (!cleanUrl.includes("/")) {
    return `${serverRoot}/uploads/${encodeURIComponent(cleanUrl)}`;
  }

  return `${serverRoot}/${cleanUrl}`;
};

const Compliance = () => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const permissions = user?.permissions || [];
  const isAdmin = user?.role === "admin";

  const hasViewPermission = isAdmin || permissions.includes("view_compliance") || permissions.includes("compliance");
  const hasCreatePermission = isAdmin || permissions.includes("create_compliance") || permissions.includes("compliance");

  const [activeTab, setActiveTab] = useState<"list" | "summary">("list");
  const [filter, setFilter] = useState("all");
  const [ownerTypeFilter, setOwnerTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [imageError, setImageError] = useState(false);
  const [currentImgUrl, setCurrentImgUrl] = useState<string | undefined>(undefined);

  const hasEditPermission = isAdmin || permissions.includes("edit_compliance") || permissions.includes("compliance") || (selectedDoc && selectedDoc.ownerId === user?.id);
  const hasDeletePermission = isAdmin || permissions.includes("delete_compliance") || permissions.includes("compliance") || (selectedDoc && selectedDoc.ownerId === user?.id);

  // Edit Form State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDocType, setEditDocType] = useState("State ID");
  const [editCustomDocType, setEditCustomDocType] = useState("");
  const [editExpiryDate, setEditExpiryDate] = useState("");
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Upload Form State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadUserType, setUploadUserType] = useState<"Guard" | "Manager">("Guard");
  const [uploadOwnerId, setUploadOwnerId] = useState("");
  const [uploadDocType, setUploadDocType] = useState("State ID");
  const [customDocType, setCustomDocType] = useState("");
  const [uploadExpiryDate, setUploadExpiryDate] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Sync currentImgUrl when selectedDoc changes
  useMemo(() => {
    if (selectedDoc?.docImage) {
      setCurrentImgUrl(selectedDoc.docImage);
      setImageError(false);
    } else {
      setCurrentImgUrl(undefined);
    }
  }, [selectedDoc]);

  const handleImageError = () => {
    if (currentImgUrl && currentImgUrl.includes("/uploads/")) {
      const fallbackUrl = currentImgUrl.replace("/uploads/", "/");
      setCurrentImgUrl(fallbackUrl);
    } else {
      setImageError(true);
    }
  };

  // Fetch documents from backend with live search and filtering parameters
  const { data: rawResponse, isLoading: isLoadingDocs, isFetching: isFetchingDocs, isError: isErrorDocs, error: errorDocs } = useQuery({
    queryKey: ["documents", search, ownerTypeFilter, filter],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      if (ownerTypeFilter !== "all") params.ownerType = ownerTypeFilter === "guard" ? "Guard" : "Manager";
      if (filter !== "all") params.status = filter;

      const response = await api.documents.list(params);
      return response.data?.data || response.data || { documents: [], counts: { all: 0, valid: 0, expiring: 0, expired: 0 } };
    },
    staleTime: 0,
  });

  // Extract documents and counts from query response
  const { documents: rawDocuments = [], counts: apiCounts = { all: 0, valid: 0, expiring: 0, expired: 0 } } = rawResponse || {};

  // Fetch guards and managers for selection in upload
  const { data: guards = [] } = useQuery({
    queryKey: ["guards"],
    queryFn: async () => {
      const response = await api.guards.list();
      const data = response.data as any;
      if (Array.isArray(data)) return data;
      return data?.data?.guards || data?.guards || data?.data || [];
    },
  });

  const { data: managers = [] } = useQuery({
    queryKey: ["managers"],
    queryFn: async () => {
      const response = await api.managers.list();
      const data = response.data as any;
      if (Array.isArray(data)) return data;
      return data?.data?.managers || data?.managers || data?.data || [];
    },
  });

  // Document creation mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.documents.create(formData);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: "Success",
        description: "Document uploaded successfully.",
      });
      setIsUploadOpen(false);
      // Reset form fields
      setUploadOwnerId("");
      setUploadDocType("State ID");
      setCustomDocType("");
      setUploadExpiryDate("");
      setUploadFile(null);
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.message || err?.message || "Failed to upload document.";
      setUploadErrors(prev => ({
        ...prev,
        form: errMsg
      }));
    },
  });

  // Document edit/update mutation
  const editMutation = useMutation({
    mutationFn: async ({ id, name, expiryDate }: { id: string; name?: string; expiryDate?: string }) => {
      const response = await api.documents.update(id, { name, expiryDate });
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: "Success",
        description: "Document updated successfully.",
      });
      setIsEditOpen(false);
      setSelectedDoc(null);
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.message || err?.message || "Failed to update document.";
      setEditErrors(prev => ({
        ...prev,
        form: errMsg
      }));
    },
  });

  // Document delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.documents.delete(id);
      return response.data;
    },
    onSuccess: async (data, id) => {
      queryClient.setQueriesData({ queryKey: ["documents"] }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData.documents)) return oldData;
        const updatedDocs = oldData.documents.filter((d: any) => d.id !== id);
        return {
          ...oldData,
          documents: updatedDocs,
          counts: {
            ...oldData.counts,
            all: updatedDocs.length
          }
        };
      });
      setSelectedDoc(null);
      setIsDeleteConfirmOpen(false);
      setDocToDelete(null);
      toast({
        title: "Success",
        description: "Document deleted successfully.",
      });
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.message || err?.message || "Failed to delete document.";
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: errMsg,
      });
    },
  });

  const validateUploadForm = () => {
    const newErrors: Record<string, string> = {};
    if (!uploadOwnerId) {
      newErrors.ownerId = "Owner selection is required";
    }
    if (uploadDocType === "Other" && !customDocType.trim()) {
      newErrors.customDocType = "Document name is required";
    }
    if (!uploadExpiryDate) {
      newErrors.expiryDate = "Expiry date is required";
    }
    if (!uploadFile) {
      newErrors.file = "Document file is required";
    } else {
      const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|avif|heic|pdf|doc|docx)$/i;
      if (!uploadFile.name.match(allowedExtensions)) {
        newErrors.file = "Invalid file format. Supported: PNG, JPG, WEBP, AVIF, GIF, HEIC, PDF, DOC, DOCX";
      } else if (uploadFile.size > 45 * 1024 * 1024) {
        newErrors.file = "File size exceeds the 45MB limit";
      }
    }
    setUploadErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEditForm = () => {
    const newErrors: Record<string, string> = {};
    if (editDocType === "Other" && !editCustomDocType.trim()) {
      newErrors.customDocType = "Document name is required";
    }
    if (!editExpiryDate) {
      newErrors.expiryDate = "Expiry date is required";
    }
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUploadForm()) return;

    const formData = new FormData();
    formData.append("ownerId", uploadOwnerId);
    formData.append("ownerType", uploadUserType);
    formData.append("name", uploadDocType === "Other" ? customDocType : uploadDocType);
    formData.append("expiryDate", uploadExpiryDate);
    formData.append("documentImage", uploadFile!);

    uploadMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;
    if (!validateEditForm()) return;

    const finalName = editDocType === "Other" ? editCustomDocType : editDocType;
    editMutation.mutate({
      id: selectedDoc.id,
      name: finalName,
      expiryDate: editExpiryDate
    });
  };

  // Normalize documents for UI rendering
  const documents = useMemo(() => {
    return rawDocuments.map((doc: any, index: number) => {
      let ownerName = "Unknown";
      let ownerPhoto = undefined;

      if (doc.ownerType === "Manager" && doc.manager) {
        ownerName = [doc.manager.firstName, doc.manager.middleName, doc.manager.lastName].filter(Boolean).join(" ") || "Manager";
        ownerPhoto = doc.manager.profilePhoto;
      } else if (doc.ownerType === "Guard" && doc.guard) {
        ownerName = [doc.guard.firstName, doc.guard.middleName, doc.guard.lastName].filter(Boolean).join(" ") || "Guard";
        ownerPhoto = doc.guard.profilePhoto;
      } else {
        if (doc.ownerType?.toLowerCase() === "manager") {
          const manager = managers.find((m: any) => m.id === doc.ownerId);
          if (manager) {
            ownerName = manager.name || manager.fullName || "Manager";
            ownerPhoto = manager.profilePhoto;
          }
        } else {
          const guard = guards.find((g: any) => g.id === doc.ownerId);
          if (guard) {
            ownerName = guard.name || guard.fullName || "Guard";
            ownerPhoto = guard.profilePhoto;
          }
        }
      }

      if (ownerName === "Unknown") {
        ownerName = doc.ownerName || doc.owner?.name || doc.personName || (doc.ownerId ? `ID: ${doc.ownerId.slice(0, 8)}...` : "Unknown");
      }

      return {
        id: String(doc.id || doc._id || `doc-${index}`),
        personName: ownerName,
        personType: (doc.ownerType || "guard").toLowerCase() as "guard" | "manager",
        personPhoto: normalizeImageUrl(ownerPhoto),
        docType: String(doc.name || "Document"),
        expiryDate: String(doc.expiryDate || "N/A"),
        status: doc.status || "valid",
        uploadDate: String(doc.createdAt || ""),
        docImage: normalizeImageUrl(doc.documentImage),
      };
    });
  }, [rawDocuments, guards, managers]);

  // Documents Compliance Summary Matrix (State ID, Security License, Pistol License)
  const documentsSummary = useMemo(() => {
    const peopleList = [
      ...guards.map((g: any) => ({
        id: g.id,
        name: [g.firstName, g.middleName, g.lastName].filter(Boolean).join(" ") || g.name || "Guard",
        type: "guard" as const,
        photo: g.profilePhoto,
      })),
      ...managers.map((m: any) => ({
        id: m.id,
        name: [m.firstName, m.middleName, m.lastName].filter(Boolean).join(" ") || m.name || "Manager",
        type: "manager" as const,
        photo: m.profilePhoto,
      })),
    ];

    return peopleList.map(person => {
      // Find documents uploaded by this person
      const personDocs = rawDocuments.filter((doc: any) => doc.ownerId === person.id);

      const findDocStatus = (typeName: string) => {
        const found = personDocs.find(
          (doc: any) => (doc.name || "").toLowerCase().includes(typeName.toLowerCase())
        );
        if (!found) return "missing";
        return found.status; // "valid" | "expiring" | "expired"
      };

      return {
        id: person.id,
        name: person.name,
        type: person.type,
        photo: normalizeImageUrl(person.photo),
        stateId: findDocStatus("State ID"),
        securityLicense: findDocStatus("Security License"),
        pistolLicense: findDocStatus("Pistol License"),
      };
    });
  }, [guards, managers, rawDocuments]);

  // Filter compliance summary list locally by search & role
  const filteredSummary = useMemo(() => {
    return documentsSummary.filter(person => {
      const matchesSearch = person.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = ownerTypeFilter === "all" || person.type === ownerTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [documentsSummary, search, ownerTypeFilter]);

  const renderSummaryBadge = (status: string) => {
    switch (status) {
      case "valid":
        return (
          <span className="inline-flex items-center mt-2 gap-1 text-[11px] font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full border border-success/20">
            <CheckCircle className="w-3.5 h-3.5" /> Verified
          </span>
        );
      case "expiring":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-warning bg-warning/10 px-2.5 py-1 rounded-full border border-warning/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Expiring Soon
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive bg-destructive/10 px-2.5 py-1 rounded-full border border-destructive/20">
            <XCircle className="w-3.5 h-3.5" /> Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full border border-border border-dashed">
            Missing
          </span>
        );
    }
  };

  const isNotFound = isErrorDocs && ((errorDocs as any)?.response?.status === 404 || (errorDocs as any)?.message?.includes("404"));
  // Only show full loading skeleton on INITIAL fetch (no cached data yet). On background re-fetches
  // (e.g. after upload/delete), keep showing existing data so there's no flash of empty state.
  const showLoader = isLoadingDocs && !rawResponse;
  const showEmpty = !isLoadingDocs && (documents.length === 0 || isNotFound);
  const showError = isErrorDocs && !isNotFound;
  // Subtle background-refetch indicator (used in the header)
  const isBackgroundRefetching = isFetchingDocs && !!rawResponse;

  const counts = useMemo(() => ({
    all: apiCounts.all || 0,
    valid: apiCounts.valid || 0,
    expiring: apiCounts.expiring || 0,
    expired: apiCounts.expired || 0,
  }), [apiCounts]);

  if (!hasViewPermission) {
    return (
      <div className="p-6">
        <StateMessage
          type="error"
          title="Access Denied"
          message="You do not have permission to view Compliance Documents."
        />
      </div>
    );
  }

  // Filter guard/manager selections based on userType in form
  const uploadOptions = uploadUserType === "Guard" ? guards : managers;
  const personOptions = uploadOptions.map((person: any) => {
    const labelName = [person.firstName, person.middleName, person.lastName].filter(Boolean).join(" ") || person.name || "User";
    return {
      value: person.id,
      label: `${labelName} (${person.email || "No email"})`
    };
  });

  const docTypeOptions = [
    { value: "State ID", label: "State ID" },
    { value: "Security License", label: "Security License" },
    { value: "Pistol License", label: "Pistol License" },
    { value: "Other", label: "Other Government ID" }
  ];

  const filteredDocTypeOptions = useMemo(() => {
    if (!uploadOwnerId) return docTypeOptions;
    const submitted = rawDocuments
      .filter((doc: any) => doc.ownerId === uploadOwnerId && doc.ownerType === uploadUserType)
      .map((doc: any) => doc.name);
    return docTypeOptions.filter(opt => opt.value === "Other" || !submitted.includes(opt.value));
  }, [uploadOwnerId, uploadUserType, rawDocuments, docTypeOptions]);

  const ownerTypeOptions = [
    { value: "all", label: "All Roles" },
    { value: "guard", label: "Guards" },
    { value: "manager", label: "Managers" }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="module-page-title">Compliance &amp; Documents</h1>
            {isBackgroundRefetching && (
              <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
            )}
          </div>
          <p className="text-sm text-muted-foreground font-medium">Track licenses, certifications, and required documents</p>
        </div>
        {hasCreatePermission && (
          <Button
            onClick={() => setIsUploadOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Upload Document
          </Button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="kpi-card flex items-center gap-4 p-5">
          <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground leading-none">{counts.valid}</p>
            <p className="text-xs text-muted-foreground font-medium mt-1">Valid Documents</p>
          </div>
        </div>
        <div className="kpi-card flex items-center gap-4 p-5">
          <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground leading-none">{counts.expiring}</p>
            <p className="text-xs text-muted-foreground font-medium mt-1">Expiring Soon (15 days)</p>
          </div>
        </div>
        <div className="kpi-card flex items-center gap-4 p-5">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground leading-none">{counts.expired}</p>
            <p className="text-xs text-muted-foreground font-medium mt-1">Expired Documents</p>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2">
        <Button
          onClick={() => setActiveTab("list")}
          variant={activeTab === "list" ? "default" : "secondary"}
          size="sm"
          className="rounded-full"
        >
          All Uploads ({counts.all})
        </Button>
        <Button
          onClick={() => setActiveTab("summary")}
          variant={activeTab === "summary" ? "default" : "secondary"}
          size="sm"
          className="rounded-full"
        >
          Compliance Summary Matrix
        </Button>
      </div>

      {/* Search, Filters and Sort Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-9 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 h-[38px] rounded-lg text-sm w-full placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end items-center">
          {activeTab === "list" && (
            <SelectDropdown
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "valid", label: "Valid Only" },
                { value: "expiring", label: "Expiring Soon" },
                { value: "expired", label: "Expired Only" },
              ]}
              placeholder="Status"
              className="w-full sm:w-[135px]"
            />
          )}

          <SelectDropdown
            value={ownerTypeFilter}
            onChange={setOwnerTypeFilter}
            options={ownerTypeOptions}
            placeholder="All Roles"
            className="w-full sm:w-[135px]"
          />

          {(search !== "" || filter !== "all" || ownerTypeFilter !== "all") && (
            <Button
              onClick={() => {
                setSearch("");
                setFilter("all");
                setOwnerTypeFilter("all");
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

      {/* Main Content Area */}
      <div className="data-table overflow-hidden">
        {activeTab === "list" ? (
          showLoader ? (
            <StateMessage type="loading" message="Loading compliance records..." />
          ) : showError ? (
            <StateMessage
              type="error"
              title="Failed to load compliance records"
              message="Error loading documents. Please try again."
              className="m-4"
            />
          ) : showEmpty ? (
            <StateMessage
              type="empty"
              title="No documents found"
              message="Upload a compliance document to get started."
              icon={ShieldCheck}
              className="m-4"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary/50 border-b border-border">
                    <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Person</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Role</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Document Type</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Expiry Date</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Status</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {documents.map(doc => (
                    <tr
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className="hover:bg-secondary/30 transition-colors group cursor-pointer animate-fade-in"
                    >
                      <td className="px-5 py-4 text-sm font-medium text-foreground flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold overflow-hidden">
                          {doc.personPhoto ? (
                            <img src={doc.personPhoto} alt="" className="w-full h-full object-cover" />
                          ) : (
                            doc.personName.charAt(0).toUpperCase()
                          )}
                        </div>
                        {doc.personName}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[10px] font-bold uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {doc.personType}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-foreground font-medium">{doc.docType}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground font-semibold">{doc.expiryDate}</td>
                      <td className="px-5 py-4">
                        <span className={`status-badge ${doc.status === "valid" ? "status-badge-active mt-2" :
                          doc.status === "expiring" ? "status-badge-warning" :
                            "status-badge-danger"
                          }`}>
                          {doc.status === "valid" ? "Verified" : doc.status === "expiring" ? "Expiring Soon" : "Expired"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Button variant="link" size="sm" className="h-auto p-0 hover:underline">
                          View details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Compliance Summary Matrix Tab */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Person</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Role</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">State ID</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Security License</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Pistol License</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSummary.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-sm text-muted-foreground font-medium">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  filteredSummary.map(person => (
                    <tr key={person.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-5 py-4 text-sm font-medium text-foreground flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold overflow-hidden">
                          {person.photo ? (
                            <img src={person.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            person.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        {person.name}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[10px] font-bold uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {person.type}
                        </span>
                      </td>
                      <td className="px-5 py-4">{renderSummaryBadge(person.stateId)}</td>
                      <td className="px-5 py-4">{renderSummaryBadge(person.securityLicense)}</td>
                      <td className="px-5 py-4">{renderSummaryBadge(person.pistolLicense)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Document Detail Dialog */}
      <Dialog
        open={!!selectedDoc}
        onOpenChange={(val) => {
          if (!val) {
            setSelectedDoc(null);
            setImageError(false);
            setCurrentImgUrl(undefined);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-none shadow-2xl">
          {selectedDoc && (
            <div className="flex flex-col">
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <DialogTitle className="text-lg font-bold text-foreground">Document Details</DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Verification & Compliance Record</p>
                </div>
                <span className={`status-badge ${selectedDoc.status === "valid" ? "status-badge-active m-2" :
                  selectedDoc.status === "expiring" ? "status-badge-warning m-2" :
                    "status-badge-danger m-2"
                  }`}>
                  {selectedDoc.status === "valid" ? "Verified" : selectedDoc.status === "expiring" ? "Expiring Soon" : "Expired"}
                </span>
              </div>

              <div className="p-6 space-y-6">
                <div className="relative aspect-[16/9] w-full bg-secondary/50 rounded-2xl overflow-hidden border border-border group">
                  {currentImgUrl && !imageError ? (
                    <img
                      src={currentImgUrl}
                      alt={selectedDoc.docType}
                      className="w-full h-full object-contain"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/20">
                      <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                        <FileText className="w-8 h-8 opacity-40" />
                      </div>
                      <p className="text-sm font-semibold">
                        {imageError ? "Image unavailable" : "No document preview"}
                      </p>
                      <p className="text-xs opacity-60 mt-1 max-w-[200px] text-center">
                        {imageError ? "The file could not be retrieved from the server." : "This document has no associated image file."}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2 flex items-center gap-4 p-4 bg-secondary/30 rounded-2xl border border-border/50">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-bold overflow-hidden">
                      {selectedDoc.personPhoto ? (
                        <img src={selectedDoc.personPhoto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        selectedDoc.personName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Document Owner</p>
                      <p className="text-base font-bold text-foreground">{selectedDoc.personName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                        <p className="text-xs text-muted-foreground font-medium capitalize">{selectedDoc.personType}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-secondary/30 rounded-2xl border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                        <FileText className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Document Type</p>
                    </div>
                    <p className="text-sm font-bold text-foreground">{selectedDoc.docType}</p>
                  </div>

                  <div className="p-4 bg-secondary/30 rounded-2xl border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Expiration Date</p>
                    </div>
                    <p className="text-sm font-bold text-foreground">{selectedDoc.expiryDate}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-secondary/10 border-t border-border/50 flex justify-between items-center">
                <div>
                  {hasDeletePermission && (
                    <Button
                      onClick={() => {
                        setDocToDelete(selectedDoc.id);
                        setIsDeleteConfirmOpen(true);
                      }}
                      loading={deleteMutation.isPending}
                      variant="destructive"
                      size="sm"
                    >
                      Delete
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {hasEditPermission && (
                    <Button
                      onClick={() => {
                        const isCustom = !["State ID", "Security License", "Pistol License"].includes(selectedDoc.docType);
                        setEditDocType(isCustom ? "Other" : selectedDoc.docType);
                        setEditCustomDocType(isCustom ? selectedDoc.docType : "");
                        setEditExpiryDate(selectedDoc.expiryDate || "");
                        setIsEditOpen(true);
                      }}
                      variant="secondary"
                      size="sm"
                    >
                      Edit Details
                    </Button>
                  )}
                  <Button
                    onClick={() => setSelectedDoc(null)}
                    size="sm"
                  >
                    Close Document
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={(val) => {
        setIsUploadOpen(val);
        if (!val) {
          setUploadOwnerId("");
          setUploadDocType("State ID");
          setCustomDocType("");
          setUploadExpiryDate("");
          setUploadFile(null);
        }
        setUploadErrors({});
      }}>
        <DialogContent className="sm:max-w-md p-6 border-none shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Upload Compliance Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit} className="space-y-4 mt-2" noValidate>
            {uploadErrors.form && (
              <div className="p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                {uploadErrors.form}
              </div>
            )}
            <FormField label="Upload For">
              <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl border border-border">
                <Button
                  type="button"
                  onClick={() => {
                    setUploadUserType("Guard");
                    setUploadOwnerId("");
                  }}
                  variant={uploadUserType === "Guard" ? "default" : "ghost"}
                  size="sm"
                  className="flex-1 rounded-full"
                >
                  Guard
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setUploadUserType("Manager");
                    setUploadOwnerId("");
                  }}
                  variant={uploadUserType === "Manager" ? "default" : "ghost"}
                  size="sm"
                  className="flex-1 rounded-full"
                >
                  Manager
                </Button>
              </div>
            </FormField>

            <FormField label="Select Person" required error={uploadErrors.ownerId}>
              <SelectDropdown
                value={uploadOwnerId}
                onChange={(val) => {
                  setUploadOwnerId(val);
                  if (uploadErrors.ownerId) setUploadErrors(prev => ({ ...prev, ownerId: undefined }));
                  if (val) {
                    const submitted = rawDocuments
                      .filter((doc: any) => doc.ownerId === val && doc.ownerType === uploadUserType)
                      .map((doc: any) => doc.name);
                    const available = docTypeOptions.find(opt => opt.value === "Other" || !submitted.includes(opt.value));
                    if (available) {
                      setUploadDocType(available.value);
                    }
                  } else {
                    setUploadDocType("State ID");
                  }
                }}
                options={personOptions}
                placeholder="Select individual..."
              />
            </FormField>

            <FormField label="Document Name" required>
              <SelectDropdown
                value={uploadDocType}
                onChange={setUploadDocType}
                options={filteredDocTypeOptions}
                placeholder="Select document name..."
              />
            </FormField>

            {uploadDocType === "Other" && (
              <FormField label="Specify ID Name" required error={uploadErrors.customDocType}>
                <input
                  type="text"
                  placeholder="e.g. Drivers License"
                  value={customDocType}
                  onChange={(e) => {
                    setCustomDocType(e.target.value);
                    if (uploadErrors.customDocType) setUploadErrors(prev => ({ ...prev, customDocType: undefined }));
                  }}
                  className={`w-full px-3 py-2.5 bg-secondary border rounded-xl text-xs focus:outline-none focus:ring-2 ${uploadErrors.customDocType ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
                    }`}
                />
              </FormField>
            )}

            <FormField label="Expiry Date" required error={uploadErrors.expiryDate}>
              <DateSelect
                value={uploadExpiryDate}
                onChange={(val) => {
                  setUploadExpiryDate(val);
                  if (uploadErrors.expiryDate) setUploadErrors(prev => ({ ...prev, expiryDate: undefined }));
                }}
                placeholder="Select expiry date"
              />
            </FormField>

            <FormField label="Document Image / File" required error={uploadErrors.file}>
              <div className={`relative border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center bg-secondary/20 hover:bg-secondary/40 transition-colors cursor-pointer group ${uploadErrors.file ? "border-destructive" : "border-border"
                }`}>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    setUploadFile(e.target.files?.[0] || null);
                    if (uploadErrors.file) setUploadErrors(prev => ({ ...prev, file: undefined }));
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className={`w-8 h-8 group-hover:text-primary transition-colors mb-2 ${uploadErrors.file ? "text-destructive" : "text-muted-foreground"
                  }`} />
                <p className="text-xs font-bold text-foreground">
                  {uploadFile ? uploadFile.name : "Click to select a file"}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium mt-1">
                  Supports Images and PDFs up to 45MB
                </p>
              </div>
            </FormField>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={uploadMutation.isPending}
                size="sm"
              >
                Upload & Verify
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(val) => {
        setIsEditOpen(val);
        if (!val) {
          setSelectedDoc(null);
        }
        setEditErrors({});
      }}>
        <DialogContent className="sm:max-w-md p-6 border-none shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Edit Compliance Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-2" noValidate>
            {editErrors.form && (
              <div className="p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                {editErrors.form}
              </div>
            )}
            <FormField label="Document Name" required>
              <SelectDropdown
                value={editDocType}
                onChange={setEditDocType}
                options={docTypeOptions}
                placeholder="Select document name..."
              />
            </FormField>

            {editDocType === "Other" && (
              <FormField label="Specify ID Name" required error={editErrors.customDocType}>
                <input
                  type="text"
                  placeholder="e.g. Drivers License"
                  value={editCustomDocType}
                  onChange={(e) => {
                    setEditCustomDocType(e.target.value);
                    if (editErrors.customDocType) setEditErrors(prev => ({ ...prev, customDocType: undefined }));
                  }}
                  className={`w-full px-3 py-2.5 bg-secondary border rounded-xl text-xs focus:outline-none focus:ring-2 ${editErrors.customDocType ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
                    }`}
                />
              </FormField>
            )}

            <FormField label="Expiry Date" required error={editErrors.expiryDate}>
              <DateSelect
                value={editExpiryDate}
                onChange={(val) => {
                  setEditExpiryDate(val);
                  if (editErrors.expiryDate) setEditErrors(prev => ({ ...prev, expiryDate: undefined }));
                }}
                placeholder="Select expiry date"
              />
            </FormField>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => setIsEditOpen(false)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={editMutation.isPending}
                size="sm"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the compliance document from the records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild onClick={() => setDocToDelete(null)}>
              <Button variant="outline" disabled={deleteMutation.isPending}>
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={() => {
                  if (docToDelete) {
                    deleteMutation.mutate(docToDelete);
                  }
                }}
                loading={deleteMutation.isPending}
              >
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Compliance;
