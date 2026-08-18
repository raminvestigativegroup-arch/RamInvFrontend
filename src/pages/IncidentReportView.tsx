import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api } from "@/config/api";
import { Download, Printer, ArrowLeft, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { downloadIncidentReportPDF, parseRefinedReport } from "@/lib/incidentPdfGenerator";
import logoImg from "@/assets/logo.png";
import StateMessage from "@/components/common/StateMessage";
import SelectDropdown from "@/components/common/SelectDropdown";
import { formatUTCDate, formatUTCTime } from "@/lib/dateUtils";

const FieldBox = ({ label, value, className = "" }: { label: string; value: string; className?: string }) => (
  <div className={`bg-[#f4f7f9] border border-[#c8d7e6] rounded p-2 flex flex-col justify-between ${className}`}>
    <span className="text-[9px] font-bold text-[#184c78] tracking-wider uppercase leading-none">{label}</span>
    <span className="text-xs text-foreground font-semibold mt-1.5 truncate leading-tight">{value || "Select..."}</span>
  </div>
);

const CheckboxItem = ({ label, checked }: { label: string; checked: boolean }) => (
  <div className="flex items-center gap-2">
    <div className={`w-4 h-4 border border-[#184c78] rounded-sm flex items-center justify-center bg-white shrink-0`}>
      {checked && <span className="text-xs font-bold text-[#184c78] leading-none">✓</span>}
    </div>
    <span className="text-xs text-[#102c57] font-semibold leading-none">{label}</span>
  </div>
);

export default function IncidentReportView() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  const { data: incident, isLoading, isError } = useQuery({
    queryKey: ["incidents", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.incidents.getById(id);
      const data = response.data?.data || response.data?.incident || response.data?.item || response.data;
      
      // Parse dates
      let date = "N/A";
      let time = "N/A";
      if (data.time) {
        const d = new Date(data.time);
        if (!isNaN(d.getTime())) {
          date = formatUTCDate(d.toISOString());
          time = formatUTCTime(d.toISOString());
        }
      }
      
      let images: string[] = [];
      if (data.image) {
        if (typeof data.image === 'string') {
          try {
            const parsed = JSON.parse(data.image);
            if (Array.isArray(parsed)) images = parsed;
            else if (parsed) images = [String(parsed)];
          } catch (e) {
            if (data.image.startsWith('[') && data.image.endsWith(']')) {
              images = data.image.slice(1, -1).split(',').map((s: string) => s.trim().replace(/^["']|["']$/g, ''));
            } else {
              images = data.image.split(',').map((s: string) => s.trim());
            }
          }
        } else if (Array.isArray(data.image)) {
          images = data.image;
        }
      }

      // Resolve URLs
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:4001/api/v1";
      const host = apiBase.replace("/api/v1", "");
      const resolvedImages = images.map(img => {
        if (img.startsWith("data:") || img.startsWith("http:") || img.startsWith("https:")) return img;
        const cleanPath = img.replace(/\\/g, "/");
        if (cleanPath.startsWith("uploads/")) return `${host}/${cleanPath}`;
        return `${host}/uploads/${encodeURIComponent(cleanPath)}`;
      });

      return {
        id: String(data.id || data._id),
        title: String(data.incidentType || data.title || "General Incident"),
        type: String(data.incidentType || data.type || "Security"),
        site: String(data.site || "Unknown Site"),
        guard: String(data.guardId || data.guard || "Unknown Guard"),
        priority: data.priority || "medium",
        status: data.solved || data.status || "open",
        date,
        time,
        description: String(data.description || "No description provided."),
        images: resolvedImages,
        pdfUrl: data.pdfUrl || null,
        isRefinedByAdmin: Boolean(data.isRefinedByAdmin),
        guardName: data.guard ? `${data.guard.firstName || ''} ${data.guard.lastName || ''}`.trim() || data.guard.email : "Unknown Guard"
      };
    },
    enabled: !!id
  });

  const textData = useMemo(() => {
    if (!incident) return {
      reportedBy: "N/A",
      dateOfReport: "N/A",
      timeOfReport: "N/A",
      titleRole: "N/A",
      incidentNo: "N/A",
      incidentType: "N/A",
      dateOfIncident: "N/A",
      city: "N/A",
      state: "N/A",
      zipCode: "N/A",
      specificArea: "N/A",
      streetAddress: "N/A",
      incidentDesc: "N/A",
      startShift: "N/A",
      endShift: "N/A",
      bodyCam: "N",
      weather: "N/A",
      witnesses: "N/A",
      narrative: "",
      severity: "Select...",
      priority: "Select...",
      incidentTime: "N/A",
      siteName: "N/A",
      policeReport: "N",
      emsCalled: "N",
    };
    const parsed = parseRefinedReport(incident.description);
    if (!parsed.narrative || parsed.narrative.trim() === "") {
      parsed.narrative = incident.description;
    }
    if (!parsed.incidentNo || parsed.incidentNo === 'N/A') {
      parsed.incidentNo = String(incident.id).slice(-4).toUpperCase();
    }
    if (!parsed.incidentType || parsed.incidentType === 'N/A') {
      parsed.incidentType = incident.type;
    }
    if (!parsed.priority || parsed.priority === 'Select...') {
      parsed.priority = incident.priority.toUpperCase();
    }
    if (!parsed.severity || parsed.severity === 'Select...') {
      parsed.severity = incident.priority.toUpperCase();
    }
    if (!parsed.dateOfIncident || parsed.dateOfIncident === 'N/A') {
      parsed.dateOfIncident = incident.date;
    }
    if (!parsed.incidentTime || parsed.incidentTime === 'N/A') {
      parsed.incidentTime = incident.time;
    }
    if (!parsed.siteName || parsed.siteName === 'N/A') {
      parsed.siteName = incident.site;
    }
    if (!parsed.reportedBy || parsed.reportedBy === 'N/A') {
      parsed.reportedBy = incident.guardName;
    }
    return parsed;
  }, [incident]);

  const flags = useMemo(() => {
    if (!incident) return {
      bodyCam: false, cctv: false, police: false, ems: false, fire: false, weapon: false, useOfForce: false, arrest: false
    };
    const checkKeyword = (regexes: RegExp[]) => regexes.some(r => r.test(textData.narrative) || r.test(textData.incidentType) || r.test(textData.incidentDesc));
    return {
      bodyCam: textData.bodyCam === 'Y' || checkKeyword([/body\s*cam|body\s*camera/i]),
      cctv: checkKeyword([/cctv|surveillance|security\s*camera|camera\s*footage/i]),
      police: textData.policeReport === 'Y' || (checkKeyword([/police|cop|sheriff|officer|911|precinct/i]) && !checkKeyword([/security\s*officer|guard/i])),
      ems: textData.emsCalled === 'Y' || checkKeyword([/ems|ambulance|paramedic|hospital|medical/i]),
      fire: checkKeyword([/fire\s*dept|fire\s*department|fireman|firemen|smoke\s*detector|fire\s*alarm/i]),
      weapon: checkKeyword([/weapon|gun|knife|firearm|pistol|revolver/i]),
      useOfForce: checkKeyword([/use of force|taser|baton|handcuff|restrained|tackled|physical|force/i]),
      arrest: checkKeyword([/arrest|detain|detained|handcuffed|custody/i]),
    };
  }, [textData, incident]);

  const witnesses = useMemo(() => {
    const list: { name: string; role: string; contact: string; notes: string }[] = [];
    if (!textData.witnesses || textData.witnesses.toLowerCase() === 'n/a') {
      while (list.length < 4) {
        list.push({ name: "", role: "Select...", contact: "", notes: "" });
      }
      return list;
    }
    const lines = textData.witnesses.split(/[;\n]+/).map(s => s.trim()).filter(s => s.length > 0);
    for (const line of lines) {
      if (list.length >= 4) break;
      const roleMatch = line.match(/(.*?)\((.*?)\)(.*)/);
      if (roleMatch) {
        list.push({
          name: roleMatch[1].trim(),
          role: roleMatch[2].trim(),
          contact: "N/A",
          notes: roleMatch[3].replace(/^[-\s:]+/, '').trim() || "Cooperating"
        });
      } else {
        list.push({
          name: line,
          role: "Witness",
          contact: "N/A",
          notes: "Cooperating"
        });
      }
    }
    while (list.length < 4) {
      list.push({ name: "", role: "Select...", contact: "", notes: "" });
    }
    return list;
  }, [textData.witnesses]);

  const handleDownloadPdf = async () => {
    if (!incident) return;
    if (incident.pdfUrl) {
      window.open(incident.pdfUrl, '_blank');
      return;
    }
    setIsPdfGenerating(true);
    try {
      await downloadIncidentReportPDF(incident.description, incident.title, incident);
      toast({ title: "Success", description: "Official report PDF generated." });
    } catch (err) {
      toast({
        title: "Download Failed",
        description: "Could not compile the PDF report.",
        variant: "destructive"
      });
    } finally {
      setIsPdfGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
        <StateMessage type="loading" message="Loading Official Report Document..." />
      </div>
    );
  }

  if (isError || !incident) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded shadow max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Failed to Load Report</h2>
          <p className="text-sm text-muted-foreground mb-4">The request was unauthorized or the incident could not be found.</p>
          <Button onClick={() => window.close()}>Close Window</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-8 flex flex-col items-center justify-start print:bg-white print:py-0">
      
      {/* Floating Toolbar (Hidden on print) */}
      <div className="w-full max-w-[850px] mb-4 flex items-center justify-between px-4 no-print shrink-0">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => window.close()}>
          <ArrowLeft className="w-4 h-4" /> Close
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print Document
          </Button>
          <Button size="sm" className="gap-2" onClick={handleDownloadPdf} disabled={isPdfGenerating}>
            {isPdfGenerating ? (
              <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download official PDF
          </Button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="w-full max-w-[850px] bg-white shadow-xl border border-neutral-200 p-8 rounded flex flex-col space-y-6 print:shadow-none print:border-none print:p-0 print:max-w-full print:w-full">
        
        {/* Navy & Teal Official Header Banner */}
        <div className="bg-[#102c57] relative p-6 flex items-center justify-between border-b-[3px] border-[#00a8cc] rounded-t-sm">
          <div className="flex items-center gap-4">
            <div className="bg-white p-1.5 rounded-sm w-16 h-16 flex items-center justify-center shrink-0">
              <img src={logoImg} alt="RAM Logo" className="w-14 h-14 object-contain" />
            </div>
            <div>
              <h1 className="text-white text-xl font-bold tracking-wider leading-none">INCIDENT COMMAND REPORT</h1>
              <p className="text-[10px] text-[#00a8cc] font-bold tracking-widest mt-2 uppercase">SECURITY OPERATIONS / INCIDENT CONTROL / DIGITAL RECORD</p>
            </div>
          </div>
          <div className="bg-[#00a8cc] text-white px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider">
            INTAKE + NARRATIVE
          </div>
        </div>

        {/* 01 REPORT CONTROL */}
        <div>
          <div className="flex items-center justify-between border-b border-neutral-300 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="bg-[#00a8cc] text-white text-xs font-bold px-2 py-0.5 rounded-sm">01</span>
              <span className="text-sm font-bold text-[#102c57]">REPORT CONTROL</span>
            </div>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Complete all applicable fields using exact dates and times.</span>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-3">
            <FieldBox label="INCIDENT NUMBER" value={textData.incidentNo} />
            <FieldBox label="REPORT STATUS" value={incident.status.toUpperCase()} />
            <FieldBox label="DATE OF REPORT" value={textData.dateOfReport} />
            <FieldBox label="TIME OF REPORT" value={textData.timeOfReport} />
          </div>

          <div className="grid grid-cols-4 gap-3">
            <FieldBox label="REPORTED BY" value={textData.reportedBy} className="col-span-2" />
            <FieldBox label="TITLE / ROLE" value={textData.titleRole} />
            <div className="grid grid-cols-2 gap-1.5 col-span-1">
              <FieldBox label="SHIFT START" value={textData.startShift} />
              <FieldBox label="SHIFT END" value={textData.endShift} />
            </div>
          </div>
        </div>

        {/* 02 INCIDENT PROFILE */}
        <div>
          <div className="flex items-center justify-between border-b border-neutral-300 pb-2 mb-3 mt-4">
            <div className="flex items-center gap-2">
              <span className="bg-[#00a8cc] text-white text-xs font-bold px-2 py-0.5 rounded-sm">02</span>
              <span className="text-sm font-bold text-[#102c57]">INCIDENT PROFILE</span>
            </div>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Core classification, time, and location information.</span>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-3">
            <FieldBox label="INCIDENT TYPE" value={textData.incidentType} className="col-span-2" />
            <FieldBox label="SEVERITY" value={textData.severity} />
            <FieldBox label="PRIORITY" value={textData.priority} />
          </div>

          <div className="grid grid-cols-4 gap-3 mb-3">
            <FieldBox label="INCIDENT DATE" value={textData.dateOfIncident} />
            <FieldBox label="INCIDENT TIME" value={textData.incidentTime} />
            <FieldBox label="SITE / PROPERTY NAME" value={textData.siteName} />
            <FieldBox label="SPECIFIC AREA" value={textData.specificArea} />
          </div>

          <div className="grid grid-cols-4 gap-3">
            <FieldBox label="STREET ADDRESS" value={textData.streetAddress} className="col-span-2" />
            <FieldBox label="CITY" value={textData.city} />
            <div className="grid grid-cols-2 gap-1.5 col-span-1">
              <FieldBox label="STATE" value={textData.state} />
              <FieldBox label="ZIP CODE" value={textData.zipCode} />
            </div>
          </div>
        </div>

        {/* 03 SYSTEMS + RESPONSE FLAGS */}
        <div>
          <div className="flex items-center justify-between border-b border-neutral-300 pb-2 mb-3 mt-4">
            <div className="flex items-center gap-2">
              <span className="bg-[#00a8cc] text-white text-xs font-bold px-2 py-0.5 rounded-sm">03</span>
              <span className="text-sm font-bold text-[#102c57]">SYSTEMS + RESPONSE FLAGS</span>
            </div>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Select every system, service, or condition that applies.</span>
          </div>

          <div className="grid grid-cols-4 gap-4 p-4 bg-[#f4f7f9] border border-[#c8d7e6] rounded-md">
            <CheckboxItem label="Body camera used" checked={flags.bodyCam} />
            <CheckboxItem label="CCTV available" checked={flags.cctv} />
            <CheckboxItem label="Police called" checked={flags.police} />
            <CheckboxItem label="EMS called" checked={flags.ems} />
            <CheckboxItem label="Fire called" checked={flags.fire} />
            <CheckboxItem label="Weapon involved" checked={flags.weapon} />
            <CheckboxItem label="Use of force" checked={flags.useOfForce} />
            <CheckboxItem label="Arrest / detention" checked={flags.arrest} />
          </div>
        </div>

        {/* 04 PERSONS INVOLVED + WITNESSES */}
        <div>
          <div className="flex items-center justify-between border-b border-neutral-300 pb-2 mb-3 mt-4">
            <div className="flex items-center gap-2">
              <span className="bg-[#00a8cc] text-white text-xs font-bold px-2 py-0.5 rounded-sm">04</span>
              <span className="text-sm font-bold text-[#102c57]">PERSONS INVOLVED + WITNESSES</span>
            </div>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Add primary involved parties, witnesses, officers, or employees.</span>
          </div>

          <div className="border border-[#c8d7e6] rounded-md overflow-hidden bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#102c57] text-white font-bold">
                  <th className="p-2 border-b border-[#c8d7e6] font-semibold w-1/4">FULL NAME</th>
                  <th className="p-2 border-b border-[#c8d7e6] font-semibold w-1/5">ROLE</th>
                  <th className="p-2 border-b border-[#c8d7e6] font-semibold w-1/5">CONTACT / ID</th>
                  <th className="p-2 border-b border-[#c8d7e6] font-semibold w-[35%]">DISPOSITION / NOTES</th>
                </tr>
              </thead>
              <tbody>
                {witnesses.map((w, idx) => (
                  <tr key={idx} className="border-b border-[#c8d7e6] last:border-none">
                    <td className="p-1.5 bg-white">
                      <div className="border border-[#c8d7e6] rounded px-2 py-1.5 bg-[#f4f7f9] min-h-[28px] text-foreground font-medium">
                        {w.name}
                      </div>
                    </td>
                    <td className="p-1.5 bg-white">
                      <div className="border border-[#c8d7e6] rounded px-2 py-1.5 bg-[#f4f7f9] min-h-[28px] text-foreground font-medium">
                        {w.role}
                      </div>
                    </td>
                    <td className="p-1.5 bg-white">
                      <div className="border border-[#c8d7e6] rounded px-2 py-1.5 bg-[#f4f7f9] min-h-[28px] text-foreground font-medium">
                        {w.contact}
                      </div>
                    </td>
                    <td className="p-1.5 bg-white">
                      <div className="border border-[#c8d7e6] rounded px-2 py-1.5 bg-[#f4f7f9] min-h-[28px] text-foreground font-medium">
                        {w.notes}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 05 INCIDENT NARRATIVE */}
        <div>
          <div className="flex items-center justify-between border-b border-neutral-300 pb-2 mb-3 mt-4">
            <div className="flex items-center gap-2">
              <span className="bg-[#00a8cc] text-white text-xs font-bold px-2 py-0.5 rounded-sm">05</span>
              <span className="text-sm font-bold text-[#102c57]">INCIDENT NARRATIVE</span>
            </div>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Objective sequence of events: who, what, when, where, and how.</span>
          </div>

          <div className="border border-[#c8d7e6] rounded-md p-4 bg-white min-h-[120px] flex flex-col">
            <span className="text-[9px] font-bold text-[#184c78] mb-2 uppercase">NARRATIVE</span>
            <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
              {textData.narrative || "No narrative provided."}
            </p>
          </div>
        </div>

        {/* 06 ATTACHED EVIDENCE */}
        {incident.images && incident.images.length > 0 && (
          <div className="page-break-before">
            <div className="flex items-center justify-between border-b border-neutral-300 pb-2 mb-3 mt-4">
              <div className="flex items-center gap-2">
                <span className="bg-[#00a8cc] text-white text-xs font-bold px-2 py-0.5 rounded-sm">06</span>
                <span className="text-sm font-bold text-[#102c57]">ATTACHED EVIDENCE / MEDIA</span>
              </div>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Official photos attached by the reporting security officer.</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {incident.images.map((imgUrl, idx) => (
                <div key={idx} className="border border-[#c8d7e6] rounded p-2 bg-white flex flex-col items-center">
                  <a
                    href={imgUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full aspect-video rounded overflow-hidden border border-border bg-muted hover:opacity-90 transition-opacity group cursor-zoom-in"
                  >
                    <img
                      src={imgUrl}
                      alt={`Incident attachment ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </a>
                  <span className="text-[10px] text-muted-foreground mt-2 font-medium">Figure {idx + 1} - Evidence Photo</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer info (only on print/bottom) */}
        <div className="border-t border-neutral-300 pt-3 flex items-center justify-between text-[8px] text-muted-foreground font-semibold">
          <span>RAM INVESTIGATIVE GROUP INC. | CONFIDENTIAL</span>
          <span>INTAKE + NARRATIVE | PAGE 1 OF 1</span>
        </div>

      </div>

      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break-before {
            page-break-before: always;
          }
        }
      `}</style>
    </div>
  );
}
