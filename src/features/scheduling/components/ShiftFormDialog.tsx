import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/config/api";
import { ScheduleEntry } from "@/data/dummyData";
import { Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import SelectDropdown from "@/components/common/SelectDropdown";
import TimeSelect from "@/components/common/TimeSelect";
import FormField from "@/components/common/FormField";
import DateSelect from "@/components/common/DateSelect";

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

  // Fetch verified guards from API
  const { data: guards = [], isLoading: isLoadingGuards } = useQuery({
    queryKey: ["guards", "verified"],
    queryFn: async () => {
      try {
        const response = await api.guards.list({ verified: true });
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
        const response = await api.sites.list({ status: "active" });
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
      if (editEntry) {
        // Extract the scheduleId prefix (first UUID part before the guard UUID)
        const scheduleId = editEntry.id.split("-")[0];

        // Find all guards currently assigned to this schedule from existingEntries
        const assignedGuards = existingEntries
          .filter(e => e.id.startsWith(scheduleId + "-"))
          .map(e => e.guard);

        // Map guard names to their corresponding guard IDs
        const guardIds = assignedGuards.map(name => guards.find(g => g.name === name)?.id).filter(Boolean) as string[];

        // Fallback to the single guard if no other matching composite entries are found
        if (guardIds.length === 0) {
          const singleGuardId = guards.find(g => g.name === editEntry.guard)?.id || "";
          if (singleGuardId) guardIds.push(singleGuardId);
        }

        const siteId = editEntry.siteId || sites.find(s => s.name === editEntry.site)?.id || "";
        const managerId = editEntry.managerId || "";

        setForm({
          selectedGuards: guardIds,
          siteId: siteId,
          managerId: managerId,
          startDate: editEntry.date,
          endDate: editEntry.date,
          shiftStart: editEntry.shiftStart.substring(0, 5),
          shiftEnd: editEntry.shiftEnd.substring(0, 5),
        });
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
      }
    }
  }, [editEntry, open, sites, guards, existingEntries]);

  // Find currently selected site details to get its managers
  const selectedSite = sites.find((s: any) => s.id === form.siteId);
  const siteManagers = selectedSite ? selectedSite.managers || [] : [];

  // Filter guards: show guards who are unassigned or assigned to this manager.
  // If no manager is selected yet, show all verified guards.
  const filteredGuards = guards.filter((g: any) => {
    if (!form.managerId) return true;
    return !g.managerId || String(g.managerId) === String(form.managerId);
  });

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
                  setForm(f => ({ ...f, siteId: val, managerId: "", selectedGuards: [] }));
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
                  setForm(f => ({ ...f, managerId: val, selectedGuards: [] }));
                  if (errors.managerId) setErrors(prev => ({ ...prev, managerId: undefined }));
                }}
                options={siteManagers.map((m: any) => ({ value: m.id, label: m.name }))}
                placeholder={form.siteId ? "Select a manager" : "Please select a site first"}
                disabled={!form.siteId}
                className={errors.managerId ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"}
              />
            </FormField>

            <FormField label="Guards" required error={errors.selectedGuards}>
              <div className={`border rounded-lg bg-secondary max-h-40 overflow-y-auto ${errors.selectedGuards ? "border-destructive" : "border-border"
                }`}>
                {filteredGuards.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      selectAllGuards();
                      setErrors(prev => ({ ...prev, selectedGuards: undefined }));
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-primary hover:bg-accent transition-colors border-b border-border"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${form.selectedGuards.length === filteredGuards.length ? "bg-primary border-primary" : "border-border"}`}>
                      {form.selectedGuards.length === filteredGuards.length && filteredGuards.length > 0 && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    Select All Verified Guards
                  </button>
                )}
                {filteredGuards.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No verified guards found
                  </div>
                ) : filteredGuards.map((g: any) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      toggleGuard(g.id);
                      setErrors(prev => ({ ...prev, selectedGuards: undefined }));
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${form.selectedGuards.includes(g.id) ? "bg-primary border-primary" : "border-border"}`}>
                      {form.selectedGuards.includes(g.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className="text-foreground">{g.name}</span>
                    <span className="text-muted-foreground text-xs ml-auto">{g.site}</span>
                  </button>
                ))}
              </div>
            </FormField>

            {/* Quick Duration Presets */}
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
                        setForm(f => ({
                          ...f,
                          startDate: start,
                          endDate: end,
                          ...(preset.fullDay ? { shiftStart: "00:00", shiftEnd: "23:59" } : {}),
                        }));
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

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Start Date" required error={errors.startDate}>
                <DateSelect
                  value={form.startDate}
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
                    setForm((f) => ({ ...f, shiftStart: val }));
                    // Clear shiftEnd error if shiftStart changes — user will re-validate on submit
                    if (errors.shiftStart || errors.shiftEnd) setErrors(prev => ({ ...prev, shiftStart: undefined, shiftEnd: undefined }));
                  }}
                />
              </FormField>
              <FormField label="Shift End" required error={errors.shiftEnd}>
                <TimeSelect
                  value={form.shiftEnd}
                  onChange={(val) => {
                    setForm((f) => ({ ...f, shiftEnd: val }));
                    if (errors.shiftEnd) setErrors(prev => ({ ...prev, shiftEnd: undefined }));
                  }}
                />
              </FormField>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isLoadingSave}
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoadingSave}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {isLoadingSave && <Loader2 className="w-4.5 h-4.5 animate-spin" />}
                {editEntry ? (isLoadingSave ? "Updating..." : "Update Shift") : (isLoadingSave ? "Creating..." : `Create ${form.selectedGuards.length > 0 ? `${form.selectedGuards.length} Shift(s)` : "Shift"}`)}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShiftFormDialog;
