import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, API_BASE_URL } from "@/config/api";
import { ArrowLeft, Calendar, MapPin, Clock, Camera, Maximize2, Mail, ShieldAlert, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import StateMessage from "@/components/common/StateMessage";
import DateSelect from "@/components/common/DateSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";


const resolveImageUrl = (pathOrData: string | undefined | null) => {
  if (!pathOrData) return undefined;
  if (pathOrData.startsWith("data:") || pathOrData.startsWith("http:") || pathOrData.startsWith("https:")) {
    return pathOrData;
  }
  const cleanPath = pathOrData.replace(/\\/g, "/");
  const host = API_BASE_URL.replace("/api/v1", "");
  if (cleanPath.startsWith("uploads/")) {
    return `${host}/${cleanPath}`;
  }
  return `${host}/uploads/${encodeURIComponent(cleanPath)}`;
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const GuardPhotosDetail = () => {
  const { guardId } = useParams<{ guardId: string }>();
  const navigate = useNavigate();

  // Date state - default to today
  const today = new Date();

  const formatDateStr = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const [selectedDate, setSelectedDate] = useState(formatDateStr(today));

  // Lightbox Zoom state
  const [activePhoto, setActivePhoto] = useState<{ url: string; date: string; time: string; siteName: string; type: string } | null>(null);

  // Query details
  const {
    data: attendanceDetails,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["guard-attendance-details", guardId, selectedDate],
    queryFn: async () => {
      if (!guardId) throw new Error("Guard ID is required");
      const response = await api.attendance.getDetails({
        guardId,
        date: selectedDate,
      });
      return response.data;
    },
    enabled: !!guardId,
  });

  const guard = attendanceDetails?.guard || null;
  const results = attendanceDetails?.details || [];

  const formatEventTime = (timestamp: string) => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return timestamp;
    }
  };

  const formatLocalDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="module-page-header">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/guard-photos")}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none shrink-0"
            title="Back to directory"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500 hover:text-slate-700" />
          </button>
          <div>
            <h1 className="module-page-title">Attendance Timeline & Photos</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review daily check-ins, locations, and uploaded verification photos.
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-foreground">Select Date:</span>
          </div>
          <div className="flex items-center gap-2">
            <DateSelect
              value={selectedDate}
              onChange={(val) => setSelectedDate(val || formatDateStr(today))}
              className="h-[38px] text-xs w-[150px] md:w-[180px]"
            />
          </div>
        </div>
      </div>

      {/* Guard profile header summary */}
      {guard && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14 border border-border">
              <AvatarImage src={resolveImageUrl(guard.profilePhoto)} alt={guard.name} className="object-cover" />
              <AvatarFallback className="bg-primary/5 text-primary text-base font-bold flex items-center justify-center h-full w-full">
                {getInitials(guard.name)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-foreground leading-snug">{guard.name}</h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="w-3.5 h-3.5" />
                <span>{guard.email}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 border-t md:border-t-0 border-border/60 pt-4 md:pt-0">
            <div className="bg-secondary/40 border border-border/50 rounded-lg px-4 py-2 text-center min-w-[100px]">
              <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Total Shifts</span>
              <span className="text-lg font-bold text-foreground mt-0.5 block">{results.length}</span>
            </div>
            <div className="bg-secondary/40 border border-border/50 rounded-lg px-4 py-2 text-center min-w-[100px]">
              <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-bold">With Photo</span>
              <span className="text-lg font-bold text-primary mt-0.5 block">
                {results.reduce((count, r) => count + (r.events?.some((e: any) => e.image) ? 1 : 0), 0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Content */}
      {isLoading && (
        <StateMessage type="loading" message="Loading detailed timeline logs..." />
      )}

      {isError && (
        <StateMessage
          type="error"
          title="Timeline Loading Failed"
          message={error instanceof Error ? error.message : "Error retrieving attendance history."}
        />
      )}

      {!isLoading && !isError && results.length === 0 && (
        <StateMessage
          type="empty"
          title="No Attendance History Found"
          message="No check-ins or scheduling events are recorded for the selected date range."
          icon={Camera}
        />
      )}

      {!isLoading && !isError && results.length > 0 && (
        <div className="space-y-6">
          {results.map((day: any, dayIdx: number) => {
            const hasPhotos = day.events?.some((e: any) => e.image);
            return (
              <div
                key={`${day.date}-${dayIdx}`}
                className="bg-card border border-border rounded-xl shadow-xs overflow-hidden"
              >
                {/* Day Header Bar */}
                <div className="bg-slate-50 dark:bg-slate-900 px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {formatLocalDate(day.date)}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[200px] sm:max-w-xs">{day.siteName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={day.status === "completed" ? "success" : day.status === "in-progress" ? "warning" : "inactive"}>
                      {day.status === "completed" ? "Completed" : day.status === "in-progress" ? "On Shift" : day.status}
                    </Badge>

                    {day.totalWorkedHours !== undefined && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-secondary/80 px-2 py-1 rounded-md">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Worked: {day.totalWorkedHours}h</span>
                        {day.totalScheduledHours > 0 && (
                          <span className="text-[10px] text-muted-foreground">/ Sch: {day.totalScheduledHours}h</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Day content timeline */}
                <div className="p-5">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Events list timeline */}
                    <div className="lg:col-span-2 space-y-5 relative pl-4 border-l border-border/80 ml-2">
                      {day.events && day.events.length > 0 ? (
                        day.events.map((event: any, evIdx: number) => {
                          const isClockIn = event.type.toLowerCase().includes("in");
                          const photoUrl = resolveImageUrl(event.image);

                          return (
                            <div key={`${event.time}-${evIdx}`} className="relative group">
                              {/* Node indicator */}
                              <div className={`absolute -left-[22px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-card ${isClockIn ? "bg-primary border-primary-hover" : "bg-destructive border-destructive/80"
                                }`} />

                              <div className="space-y-2">
                                <div className="flex items-center gap-2.5">
                                  <span className="text-xs font-bold text-foreground">{event.type}</span>
                                  <span className="text-[10px] font-semibold text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">
                                    {formatEventTime(event.time)}
                                  </span>
                                </div>

                                {event.latitude && event.longitude && (
                                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>GPS: {event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}</span>
                                  </p>
                                )}

                                {/* Render Verification Photo inline inside the timeline */}
                                {isClockIn && photoUrl && (
                                  <div className="mt-2.5 max-w-sm rounded-lg overflow-hidden border border-border group relative aspect-[4/3] bg-secondary/40">
                                    <img
                                      src={photoUrl}
                                      alt="Clock-in proof"
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                    <div
                                      onClick={() =>
                                        setActivePhoto({
                                          url: photoUrl,
                                          date: formatLocalDate(day.date),
                                          time: formatEventTime(event.time),
                                          siteName: day.siteName,
                                          type: event.type,
                                        })
                                      }
                                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    >
                                      <div className="flex items-center gap-1 bg-white/95 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                                        <Maximize2 className="w-3.5 h-3.5" />
                                        <span>Enlarge Photo</span>
                                      </div>
                                    </div>
                                  </div>
                                )}


                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No events logged.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal Dialog */}
      <Dialog open={!!activePhoto} onOpenChange={(open) => { if (!open) setActivePhoto(null); }}>
        {activePhoto && (
          <DialogContent className="max-w-2xl bg-card border border-border/80 flex flex-col max-h-[90vh] p-0">
            {/* Modal Header */}
            <DialogHeader className="px-5 py-4 border-b border-border/80">
              <DialogTitle className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-primary" />
                <span>Clock-In Photo Audit</span>
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                {activePhoto.siteName} • {activePhoto.date} at {activePhoto.time}
              </DialogDescription>
            </DialogHeader>

            {/* Modal Photo Body */}
            <DialogBody className="flex-1 bg-slate-950 overflow-hidden flex items-center justify-center p-2 min-h-0">
              <img
                src={activePhoto.url}
                alt="Audit Zoom"
                className="max-h-[60vh] max-w-full object-contain"
              />
            </DialogBody>

            {/* Modal Footer info */}
            <div className="bg-slate-50 dark:bg-slate-900 px-5 py-4 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground shrink-0">
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6 shrink-0">
                  <AvatarImage src={resolveImageUrl(guard?.profilePhoto)} alt={guard?.name} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-bold">
                    {guard?.name ? getInitials(guard.name) : "G"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">{guard?.name}</span>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default GuardPhotosDetail;
