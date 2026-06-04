import { useState } from "react";
import { Download, Filter, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/config/api";
import StateMessage from "@/components/common/StateMessage";
import SelectDropdown from "@/components/common/SelectDropdown";
import { Button } from "@/components/ui/button";

const HoursTracking = () => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const permissions = user?.permissions || [];
  const isAdmin = user?.role === "admin";

  const hasViewPermission = isAdmin || permissions.includes("view_hour") || permissions.includes("hour");
  const hasEditPermission = isAdmin || permissions.includes("edit_hour") || permissions.includes("hour");

  const [period, setPeriod] = useState<"this-week" | "last-week" | "all">("this-week");

  const getDatesForPeriod = (p: "this-week" | "last-week" | "all") => {
    if (p === "all") return { startDate: "", endDate: "" };

    const now = new Date();
    if (p === "this-week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return {
        startDate: monday.toISOString().split("T")[0],
        endDate: sunday.toISOString().split("T")[0]
      };
    } else {
      // last-week
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
      const monday = new Date(now.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return {
        startDate: monday.toISOString().split("T")[0],
        endDate: sunday.toISOString().split("T")[0]
      };
    }
  };

  const { startDate, endDate } = getDatesForPeriod(period);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["hours-tracking", period, startDate, endDate],
    queryFn: () => api.hoursTracking.list({ startDate, endDate }).then(res => res.data),
    enabled: hasViewPermission,
  });

  const exportToCSV = () => {
    if (!response?.guards || response.guards.length === 0) return;
    const headers = ["GUARD", "SITE", "SCHEDULED", "WORKED", "DIFF", "STATUS"];
    const rows = response.guards.map((g: any) => [
      g.name,
      g.site,
      `${g.scheduledHours}h`,
      `${g.workedHours}h`,
      `${g.diff > 0 ? "+" : ""}${g.diff}h`,
      g.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map((r: any) => r.map((cell: any) => `"${cell.replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hours_Attendance_Report_${period}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!hasViewPermission) {
    return (
      <div className="p-6">
        <StateMessage
          type="error"
          title="Access Denied"
          message="You do not have permission to view Hours & Attendance."
        />
      </div>
    );
  }

  const summary = response?.summary || { totalScheduled: 0, totalWorked: 0, totalOvertime: 0, totalShortage: 0 };
  const guardRecords = response?.guards || [];

  const periodOptions = [
    { value: "this-week", label: "This Week" },
    { value: "last-week", label: "Last Week" },
    { value: "all", label: "All Time" }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="module-page-header">
        <div>
          <h1 className="module-page-title">Hours & Attendance</h1>
          <p className="text-sm text-muted-foreground">Track worked hours, overtime, and attendance</p>
        </div>
        <div className="flex gap-3">
          <SelectDropdown
            value={period}
            onChange={(val) => setPeriod(val as any)}
            options={periodOptions}
            placeholder="Select period"
            className="w-[140px]"
          />

          {hasEditPermission && (
            <Button
              onClick={exportToCSV}
              disabled={isLoading || guardRecords.length === 0}
            >
              <Download className="w-4 h-4" />Export Report
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="ml-2 text-muted-foreground text-sm font-medium">Loading attendance data...</span>
        </div>
      ) : error ? (
        <StateMessage
          type="error"
          title="Error Loading Data"
          message="Failed to fetch hours and attendance details from the server."
        />
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="kpi-card">
              <p className="text-sm text-muted-foreground">Total Scheduled</p>
              <p className="text-2xl font-bold text-foreground mt-1">{summary.totalScheduled}h</p>
            </div>
            <div className="kpi-card">
              <p className="text-sm text-muted-foreground">Total Worked</p>
              <p className="text-2xl font-bold text-foreground mt-1">{summary.totalWorked}h</p>
            </div>
            <div className="kpi-card">
              <p className="text-sm text-muted-foreground">Overtime</p>
              <p className="text-2xl font-bold text-warning mt-1">{summary.totalOvertime}h</p>
            </div>
            <div className="kpi-card">
              <p className="text-sm text-muted-foreground">Shortage</p>
              <p className="text-2xl font-bold text-destructive mt-1">{summary.totalShortage}h</p>
            </div>
          </div>

          {/* Per Guard Table */}
          <div className="data-table">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary">
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">GUARD</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">SITE</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">SCHEDULED</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">WORKED</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">DIFF</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {guardRecords.length > 0 ? (
                  guardRecords.map((guard: any) => (
                    <tr key={guard.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            {guard.avatar}
                          </div>
                          <span className="text-sm font-medium text-foreground">{guard.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{guard.site}</td>
                      <td className="px-5 py-3 text-sm text-foreground text-right">{guard.scheduledHours}h</td>
                      <td className="px-5 py-3 text-sm text-foreground text-right">{guard.workedHours}h</td>
                      <td className={`px-5 py-3 text-sm text-right font-medium ${guard.diff > 0 ? "text-warning" : guard.diff < 0 ? "text-destructive" : "text-success"}`}>
                        {guard.diff > 0 ? `+${guard.diff}h` : `${guard.diff}h`}
                      </td>
                      <td className="px-5 py-3">
                        <span className={guard.diff > 0 ? "status-badge-warning" : guard.diff < 0 ? "status-badge-danger" : "status-badge-active"}>
                          {guard.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
                      No attendance tracking records found for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default HoursTracking;
