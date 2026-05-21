import { useNavigate } from "react-router-dom";
import { DashboardKpis } from "@/services/dashboardService";

interface HoursSummaryProps {
  kpis: DashboardKpis | null;
  loading?: boolean;
}

const HoursSummary = ({ kpis, loading }: HoursSummaryProps) => {
  const navigate = useNavigate();
  
  const worked = kpis?.workedHoursToday ?? 0;
  const scheduled = kpis?.scheduledHoursToday ?? 0;
  const pct = scheduled > 0 ? Math.round((worked / scheduled) * 100) : 0;

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-foreground">Hours Summary — Today</h2>
        <button onClick={() => navigate("/dashboard/hours")} className="text-sm text-primary font-medium hover:underline">View Details</button>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground py-2">Loading hours summary...</div>
      ) : (
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">Worked: {worked}h</span>
              <span className="text-muted-foreground">Scheduled: {scheduled}h</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-foreground leading-tight">{pct}%</p>
            <p className="text-[11px] text-muted-foreground">Coverage</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HoursSummary;
