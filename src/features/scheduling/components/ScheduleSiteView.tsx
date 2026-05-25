import { ScheduleEntry } from "@/data/dummyData";
import { MapPin, Users, Clock } from "lucide-react";

interface Props {
  entries: ScheduleEntry[];
  selectedDate: string;
  sites: any[];
}

const ScheduleSiteView = ({ entries, selectedDate, sites }: Props) => {
  const activeSites = sites.filter((s) => s.status === "active");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {activeSites.map((site) => {
        const siteShifts = entries.filter((e) => e.site === site.name && e.date === selectedDate);
        const managerName = site.Manager?.name || site.manager || "Unassigned";
        return (
          <div key={site.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate">{site.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{site.address}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{siteShifts.length} shifts</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Manager: {managerName.split(" ")[0]}</span>
            </div>
            {siteShifts.length > 0 ? (
              <div className="space-y-2">
                {siteShifts.map((shift) => (
                  <div key={shift.id} className="flex items-center justify-between px-3 py-2 bg-secondary/60 rounded-lg">
                    <span className="text-sm font-medium text-foreground">{shift.guard}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{shift.shiftStart}–{shift.shiftEnd}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${shift.status === "completed" ? "bg-success/10 text-success" :
                        shift.status === "in-progress" ? "bg-primary/10 text-primary" :
                          shift.status === "missed" ? "bg-destructive/10 text-destructive" :
                            "bg-muted text-muted-foreground"
                        }`}>
                        {shift.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-3">No shifts scheduled</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ScheduleSiteView;
