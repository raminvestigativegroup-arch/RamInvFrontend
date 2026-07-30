/**
 * RAM Investigative Group — Incident Report PDF Generator
 * Reproduces the exact official report format shown in the company template.
 */
import { jsPDF } from 'jspdf';

// ─── Colour palette (matching the RAM template) ─────────────────────────────
const RAM_BLUE     = [24, 76, 120] as const;    // Underlined labels color
const DARK_NAVY    = [16, 44, 87] as const;     // Section banner backgrounds
const BORDER_COLOR = [180, 200, 220] as const;  // Box borders / dividers
const BOX_BG       = [235, 242, 250] as const;  // Light blue-grey background shade
const BLACK        = [0, 0, 0] as const;
const WHITE        = [255, 255, 255] as const;

// ─── Typography ──────────────────────────────────────────────────────────────
const FONT_NORMAL  = 'helvetica';
const FONT_BOLD    = 'helvetica';
const PAGE_W       = 210;  // A4 mm width
const PAGE_H       = 297;  // A4 mm height
const MARGIN_L     = 14;
const MARGIN_R     = PAGE_W - 14;
const CONTENT_W    = MARGIN_R - MARGIN_L;

interface ParsedReport {
  reportedBy:       string;
  dateOfReport:     string;
  titleRole:        string;
  incidentNo:       string;
  incidentType:     string;
  dateOfIncident:   string;
  city:             string;
  state:            string;
  zipCode:          string;
  specificArea:     string;
  incidentDesc:     string;
  startShift:       string;
  endShift:         string;
  bodyCam:          string;
  weather:          string;
  witnesses:        string;
  narrative:        string;
  policeReport:     string;
  timeOfCall:       string;
  caseNo:           string;
  emsCalled:        string;
  reportingOfficer: string;
  postNarrative:    string;
  followUp:         string;
}

// ─── Parse the refined text returned from backend ────────────────────────────
function extractField(text: string, label: string, fallback = 'N/A'): string {
  // Matches the label, colon, then non-greedily captures content.
  // Stops matching if it sees 2 or more spaces followed by any uppercase/alphanumeric characters and a colon (indicating next field on the same line), or a newline, or end of string.
  const regex = new RegExp(`${label}\\s*:\\s*(.*?)(?=\\s{2,}[A-Za-z0-9/\\s()]+:|\\n|$)`, 'i');
  const m = text.match(regex);
  return m ? m[1].trim() : fallback;
}

function extractNarrative(text: string, sectionLabel: string): string {
  const regex = new RegExp(`${sectionLabel}\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*\\n\\s*[A-Z ]{4,}:|$)`, 'i');
  const m = text.match(regex);
  return m ? m[1].trim() : '';
}

export function parseRefinedReport(refined: string): ParsedReport {
  const postOpIndex = refined.search(/POST\s+OP\s+REPORT/i);
  const mainPart = postOpIndex >= 0 ? refined.slice(0, postOpIndex) : refined;
  const postPart = postOpIndex >= 0 ? refined.slice(postOpIndex) : '';

  return {
    reportedBy:       extractField(mainPart, 'REPORTED BY'),
    dateOfReport:     extractField(mainPart, 'DATE OF REPORT'),
    titleRole:        extractField(mainPart, 'TITLE / ROLE', 'Security Officer'),
    incidentNo:       extractField(mainPart, 'INCIDENT NO'),
    incidentType:     extractField(mainPart, 'INCIDENT TYPE'),
    dateOfIncident:   extractField(mainPart, 'DATE OF INCIDENT'),
    city:             extractField(mainPart, 'CITY'),
    state:            extractField(mainPart, 'STATE'),
    zipCode:          extractField(mainPart, 'ZIP CODE'),
    specificArea:     extractField(mainPart, 'SPECIFIC AREA OF LOCATION \\(if applicable\\)'),
    incidentDesc:     extractField(mainPart, 'Incident Description'),
    startShift:       extractField(mainPart, 'Start of Shift Time'),
    endShift:         extractField(mainPart, 'End of Shift Time', 'N/G'),
    bodyCam:          extractField(mainPart, 'Body Cam Used \\(Y\\/N\\)', 'N'),
    weather:          extractField(mainPart, 'Weather', 'N/A'),
    witnesses:        extractField(mainPart, 'Witnesses \\/ Persons Involved', 'N/A'),
    narrative:        extractNarrative(mainPart, 'Narrative'),
    policeReport:     extractField(postPart, 'Police Report Filed \\(Y\\/N\\)', 'N'),
    timeOfCall:       extractField(postPart, 'Time of Call', 'N/G'),
    caseNo:           extractField(postPart, 'Case #', 'N/A'),
    emsCalled:        extractField(postPart, 'EMS Called \\(Y\\/N\\)', 'N'),
    reportingOfficer: extractField(postPart, 'Reporting Officer', 'N/A'),
    postNarrative:    extractNarrative(postPart, 'Narrative'),
    followUp:         extractField(postPart, 'Follow-Up Action', '.'),
  };
}

