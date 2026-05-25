import { useState } from "react";
import { Download, FileText, BarChart3, Eye, X, TrendingUp, Shield, Clock, AlertTriangle, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { incidents, guards, scheduleEntries, complianceDocs, sites } from "@/data/dummyData";

const reports = [
  { id: "R1", name: "Incident Summary Report", type: "Incidents", format: "PDF", lastGenerated: "Feb 24, 2026" },
  { id: "R2", name: "Weekly Hours Report", type: "Hours & Attendance", format: "Excel", lastGenerated: "Feb 23, 2026" },
  { id: "R3", name: "Compliance Status Report", type: "Compliance", format: "PDF", lastGenerated: "Feb 22, 2026" },
  { id: "R4", name: "Guard Activity Report", type: "Operations", format: "PDF", lastGenerated: "Feb 21, 2026" },
  { id: "R5", name: "Payroll Hours Export", type: "Hours & Attendance", format: "Excel", lastGenerated: "Feb 20, 2026" },
  { id: "R6", name: "Site Coverage Report", type: "Scheduling", format: "PDF", lastGenerated: "Feb 19, 2026" },
];

const statsCards = [
  { label: "Total Incidents", value: incidents.length, icon: AlertTriangle, change: "+2 this week", color: "text-destructive", bg: "bg-destructive/10" },
  { label: "Active Guards", value: guards.filter((g) => g.status === "on-duty").length, icon: Users, change: `${guards.length} total`, color: "text-primary", bg: "bg-primary/10" },
  { label: "Compliance Alerts", value: complianceDocs.filter((d) => d.status !== "valid").length, icon: Shield, change: "3 expiring", color: "text-warning", bg: "bg-warning/10" },
  { label: "Shifts Scheduled", value: scheduleEntries.length, icon: Clock, change: "This week", color: "text-success", bg: "bg-success/10" },
  { label: "Active Sites", value: sites.filter((s) => s.status === "active").length, icon: TrendingUp, change: `${sites.length} total`, color: "text-info", bg: "bg-info/10" },
];

// Dummy report preview data
const reportPreviews: Record<string, { title: string; sections: { heading: string; content: string }[] }> = {
  R1: {
    title: "Incident Summary Report — Feb 2026",
    sections: [
      { heading: "Overview", content: `Total incidents this month: ${incidents.length}. High priority: ${incidents.filter((i) => i.priority === "high").length}. Open incidents: ${incidents.filter((i) => i.status === "open").length}. Resolved: ${incidents.filter((i) => i.status === "resolved").length}.` },
      { heading: "Breakdown by Type", content: incidents.map((i) => `• ${i.type}: ${i.title} (${i.priority} priority) — ${i.site}`).join("\n") },
      { heading: "Key Findings", content: "Unauthorized access attempts remain the top concern. Downtown Office Complex has the highest incident density. Recommend increased patrol presence during evening hours." },
    ],
  },
  R2: {
    title: "Weekly Hours Report — Feb 17–23, 2026",
    sections: [
      { heading: "Summary", content: `Total guards tracked: ${guards.length}. Average hours/guard: ${Math.round(guards.reduce((a, g) => a + g.hoursThisWeek, 0) / guards.length)}h. Guards exceeding 40h: ${guards.filter((g) => g.hoursThisWeek > 40).length}.` },
      { heading: "Guard Hours", content: guards.map((g) => `• ${g.name}: ${g.hoursThisWeek}h / ${g.scheduledHours}h scheduled`).join("\n") },
      { heading: "Overtime Alert", content: "Maria Santos and Lisa Patel exceeded scheduled hours. Review overtime policy compliance." },
    ],
  },
  R3: {
    title: "Compliance Status Report — Feb 2026",
    sections: [
      { heading: "Overview", content: `Total documents tracked: ${complianceDocs.length}. Valid: ${complianceDocs.filter((d) => d.status === "valid").length}. Expiring: ${complianceDocs.filter((d) => d.status === "expiring").length}. Expired: ${complianceDocs.filter((d) => d.status === "expired").length}.` },
      { heading: "Action Required", content: complianceDocs.filter((d) => d.status !== "valid").map((d) => `• ${d.personName} — ${d.docType}: ${d.status} (${d.expiryDate})`).join("\n") },
      { heading: "Recommendation", content: "Immediate action required for expired licenses. Set up automated reminders 60 days before expiry." },
    ],
  },
  R4: {
    title: "Guard Activity Report — Feb 2026",
    sections: [
      { heading: "Active Status", content: guards.map((g) => `• ${g.name}: ${g.status} at ${g.site} — Last seen ${g.lastSeen}`).join("\n") },
      { heading: "Performance", content: "All on-duty guards within geofence boundaries. One geofence alert flagged for James Wilson — under review." },
    ],
  },
  R5: {
    title: "Payroll Hours Export — Feb 2026",
    sections: [
      { heading: "Payroll Data", content: guards.map((g) => `• ${g.name}: ${g.hoursThisWeek}h worked, ${Math.max(0, g.hoursThisWeek - 40)}h overtime`).join("\n") },
      { heading: "Total", content: `Total hours: ${guards.reduce((a, g) => a + g.hoursThisWeek, 0)}h. Total overtime: ${guards.reduce((a, g) => a + Math.max(0, g.hoursThisWeek - 40), 0)}h.` },
    ],
  },
  R6: {
    title: "Site Coverage Report — Feb 2026",
    sections: [
      { heading: "Coverage Summary", content: sites.map((s) => `• ${s.name}: ${s.guards.length} guards assigned, Manager: ${s.manager}, Status: ${s.status}`).join("\n") },
      { heading: "Gaps", content: "Old Factory Site has no guards assigned. Consider decommissioning or assigning temporary coverage." },
    ],
  },
};

import StateMessage from "@/components/common/StateMessage";

const Reports = () => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const permissions = user?.permissions || [];
  const isAdmin = user?.role === "admin";

  const hasViewPermission = isAdmin || permissions.includes("view_report") || permissions.includes("report");
  const hasCreatePermission = isAdmin || permissions.includes("create_report") || permissions.includes("report");

  const [previewReport, setPreviewReport] = useState<string | null>(null);
  const preview = previewReport ? reportPreviews[previewReport] : null;

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

  return (
    <div className="p-6 space-y-6">
      <div className="module-page-header">
        <div>
          <h1 className="module-page-title">Reports & Data Export</h1>
          <p className="text-sm text-muted-foreground">View stats, preview reports, and download data</p>
        </div>
      </div>

      {/* Stats Overview */}
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

      {/* Quick Export */}
      {hasCreatePermission && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Incident Report", desc: "Export all incidents as PDF", icon: FileText },
            { label: "Hours Report", desc: "Export hours data as Excel", icon: BarChart3 },
            { label: "Compliance Report", desc: "Export compliance status as PDF", icon: FileText },
          ].map((item) => (
            <div key={item.label} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <button className="flex items-center gap-2 text-sm text-primary font-medium hover:underline">
                <Download className="w-3.5 h-3.5" />Generate & Download
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Report History with View */}
      <div className="data-table">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Report History</h2>
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
            {reports.map((r) => (
              <tr key={r.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                <td className="px-5 py-3 text-sm font-medium text-foreground">{r.name}</td>
                <td className="px-5 py-3 text-sm text-muted-foreground">{r.type}</td>
                <td className="px-5 py-3"><span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded font-medium">{r.format}</span></td>
                <td className="px-5 py-3 text-sm text-muted-foreground">{r.lastGenerated}</td>
                <td className="px-5 py-3 flex gap-3">
                  <button onClick={() => setPreviewReport(r.id)} className="flex items-center gap-1 text-sm text-primary hover:underline">
                    <Eye className="w-3.5 h-3.5" />View
                  </button>
                  <button className="flex items-center gap-1 text-sm text-primary hover:underline">
                    <Download className="w-3.5 h-3.5" />Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Report Preview Dialog */}
      <Dialog open={!!previewReport} onOpenChange={() => setPreviewReport(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{preview?.title || "Report Preview"}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-5 mt-2">
              {preview.sections.map((section, i) => (
                <div key={i}>
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">{section.heading}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{section.content}</p>
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button onClick={() => setPreviewReport(null)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors">Close</button>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                  <Download className="w-4 h-4" />Download Report
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reports;
