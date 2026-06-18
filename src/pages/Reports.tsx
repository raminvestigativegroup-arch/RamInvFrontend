import { useState } from "react";
import { Download, FileText, BarChart3, Eye, TrendingUp, Shield, Clock, AlertTriangle, Users, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/config/api";
import StateMessage from "@/components/common/StateMessage";
import { Button } from "@/components/ui/button";

const Reports = () => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const permissions = user?.permissions || [];
  const isAdmin = user?.role === "admin";

  const hasViewPermission = isAdmin || permissions.includes("view_report") || permissions.includes("report");
  const hasCreatePermission = isAdmin || permissions.includes("create_report") || permissions.includes("report");

  const [previewReport, setPreviewReport] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // 1. Fetch Dynamic Reports templates list from Backend
  const { data: listResponse, isLoading: listLoading, error: listError } = useQuery({
    queryKey: ["reports-list"],
    queryFn: () => api.reports.list().then((res) => res.data),
    enabled: hasViewPermission,
  });

  // 2. Fetch Dynamic Stats Cards from Backend
  const { data: statsResponse, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["report-stats"],
    queryFn: () => api.reports.getStats().then((res) => res.data),
    enabled: hasViewPermission,
  });

  // 3. Fetch Live Report Preview on Demand
  const { data: previewResponse, isLoading: previewLoading } = useQuery({
    queryKey: ["report-preview", previewReport],
    queryFn: () => api.reports.getPreview(previewReport!).then((res) => res.data),
    enabled: !!previewReport,
  });


  const downloadReport = (title: string, sections: any[]) => {
    if (!sections || sections.length === 0) return;
    
    let content = `=========================================\n`;
    content += `${title.toUpperCase()}\n`;
    content += `Generated on: ${new Date().toLocaleString()}\n`;
    content += `=========================================\n\n`;

    sections.forEach((s) => {
      content += `${s.heading.toUpperCase()}\n`;
      content += `${"-".repeat(s.heading.length)}\n`;
      content += `${s.content}\n\n`;
    });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${title.replace(/\s+/g, "_")}_${new Date().toISOString().split('T')[0]}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = async (reportId: string) => {
    try {
      setDownloadingId(reportId);
      const res = await api.reports.getPreview(reportId);
      if (res.data && res.data.sections) {
        downloadReport(res.data.title, res.data.sections);
      }
    } catch (err) {
      console.error("Failed to generate report download:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  if (!hasViewPermission) {
    return (
      <div className="p-6">
        <StateMessage
          type="error"
          title="Access Denied"
          message="You do not have permission to view Reports."
        />
      </div>
    );
  }

  const stats = statsResponse?.stats;
  const statsCards = [
    { label: "Total Incidents", value: stats?.totalIncidents ?? 0, icon: AlertTriangle, change: "Current total", color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Active Guards", value: stats?.activeGuards ?? 0, icon: Users, change: "On Duty right now", color: "text-primary", bg: "bg-primary/10" },
    { label: "Compliance Alerts", value: stats?.complianceAlerts ?? 0, icon: Shield, change: "Requiring attention", color: "text-warning", bg: "bg-warning/10" },
    { label: "Shifts Scheduled", value: stats?.shiftsScheduled ?? 0, icon: Clock, change: "This week", color: "text-success", bg: "bg-success/10" },
    { label: "Active Sites", value: stats ? `${stats.activeSites} / ${stats.totalSites}` : "0 / 0", icon: TrendingUp, change: "Sites active/total", color: "text-info", bg: "bg-info/10" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="module-page-header">
        <div>
          <h1 className="module-page-title">Reports & Data Export</h1>
          <p className="text-sm text-muted-foreground">View stats, preview reports, and download data</p>
        </div>
      </div>

      {/* Stats Overview */}
      {statsLoading ? (
        <StateMessage type="loading" message="Loading live reporting stats..." inline className="my-2" />
      ) : statsError ? (
        <StateMessage
          type="error"
          title="Error Loading Stats"
          message="Failed to load live metrics. Displaying default views."
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statsCards.map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              <p className="text-[10px] text-muted-foreground">{stat.change}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick Export */}
      {hasCreatePermission && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: "R1", label: "Incident Report", desc: "Export all incidents as TXT", icon: FileText },
            { id: "R2", label: "Hours Report", desc: "Export hours data as TXT", icon: BarChart3 },
            { id: "R3", label: "Compliance Report", desc: "Export compliance status as TXT", icon: FileText },
          ].map((item) => (
            <div key={item.label} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <Button
                variant="link"
                size="sm"
                disabled={downloadingId === item.id}
                onClick={() => handleDownload(item.id)}
                className="flex items-center gap-2 text-primary font-medium hover:underline p-0 h-auto shadow-none"
              >
                {downloadingId === item.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Generate & Download
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Report History with View */}
      <div className="data-table">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Report Templates</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-secondary">
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">REPORT NAME</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">TYPE</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">FORMAT</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">LAST GENERATED</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {listLoading ? (
              <tr>
                <td colSpan={5} className="p-4">
                  <StateMessage type="loading" message="Loading templates..." inline />
                </td>
              </tr>
            ) : listError ? (
              <tr>
                <td colSpan={5} className="p-4">
                  <StateMessage
                    type="error"
                    title="Load Failure"
                    message="Failed to load report templates."
                  />
                </td>
              </tr>
            ) : listResponse?.reports && listResponse.reports.length > 0 ? (
              listResponse.reports.map((r: any) => (
                <tr key={r.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-foreground">{r.name}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{r.type}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded font-medium">
                      {r.format}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{r.lastGenerated}</td>
                  <td className="px-5 py-3 flex gap-3">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setPreviewReport(r.id)}
                      className="flex items-center gap-1 text-primary hover:underline p-0 h-auto shadow-none"
                    >
                      <Eye className="w-3.5 h-3.5" />View
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      disabled={downloadingId === r.id}
                      onClick={() => handleDownload(r.id)}
                      className="flex items-center gap-1 text-primary hover:underline disabled:opacity-50 p-0 h-auto shadow-none"
                    >
                      {downloadingId === r.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      Download
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-10 text-sm text-muted-foreground">
                  No report templates available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


      {/* Report Preview Dialog */}
      <Dialog open={!!previewReport} onOpenChange={() => setPreviewReport(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewResponse?.title || "Report Preview"}</DialogTitle>
          </DialogHeader>

          {previewLoading ? (
            <StateMessage type="loading" message="Generating preview dynamically..." className="my-6" />
          ) : previewResponse ? (
            <div className="space-y-5 mt-2">
              {previewResponse.sections.map((section: any, i: number) => (
                <div key={i}>
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">{section.heading}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {section.content}
                  </p>
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button
                  onClick={() => setPreviewReport(null)}
                  variant="secondary"
                  size="sm"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    downloadReport(previewResponse.title, previewResponse.sections);
                    setPreviewReport(null);
                  }}
                  size="sm"
                >
                  <Download className="w-4 h-4" />Download Report
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Failed to load preview for this report.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reports;
