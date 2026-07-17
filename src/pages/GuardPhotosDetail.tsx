import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, API_BASE_URL } from "@/config/api";
import { ArrowLeft, Calendar, MapPin, Clock, Camera, Maximize2, Mail, ShieldAlert, Loader2, CheckCircle2, AlertCircle, Download, Share2 } from "lucide-react";
import StateMessage from "@/components/common/StateMessage";
import DateSelect from "@/components/common/DateSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";


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

const dataURLtoBlob = (dataurl: string): Blob => {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

const copyToClipboard = async (text: string): Promise<boolean> => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback to execCommand
    }
  }
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Fallback clipboard copy failed:", err);
    return false;
  }
};

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
  const [activePhoto, setActivePhoto] = useState<{
    url: string;
    date: string;
    time: string;
    siteName: string;
    type: string;
    latitude?: number;
    longitude?: number;
  } | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  const createWatermarkedImage = (
    imgUrl: string,
    details: {
      guardName: string;
      siteName: string;
      dateTime: string;
      gps: string;
    }
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(imgUrl);
          return;
        }

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Configure overlay text style (scaling with image size)
        const padding = Math.max(12, Math.round(canvas.width * 0.02));
        const fontSize = Math.max(14, Math.round(canvas.width * 0.025));
        ctx.font = `bold ${fontSize}px sans-serif`;

        const lines = [
          `Guard: ${details.guardName}`,
          `Location: ${details.siteName}`,
          `Date/Time: ${details.dateTime}`,
          `GPS: ${details.gps}`,
        ].filter(Boolean);

        // Calculate maximum line width
        let maxWidth = 0;
        lines.forEach((line) => {
          const width = ctx.measureText(line).width;
          if (width > maxWidth) maxWidth = width;
        });

        const lineHeight = fontSize * 1.4;
        const rectWidth = maxWidth + padding * 2;
        const rectHeight = lineHeight * lines.length + padding * 2;

        // Position: Bottom Right corner
        const rectX = canvas.width - rectWidth - padding;
        const rectY = canvas.height - rectHeight - padding;

        // Draw translucent dark background with rounded corners fallback
        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.beginPath();
        const radius = 8;
        if (ctx.roundRect) {
          ctx.roundRect(rectX, rectY, rectWidth, rectHeight, radius);
        } else {
          ctx.rect(rectX, rectY, rectWidth, rectHeight);
        }
        ctx.fill();

        // Draw text lines
        ctx.fillStyle = "#ffffff";
        ctx.textBaseline = "top";
        lines.forEach((line, index) => {
          ctx.fillText(line, rectX + padding, rectY + padding + index * lineHeight);
        });

        resolve(canvas.toDataURL("image/jpeg", 0.95));
      };
      img.onerror = () => {
        resolve(imgUrl);
      };
      img.src = imgUrl;
    });
  };

  const downloadPDF = async () => {
    if (!activePhoto) return;
    try {
      setIsDownloading(true);
      const gpsText =
        activePhoto.latitude !== undefined && activePhoto.longitude !== undefined
          ? `${activePhoto.latitude.toFixed(6)}, ${activePhoto.longitude.toFixed(6)}`
          : "N/A";

      const stampedDataUrl = await createWatermarkedImage(activePhoto.url, {
        guardName: guard?.name || "N/A",
        siteName: activePhoto.siteName,
        dateTime: `${activePhoto.date} ${activePhoto.time}`,
        gps: gpsText,
      });

      const img = new window.Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;

        const orientation = width > height ? "l" : "p";
        const pdf = new jsPDF({
          orientation: orientation,
          unit: "px",
          format: [width, height],
        });

        pdf.addImage(stampedDataUrl, "JPEG", 0, 0, width, height);
        pdf.save(
          `Audit_${(guard?.name || "Guard").replace(/\s+/g, "_")}_${activePhoto.date.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`
        );
        setIsDownloading(false);
        toast({
          title: "PDF Downloaded",
          description: "Audit photo PDF has been successfully downloaded.",
        });
      };
      img.onerror = () => {
        const pdf = new jsPDF();
        pdf.text("Clock-In Photo Audit Details", 10, 10);
        pdf.text(`Guard: ${guard?.name || "N/A"}`, 10, 20);
        pdf.text(`Location: ${activePhoto.siteName}`, 10, 30);
        pdf.text(`Date/Time: ${activePhoto.date} ${activePhoto.time}`, 10, 40);
        pdf.text(`GPS: ${gpsText}`, 10, 50);
        pdf.save(`Audit_${(guard?.name || "Guard").replace(/\s+/g, "_")}_details.pdf`);
        setIsDownloading(false);
        toast({
          title: "PDF Downloaded",
          description: "Audit photo details PDF downloaded (fallback text mode).",
        });
      };
      img.src = stampedDataUrl;
    } catch (err) {
      console.error("PDF generation failed:", err);
      setIsDownloading(false);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const sharePhoto = async () => {
    if (!activePhoto) return;
    try {
      setIsSharing(true);
      const gpsText =
        activePhoto.latitude !== undefined && activePhoto.longitude !== undefined
          ? `${activePhoto.latitude.toFixed(6)}, ${activePhoto.longitude.toFixed(6)}`
          : "N/A";

      const stampedDataUrl = await createWatermarkedImage(activePhoto.url, {
        guardName: guard?.name || "N/A",
        siteName: activePhoto.siteName,
        dateTime: `${activePhoto.date} ${activePhoto.time}`,
        gps: gpsText,
      });

      let blob: Blob;
      if (stampedDataUrl.startsWith("data:")) {
        blob = dataURLtoBlob(stampedDataUrl);
      } else {
        const res = await fetch(stampedDataUrl);
        blob = await res.blob();
      }

      const file = new File(
        [blob],
        `Audit_${(guard?.name || "Guard").replace(/\s+/g, "_")}.jpg`,
        { type: "image/jpeg" }
      );

      const shareText = `Clock-In Photo Audit:\nGuard: ${guard?.name || "N/A"}\nLocation: ${activePhoto.siteName}\nDate/Time: ${activePhoto.date} ${activePhoto.time}\nGPS: ${gpsText}\nImage Link: ${activePhoto.url}`;

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Clock-In Photo Audit",
          text: `Clock-In Photo Audit for ${guard?.name || "Guard"} at ${activePhoto.siteName} on ${activePhoto.date} ${activePhoto.time} (GPS: ${gpsText})`,
        });
        toast({
          title: "Shared Successfully",
          description: "Audit photo shared.",
        });
      } else {
        const copied = await copyToClipboard(shareText);
        if (copied) {
          toast({
            title: "Details Copied",
            description: "Audit details and image link copied to clipboard.",
          });
        } else {
          throw new Error("Clipboard copy failed");
        }
      }
    } catch (err) {
      console.error("Sharing failed:", err);
      const gpsText =
        activePhoto.latitude !== undefined && activePhoto.longitude !== undefined
          ? `${activePhoto.latitude.toFixed(6)}, ${activePhoto.longitude.toFixed(6)}`
          : "N/A";
      const shareText = `Clock-In Photo Audit:\nGuard: ${guard?.name || "N/A"}\nLocation: ${activePhoto.siteName}\nDate/Time: ${activePhoto.date} ${activePhoto.time}\nGPS: ${gpsText}\nImage Link: ${activePhoto.url}`;
      const copied = await copyToClipboard(shareText);
      if (copied) {
        toast({
          title: "Details Copied",
          description: "Audit details and image link copied to clipboard.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to share or copy details.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

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
      return d.toLocaleTimeString("en-US", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return timestamp;
    }
  };

  const formatLocalDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00Z`);
      return d.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const formatHoursMinutes = (decimalHours: number): string => {
    if (!decimalHours || decimalHours < 0) return '0h 0m';
    const totalSeconds = Math.round(decimalHours * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
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
                        <span>Worked: {formatHoursMinutes(day.totalWorkedHours)}</span>
                        {day.totalScheduledHours > 0 && (
                          <span className="text-[10px] text-muted-foreground">/ Sch: {formatHoursMinutes(day.totalScheduledHours)}</span>
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
                                          latitude: event.latitude,
                                          longitude: event.longitude,
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
            <div className="bg-slate-50 dark:bg-slate-900 px-5 py-4 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground shrink-0">
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6 shrink-0">
                  <AvatarImage src={resolveImageUrl(guard?.profilePhoto)} alt={guard?.name} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-bold">
                    {guard?.name ? getInitials(guard.name) : "G"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground leading-none">{guard?.name}</span>
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {activePhoto.latitude !== undefined && activePhoto.longitude !== undefined
                      ? `GPS: ${activePhoto.latitude.toFixed(6)}, ${activePhoto.longitude.toFixed(6)}`
                      : "No GPS Coordinates"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  onClick={downloadPDF}
                  disabled={isDownloading}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none gap-1.5 h-8 text-xs border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {isDownloading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Download PDF</span>
                </Button>

                <Button
                  onClick={sharePhoto}
                  disabled={isSharing}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none gap-1.5 h-8 text-xs border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {isSharing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5" />
                  )}
                  <span>Share</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default GuardPhotosDetail;
