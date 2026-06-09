import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock, CalendarClock } from "lucide-react";
import { DashboardKpis } from "@/services/dashboardService";

interface HoursSummaryProps {
  kpis: DashboardKpis | null;
  loading?: boolean;
}

const HoursSummary = ({ kpis, loading }: HoursSummaryProps) => {
  const navigate = useNavigate();

  // Use real API values — no hardcoded fallbacks
  const worked = kpis?.workedHoursToday ?? 0;
  const scheduled = kpis?.scheduledHoursToday ?? 0;
  const pct = scheduled > 0 ? Math.min(100, Math.round((worked / scheduled) * 100)) : 0;

  // Format hours nicely: 8.5 → "8h 30m", 8 → "8h"
  const formatHours = (h: number) => {
    if (h === 0) return "0h";
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-44 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
        </div>
        <div className="flex items-center gap-6">
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-28 bg-muted rounded" />
              <div className="h-3 w-28 bg-muted rounded" />
            </div>
            <div className="w-full h-3.5 bg-muted rounded-full" />
          </div>
          <div className="text-right shrink-0">
            <div className="h-8 w-14 bg-muted rounded" />
            <div className="h-2.5 w-14 bg-muted rounded mt-1.5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-foreground">Hours Summary — Today</h2>
        <button
          onClick={() => navigate("/dashboard/hours")}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          View Details <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-6">
        {/* Progress section */}
        <div className="flex-1">
          {/* Labels */}
          <div className="flex justify-between text-xs font-medium text-foreground mb-2">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              Worked: <strong className="text-primary font-bold ml-0.5">{formatHours(worked)}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5 text-muted-foreground" />
              Scheduled: <strong className="font-bold ml-0.5">{formatHours(scheduled)}</strong>
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3.5 bg-secondary rounded-full overflow-hidden border border-border/10">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, hsl(228 45% 28%) 0%, hsl(220 90% 52%) 100%)",
                minWidth: pct > 0 ? "6px" : "0px",
              }}
            />
          </div>

          {/* No data state */}
          {scheduled === 0 && (
            <p className="text-xs text-muted-foreground mt-1.5">No shifts scheduled for today.</p>
          )}
        </div>

        {/* Percentage */}
        <div className="text-right shrink-0">
          <p
            className="text-3xl font-extrabold leading-none tracking-tight"
            style={{ color: "hsl(228 50% 22%)" }}
          >
            {pct}%
          </p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
            Coverage
          </p>
        </div>
      </div>
    </div>
  );
};

export default HoursSummary;
