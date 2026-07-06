import { useQuery } from "@tanstack/react-query";
import { api } from "@/config/api";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { Loader2 } from "lucide-react";

interface NormalizedDoc {
  id: string;
  personName: string;
  personType: "guard" | "manager";
  docType: string;
  expiryDate: string;
  status: "valid" | "expiring" | "expired";
}

const ComplianceAlerts = () => {
  const navigate = useNavigate();

  // Fetch documents
  const { data: rawDocuments = [], isLoading: isLoadingDocs } = useQuery({
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

  // Normalize documents with name lookup and calculate expiry alert status
  const documents = useMemo<NormalizedDoc[]>(() => {
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

      // Look up owner name
      let ownerName = "Unknown";
      
      if (doc.ownerType?.toLowerCase() === "manager") {
        const manager = managers.find((m: any) => m.id === doc.ownerId);
        if (manager) {
          ownerName = manager.name || manager.fullName || "Manager";
        }
      } else {
        const guard = guards.find((g: any) => g.id === doc.ownerId);
        if (guard) {
          ownerName = guard.name || guard.fullName || "Guard";
        }
      }

      if (ownerName === "Unknown") {
        ownerName = doc.ownerName || doc.owner?.name || doc.personName || (doc.ownerId ? `ID: ${doc.ownerId.slice(0, 8)}...` : "Unknown");
      }

      // Calculate status based on expiryDate if status is not already marked as expired
      let expiryStatus = statusStr;
      if (doc.expiryDate) {
        const expDate = new Date(doc.expiryDate + (doc.expiryDate.includes("T") ? "" : "T00:00:00Z"));
        const today = new Date();
        const diffMs = expDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          expiryStatus = "expired";
        } else if (diffDays <= 30) {
          expiryStatus = "expiring";
        }
      }

      return {
        id: String(doc.id || doc._id || `doc-${index}`),
        personName: ownerName,
        personType: (doc.ownerType || doc.personType || "guard").toLowerCase() as "guard" | "manager",
        docType: String(doc.name || doc.docType || "Document"),
        expiryDate: String(doc.expiryDate || doc.expiry || "N/A"),
        status: expiryStatus,
      };
    });
  }, [rawDocuments, guards, managers]);

  const alertDocs = useMemo(() => {
    return documents.filter(d => d.status !== "valid");
  }, [documents]);

  if (isLoadingDocs) {
    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden p-6 flex justify-center items-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mr-2" />
        <span className="text-sm text-muted-foreground">Loading compliance alerts...</span>
      </div>
    );
  }

  if (alertDocs.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Compliance Alerts</h2>
        <button onClick={() => navigate("/dashboard/compliance")} className="text-sm text-primary font-medium hover:underline">View All</button>
      </div>
      <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {alertDocs.map((doc) => (
          <div
            key={doc.id}
            className="flex items-start gap-3 p-3.5 bg-card border border-border/80 rounded-xl cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
            onClick={() => navigate("/dashboard/compliance")}
          >
            <div className={`relative w-2 h-2 rounded-full mt-1.5 shrink-0 ${doc.status === "expired" ? "bg-destructive" : "bg-warning"}`}>
              <span className={`absolute -inset-1 rounded-full animate-ping opacity-25 ${doc.status === "expired" ? "bg-destructive" : "bg-warning"}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">{doc.personName}</p>
              <p className="text-xs text-muted-foreground truncate">{doc.docType}</p>
              <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${doc.status === "expired" ? "text-destructive" : "text-warning"}`}>
                {doc.status === "expired" ? `Expired: ${doc.expiryDate}` : `Expires: ${doc.expiryDate}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComplianceAlerts;
