import { useMemo } from "react";
import { ScheduleEntry } from "@/data/dummyData";
import { Pencil, Trash2 } from "lucide-react";

interface Guard {
  id: string;
  name: string;
  fullName?: string;
  profilePhoto?: string;
  siteId?: string;
  site?: string;
  isVerified?: boolean;
}

interface Props {
  entries: ScheduleEntry[];
  guards: Guard[];
  onEdit: (entry: ScheduleEntry) => void;
  onDelete: (id: string) => void;
  filterSite: string;
  weekStart: Date;
}

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ScheduleWeekView = ({ entries, guards, onEdit, onDelete, filterSite, weekStart }: Props) => {
  const filteredGuards = useMemo(() => {
    if (filterSite === "all") {
      return guards.filter((g) => g.isVerified);
    }
    // Find guard names with at least one shift at this site
    const guardNamesWithShifts = new Set(
      entries
        .filter((e) => e.site === filterSite)
        .map((e) => e.guard)
    );
    return guards.filter((g) => g.isVerified && guardNamesWithShifts.has(g.name));
  }, [guards, filterSite, entries]);

  // Generate the 7 days of the week based on weekStart
  const weekDays = daysOfWeek.map((day, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return {
      day,
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      dateStr: date.toISOString().split("T")[0],
      isToday: date.toDateString() === new Date().toDateString(),
    };
  });

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="bg-secondary">
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 w-40 sticky left-0 bg-secondary z-10">GUARD</th>
            {weekDays.map((wd) => (
              <th key={wd.dateStr} className={`text-center text-xs font-medium px-4 py-3 ${wd.isToday ? "text-primary bg-primary/5" : "text-muted-foreground"}`}>
                <div>{wd.day}</div>
                <div className="text-[10px] opacity-70">{wd.label}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredGuards.length === 0 ? (
            <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">No guards found for this site</td></tr>
          ) : filteredGuards.map((guard) => (
            <tr key={guard.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
              <td className="px-4 py-3 sticky left-0 bg-card z-10 border-r border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold border border-primary/20 overflow-hidden">
                    {guard.profilePhoto ? (
                      <img src={guard.profilePhoto} alt={guard.name || "Guard"} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      guard.name.split(" ").map((n) => n[0].toUpperCase()).join("")
                    )}
                  </div>
                  <span className="text-sm font-semibold text-foreground truncate">{guard.name}</span>
                </div>
              </td>
              {weekDays.map((wd) => {
                const entry = entries.find((s) => s.guard === guard.name && s.date === wd.dateStr && (filterSite === "all" || s.site === filterSite));
                return (
                  <td key={wd.dateStr} className={`px-2 py-3 text-center ${wd.isToday ? "bg-primary/5" : ""}`}>
                    {entry ? (
                      <div className="group relative mx-auto max-w-[100px]">
                        <div className={`px-2 py-2 rounded-lg text-[10px] font-bold shadow-sm border transition-all duration-200 ${
                          entry.status === "completed" ? "bg-success/10 text-success border-success/20 group-hover:opacity-20" :
                          entry.status === "in-progress" ? "bg-primary/10 text-primary border-primary/20 group-hover:opacity-20" :
                          entry.status === "missed" ? "bg-destructive/10 text-destructive border-destructive/20 group-hover:opacity-20" :
                          "bg-secondary text-muted-foreground border-border group-hover:opacity-20"
                        }`}>
                          {entry.shiftStart}–{entry.shiftEnd}
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center gap-1 z-20 transition-all duration-200">
                          <button
                            onClick={() => onEdit(entry)}
                            className="p-1 bg-card hover:bg-primary hover:text-primary-foreground border border-border rounded-md shadow-sm transition-all"
                            title="Edit Shift"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDelete(entry.id)}
                            className="p-1 bg-card hover:bg-destructive hover:text-destructive-foreground border border-border rounded-md shadow-sm transition-all"
                            title="Delete Shift"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground opacity-30">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleWeekView;
