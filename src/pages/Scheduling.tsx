import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/config/api";
import { ScheduleEntry } from "@/data/dummyData";
import { Plus, CalendarDays, LayoutGrid, MapPin, ChevronLeft, ChevronRight, Loader2, Calendar, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ShiftFormDialog from "@/features/scheduling/components/ShiftFormDialog";
import ScheduleCalendarView from "@/features/scheduling/components/ScheduleCalendarView";
import ScheduleWeekView from "@/features/scheduling/components/ScheduleWeekView";
import ScheduleSiteView from "@/features/scheduling/components/ScheduleSiteView";
import StateMessage from "@/components/common/StateMessage";
import SelectDropdown from "@/components/common/SelectDropdown";
import { Button } from "@/components/ui/button";
import { formatDateOnly } from "@/lib/dateUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ViewMode = "calendar" | "week" | "site";

const Scheduling = () => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const permissions = user?.permissions || [];
  const isAdmin = user?.role === "admin";

  const hasViewPermission = isAdmin || permissions.includes("view_scheduling") || permissions.includes("scheduling");
  const hasCreatePermission = isAdmin || permissions.includes("create_scheduling") || permissions.includes("scheduling");
  const hasEditPermission = isAdmin || permissions.includes("edit_scheduling") || permissions.includes("scheduling");
  const hasDeletePermission = isAdmin || permissions.includes("delete_scheduling") || permissions.includes("scheduling");

  const [open, setOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<ScheduleEntry | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const utcDay = d.getUTCDay();
    const diffToMonday = utcDay === 0 ? -6 : 1 - utcDay;
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diffToMonday));
    return monday;
  });
  const [filterSite, setFilterSite] = useState("all");

  useEffect(() => {
    const d = new Date(selectedDate + "T00:00:00Z");
    const day = d.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diffToMonday));
    setWeekStart(monday);
  }, [selectedDate]);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Fetch Guards
  const { data: rawGuards = [] } = useQuery({
    queryKey: ["guards", "all"],
    queryFn: async () => {
      try {
        const response = await api.guards.list();
        const raw = response.data as any;
        let list: any[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (Array.isArray(raw?.data)) list = raw.data;
        else if (raw?.data && typeof raw.data === 'object') {
          list = raw.data.guards || raw.data.items || raw.data.results || [];
        } else {
          list = raw?.guards || raw?.items || raw?.results || [];
        }
        return list;
      } catch (error) {
        return [];
      }
    }
  });

  const guards = useMemo(() => {
    return rawGuards.map((g: any) => ({
      ...g,
      isVerified: g.isVerified === true || g.verified === true || g.verified === "true" || g.isVerified === "true"
    })).filter((g: any) => g.isVerified);
  }, [rawGuards]);

  // Fetch Sites
  const { data: sites = [] } = useQuery({
    queryKey: ["sites", "all"],
    queryFn: async () => {
      try {
        const response = await api.sites.list();
        const raw = response.data as any;
        let list: any[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (Array.isArray(raw?.data)) list = raw.data;
        else if (raw?.data && typeof raw.data === 'object') {
          list = raw.data.site || raw.data.sites || raw.data.items || raw.data.results || [];
        } else {
          list = raw?.site || raw?.sites || raw?.items || raw?.results || [];
        }
        return list;
      } catch (error) {
        return [];
      }
    }
  });

  const activeSites = useMemo(() => sites.filter((s: any) => s.status === "active"), [sites]);

  // Fetch Scheduling Entries
  const { data: rawEntries = [], isLoading: isLoadingEntries, isError: isErrorEntries, error: errorEntries } = useQuery({
    queryKey: ["scheduling", "list", filterSite],
    queryFn: async () => {
      const params: any = {};
      if (filterSite && filterSite !== "all") {
        params.site = filterSite;
      }
      const response = await api.scheduling.list(params);
      const raw = response.data as any;
      const list = Array.isArray(raw) ? raw : (raw?.data || raw?.schedules || raw?.items || []);
      return Array.isArray(list) ? list : [];
    }
  });

  const entries = useMemo(() => {
    const guardsMap = new Map(guards.map((g: any) => [g.id || g._id, g.name || g.fullName || "Unknown Guard"]));
    const sitesMap = new Map(sites.map((s: any) => [s.id || s._id, s.name || "Unknown Site"]));

    const parsed: ScheduleEntry[] = [];

    for (const s of rawEntries) {
      const siteName = s.site?.name || s.siteName || sitesMap.get(s.siteId) || "Unknown Site";

      const startStr = s.startDate || s.date;
      const endStr = s.endDate || s.date || s.startDate;

      if (!startStr) continue;

      const start = new Date(startStr);
      const end = endStr ? new Date(endStr) : new Date(start);

      if (isNaN(start.getTime())) continue;

      const guardIds = s.guardIds && Array.isArray(s.guardIds) ? s.guardIds : (s.guardId ? [s.guardId] : []);

      if (guardIds.length === 0 && (s.guard || s.guardName)) {
        const guardName = s.guard?.name || s.guardName;
        // Check if this guard name exists in our verified guards map
        const isVerified = Array.from(guardsMap.values()).includes(guardName);

        if (isVerified) {
          parsed.push({
            id: s.id || s._id,
            guard: guardName,
            site: siteName,
            siteId: s.siteId || null,
            managerId: s.managerId || null,
            date: start.toISOString().split('T')[0],
            shiftStart: (s.shiftStart || "00:00").substring(0, 5),
            shiftEnd: (s.shiftEnd || "00:00").substring(0, 5),
            status: s.status || "scheduled",
            actualStart: s.actualStart,
            actualEnd: s.actualEnd
          });
        }
        continue;
      }

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];

        for (const gId of guardIds) {
          const guardName = guardsMap.get(gId);
          if (!guardName) continue; // Skip unverified or unknown guards

          parsed.push({
            id: `${s.id || s._id}-${gId}-${dateStr}`,
            guard: guardName,
            site: siteName,
            siteId: s.siteId || null,
            managerId: s.managerId || null,
            date: dateStr,
            shiftStart: (s.shiftStart || "00:00:00").substring(0, 5),
            shiftEnd: (s.shiftEnd || "00:00:00").substring(0, 5),
            status: s.status || "scheduled",
            actualStart: s.actualStart,
            actualEnd: s.actualEnd
          });
        }
      }
    }
    return parsed;
  }, [rawEntries, guards, sites]);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deletingEntry = useMemo(() => entries.find(e => e.id === deletingId), [entries, deletingId]);




  const isNotFound = isErrorEntries && ((errorEntries as any)?.response?.status === 404 || (errorEntries as any)?.message?.includes("404"));
  const showLoader = isLoadingEntries;
  const showEmpty = !isLoadingEntries && (entries.length === 0 || isNotFound);
  const showError = isErrorEntries && !isNotFound;

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.scheduling.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["scheduling"] });
      toast({ title: "Schedule Created", description: "The shifts have been successfully scheduled." });
      setOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string, payload: any }) => api.scheduling.update(data.id, data.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["scheduling"] });
      toast({ title: "Shift Updated", description: "The shift information has been updated." });
      setOpen(false);
      setEditEntry(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.scheduling.delete(id),
    onSuccess: async (data, id) => {
      queryClient.setQueriesData({ queryKey: ["scheduling"] }, (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.filter((s: any) => s.id !== id);
      });
      setDeletingId(null);
      toast({ title: "Shift Deleted", description: "The shift has been removed." });
      await queryClient.invalidateQueries({ queryKey: ["scheduling"] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.response?.data?.message || "Failed to delete shift.",
        variant: "destructive",
      });
      setDeletingId(null);
    }
  });

  const handlePrevWeek = () => {
    const prev = new Date(weekStart);
    prev.setUTCDate(prev.getUTCDate() - 7);
    setWeekStart(prev);
    setSelectedDate(prev.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const next = new Date(weekStart);
    next.setUTCDate(next.getUTCDate() + 7);
    setWeekStart(next);
    setSelectedDate(next.toISOString().split('T')[0]);
  };

  const getWeekRangeText = () => {
    const start = new Date(weekStart);
    const end = new Date(weekStart);
    end.setUTCDate(end.getUTCDate() + 6);

    const startOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' };
    const endOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' };

    return `Week of ${start.toLocaleDateString('en-US', startOptions)} – ${end.toLocaleDateString('en-US', endOptions)}`;
  };

  const handleSave = (payload: any) => {
    if (editEntry) {
      updateMutation.mutate({ id: editEntry.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleOpenDialog = () => {
    createMutation.reset();
    updateMutation.reset();
    setEditEntry(null);
    setOpen(true);
  };

  const handleEdit = (entry: ScheduleEntry) => {
    createMutation.reset();
    updateMutation.reset();
    setEditEntry(entry);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const filteredEntries = entries;

  const todayShifts = useMemo(() => filteredEntries.filter((s: ScheduleEntry) => s.date === selectedDate), [filteredEntries, selectedDate]);

  const viewTabs: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: "calendar", label: "Calendar", icon: <CalendarDays className="w-4 h-4" /> },
    { id: "week", label: "Weekly", icon: <LayoutGrid className="w-4 h-4" /> },
    { id: "site", label: "By Site", icon: <MapPin className="w-4 h-4" /> },
  ];

  if (!hasViewPermission) {
    return (
      <div className="p-6">
        <StateMessage
          type="error"
          title="Access Denied"
          message="You do not have permission to view Scheduling."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="module-page-header">
        <div>
          <h1 className="module-page-title">Scheduling</h1>
          <p className="text-sm text-muted-foreground">Create shifts, assign guards, and manage weekly schedules</p>
        </div>
        {hasCreatePermission && (
          <Button
            onClick={handleOpenDialog}
          >
            <Plus className="w-4 h-4" />Create Shift
          </Button>
        )}
      </div>

      {/* View Toggle & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between" >
        <div className="flex bg-secondary rounded-lg p-1">
          {viewTabs.map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              variant={viewMode === tab.id ? "default" : "ghost"}
              size="sm"
              className="rounded"
            >
              {tab.icon}{tab.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-3 w-48">
          <SelectDropdown
            value={filterSite}
            onChange={setFilterSite}
            options={[
              { value: "all", label: "All Sites" },
              ...activeSites.map((s: any) => ({ value: s.name, label: s.name }))
            ]}
            placeholder="All Sites"
          />
        </div>
      </div>

      {/* Views */}
      {showLoader ? (
        <StateMessage type="loading" message="Loading schedules..." className="py-20" />
      ) : showError ? (
        <StateMessage
          type="error"
          title="Failed to load schedules"
          message={errorEntries instanceof Error ? errorEntries.message : undefined}
          className="py-20"
        />
      ) : showEmpty ? (
        <StateMessage
          type="empty"
          title="Schedule not found"
          message="Create a new shift/schedule to get started."
          className="py-20"
          icon={Calendar}
        />
      ) : (
        <>
          {viewMode === "calendar" && (
            <ScheduleCalendarView entries={filteredEntries} onSelectDate={setSelectedDate} selectedDate={selectedDate} />
          )}

          {viewMode === "week" && (
            <>
              <div className="flex items-center gap-4">
                <Button
                  onClick={handlePrevWeek}
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                >
                  <ChevronLeft className="w-4 h-4 text-foreground" />
                </Button>
                <h2 className="text-base font-semibold text-foreground">{getWeekRangeText()}</h2>
                <Button
                  onClick={handleNextWeek}
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                >
                  <ChevronRight className="w-4 h-4 text-foreground" />
                </Button>
              </div>
              <ScheduleWeekView
                guards={guards}
                entries={entries}
                onEdit={hasEditPermission ? handleEdit : undefined}
                onDelete={hasDeletePermission ? handleDelete : undefined}
                filterSite={filterSite}
                weekStart={weekStart}
              />
            </>
          )}

          {viewMode === "site" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => {
                    const prev = new Date(selectedDate + "T00:00:00Z");
                    prev.setUTCDate(prev.getUTCDate() - 1);
                    setSelectedDate(prev.toISOString().split('T')[0]);
                  }}
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                >
                  <ChevronLeft className="w-4 h-4 text-foreground" />
                </Button>
                <h2 className="text-base font-semibold text-foreground">
                  {formatDateOnly(selectedDate)}
                </h2>
                <Button
                  onClick={() => {
                    const next = new Date(selectedDate + "T00:00:00Z");
                    next.setUTCDate(next.getUTCDate() + 1);
                    setSelectedDate(next.toISOString().split('T')[0]);
                  }}
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                >
                  <ChevronRight className="w-4 h-4 text-foreground" />
                </Button>
              </div>

              <ScheduleSiteView
                entries={entries}
                selectedDate={selectedDate}
                sites={filterSite === "all" ? activeSites : activeSites.filter((s: any) => s.name === filterSite)}
              />
            </div>
          )}
        </>
      )}

      {/* Selected Day Detail */}
      {viewMode !== "week" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Shifts for {formatDateOnly(selectedDate)}
            </h2>
            <span className="text-xs text-muted-foreground">{todayShifts.length} shift(s)</span>
          </div>
          {todayShifts.length === 0 ? (
            <div className="p-4">
              <StateMessage type="empty" message="No shifts scheduled for this date" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary">
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">GUARD</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">SITE</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">SCHEDULED</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">ACTUAL START</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">STATUS</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {todayShifts.map((entry) => (
                    <tr key={entry.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-foreground">{entry.guard}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{entry.site}</td>
                      <td className="px-5 py-3 text-sm text-foreground">{entry.shiftStart} – {entry.shiftEnd}</td>
                      <td className="px-5 py-3 text-sm text-foreground">{entry.actualStart || "—"}</td>
                      <td className="px-5 py-3">
                        <span className={
                          entry.status === "in-progress" ? "status-badge-active" :
                            entry.status === "completed" ? "status-badge-active" :
                              entry.status === "missed" ? "status-badge-danger" : "status-badge-inactive"
                        }>{entry.status}</span>
                      </td>
                      <td className="px-5 py-3 flex gap-2">
                        {hasEditPermission && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => handleEdit(entry)}
                            className="h-auto p-0 hover:underline"
                          >
                            Edit
                          </Button>
                        )}
                        {hasDeletePermission && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => handleDelete(entry.id)}
                            className="h-auto p-0 hover:underline text-destructive"
                          >
                            Delete
                          </Button>
                        )}
                        {!hasEditPermission && !hasDeletePermission && (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      <ShiftFormDialog
        open={open}
        onOpenChange={(o) => { setOpen(o); if (!o) setEditEntry(null); }}
        onSave={handleSave}
        editEntry={editEntry}
        existingEntries={entries}
        isLoadingSave={createMutation.isPending || updateMutation.isPending}
        error={createMutation.error?.response?.data?.message || createMutation.error?.message || updateMutation.error?.response?.data?.message || updateMutation.error?.message}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(val) => !val && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <AlertDialogTitle>Delete Shift?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to delete the shift for <strong>{deletingEntry?.guard || "this guard"}</strong> at <strong>{deletingEntry?.site || "this site"}</strong> on <strong>{deletingEntry?.date || "this date"}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={deleteMutation.isPending}>
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={() => deletingId && deleteMutation.mutate(deletingId)}
                loading={deleteMutation.isPending}
              >
                Delete Shift
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Scheduling;
