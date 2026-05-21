import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, API_BASE_URL } from "@/config/api";
import { ComplianceDoc } from "@/data/dummyData";
import { Search, Upload, AlertTriangle, CheckCircle, XCircle, Loader2, User, FileText, Calendar, ShieldCheck, Plus } from "lucide-react";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
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
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<ComplianceDoc | null>(null);
  const [imageError, setImageError] = useState(false);
  const [currentImgUrl, setCurrentImgUrl] = useState<string | undefined>(undefined);

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
      // If /uploads/ failed, try requesting from the server root directly
      const fallbackUrl = currentImgUrl.replace("/uploads/", "/");
      setCurrentImgUrl(fallbackUrl);
    } else {
      setImageError(true);
    }
  };



  // Fetch documents
  const { data: rawDocuments = [], isLoading: isLoadingDocs, isError: isErrorDocs } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const response = await api.documents.list();
      const data = response.data?.data || response.data || [];
      return Array.isArray(data) ? data : (data.id ? [data] : []);
    },
  });

  // Fetch guards and managers for name lookup
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

  // Normalize documents with name lookup
  const documents = useMemo(() => {
    return rawDocuments.map((doc: any, index: number) => {
      let statusStr: "valid" | "expiring" | "expired" = "valid";
      if (typeof doc.status === "boolean") {
        statusStr = doc.status ? "valid" : "expired";
      } else if (doc.status) {
        const lowerStatus = String(doc.status).toLowerCase();
        if (lowerStatus === "true" || lowerStatus === "valid") statusStr = "valid";
        else if (lowerStatus === "false" || lowerStatus === "invalid" || lowerStatus === "expired") statusStr = "expired";
        else statusStr = lowerStatus as any;
      }

      // Look up owner name and photo
      let ownerName = "Unknown";
      let ownerPhoto = undefined;
      
      if (doc.ownerType?.toLowerCase() === "manager") {
        const manager = managers.find((m: any) => m.id === doc.ownerId);
        if (manager) {
          ownerName = manager.name || manager.fullName || "Manager";
          ownerPhoto = manager.profilePhoto || manager.avatar || manager.image;
        }
      } else {
        const guard = guards.find((g: any) => g.id === doc.ownerId);
        if (guard) {
          ownerName = guard.name || guard.fullName || "Guard";
          ownerPhoto = guard.profilePhoto || guard.avatar || guard.image;
        }
      }

      // If still unknown and we have ownerId, show truncated ID as fallback but prefer looking for other name fields
      if (ownerName === "Unknown") {
        ownerName = doc.ownerName || doc.owner?.name || doc.personName || (doc.ownerId ? `ID: ${doc.ownerId.slice(0, 8)}...` : "Unknown");
      }

      return {
        id: String(doc.id || doc._id || `doc-${index}`),
        personName: ownerName,
        personType: (doc.ownerType || doc.personType || "guard").toLowerCase() as "guard" | "manager",
        personPhoto: normalizeImageUrl(ownerPhoto),
        docType: String(doc.name || doc.docType || "Document"),
        expiryDate: String(doc.expiryDate || doc.expiry || "N/A"),
        status: statusStr,
        uploadDate: String(doc.uploadDate || doc.createdAt || ""),
        docImage: normalizeImageUrl(doc.documentImage || doc.image || doc.fileUrl || doc.document || doc.filePath),
      };
    });
  }, [rawDocuments, guards, managers]);

  const isLoading = isLoadingDocs;
  const isError = isErrorDocs;

  const filtered = useMemo(() => {
    return documents.filter(doc => {
      const matchesFilter = filter === "all" || doc.status === filter;
      const personName = doc.personName || "";
      const docType = doc.docType || "";
      const searchTerm = search.toLowerCase();
      
      const matchesSearch = 
        personName.toLowerCase().includes(searchTerm) || 
        docType.toLowerCase().includes(searchTerm);
      return matchesFilter && matchesSearch;
    });
  }, [documents, filter, search]);

  const counts = useMemo(() => ({
    all: documents.length,
    valid: documents.filter(d => d.status === "valid").length,
    expiring: documents.filter(d => d.status === "expiring").length,
    expired: documents.filter(d => d.status === "expired" || d.status === ("invalid" as any)).length,
  }), [documents]);

  return (
    <div className="p-6 space-y-6">
      <div className="module-page-header">
        <div>
          <h1 className="module-page-title">Compliance & Documents</h1>
          <p className="text-sm text-muted-foreground">Track licenses, certifications, and required documents</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="kpi-card flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-success" />
          </div>
          <div><p className="text-2xl font-bold text-foreground">{counts.valid}</p><p className="text-sm text-muted-foreground">Valid Documents</p></div>
        </div>
        <div className="kpi-card flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-warning" />
          </div>
          <div><p className="text-2xl font-bold text-foreground">{counts.expiring}</p><p className="text-sm text-muted-foreground">Expiring Soon</p></div>
        </div>
        <div className="kpi-card flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-destructive" />
          </div>
          <div><p className="text-2xl font-bold text-foreground">{counts.expired}</p><p className="text-sm text-muted-foreground">Invalid/Expired</p></div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          {(["all", "valid", "expiring", "expired"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search documents..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="data-table overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p>Loading compliance records...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-destructive">
            <AlertTriangle className="w-8 h-8 mb-2" />
            <p>Error loading documents. Please try again.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Person</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Type</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Document</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Expiry Date</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Status</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-4 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length > 0 ? (
                  filtered.map(doc => (
                    <tr 
                      key={doc.id} 
                      onClick={() => setSelectedDoc(doc as any)}
                      className="hover:bg-secondary/30 transition-colors group cursor-pointer"
                    >
                      <td className="px-5 py-4 text-sm font-medium text-foreground">{doc.personName}</td>
                      <td className="px-5 py-4">
                        <span className="text-[10px] font-bold uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {doc.personType}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-foreground">{doc.docType}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{doc.expiryDate}</td>
                      <td className="px-5 py-4">
                        <span className={`status-badge ${
                          doc.status === "valid" ? "status-badge-active" : 
                          doc.status === "expiring" ? "status-badge-warning" : 
                          "status-badge-danger"
                        }`}>
                          {doc.status === "valid" ? "Valid" : doc.status === "expiring" ? "Expiring" : "Invalid"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button className="text-xs font-semibold text-primary hover:underline">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                      No documents found matching your criteria.
                    </td>
                  </tr>
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
              {/* Header with Background Gradient */}
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-bold text-foreground">Document Details</DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Verification & Compliance Record</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  selectedDoc.status === "valid" ? "bg-success/10 text-success border border-success/20" : 
                  selectedDoc.status === "expiring" ? "bg-warning/10 text-warning border border-warning/20" : 
                  "bg-destructive/10 text-destructive border border-destructive/20"
                }`}>
                  {selectedDoc.status}
                </span>
              </div>

              <div className="p-6 space-y-6">
                {/* Document Image Section */}
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
                      {imageError && currentImgUrl && (
                        <a 
                          href={currentImgUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="mt-4 flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg text-xs font-medium hover:bg-secondary transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Try direct link
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Person Info */}
                  <div className="col-span-1 md:col-span-2 flex items-center gap-4 p-4 bg-secondary/30 rounded-xl border border-border/50">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-bold overflow-hidden">
                      {(selectedDoc as any).personPhoto ? (
                        <img src={(selectedDoc as any).personPhoto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        selectedDoc.personName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Document Owner</p>
                      <p className="text-base font-bold text-foreground">{selectedDoc.personName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <ShieldCheck className="w-3 h-3 text-primary" />
                        <p className="text-xs text-muted-foreground font-medium capitalize">{selectedDoc.personType}</p>
                      </div>
                    </div>
                  </div>

                  {/* Doc Type Card */}
                  <div className="p-4 bg-secondary/30 rounded-xl border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                        <FileText className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Document Type</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{selectedDoc.docType}</p>
                  </div>

                  {/* Expiry Card */}
                  <div className="p-4 bg-secondary/30 rounded-xl border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Expiration Date</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{selectedDoc.expiryDate}</p>
                  </div>
                </div>

              </div>

              {/* Action Button */}
              <div className="p-6 bg-secondary/10 border-t border-border/50 flex justify-end">
                <button 
                  onClick={() => setSelectedDoc(null)}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                >
                  Close Document
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Compliance;
