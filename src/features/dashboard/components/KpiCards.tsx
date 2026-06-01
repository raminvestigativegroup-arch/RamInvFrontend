import { Users, MapPin, FileWarning, ShieldAlert, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardKpis } from "@/services/dashboardService";

interface KpiCardsProps {
  kpis: DashboardKpis | null;
  loading?: boolean;
}

const KpiCards = ({ kpis, loading }: KpiCardsProps) => {
  const navigate = useNavigate();

  const kpiCards = [
    {
      label: "Active Guards",
      value: loading ? "..." : (kpis?.activeGuards ?? 0),
      subtitle: loading ? "Loading..." : `of ${kpis?.totalGuards ?? 0} total`,
      icon: Users,
      color: "text-primary",
      bg: "bg-accent/10",
      link: "/dashboard/guards",
    },
    {
      label: "Sites Covered",
      value: loading ? "..." : (kpis?.activeSites ?? 0),
      subtitle: loading ? "Loading..." : `of ${kpis?.totalSites ?? 0} total`,
      icon: MapPin,
      color: "text-success",
      bg: "bg-success/10",
      link: "/dashboard/sites",
    },
    {
      label: "Incidents Today",
      value: loading ? "..." : (kpis?.incidentsToday ?? 0),
      subtitle: loading ? "Loading..." : `${kpis?.openIncidents ?? 0} open`,
      icon: FileWarning,
      color: "text-warning",
      bg: "bg-warning/10",
      link: "/dashboard/incidents",
    },
    {
      label: "Compliance Alerts",
      value: loading ? "..." : (kpis?.complianceAlerts ?? 0),
      subtitle: "need attention",
      icon: ShieldAlert,
      color: "text-destructive",
      bg: "bg-destructive/10",
      link: "/dashboard/compliance",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpiCards.map((card) => (
        <div
          key={card.label}
          className="kpi-card !px-3 !py-2.5 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate(card.link)}
        >
          <div className="flex items-center justify-between mb-1">
            <div className={`w-7 h-7 rounded-lg ${card.bg} flex items-center justify-center`}>
              <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
            </div>
            <TrendingUp className="w-3 h-3 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold text-foreground leading-tight">{card.value}</p>
          <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
          <p className="text-xs text-muted-foreground">{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
};

export default KpiCards;
