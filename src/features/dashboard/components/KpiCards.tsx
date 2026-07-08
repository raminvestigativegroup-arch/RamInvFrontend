import { Users, MapPin, FileWarning, ShieldAlert, ArrowUpRight, Check } from "lucide-react";
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

  const activeGuards = kpis?.activeGuards ?? 0;
  const totalGuards = kpis?.totalGuards ?? 0;
  const activeSites = kpis?.activeSites ?? 0;
  const totalSites = kpis?.totalSites ?? 0;
  const incidentsToday = kpis?.incidentsToday ?? 0;
  const openIncidents = kpis?.openIncidents ?? 0;
  const complianceAlerts = kpis?.complianceAlerts ?? 0;

  const guardsCapacity = totalGuards > 0 ? Math.round((activeGuards / totalGuards) * 100) : 0;
  const sitesCapacity = totalSites > 0 ? Math.round((activeSites / totalSites) * 100) : 0;

  const cards = [
    {
      label: "Active Guards",
      value: formatValue(activeGuards),
      icon: Users,
      link: "/dashboard/guards",
      colorClass: "indigo",
      colors: {
        text: "text-indigo-600 dark:text-indigo-400",
        borderHover: "hover:border-indigo-500/30 dark:hover:border-indigo-400/30",
        shadowHover: "hover:shadow-indigo-500/5",
        bgIcon: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100/50 dark:border-indigo-900/30",
        glow: "from-indigo-500/10",
        blurBg: "bg-indigo-500/10",
      },
      badge: `${guardsCapacity}% Capacity`,
      badgeColor: guardsCapacity >= 80 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    },
    {
      label: "Sites Covered",
      value: formatValue(activeSites),
      icon: MapPin,
      link: "/dashboard/sites",
      colorClass: "violet",
      colors: {
        text: "text-violet-600 dark:text-violet-400",
        borderHover: "hover:border-violet-500/30 dark:hover:border-violet-400/30",
        shadowHover: "hover:shadow-violet-500/5",
        bgIcon: "bg-violet-50 dark:bg-violet-950/40 border-violet-100/50 dark:border-violet-900/30",
        glow: "from-violet-500/10",
        blurBg: "bg-violet-500/10",
      },
      badge: totalSites - activeSites > 0 ? `${totalSites - activeSites} Pending` : "All Covered",
      badgeColor: totalSites - activeSites === 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    },
    {
      label: "Incidents Today",
      value: formatValue(incidentsToday),
      icon: FileWarning,
      link: "/dashboard/incidents",
      colorClass: "rose",
      colors: {
        text: "text-rose-600 dark:text-rose-400",
        borderHover: "hover:border-rose-500/30 dark:hover:border-rose-400/30",
        shadowHover: "hover:shadow-rose-500/5",
        bgIcon: "bg-rose-50 dark:bg-rose-950/40 border-rose-100/50 dark:border-rose-900/30",
        glow: "from-rose-500/10",
        blurBg: "bg-rose-500/10",
      },
      badge: openIncidents > 0 ? `${openIncidents} Open` : "All Resolved",
      badgeColor: openIncidents > 0 ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      isPulse: openIncidents > 0,
    },
    {
      label: "Compliance Alerts",
      value: formatValue(complianceAlerts),
      icon: ShieldAlert,
      link: "/dashboard/compliance",
      colorClass: "amber",
      colors: {
        text: "text-amber-600 dark:text-amber-400",
        borderHover: "hover:border-amber-500/30 dark:hover:border-amber-400/30",
        shadowHover: "hover:shadow-amber-500/5",
        bgIcon: "bg-amber-50 dark:bg-amber-950/40 border-amber-100/50 dark:border-amber-900/30",
        glow: "from-amber-500/10",
        blurBg: "bg-amber-500/10",
      },
      badge: complianceAlerts > 0 ? `${complianceAlerts} Alerts` : "All Compliant",
      badgeColor: complianceAlerts > 0 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      isPulse: complianceAlerts > 0,

    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`group relative overflow-hidden bg-card rounded-2xl border border-border/80 p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${card.colors.borderHover} ${card.colors.shadowHover}`}
            onClick={() => navigate(card.link)}
          >
            {/* Background Glow */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.colors.glow} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

            {/* Decorative Blur Circle */}
            <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full ${card.colors.blurBg} blur-xl group-hover:scale-150 transition-all duration-500 opacity-30 dark:opacity-20 pointer-events-none`} />

            {/* Header Content */}
            <div className="flex items-start justify-between relative z-10">
              <div className={`w-10 h-10 rounded-xl ${card.colors.bgIcon} flex items-center justify-center shrink-0 border border-border/50 transition-transform duration-300 group-hover:scale-110`}>
                <Icon className={`w-5 h-5 ${card.colors.text}`} />
              </div>

              <div className="flex items-center gap-2">
                {/* Status Badge */}
                <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${card.badgeColor} flex items-center gap-1 relative`}>
                  {card.isPulse && (
                    <span className="flex h-1.5 w-1.5 relative shrink-0">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${card.colorClass === 'rose' ? 'bg-rose-400' : 'bg-amber-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${card.colorClass === 'rose' ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
                    </span>
                  )}
                  {card.badge}
                </div>

                {/* Arrow Link */}
                <div className={`w-7 h-7 rounded-lg bg-secondary/65 border border-border/40 flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:border-border/80 group-hover:bg-accent transition-all duration-300 shrink-0`}>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                </div>
              </div>
            </div>

            {/* Metric Body */}
            <div className="mt-4 relative z-10">
              <p className="text-3xl font-extrabold text-foreground tracking-tight leading-none mb-1">
                {card.value}
              </p>
              <p className="text-xs font-semibold text-muted-foreground/95 uppercase tracking-wider">
                {card.label}
              </p>
            </div>

            {/* Extra details (progress, status, description) */}
            <div className="relative z-10">
              {card.extra}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KpiCards;
