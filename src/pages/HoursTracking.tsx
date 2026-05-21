import { guards } from "@/data/dummyData";
import { Download, Filter } from "lucide-react";

const HoursTracking = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="module-page-header">
        <div>
          <h1 className="module-page-title">Hours & Attendance</h1>
          <p className="text-sm text-muted-foreground">Track worked hours, overtime, and attendance</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-muted"><Filter className="w-4 h-4" />This Week</button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"><Download className="w-4 h-4" />Export Report</button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">Total Scheduled</p>
          <p className="text-2xl font-bold text-foreground mt-1">320h</p>
        </div>
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">Total Worked</p>
          <p className="text-2xl font-bold text-foreground mt-1">296h</p>
        </div>
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">Overtime</p>
          <p className="text-2xl font-bold text-warning mt-1">12h</p>
        </div>
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">Shortage</p>
          <p className="text-2xl font-bold text-destructive mt-1">36h</p>
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
            {guards.map(guard => {
              const diff = guard.hoursThisWeek - guard.scheduledHours;
              return (
                <tr key={guard.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{guard.avatar}</div>
                      <span className="text-sm font-medium text-foreground">{guard.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{guard.site}</td>
                  <td className="px-5 py-3 text-sm text-foreground text-right">{guard.scheduledHours}h</td>
                  <td className="px-5 py-3 text-sm text-foreground text-right">{guard.hoursThisWeek}h</td>
                  <td className={`px-5 py-3 text-sm text-right font-medium ${diff > 0 ? "text-warning" : diff < 0 ? "text-destructive" : "text-success"}`}>
                    {diff > 0 ? `+${diff}h` : `${diff}h`}
                  </td>
                  <td className="px-5 py-3">
                    <span className={diff >= 0 ? "status-badge-active" : "status-badge-danger"}>
                      {diff > 0 ? "Overtime" : diff < 0 ? "Shortage" : "On Track"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HoursTracking;