// ─── Helper: Draw Underlined Label and Value next to it ─────────────────────
function drawMetaField(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  align: 'left' | 'right' = 'left',
  widthConstraint?: number
) {
  doc.setFont(FONT_BOLD, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...RAM_BLUE);

  const labelW = doc.getTextWidth(label + " ");
  
  doc.setFont(FONT_NORMAL, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...BLACK);
  const valW = doc.getTextWidth(value);

  const totalW = labelW + valW;
  const startX = align === 'left' ? x : x - totalW;

  // Draw Label (blue)
  doc.setFont(FONT_BOLD, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...RAM_BLUE);
  doc.text(label, startX, y);

  // Draw underline for label
  const lineY = y + 1;
  doc.setDrawColor(...RAM_BLUE);
  doc.setLineWidth(0.3);
  doc.line(startX, lineY, startX + labelW - 1, lineY);

  // Draw Value (black)
  doc.setFont(FONT_NORMAL, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...BLACK);
  
  if (widthConstraint) {
    const lines = doc.splitTextToSize(value, widthConstraint - labelW);
    doc.text(lines, startX + labelW, y);
  } else {
    doc.text(value, startX + labelW, y);
  }
}

// ─── Helper: draw a filled navy banner with white centered text ─────────────
function drawSectionBanner(doc: jsPDF, y: number, label: string): number {
  doc.setFillColor(...DARK_NAVY);
  doc.rect(MARGIN_L, y, CONTENT_W, 6, 'F');
  
  doc.setFont(FONT_BOLD, 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...WHITE);
  doc.text(label, PAGE_W / 2, y + 4.2, { align: 'center' });
  
  return y + 6;
}

// ─── Helper: start/draw boxed container (light blue bg with border) ──────────
function drawContainerBox(
  doc: jsPDF,
  y: number,
  h: number
) {
  doc.setFillColor(...BOX_BG);
  doc.rect(MARGIN_L, y, CONTENT_W, h, 'F');
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.4);
  doc.rect(MARGIN_L, y, CONTENT_W, h, 'S');
}

// ─── Helper: Draw horizontal line inside box ─────────────────────────
function drawBoxDivider(doc: jsPDF, y: number) {
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_L, y, MARGIN_R, y);
}

