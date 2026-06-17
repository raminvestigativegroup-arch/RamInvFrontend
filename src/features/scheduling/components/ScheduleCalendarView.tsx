import { ScheduleEntry } from "@/data/dummyData";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Props {
  entries: ScheduleEntry[];
  onSelectDate: (date: string) => void;
  selectedDate: string;
}

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const ScheduleCalendarView = ({ entries, onSelectDate, selectedDate }: Props) => {
  // Use today's date as reference for initial view and "Today" marker
  const todayDate = new Date();
  const [viewDate, setViewDate] = useState(new Date());

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const getDateStr = (day: number) =>
    `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const getShiftsForDay = (day: number) =>
    entries.filter((e) => e.date === getDateStr(day));

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  
  // Pad trailing empty days to make a complete grid row
  const totalCells = Math.ceil(cells.length / 7) * 7;
  const paddingCount = totalCells - cells.length;
  for (let i = 0; i < paddingCount; i++) cells.push(null);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <button 
          onClick={handlePrevMonth}
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
        <h3 className="text-base font-semibold text-foreground">
          {months[currentMonth]} {currentYear}
        </h3>
        <button 
          onClick={handleNextMonth}
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-foreground" />
        </button>
      </div>
      <div className="grid grid-cols-7">
        {daysOfWeek.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2 border-b border-border">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-border bg-secondary/10" />;
          
          const dateStr = getDateStr(day);
          const shifts = getShiftsForDay(day);
          
          // Check if this cell is "today"
          const isToday = 
            todayDate.getDate() === day && 
            todayDate.getMonth() === currentMonth && 
            todayDate.getFullYear() === currentYear;
            
          const isSelected = dateStr === selectedDate;

          return (
            <div
              key={day}
              onClick={() => onSelectDate(dateStr)}
              className={`min-h-[100px] border-b border-r border-border p-1.5 cursor-pointer transition-all hover:bg-accent/10 ${
                isSelected ? "bg-primary/5 ring-1 ring-primary/20 ring-inset" : ""
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                  isToday ? "bg-primary text-primary-foreground font-bold" : 
                  isSelected ? "bg-primary/20 text-primary" : "text-foreground"
                }`}>
                  {day}
                </span>
                {shifts.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                )}
              </div>
              <div className="space-y-1">
                {shifts.slice(0, 3).map((s) => (
                  <div
                    key={s.id}
                    className={`text-[9px] truncate px-1.5 py-0.5 rounded-md border font-medium ${
                      s.status === "completed" ? "bg-success/10 text-success border-success/20" :
                      s.status === "in-progress" ? "bg-primary/10 text-primary border-primary/20" :
                      s.status === "missed" ? "bg-destructive/10 text-destructive border-destructive/20" :
                      "bg-secondary/50 text-muted-foreground border-border"
                    }`}
                  >
                    {s.guard.split(" ")[0]} • {s.shiftStart}–{s.shiftEnd}
                  </div>
                ))}
                {shifts.length > 3 && (
                  <span className="text-[9px] text-muted-foreground pl-1">+{shifts.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduleCalendarView;
