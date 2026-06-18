import { useState } from "react";
import { Bell, AlertTriangle, Calendar, Settings, CheckCircle, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/config/api";
import StateMessage from "@/components/common/StateMessage";
import { Button } from "@/components/ui/button";

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

  // 1. Query for live notifications
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ["notifications-list"],
    queryFn: () => api.notifications.list().then(res => res.data),
    enabled: hasViewPermission,
  });

  // 2. Mutation to mark all notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: () => api.notifications.markAllAsRead(),
    onSuccess: () => {
      refetch();
    },
  });

  // 3. Mutation to mark a single notification as read
  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.notifications.markAsRead(id),
    onSuccess: () => {
      refetch();
    },
  });

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

  const notificationList = response?.notifications || [];
  const unreadCount = notificationList.filter((n: any) => !n.read).length;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="module-page-header">
        <div>
          <h1 className="module-page-title">Notifications & Alerts</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Checking notifications..." : `${unreadCount} unread notifications`}
          </p>
        </div>
        {hasEditPermission && (
          <Button
            onClick={() => markAllReadMutation.mutate()}
            disabled={isLoading || unreadCount === 0}
            variant="secondary"
          >
            Mark All Read
          </Button>
        )}
      </div>

      {/* Alert Settings Configuration Card */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">Alert Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "High Priority Incidents", desc: "Instant email + in-app alert", enabled: true },
            { label: "License Expirations", desc: "30 days before expiry", enabled: true },
            { label: "Shift Discrepancies", desc: "When actual differs from scheduled", enabled: true },
            { label: "System Updates", desc: "Platform announcements", enabled: false },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <div className={`w-10 h-6 rounded-full flex items-center transition-colors ${item.enabled ? "bg-primary justify-end" : "bg-muted-foreground/30 justify-start"}`}>
                <div className="w-4 h-4 rounded-full bg-card mx-1 shadow" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notification List */}
      {isLoading ? (
        <StateMessage type="loading" message="Loading notifications..." />
      ) : error ? (
        <StateMessage
          type="error"
          title="Error Loading Notifications"
          message="Failed to connect to the alerts server."
        />
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {notificationList.length > 0 ? (
            notificationList.map((notif: any) => {
              const Icon = iconMap[notif.type] || Bell;
              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read && hasEditPermission) {
                      markReadMutation.mutate(notif.id);
                    }
                  }}
                  className={`flex items-start gap-4 px-5 py-4 border-b border-border transition-colors hover:bg-secondary/50 cursor-pointer ${!notif.read ? "bg-primary/5" : ""
                    }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${notif.priority === "high" ? "bg-destructive/10 text-destructive" :
                      notif.priority === "medium" ? "bg-warning/10 text-warning" : "bg-secondary text-muted-foreground"
                    }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${!notif.read ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                        {notif.title}
                      </p>
                      {!notif.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(notif.createdAt)}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 text-sm text-muted-foreground">
              <CheckCircle className="w-8 h-8 mx-auto text-success/70 mb-2" />
              You are all caught up! No notifications.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