// ─── Main export ─────────────────────────────────────────────────────────────
export async function downloadIncidentReportPDF(
  refinedText: string,
  incidentTitle: string
) {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const data = parseRefinedReport(refinedText);

  // ── 1. CENTERED CIRCULAR RAM LOGO ──────────────────────────────────────────
  let logoLoaded = false;
  try {
    const logoResp = await fetch('/src/assets/logo.png');
    if (logoResp.ok) {
      const blob   = await logoResp.blob();
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      const logoSize = 38; // Size in mm
      const logoX = (PAGE_W - logoSize) / 2;
      doc.addImage(dataUrl, 'PNG', logoX, 8, logoSize, logoSize);
      logoLoaded = true;
    }
  } catch (err) {
    console.error('Failed to load logo:', err);
  }

  // Fallback if logo not loaded
  if (!logoLoaded) {
    doc.setFont(FONT_BOLD, 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...RAM_BLUE);
    doc.text('RAM', PAGE_W / 2, 25, { align: 'center' });
    doc.setFontSize(9);
    doc.text('Investigative Group Inc.', PAGE_W / 2, 31, { align: 'center' });
  }

  let y = 52;

  // ── 2. METADATA SECTION BELOW LOGO ─────────────────────────────────────────
  drawMetaField(doc, 'REPORTED BY:', data.reportedBy, MARGIN_L, y, 'left');
  drawMetaField(doc, 'DATE OF REPORT:', data.dateOfReport, MARGIN_R, y, 'right');
  y += 7;

  drawMetaField(doc, 'TITLE / ROLE:', data.titleRole, MARGIN_L, y, 'left');
  drawMetaField(doc, 'INCIDENT NO:', data.incidentNo, MARGIN_R, y, 'right');
  y += 10;

  // ── 3. INCIDENT INFORMATION BANNER ─────────────────────────────────────────
  y = drawSectionBanner(doc, y, 'INCIDENT INFORMATION');
  y += 4;

  // Meta fields inside Incident Information
  drawMetaField(doc, 'INCIDENT TYPE:', data.incidentType, MARGIN_L, y, 'left');
  drawMetaField(doc, 'DATE OF INCIDENT:', data.dateOfIncident, MARGIN_R, y, 'right');
  y += 7;

  // City / State / Zip row
  const colW3 = CONTENT_W / 3;
  drawMetaField(doc, 'CITY:', data.city, MARGIN_L, y, 'left');
  drawMetaField(doc, 'STATE:', data.state, MARGIN_L + colW3, y, 'left');
  drawMetaField(doc, 'ZIP CODE:', data.zipCode, MARGIN_L + colW3 * 2, y, 'left');
  y += 7;

  drawMetaField(doc, 'SPECIFIC AREA OF LOCATION (if applicable):', data.specificArea, MARGIN_L, y, 'left');
  y += 8;

  // ── 4. MAIN INCIDENT DETAIL CONTAINER ──────────────────────────────────────
  // We need to calculate container height before drawing it so it wraps narrative
  const lh = 4.5;
  const descLines = doc.splitTextToSize(`Incident Description: ${data.incidentDesc}`, CONTENT_W - 8);
  const descH = Math.max(8, descLines.length * 4.5 + 3);

  const witnessesLines = doc.splitTextToSize(data.witnesses, CONTENT_W - 8);
  const witnessesH = Math.max(8, witnessesLines.length * 4.5 + 6);

  const narrativeLines = doc.splitTextToSize(data.narrative, CONTENT_W - 8);
  const narrativeH = Math.max(20, narrativeLines.length * lh + 8);

  const containerH = descH + 8 + 8 + 8 + witnessesH + narrativeH;

  // Draw main box
  drawContainerBox(doc, y, containerH);

  let currentBoxY = y;

  // Row 1: Incident Description
  doc.setFont(FONT_NORMAL, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...BLACK);
  doc.text(descLines, MARGIN_L + 4, currentBoxY + 5.5);
  currentBoxY += descH;
  drawBoxDivider(doc, currentBoxY);

  // Row 2: Date of Report | Start of Shift Time | End of Shift Time
  doc.setFont(FONT_NORMAL, 'normal');
  doc.setFontSize(8);
  
  // Columns
  const innerW3 = (CONTENT_W) / 3;
  doc.text(`Date of Report: ${data.dateOfReport}`, MARGIN_L + 4, currentBoxY + 5.5);
  doc.text(`Start of Shift Time: ${data.startShift}`, MARGIN_L + innerW3 + 4, currentBoxY + 5.5);
  doc.text(`End of Shift Time: ${data.endShift}`, MARGIN_L + innerW3 * 2 + 4, currentBoxY + 5.5);
  
  // Vertical dividers
  doc.setDrawColor(...BORDER_COLOR);
  doc.line(MARGIN_L + innerW3, currentBoxY, MARGIN_L + innerW3, currentBoxY + 8);
  doc.line(MARGIN_L + innerW3 * 2, currentBoxY, MARGIN_L + innerW3 * 2, currentBoxY + 8);

  currentBoxY += 8;
  drawBoxDivider(doc, currentBoxY);

  // Row 3: Body Cam Used | Weather
  const innerW2 = CONTENT_W / 2;
  doc.text(`Body Cam Used (Y/N): ${data.bodyCam}`, MARGIN_L + 4, currentBoxY + 5.5);
  doc.text(`Weather: ${data.weather}`, MARGIN_L + innerW2 + 4, currentBoxY + 5.5);
  doc.line(MARGIN_L + innerW2, currentBoxY, MARGIN_L + innerW2, currentBoxY + 8);

  currentBoxY += 8;
  drawBoxDivider(doc, currentBoxY);

  // Row 4: Witnesses / Persons Involved
  doc.setFont(FONT_BOLD, 'bold');
  doc.text('Witnesses / Persons Involved:', MARGIN_L + 4, currentBoxY + 4.5);
  doc.setFont(FONT_NORMAL, 'normal');
  doc.text(witnessesLines, MARGIN_L + 4, currentBoxY + 9);
  
  currentBoxY += witnessesH;
  drawBoxDivider(doc, currentBoxY);

  // Row 5: Narrative
  doc.setFont(FONT_BOLD, 'bold');
  doc.text('Narrative:', MARGIN_L + 4, currentBoxY + 4.5);
  doc.setFont(FONT_NORMAL, 'normal');
  doc.text(narrativeLines, MARGIN_L + 4, currentBoxY + 9);

  y += containerH + 10;

  // ── 5. FOOTER ON ALL PAGES ──────────────────────────────────────────────────
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont(FONT_NORMAL, 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `RAM Investigative Group Inc. — Confidential Incident Report — Page ${i} of ${pageCount}`,
      PAGE_W / 2,
      PAGE_H - 6,
      { align: 'center' }
    );
  }

  // ── 7. SAVE FILE ────────────────────────────────────────────────────────────
  const safeName = incidentTitle.replace(/[^a-z0-9_\-]/gi, '_').toLowerCase();
  doc.save(`incident_report_${safeName}_${data.dateOfReport.replace(/\./g, '')}.pdf`);
}
