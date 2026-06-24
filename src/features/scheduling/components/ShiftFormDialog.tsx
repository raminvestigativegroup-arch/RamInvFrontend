import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/config/api";
import { ScheduleEntry } from "@/data/dummyData";
import { Check, Loader2, Search, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import SelectDropdown from "@/components/common/SelectDropdown";
import TimeSelect from "@/components/common/TimeSelect";
import FormField from "@/components/common/FormField";
import DateSelect from "@/components/common/DateSelect";
import { Button } from "@/components/ui/button";
import { formatDateOnly } from "@/lib/dateUtils";

const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const minutesToTime = (mins: number): string => {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const getShiftDurationMinutes = (start: string, end: string): number => {
  if (!start || !end) return 0;
  const startMins = timeToMinutes(start);
  let endMins = timeToMinutes(end);
  if (endMins < startMins) {
    endMins += 24 * 60; // Crosses midnight
  }
  return endMins - startMins;
};

const formatDateFriendly = (dateStr: string) => {
  return formatDateOnly(dateStr);
};

const formatDateRangeFriendly = (startStr: string, endStr: string) => {
  if (!startStr || !endStr) return "";
  return `${formatDateFriendly(startStr)} – ${formatDateFriendly(endStr)}`;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (entries: ScheduleEntry[]) => void;
  editEntry?: ScheduleEntry | null;
  existingEntries: ScheduleEntry[];
  isLoadingSave?: boolean;
  error?: string;
}

const ShiftFormDialog = ({ open, onOpenChange, onSave, editEntry, existingEntries, isLoadingSave = false, error }: Props) => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    selectedGuards: [] as string[],
    siteId: "",
    managerId: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    shiftStart: "",
    shiftEnd: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Tracks the active preset offset (days) so startDate changes keep the same duration
  const [activePresetDays, setActivePresetDays] = useState<number | null>(null);
  const [guardSelectOpen, setGuardSelectOpen] = useState(false);
  const [guardSearchQuery, setGuardSearchQuery] = useState("");
  const [activePresetTimeMins, setActivePresetTimeMins] = useState<number | null>(null);
  const [editScope, setEditScope] = useState<"single" | "all">("all");

  // Determine if it is a multi-day series
  const scheduleId = editEntry ? editEntry.id.split("-")[0] : "";
  const scheduleEntries = editEntry ? existingEntries.filter(e => e.id.startsWith(scheduleId + "-")) : [];
  const uniqueDates = Array.from(new Set(scheduleEntries.map(e => e.date)));
  const isMultiDay = uniqueDates.length > 1;

  let minDate = editEntry ? editEntry.date : "";
  let maxDate = editEntry ? editEntry.date : "";
  if (scheduleEntries.length > 0) {
    const dates = scheduleEntries.map(e => e.date).sort();
    minDate = dates[0];
    maxDate = dates[dates.length - 1];
  }

  // Fetch verified guards from API
  const { data: guards = [], isLoading: isLoadingGuards } = useQuery({
    queryKey: ["guards", "verified"],
    queryFn: async () => {
      try {
        const response = await api.guards.list({ verified: true, fields: "id,firstName,middleName,lastName,name,verified,managerId" });
        const raw = response.data as any;

        let list: any[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (Array.isArray(raw?.data)) list = raw.data;
        else if (raw?.data && typeof raw.data === 'object') {
          list = raw.data.guards || raw.data.items || raw.data.results || [];
        } else {
          list = raw?.guards || raw?.items || raw?.results || [];
        }

        return (Array.isArray(list) ? list : [])
          .map((g: any) => ({
            id: g.id || g._id,
            name: g.name || g.fullName || `${g.firstName || ""} ${g.lastName || ""}`.trim() || "Unnamed",
            site: g.site || g.siteName || "Unassigned",
            verified: g.verified === true || g.verified === "true" || g.isVerified === true,
            managerId: g.managerId || null
          }))
          .filter((g: any) => g.verified);
      } catch (error: any) {
        if (error.response?.status === 404) return [];
        throw error;
      }
    },
    enabled: open
  });

  // Fetch active sites from API
  const { data: sites = [], isLoading: isLoadingSites } = useQuery({
    queryKey: ["sites", "active"],
    queryFn: async () => {
      try {
        const response = await api.sites.list({ status: "active", fields: "id,name,status,managerid,managerIds" });
        const raw = response.data as any;

        let list: any[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (Array.isArray(raw?.data)) list = raw.data;
        else if (raw?.data && typeof raw.data === 'object') {
          list = raw.data.site || raw.data.sites || raw.data.items || raw.data.results || [];
        } else {
          list = raw?.site || raw?.sites || raw?.items || raw?.results || [];
        }

        return (Array.isArray(list) ? list : [])
          .map((s: any) => ({
            id: s.id || s._id,
            name: s.name || "Unnamed Site",
            status: s.status || "inactive",
            managers: s.managers || [],
            managerIds: s.managerIds || [],
          }))
          .filter((s: any) => s.status === "active");
      } catch (error: any) {
        if (error.response?.status === 404) return [];
        throw error;
      }
    },
    enabled: open
  });

  useEffect(() => {
    if (open) {
      setErrors({});
      setEditScope("all");
      if (editEntry) {
        const assignedGuards = scheduleEntries.map(e => e.guard);

        // Map guard names to their corresponding guard IDs and deduplicate them
        const guardIds = Array.from(
          new Set(
            assignedGuards
              .map(name => guards.find(g => g.name === name)?.id)
              .filter(Boolean)
          )
        ) as string[];

        // Fallback to the single guard if no other matching composite entries are found
        if (guardIds.length === 0) {
          const singleGuardId = guards.find(g => g.name === editEntry.guard)?.id || "";
          if (singleGuardId) guardIds.push(singleGuardId);
        }

        const siteId = editEntry.siteId || sites.find(s => s.name === editEntry.site)?.id || "";
        const managerId = editEntry.managerId || "";
        const start = editEntry.shiftStart.substring(0, 5);
        const end = editEntry.shiftEnd.substring(0, 5);

        setForm({
          selectedGuards: guardIds,
          siteId: siteId,
          managerId: managerId,
          startDate: minDate,
          endDate: maxDate,
          shiftStart: start,
          shiftEnd: end,
        });
        setActivePresetTimeMins(getShiftDurationMinutes(start, end));
      } else {
        setForm({
          selectedGuards: [],
          siteId: "",
          managerId: "",
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          shiftStart: "",
          shiftEnd: ""
        });
        setActivePresetTimeMins(null);
      }
    }
  }, [editEntry, open, sites, guards, existingEntries]);

  // Find currently selected site details to get its managers
  const selectedSite = sites.find((s: any) => s.id === form.siteId);
  const siteManagers = selectedSite ? selectedSite.managers || [] : [];

  // Filter guards: show all verified guards as they are independent of managers
  const filteredGuards = guards;

  const toggleGuard = (id: string) => {
    setForm((f) => ({
      ...f,
      selectedGuards: f.selectedGuards.includes(id)
        ? f.selectedGuards.filter((gId) => gId !== id)
        : [...f.selectedGuards, id],
    }));
  };

  const selectAllGuards = () => {
    setForm((f) => ({
      ...f,
      selectedGuards: f.selectedGuards.length === filteredGuards.length ? [] : filteredGuards.map((g: any) => g.id),
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.siteId) {
      newErrors.siteId = "Site is required";
    }
    if (!form.managerId) {
      newErrors.managerId = "Manager is required";
    }
    if (form.selectedGuards.length === 0) {
      newErrors.selectedGuards = "At least one guard must be selected";
    }
    if (!form.startDate) {
      newErrors.startDate = "Start date is required";
    }
    if (!form.endDate) {
      newErrors.endDate = "End date is required";
    } else if (new Date(form.startDate) > new Date(form.endDate)) {
      newErrors.endDate = "End date cannot be before start date";
    }
    if (!form.shiftStart) {
      newErrors.shiftStart = "Shift start time is required";
    }
    if (!form.shiftEnd) {
      newErrors.shiftEnd = "Shift end time is required";
    } else if (form.shiftStart && form.shiftEnd <= form.shiftStart) {
      newErrors.shiftEnd = "Shift end must be after shift start";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Prepare payload in the specific format requested
    const payload = {
      guardIds: form.selectedGuards,
      siteId: form.siteId,
      managerId: form.managerId,
      startDate: form.startDate,
      endDate: form.endDate,
      shiftStart: `${form.shiftStart}:00`,
      shiftEnd: `${form.shiftEnd}:00`,
      onlyThisDay: editScope === "single",
    };

    onSave(payload as any);
  };

  const isLoading = isLoadingGuards || isLoadingSites;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editEntry ? "Edit Shift" : "Create New Shift"}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Fetching data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2" noValidate>
            {error && (
              <div className="p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                {error}
              </div>
            )}
            <FormField label="Site" required error={errors.siteId}>
              <SelectDropdown
                value={form.siteId}
                onChange={val => {
                  setForm(f => ({ ...f, siteId: val, managerId: "" }));
                  if (errors.siteId) setErrors(prev => ({ ...prev, siteId: undefined }));
                }}
                options={sites.map((s: any) => ({ value: s.id, label: s.name }))}
                placeholder="Select a site"
                className={errors.siteId ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"}
              />
            </FormField>

            <FormField label="Manager" required error={errors.managerId}>
              <SelectDropdown
                value={form.managerId}
                onChange={val => {
                  setForm(f => ({ ...f, managerId: val }));
                  if (errors.managerId) setErrors(prev => ({ ...prev, managerId: undefined }));
                }}
                options={siteManagers.map((m: any) => ({ value: m.id, label: m.name }))}
                placeholder={form.siteId ? "Select a manager" : "Please select a site first"}
                disabled={!form.siteId}
                className={errors.managerId ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"}
              />
            </FormField>

            <FormField label="Guards" required error={errors.selectedGuards}>
              <div
                onClick={() => setGuardSelectOpen(true)}
                className={`w-full min-h-[38px] px-3 py-2 bg-secondary border rounded-lg text-sm text-foreground flex flex-wrap gap-1.5 items-center cursor-pointer hover:border-primary/50 transition-colors ${errors.selectedGuards ? "border-destructive focus:ring-destructive/20" : "border-border"
                  }`}
              >
                {form.selectedGuards.length === 0 ? (
                  <span className="text-slate-400">Click to assign guards...</span>
                ) : (
                  form.selectedGuards.map(id => {
                    const guard = guards.find((g: any) => g.id === id);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                      >
                        {guard ? guard.name : id}
                      </span>
                    );
                  })
                )}
              </div>
            </FormField>

            <Dialog open={guardSelectOpen} onOpenChange={setGuardSelectOpen}>
              <DialogContent className="sm:max-w-md border border-slate-100 dark:border-slate-800 shadow-2xl rounded-xl">
                <DialogTitle className="text-lg font-bold text-foreground">Assign Guards</DialogTitle>
                <div className="space-y-4 mt-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        value={guardSearchQuery}
                        onChange={(e) => setGuardSearchQuery(e.target.value)}
                        placeholder="Search guards..."
                        className="pl-9 pr-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 h-[38px] rounded-lg text-sm w-full placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    {filteredGuards.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const allSelected = form.selectedGuards.length === filteredGuards.length;
                          setForm(f => ({
                            ...f,
                            selectedGuards: allSelected ? [] : filteredGuards.map((g: any) => g.id),
                          }));
                          if (errors.selectedGuards) setErrors(prev => ({ ...prev, selectedGuards: undefined }));
                        }}
                        className="px-3 h-[38px] bg-secondary hover:bg-slate-100 dark:hover:bg-slate-800 border border-border rounded-lg text-xs font-semibold active:scale-95 transition-all"
                      >
                        {form.selectedGuards.length === filteredGuards.length ? "Deselect All" : "Select All"}
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                    {filteredGuards.filter((g: any) => g.name.toLowerCase().includes(guardSearchQuery.toLowerCase())).length === 0 ? (
                      <div className="text-center py-8">
                        <Search className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">No guards found</p>
                      </div>
                    ) : (
                      filteredGuards
                        .filter((g: any) => g.name.toLowerCase().includes(guardSearchQuery.toLowerCase()))
                        .map((g: any) => {
                          const isSelected = form.selectedGuards.includes(g.id);
                          const initials = g.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                          return (
                            <div
                              key={g.id}
                              onClick={() => {
                                toggleGuard(g.id);
                                if (errors.selectedGuards) setErrors(prev => ({ ...prev, selectedGuards: undefined }));
                              }}
                              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-all duration-150 border ${isSelected
                                ? "bg-primary/10 text-primary border-primary/25 font-medium shadow-sm"
                                : "bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900 text-foreground border-slate-300 dark:border-slate-700"
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-primary/10 text-primary"
                                  }`}>
                                  {initials}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium text-foreground">{g.name}</span>
                                  {/* {g.site && (
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                                      <MapPin className="w-3 h-3 text-slate-400" />
                                      {g.site}
                                    </span>
                                  )} */}
                                </div>
                              </div>
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                                  <Check className="w-3.5 h-3.5 text-primary-foreground stroke-[3]" />
                                </div>
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>
                  <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setGuardSelectOpen(false);
                        setGuardSearchQuery("");
                      }}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Quick Duration Presets */}
            {(
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Quick Duration</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "24 Hours", days: 0, fullDay: true },
                    { label: "3 Days", days: 2, fullDay: false },
                    { label: "1 Week", days: 6, fullDay: false },
                    { label: "2 Weeks", days: 13, fullDay: false },
                    { label: "1 Month", days: 29, fullDay: false },
                  ].map(preset => {
                    const today = new Date();
                    const start = today.toISOString().split("T")[0];
                    const endD = new Date(today);
                    endD.setDate(today.getDate() + preset.days);
                    const end = endD.toISOString().split("T")[0];

                    const isActive = activePresetDays === preset.days &&
                      (preset.fullDay ? form.shiftStart === "00:00" && form.shiftEnd === "23:59" : true);

                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setActivePresetDays(preset.days);
                          if (preset.fullDay) {
                            setActivePresetTimeMins(1439); // 23h 59m offset
                            setForm(f => ({
                              ...f,
                              startDate: start,
                              endDate: end,
                              shiftStart: "00:00",
                              shiftEnd: "23:59",
                            }));
                          } else {
                            setForm(f => ({
                              ...f,
                              startDate: start,
                              endDate: end,
                            }));
                          }
                          setErrors(prev => ({ ...prev, startDate: undefined, endDate: undefined, shiftStart: undefined, shiftEnd: undefined }));
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${isActive
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-secondary text-foreground border-border hover:bg-accent hover:border-primary/40"
                          }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Start Date" required error={errors.startDate}>
                <DateSelect
                  value={form.startDate}
                  disabled={editScope === "single"}
                  onChange={(val) => {
                    setForm((f) => {
                      // If a preset is active, keep the same duration offset
                      let newEnd = f.endDate;
                      if (activePresetDays !== null) {
                        const d = new Date(val);
                        d.setDate(d.getDate() + activePresetDays);
                        newEnd = d.toISOString().split("T")[0];
                      } else {
                        // Auto-clamp: if endDate is now before the new startDate, bump it up
                        newEnd = f.endDate && f.endDate < val ? val : f.endDate;
                      }
                      return { ...f, startDate: val, endDate: newEnd };
                    });
                    if (errors.startDate) setErrors(prev => ({ ...prev, startDate: undefined, endDate: undefined }));
                  }}
                  className={errors.startDate ? "border-destructive focus:ring-destructive/20" : ""}
                />
              </FormField>
              <FormField label="End Date" required error={errors.endDate}>
                <DateSelect
                  value={form.endDate}
                  disabled={editScope === "single"}
                  onChange={(val) => {
                    // Manual end-date change breaks the preset lock
                    setActivePresetDays(null);
                    setForm((f) => ({ ...f, endDate: val }));
                    if (errors.endDate) setErrors(prev => ({ ...prev, endDate: undefined }));
                  }}
                  className={errors.endDate ? "border-destructive focus:ring-destructive/20" : ""}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Shift Start" required error={errors.shiftStart}>
                <TimeSelect
                  value={form.shiftStart}
                  onChange={(val) => {
                    setForm((f) => {
                      let newEnd = f.shiftEnd;
                      if (activePresetTimeMins !== null && val) {
                        const startMins = timeToMinutes(val);
                        const endMins = (startMins + activePresetTimeMins) % (24 * 60);
                        newEnd = minutesToTime(endMins);
                      }
                      return { ...f, shiftStart: val, shiftEnd: newEnd };
                    });
                    // Clear shiftEnd error if shiftStart changes — user will re-validate on submit
                    if (errors.shiftStart || errors.shiftEnd) setErrors(prev => ({ ...prev, shiftStart: undefined, shiftEnd: undefined }));
                  }}
                />
              </FormField>
              <FormField label="Shift End" required error={errors.shiftEnd}>
                <TimeSelect
                  value={form.shiftEnd}
                  onChange={(val) => {
                    // Manual shiftEnd change breaks the preset lock
                    setActivePresetTimeMins(null);
                    setForm((f) => ({ ...f, shiftEnd: val }));
                    if (errors.shiftEnd) setErrors(prev => ({ ...prev, shiftEnd: undefined }));
                  }}
                />
              </FormField>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                disabled={isLoadingSave}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isLoadingSave}
              >
                {editEntry ? "Update Shift" : `Create ${form.selectedGuards.length > 0 ? `${form.selectedGuards.length} Shift(s)` : "Shift"}`}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShiftFormDialog;
