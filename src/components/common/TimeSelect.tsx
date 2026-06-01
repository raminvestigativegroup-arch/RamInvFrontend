import React, { useEffect, useRef } from "react";
import { Clock } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TimeSelectProps {
  value: string; // "HH:MM" 24h format
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const periods = ["AM", "PM"];

const TimeSelect: React.FC<TimeSelectProps> = ({
  value = "06:00",
  onChange,
  className = "",
  disabled = false,
}) => {
  // Parse initial 24h format to 12h components
  const parse24to12 = (timeString: string) => {
    const [hourStr, minuteStr] = (timeString || "06:00").split(":");
    let hour = parseInt(hourStr || "6", 10);
    const minute = minuteStr || "00";
    const ampm = hour >= 12 ? "PM" : "AM";
    
    hour = hour % 12;
    hour = hour ? hour : 12; // 0 becomes 12
    return {
      hour: String(hour).padStart(2, "0"),
      minute,
      ampm,
    };
  };

  const { hour: currentHour, minute: currentMinute, ampm: currentAmpm } = parse24to12(value);

  const format12to24 = (h: string, m: string, period: string) => {
    let hr = parseInt(h, 10);
    if (period === "PM" && hr < 12) hr += 12;
    if (period === "AM" && hr === 12) hr = 0;
    return `${String(hr).padStart(2, "0")}:${m}`;
  };

  const handleSelectHour = (h: string) => {
    onChange(format12to24(h, currentMinute, currentAmpm));
  };

  const handleSelectMinute = (m: string) => {
    onChange(format12to24(currentHour, m, currentAmpm));
  };

  const handleSelectPeriod = (period: string) => {
    onChange(format12to24(currentHour, currentMinute, period));
  };

  const displayTime = `${currentHour}:${currentMinute} ${currentAmpm}`;

  // Refs for scrolling selected items into view
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  const scrollSelectedIntoView = () => {
    const activeHourEl = hourRef.current?.querySelector("[data-active='true']");
    if (activeHourEl) {
      activeHourEl.scrollIntoView({ block: "center", behavior: "auto" });
    }
    const activeMinuteEl = minuteRef.current?.querySelector("[data-active='true']");
    if (activeMinuteEl) {
      activeMinuteEl.scrollIntoView({ block: "center", behavior: "auto" });
    }
  };

  // Center the active items whenever they change
  useEffect(() => {
    scrollSelectedIntoView();
  }, [currentHour, currentMinute]);

  // Wheel scroll event handlers
  const handleHourWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const direction = e.deltaY > 0 ? 1 : -1;
    const currentIndex = hours.indexOf(currentHour);
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = hours.length - 1;
    if (nextIndex >= hours.length) nextIndex = 0;
    handleSelectHour(hours[nextIndex]);
  };

  const handleMinuteWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const direction = e.deltaY > 0 ? 1 : -1;
    const currentIndex = minutes.indexOf(currentMinute);
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = minutes.length - 1;
    if (nextIndex >= minutes.length) nextIndex = 0;
    handleSelectMinute(minutes[nextIndex]);
  };

  const handlePeriodWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const direction = e.deltaY > 0 ? 1 : -1;
    const currentIndex = periods.indexOf(currentAmpm);
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = periods.length - 1;
    if (nextIndex >= periods.length) nextIndex = 0;
    handleSelectPeriod(periods[nextIndex]);
  };

  return (
    <Popover onOpenChange={(open) => open && setTimeout(scrollSelectedIntoView, 50)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex items-center justify-between w-full h-[38px] px-3 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed select-none transition-colors",
            className
          )}
        >
          <span>{displayTime}</span>
          <Clock className="w-4 h-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-2 bg-popover border border-border rounded-lg shadow-lg z-50">
        <div className="grid grid-cols-3 gap-1 h-56 text-center select-none">
          {/* Hours Column */}
          <div 
            ref={hourRef} 
            onWheel={handleHourWheel}
            className="flex flex-col overflow-y-auto scrollbar-none border-r border-border pr-1 cursor-ns-resize"
          >
            <span className="text-[10px] uppercase font-semibold text-muted-foreground mb-1 select-none sticky top-0 bg-popover py-1">Hour</span>
            {hours.map((h) => {
              const isActive = h === currentHour;
              return (
                <button
                  key={h}
                  type="button"
                  data-active={isActive}
                  onClick={() => handleSelectHour(h)}
                  className={cn(
                    "py-1.5 text-sm rounded transition-colors font-medium mb-0.5 shrink-0",
                    isActive
                      ? "bg-primary text-primary-foreground font-bold"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {h}
                </button>
              );
            })}
          </div>

          {/* Minutes Column */}
          <div 
            ref={minuteRef} 
            onWheel={handleMinuteWheel}
            className="flex flex-col overflow-y-auto scrollbar-none border-r border-border px-1 cursor-ns-resize"
          >
            <span className="text-[10px] uppercase font-semibold text-muted-foreground mb-1 select-none sticky top-0 bg-popover py-1">Minute</span>
            {minutes.map((m) => {
              const isActive = m === currentMinute;
              return (
                <button
                  key={m}
                  type="button"
                  data-active={isActive}
                  onClick={() => handleSelectMinute(m)}
                  className={cn(
                    "py-1.5 text-sm rounded transition-colors font-medium mb-0.5 shrink-0",
                    isActive
                      ? "bg-primary text-primary-foreground font-bold"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Period Column (AM/PM) */}
          <div 
            onWheel={handlePeriodWheel}
            className="flex flex-col overflow-y-auto scrollbar-none pl-1 cursor-ns-resize"
          >
            <span className="text-[10px] uppercase font-semibold text-muted-foreground mb-1 select-none sticky top-0 bg-popover py-1">Period</span>
            {periods.map((p) => {
              const isActive = p === currentAmpm;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSelectPeriod(p)}
                  className={cn(
                    "py-1.5 text-sm rounded transition-colors font-medium mb-0.5 shrink-0",
                    isActive
                      ? "bg-primary text-primary-foreground font-bold"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TimeSelect;
