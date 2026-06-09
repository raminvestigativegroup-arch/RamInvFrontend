import { Users, MapPin, FileWarning, ShieldAlert, ArrowUpRight, TrendingDown, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardKpis } from "@/services/dashboardService";

interface KpiCardsProps {
  kpis: DashboardKpis | null;
  loading?: boolean;
}

const KpiCards = ({ kpis, loading }: KpiCardsProps) => {
  const navigate = useNavigate();

  const formatValue = (val: number | undefined) => {
    if (loading || val === undefined || val === null) return "...";
    return val < 10 ? `0${val}` : String(val);
  };

  const kpiCards = [
    {
      label: "Active Guards",
      value: formatValue(kpis?.activeGuards),
      subtitle: (
        <span className="text-[11px] text-primary font-semibold tracking-wide">
          {kpis && kpis.totalGuards > 0 
            ? `${Math.round((kpis.activeGuards / kpis.totalGuards) * 100)}% Capacity` 
            : "0% Capacity"}
        </span>
      ),
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/5 border border-primary/10",
      trendIcon: ArrowUpRight,
      trendColor: "text-muted-foreground/60",
      link: "/dashboard/guards",
    },
    {
      label: "Sites Covered",
      value: formatValue(kpis?.activeSites),
      subtitle: (
        <span className="text-[11px] text-muted-foreground font-medium tracking-wide">
          {kpis && (kpis.totalSites - kpis.activeSites) > 0 
            ? `${kpis.totalSites - kpis.activeSites} Pending Activation` 
            : "All Sites Active"}
        </span>
      ),
      icon: MapPin,
      color: "text-primary",
      bg: "bg-primary/5 border border-primary/10",
      trendIcon: ArrowUpRight,
      trendColor: "text-muted-foreground/60",
      link: "/dashboard/sites",
    },
    {
      label: "Incidents Today",
      value: formatValue(kpis?.incidentsToday),
      subtitle: (
        <span className={`text-[11px] font-semibold tracking-wide ${kpis && kpis.openIncidents > 0 ? "text-red-500" : "text-success"}`}>
          {kpis && kpis.openIncidents > 0 
            ? `${kpis.openIncidents} Open Incidents` 
            : "No Open Incidents"}
        </span>
      ),
      icon: FileWarning,
      color: "text-red-500",
      bg: "bg-red-50/80 border border-red-100/50",
      trendIcon: ArrowUpRight,
      trendColor: "text-muted-foreground/60",
      link: "/dashboard/incidents",
    },
    {
      label: "Compliance Alerts",
      value: formatValue(kpis?.complianceAlerts),
      subtitle: (
        <span className={`text-[11px] font-semibold tracking-wide ${kpis && kpis.complianceAlerts > 0 ? "text-warning" : "text-success"}`}>
          {kpis && kpis.complianceAlerts > 0 
            ? `${kpis.complianceAlerts} Actions Required` 
            : "All Compliant"}
        </span>
      ),
      icon: ShieldAlert,
      color: kpis && kpis.complianceAlerts > 0 ? "text-warning" : "text-primary",
      bg: kpis && kpis.complianceAlerts > 0 ? "bg-warning/5 border border-warning/10" : "bg-primary/5 border border-primary/10",
      trendIcon: ArrowUpRight,
      trendColor: "text-muted-foreground/60",
      link: "/dashboard/compliance",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiCards.map((card) => (
        <div
          key={card.label}
          className="bg-card rounded-xl border border-border p-4 cursor-pointer hover:shadow-md transition-all duration-200"
          onClick={() => navigate(card.link)}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-9 h-9 rounded-full ${card.bg} flex items-center justify-center shrink-0`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <card.trendIcon className={`w-4 h-4 ${card.trendColor}`} />
          </div>
          <p className="text-3xl font-bold text-foreground leading-none tracking-tight mb-2">{card.value}</p>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{card.label}</p>
          <div className="leading-none mt-1">{card.subtitle}</div>
        </div>
      ))}
    </div>
  );
};

export default KpiCards;
