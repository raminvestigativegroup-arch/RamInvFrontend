import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock, CalendarClock, Users, TrendingUp, Timer } from "lucide-react";
import { DashboardKpis } from "@/services/dashboardService";

interface HoursSummaryProps {
  kpis: DashboardKpis | null;
  loading?: boolean;
}

const HoursSummary = ({ kpis, loading }: HoursSummaryProps) => {
  const navigate = useNavigate();

  const worked = kpis?.workedHoursToday ?? 0;
  const scheduled = kpis?.scheduledHoursToday ?? 0;
  const remaining = Math.max(0, scheduled - worked);
  const pct = scheduled > 0 ? Math.min(100, Math.round((worked / scheduled) * 100)) : 0;
  const activeGuards = kpis?.activeGuards ?? 0;
  const totalGuards = kpis?.totalGuards ?? 0;

  const formatHours = (h: number) => {
    if (h === 0) return "0h";
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  const pctColor =
    pct >= 90 ? "text-emerald-500" :
      pct >= 60 ? "text-amber-500" :
        "text-rose-500";

  const barColor =
    pct >= 90 ? "from-emerald-500 to-emerald-400" :
      pct >= 60 ? "from-amber-500   to-amber-400" :
        "from-rose-500    to-rose-400";

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-5">
          <div className="h-4 w-48 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-6 w-14 bg-muted rounded" />
            </div>
          ))}
        </div>
        <div className="w-full h-3 bg-muted rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-foreground">Hours Summary</h2>
          <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full border border-border">
            Today
          </span>
          {/* Live pulse indicator */}
          <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            Live
          </span>
        </div>
        <button
          onClick={() => navigate("/dashboard/hours")}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          View Details <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>



      {/* Progress bar + coverage */}
      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-1.5">
          <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
            <span>Coverage progress</span>
            <span className={pctColor}>{pct}%</span>
          </div>
          <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden border border-border/20">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${barColor}`}
              style={{ width: `${pct}%`, minWidth: pct > 0 ? "6px" : "0px" }}
            />
          </div>
          {scheduled === 0 && (
            <p className="text-xs text-muted-foreground">No shifts scheduled for today.</p>
          )}
        </div>

        {/* Coverage badge */}
        <div className="shrink-0 text-right">
          <p className={`text-3xl font-extrabold leading-none tracking-tight ${pctColor}`}>
            {pct}%
          </p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 flex items-center gap-1 justify-end">
            <TrendingUp className="w-3 h-3" /> Coverage
          </p>
        </div>
      </div>
    </div>
  );
};

export default HoursSummary;
