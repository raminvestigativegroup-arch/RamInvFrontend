import { useState, useMemo } from "react";
import { Bell, AlertTriangle, Calendar, Settings, CheckCircle, Search, Inbox, EyeOff } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/config/api";
import StateMessage from "@/components/common/StateMessage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const iconMap = {
  incident: AlertTriangle,
  compliance: Bell,
  schedule: Calendar,
  system: Settings,
};

const Notifications = () => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const permissions = user?.permissions || [];
  const isAdmin = user?.role === "admin";

  const hasViewPermission = isAdmin || permissions.includes("view_notification") || permissions.includes("notification");
  const hasEditPermission = isAdmin || permissions.includes("edit_notification") || permissions.includes("notification");

  // State for search and active inbox filter tabs
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "high">("all");

  // 1. Query for live notifications
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ["notifications-list"],
    queryFn: () => api.notifications.list().then(res => res.data),
    enabled: hasViewPermission,
  });

  // 2. Mutation to mark all notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: () => api.notifications.markAllAsRead(),
    onSuccess: async () => {
      await refetch();
    },
  });

  // 3. Mutation to mark a single notification as read
  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.notifications.markAsRead(id),
    onSuccess: async () => {
      await refetch();
    },
  });

  // 4. Query for alert configurations
  const { data: configsResponse, refetch: refetchConfigs } = useQuery({
    queryKey: ["alert-configs"],
    queryFn: () => api.alerts.list().then(res => res.data),
    enabled: hasViewPermission,
  });

  const configs = configsResponse?.configs || [];

  // 5. Mutation to toggle configuration
  const toggleConfigMutation = useMutation({
    mutationFn: (data: { alertType: string; enabled: boolean }) => api.alerts.upsert(data),
    onSuccess: () => {
      refetchConfigs();
    },
  });

  const isEnabled = (key: string) => {
    const config = configs.find((c: any) => c.alertType === key);
    return config ? config.enabled : true; // Default to true
  };

  const handleToggle = (key: string) => {
    if (!hasEditPermission) return;
    const currentVal = isEnabled(key);
    toggleConfigMutation.mutate({ alertType: key, enabled: !currentVal });
  };

  const notificationList = response?.notifications || [];
  const unreadCount = notificationList.filter((n: any) => !n.read).length;

  // Filter list based on tabs & search
  const filteredNotifications = useMemo(() => {
    return notificationList.filter((n: any) => {
      // Tab filter
      if (activeTab === "unread" && n.read) return false;
      if (activeTab === "high" && n.priority !== "high") return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = n.title?.toLowerCase().includes(query);
        const msgMatch = n.message?.toLowerCase().includes(query);
        return titleMatch || msgMatch;
      }

      return true;
    });
  }, [notificationList, activeTab, searchQuery]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  if (!hasViewPermission) {
    return (
      <div className="p-6">
        <StateMessage
          type="error"
          title="Access Denied"
          message="You do not have permission to view Notifications."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header section with Action Button */}
      <div className="module-page-header">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="module-page-title">Notifications & Alerts</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Checking notifications..." : `Manage alert configurations and review recent events`}
          </p>
        </div>
        {hasEditPermission && (
          <Button
            onClick={() => markAllReadMutation.mutate()}
            disabled={isLoading || unreadCount === 0 || markAllReadMutation.isPending}
            loading={markAllReadMutation.isPending}
            variant="secondary"
          >
            Mark All Read
          </Button>
        )}
      </div>

      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unread Alerts</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{unreadCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Bell className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">High Priority</p>
            <h3 className="text-2xl font-bold text-destructive mt-1">
              {notificationList.filter((n: any) => n.priority === "high" && !n.read).length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monitored Services</p>
            <h3 className="text-2xl font-bold text-success mt-1">
              {configs.filter((c: any) => c.enabled).length} / {configs.length || 4}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center text-success">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Notifications Listing with search/filter tabs */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            {/* Inbox Tabs */}
            <div className="flex bg-secondary rounded-lg p-1">
              {(
                [
                  { id: "all", label: "All", count: notificationList.length, icon: <Inbox className="w-4 h-4" /> },
                  { id: "unread", label: "Unread", count: unreadCount, icon: <EyeOff className="w-4 h-4" /> },
                  { id: "high", label: "Critical", count: notificationList.filter((n: any) => n.priority === "high").length, icon: <AlertTriangle className="w-4 h-4" /> },
                ] as const
              ).map((tab) => (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  size="sm"
                  className="rounded flex items-center gap-1.5"
                >
                  {tab.icon}
                  <span>{tab.label} ({tab.count})</span>
                </Button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 md:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search alert title or body..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground text-foreground"
              />
            </div>
          </div>

          {/* Notifications List Content */}
          {isLoading ? (
            <StateMessage type="loading" message="Loading notifications..." />
          ) : error ? (
            <StateMessage
              type="error"
              title="Error Loading Notifications"
              message="Failed to connect to the alerts server."
            />
          ) : (
            <div className="space-y-3">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notif: any) => {
                  const Icon = iconMap[notif.type] || Bell;
                  const isHigh = notif.priority === "high";
                  const isUnread = !notif.read;

                  return (
                    <div
                      key={notif.id}
                      onClick={() => {
                        if (isUnread && hasEditPermission && !markReadMutation.isPending) {
                          markReadMutation.mutate(notif.id);
                        }
                      }}
                      className={`group relative flex items-start gap-4 pl-6 pr-5 py-4 border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs hover:border-border/80 ${isUnread
                        ? "bg-card border-border"
                        : "bg-card/60 border-border hover:bg-card"
                        }`}
                    >
                      {/* Left color bar indicator for unread alerts */}
                      {isUnread && (
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${isHigh ? "bg-destructive" : "bg-primary"}`} />
                      )}

                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-200 ${isHigh ? "bg-destructive/10 text-destructive border border-destructive/20" :
                        notif.priority === "medium" ? "bg-warning/10 text-warning border border-warning/20" :
                          notif.type === "compliance" ? "bg-primary/10 text-primary border border-primary/20" :
                            "bg-secondary text-muted-foreground border border-border"
                        }`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`text-sm tracking-tight ${isUnread ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
                                {notif.title}
                              </p>
                              {isHigh && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Critical</Badge>
                              )}
                              {notif.type && (
                                <Badge variant={
                                  notif.type === "incident" ? "destructive" :
                                    notif.type === "compliance" ? "warning" :
                                      notif.type === "schedule" ? "info" : "secondary"
                                } className="text-[9px] px-1.5 py-0 opacity-80 uppercase tracking-wider">{notif.type}</Badge>
                              )}
                            </div>
                            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                              {notif.message}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {formatDate(notif.createdAt)}
                            </span>
                            {/* Unread mark / Hover action */}
                            {isUnread ? (
                              <div className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-primary status-pulse" />
                                <span className="text-[9px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">Mark as read</span>
                              </div>
                            ) : (
                              <span className="text-[9px] text-muted-foreground/60 italic">Read</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-card border border-border rounded-xl py-16 text-center shadow-xs">
                  <CheckCircle className="w-10 h-10 mx-auto text-success/60 mb-3" />
                  <p className="text-sm font-bold text-foreground">No alerts match your filter</p>
                  <p className="text-xs text-muted-foreground mt-1">Try clearing your search query or selecting a different tab.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Alert Configurations */}
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Alert Channel Rules</h2>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Configure alert routing rules. Disabling an option silences corresponding in-app banner alerts.
            </p>

            <div className="space-y-3">
              {[
                { key: "incident_priority", label: "High Priority Incidents", desc: "Instant critical security updates" },
                { key: "document_expiry", label: "License Expirations", desc: "Alerts when files expire soon" },
                { key: "assignment_rejected", label: "Shift Discrepancies", desc: "Actual hours differ from schedule" },
                { key: "password_change", label: "System Updates", desc: "Security and system adjustments" },
              ].map(item => {
                const enabled = isEnabled(item.key);
                return (
                  <div key={item.key} className="flex items-start justify-between gap-4 p-3.5 bg-secondary/30 rounded-xl border border-border/50 hover:bg-secondary/50 transition-colors">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(item.key)}
                      disabled={!hasEditPermission || toggleConfigMutation.isPending}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${enabled ? "bg-primary" : "bg-muted-foreground/30"
                        }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${enabled ? "translate-x-4" : "translate-x-0"
                          }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Help / Info box */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-5 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">System Log Integration</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Alert logs are generated autoritatively by backend monitoring services. High priority security breaches trigger real-time SMS relays to supervisors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
