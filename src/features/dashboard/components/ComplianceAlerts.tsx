import { complianceDocs } from "@/data/dummyData";
import { useNavigate } from "react-router-dom";

const ComplianceAlerts = () => {
  const navigate = useNavigate();
  const alertDocs = complianceDocs.filter(d => d.status !== "valid");

  if (alertDocs.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Compliance Alerts</h2>
        <button onClick={() => navigate("/dashboard/compliance")} className="text-sm text-primary font-medium hover:underline">View All</button>
      </div>
      <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {alertDocs.map((doc) => (
          <div key={doc.id} className="flex items-start gap-2.5 p-3.5 bg-secondary rounded-lg cursor-pointer hover:bg-muted transition-colors" onClick={() => navigate("/dashboard/compliance")}>
            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${doc.status === "expired" ? "bg-destructive" : "bg-warning"}`} />
            <div>
              <p className="text-sm font-medium text-foreground">{doc.personName}</p>
              <p className="text-xs text-muted-foreground">{doc.docType}</p>
              <p className={`text-xs font-medium mt-0.5 ${doc.status === "expired" ? "text-destructive" : "text-warning"}`}>
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
