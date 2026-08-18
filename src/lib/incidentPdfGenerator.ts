/**
 * RAM Investigative Group — Incident Report PDF Generator
 * Reproduces the exact official report format shown in the company template.
 */
import { jsPDF } from 'jspdf';

// ─── Color Palette (matching the RAM template) ─────────────────────────────
const RAM_BLUE     = [24, 76, 120] as const;    // Label color
const DARK_NAVY    = [16, 44, 87] as const;     // Header background
const BORDER_COLOR = [200, 215, 230] as const;  // Box borders / dividers
const TEAL         = [0, 168, 204] as const;    // Teal accent / pills
const BLACK        = [0, 0, 0] as const;
const WHITE        = [255, 255, 255] as const;
const BOX_BG       = [244, 247, 249] as const;  // Very light grey/blue

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
  timeOfReport:     string;
  titleRole:        string;
  incidentNo:       string;
  incidentType:     string;
  dateOfIncident:   string;
  city:             string;
  state:            string;
  zipCode:          string;
  specificArea:     string;
  streetAddress:    string;
  incidentDesc:     string;
  startShift:       string;
  endShift:         string;
  bodyCam:          string;
  weather:          string;
  witnesses:        string;
  narrative:        string;
  severity:         string;
  priority:         string;
  incidentTime:     string;
  siteName:         string;
  policeReport:     string;
  emsCalled:        string;
}

interface WitnessRow {
  name: string;
  role: string;
  contact: string;
  notes: string;
}

// Helper: Convert URL to base64 via fetch
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Failed to fetch image as base64:', url, err);
    return null;
  }
}

// ─── Parse the refined text ────────────────────────────
function extractField(text: string, label: string, fallback = 'N/A'): string {
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

  const dateOfIncident = extractField(mainPart, 'DATE OF INCIDENT');
  const incidentTime = extractField(mainPart, 'INCIDENT TIME', extractField(mainPart, 'TIME OF INCIDENT', 'N/A'));

  return {
    reportedBy:       extractField(mainPart, 'REPORTED BY'),
    dateOfReport:     extractField(mainPart, 'DATE OF REPORT'),
    timeOfReport:     extractField(mainPart, 'TIME OF REPORT', 'N/A'),
    titleRole:        extractField(mainPart, 'TITLE / ROLE', 'Security Officer'),
    incidentNo:       extractField(mainPart, 'INCIDENT NO'),
    incidentType:     extractField(mainPart, 'INCIDENT TYPE'),
    dateOfIncident,
    city:             extractField(mainPart, 'CITY'),
    state:            extractField(mainPart, 'STATE'),
    zipCode:          extractField(mainPart, 'ZIP CODE'),
    specificArea:     extractField(mainPart, 'SPECIFIC AREA OF LOCATION \\(if applicable\\)', extractField(mainPart, 'SPECIFIC AREA', 'N/A')),
    streetAddress:    extractField(mainPart, 'STREET ADDRESS', 'N/A'),
    incidentDesc:     extractField(mainPart, 'Incident Description'),
    startShift:       extractField(mainPart, 'Start of Shift Time', extractField(mainPart, 'SHIFT START', 'N/A')),
    endShift:         extractField(mainPart, 'End of Shift Time', extractField(mainPart, 'SHIFT END', 'N/G')),
    bodyCam:          extractField(mainPart, 'Body Cam Used \\(Y\\/N\\)', 'N'),
    weather:          extractField(mainPart, 'Weather', 'N/A'),
    witnesses:        extractField(mainPart, 'Witnesses \\/ Persons Involved', 'N/A'),
    narrative:        extractNarrative(mainPart, 'Narrative'),
    severity:         extractField(mainPart, 'SEVERITY', 'Select...'),
    priority:         extractField(mainPart, 'PRIORITY', 'Select...'),
    incidentTime,
    siteName:         extractField(mainPart, 'SITE / PROPERTY NAME', 'N/A'),
    policeReport:     extractField(postPart, 'Police Report Filed \\(Y\\/N\\)', 'N'),
    emsCalled:        extractField(postPart, 'EMS Called \\(Y\\/N\\)', 'N'),
  };
}

function parseWitnesses(witnessesText: string): WitnessRow[] {
  const list: WitnessRow[] = [];
  if (!witnessesText || witnessesText.toLowerCase() === 'n/a') {
    while (list.length < 4) {
      list.push({ name: '', role: 'Select...', contact: '', notes: '' });
    }
    return list;
  }

  const lines = witnessesText.split(/[;\n]+/).map(s => s.trim()).filter(s => s.length > 0);
  for (const line of lines) {
    if (list.length >= 4) break;
    const roleMatch = line.match(/(.*?)\((.*?)\)(.*)/);
    if (roleMatch) {
      list.push({
        name: roleMatch[1].trim(),
        role: roleMatch[2].trim(),
        contact: 'N/A',
        notes: roleMatch[3].replace(/^[-\s:]+/, '').trim() || 'Cooperating'
      });
    } else {
      list.push({
        name: line,
        role: 'Witness',
        contact: 'N/A',
        notes: 'Cooperating'
      });
    }
  }

  while (list.length < 4) {
    list.push({ name: '', role: 'Select...', contact: '', notes: '' });
  }
  return list;
}

function parseFlags(narrative: string, data: ParsedReport) {
  const checkKeyword = (regexes: RegExp[]) => regexes.some(r => r.test(narrative) || r.test(data.incidentType) || r.test(data.incidentDesc));

  return {
    bodyCam: data.bodyCam === 'Y' || checkKeyword([/body\s*cam|body\s*camera/i]),
    cctv: checkKeyword([/cctv|surveillance|security\s*camera|camera\s*footage/i]),
    police: data.policeReport === 'Y' || (checkKeyword([/police|cop|sheriff|officer|911|precinct/i]) && !checkKeyword([/security\s*officer|guard/i])),
    ems: data.emsCalled === 'Y' || checkKeyword([/ems|ambulance|paramedic|hospital|medical/i]),
    fire: checkKeyword([/fire\s*dept|fire\s*department|fireman|firemen|smoke\s*detector|fire\s*alarm/i]),
    weapon: checkKeyword([/weapon|gun|knife|firearm|pistol|revolver/i]),
    useOfForce: checkKeyword([/use of force|taser|baton|handcuff|restrained|tackled|physical|force/i]),
    arrest: checkKeyword([/arrest|detain|detained|handcuffed|custody/i]),
  };
}

// ─── Helper: Draw Section Header ─────────────────────────────────────────────
function drawSectionHeader(doc: jsPDF, y: number, num: string, title: string, subtitle: string): number {
  // Draw teal number pill
  doc.setFillColor(...TEAL);
  doc.roundedRect(MARGIN_L, y, 8, 5.5, 1, 1, 'F');
  
  doc.setFont(FONT_BOLD, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text(num, MARGIN_L + 4, y + 3.8, { align: 'center' });

  // Section Title
  doc.setFont(FONT_BOLD, 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...DARK_NAVY);
  doc.text(title, MARGIN_L + 10, y + 4.2);

  // Subtitle
  doc.setFont(FONT_NORMAL, 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(120, 130, 140);
  doc.text(subtitle, MARGIN_R, y + 4.2, { align: 'right' });

  return y + 7.5;
}

// ─── Helper: Draw Inset Form Fields Row ───────────────────────────────────────
function drawFieldsRow(doc: jsPDF, y: number, fields: { label: string; value: string }[], colWidths: number[]): number {
  let currentX = MARGIN_L;
  for (let i = 0; i < fields.length; i++) {
    const w = colWidths[i];
    const field = fields[i];

    // Background box
    doc.setFillColor(...WHITE);
    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.25);
    doc.roundedRect(currentX, y, w - 2, 8.5, 0.8, 0.8, 'FD');

    // Label
    doc.setFont(FONT_BOLD, 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(...RAM_BLUE);
    doc.text(field.label, currentX + 2, y + 2.5);

    // Value
    doc.setFont(FONT_NORMAL, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...BLACK);
    const cleanValue = field.value && field.value !== 'N/A' && field.value !== 'undefined' ? field.value : 'Select...';
    doc.text(cleanValue, currentX + 2, y + 6.8);

    currentX += w;
  }
  return y + 10.5;
}

// ─── Header & Footer Painting function ───────────────────────────────────────
function drawHeaderAndFooter(doc: jsPDF, pageNum: number, totalPages: number, logoDataUrl: string | null) {
  // 1. Top teal thin bar
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, PAGE_W, 1.5, 'F');

  // 2. Main navy header block
  doc.setFillColor(...DARK_NAVY);
  doc.rect(0, 1.5, PAGE_W, 30.5, 'F');

  // 3. Bottom teal thin bar
  doc.setFillColor(...TEAL);
  doc.rect(0, 32, PAGE_W, 1.5, 'F');

  // 4. White box on the left for RAM logo
  doc.setFillColor(...WHITE);
  doc.rect(14, 4.5, 23, 23, 'F');

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', 15, 5.5, 21, 21);
  } else {
    doc.setFont(FONT_BOLD, 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...RAM_BLUE);
    doc.text('RAM', 25.5, 18, { align: 'center' });
  }

  // 5. Title & Subtitle
  doc.setFont(FONT_BOLD, 'bold');
  doc.setFontSize(17);
  doc.setTextColor(...WHITE);
  doc.text('INCIDENT COMMAND REPORT', 42, 14);

  doc.setFont(FONT_NORMAL, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...TEAL);
  doc.text('SECURITY OPERATIONS / INCIDENT CONTROL / DIGITAL RECORD', 42, 20);

  // 6. Right Intake rounded pill
  doc.setFillColor(...TEAL);
  doc.roundedRect(152, 9, 44, 7, 2, 2, 'F');

  doc.setFont(FONT_BOLD, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text('INTAKE + NARRATIVE', 174, 13.6, { align: 'center' });

  // Page indicator
  doc.setFont(FONT_NORMAL, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 200, 220);
  doc.text(`PAGE ${pageNum} / ${totalPages}`, 196, 23.5, { align: 'right' });

  // 7. Footer
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.line(14, 286, 196, 286);

  doc.setFont(FONT_BOLD, 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 110, 120);
  doc.text('RAM INVESTIGATIVE GROUP INC. | CONFIDENTIAL', 14, 290.5);

  doc.setFont(FONT_NORMAL, 'normal');
  doc.text('RIG-IR-001 | REV 2026.08', PAGE_W / 2, 290.5, { align: 'center' });

  doc.text(`INTAKE + NARRATIVE | PAGE ${pageNum} OF ${totalPages}`, 196, 290.5, { align: 'right' });
}

// ─── Main export ─────────────────────────────────────────────────────────────
export async function downloadIncidentReportPDF(
  refinedText: string,
  incidentTitle: string,
  incidentObj?: any
) {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const textData = parseRefinedReport(refinedText);

  // If incident object is passed, override with DB fields
  if (incidentObj) {
    if (incidentObj.id) {
      textData.incidentNo = String(incidentObj.id).slice(-4).toUpperCase();
    }
    if (incidentObj.type || incidentObj.incidentType) {
      textData.incidentType = incidentObj.type || incidentObj.incidentType;
    }
    if (incidentObj.priority) {
      textData.priority = incidentObj.priority.toUpperCase();
      textData.severity = incidentObj.priority.toUpperCase();
    }
    if (incidentObj.date) {
      textData.dateOfIncident = incidentObj.date;
    }
    if (incidentObj.time) {
      textData.incidentTime = incidentObj.time;
    }
    if (incidentObj.time && incidentObj.time.includes('T')) {
      try {
        const d = new Date(incidentObj.time);
        if (!isNaN(d.getTime())) {
          const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
          const dd = String(d.getUTCDate()).padStart(2, '0');
          const yy = String(d.getUTCFullYear()).slice(2);
          textData.dateOfIncident = `${mm}.${dd}.${yy}`;
          
          const hh = String(d.getUTCHours()).padStart(2, '0');
          const min = String(d.getUTCMinutes()).padStart(2, '0');
          textData.incidentTime = `${hh}${min}`;
        }
      } catch (e) {}
    }
    if (incidentObj.site) {
      textData.siteName = incidentObj.siteInfo?.name || incidentObj.site;
    }
    if (incidentObj.siteInfo?.address) {
      textData.streetAddress = incidentObj.siteInfo.address;
    }
    if (incidentObj.location?.city) {
      textData.city = incidentObj.location.city;
    }
    if (incidentObj.location?.state) {
      textData.state = incidentObj.location.state;
    }
    if (incidentObj.location?.postalCode) {
      textData.zipCode = incidentObj.location.postalCode;
    }
    if (incidentObj.guardName) {
      textData.reportedBy = incidentObj.guardName;
    } else if (incidentObj.guardDetails?.name) {
      textData.reportedBy = incidentObj.guardDetails.name;
    } else if (incidentObj.guard) {
      if (typeof incidentObj.guard === 'object') {
        textData.reportedBy = `${incidentObj.guard.firstName || ''} ${incidentObj.guard.lastName || ''}`.trim() || incidentObj.guard.name || incidentObj.guard.email;
        if (incidentObj.guard.role?.name) {
          textData.titleRole = incidentObj.guard.role.name;
        }
      } else {
        textData.reportedBy = incidentObj.guard;
      }
    }
  }

  // Load logo via fetch
  let logoDataUrl: string | null = null;
  try {
    logoDataUrl = await fetchImageAsBase64('/src/assets/logo.png');
  } catch (err) {
    console.error('Failed to load logo on frontend:', err);
  }

  let y = 42;

  // ── 01. REPORT CONTROL
  y = drawSectionHeader(doc, y, '01', 'REPORT CONTROL', 'Complete all applicable fields using exact dates and times.');
  y = drawFieldsRow(
    doc,
    y,
    [
      { label: 'INCIDENT NUMBER', value: textData.incidentNo },
      { label: 'REPORT STATUS', value: String(incidentObj?.status || incidentObj?.solved || 'open').toLowerCase() === 'resolved' || textData.policeReport === 'Y' ? 'CLOSED' : 'ACTIVE' },
      { label: 'DATE OF REPORT', value: textData.dateOfReport },
      { label: 'TIME OF REPORT', value: textData.timeOfReport },
    ],
    [45.5, 45.5, 45.5, 45.5]
  );
  y = drawFieldsRow(
    doc,
    y,
    [
      { label: 'REPORTED BY', value: textData.reportedBy },
      { label: 'TITLE / ROLE', value: textData.titleRole },
      { label: 'SHIFT START', value: textData.startShift },
      { label: 'SHIFT END', value: textData.endShift },
    ],
    [65.5, 51.5, 32.5, 32.5]
  );
  y += 2.5;

  // ── 02. INCIDENT PROFILE
  y = drawSectionHeader(doc, y, '02', 'INCIDENT PROFILE', 'Core classification, time, and location information.');
  y = drawFieldsRow(
    doc,
    y,
    [
      { label: 'INCIDENT TYPE', value: textData.incidentType },
      { label: 'SEVERITY', value: textData.severity },
      { label: 'PRIORITY', value: textData.priority },
      { label: 'WEATHER', value: textData.weather },
    ],
    [60, 40.5, 40.5, 41]
  );
  y = drawFieldsRow(
    doc,
    y,
    [
      { label: 'INCIDENT DATE', value: textData.dateOfIncident },
      { label: 'INCIDENT TIME', value: textData.incidentTime },
      { label: 'SITE / PROPERTY NAME', value: textData.siteName },
      { label: 'SPECIFIC AREA', value: textData.specificArea },
    ],
    [38, 38, 56, 50]
  );
  y = drawFieldsRow(
    doc,
    y,
    [
      { label: 'STREET ADDRESS', value: textData.streetAddress },
      { label: 'CITY', value: textData.city },
      { label: 'STATE', value: textData.state },
      { label: 'ZIP CODE', value: textData.zipCode },
    ],
    [72, 40, 30, 40]
  );
  y += 2.5;

  // ── 03. SYSTEMS + RESPONSE FLAGS
  y = drawSectionHeader(doc, y, '03', 'SYSTEMS + RESPONSE FLAGS', 'Select every system, service, or condition that applies.');
  const flags = parseFlags(textData.narrative, textData);
  doc.setFillColor(...BOX_BG);
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.25);
  doc.roundedRect(MARGIN_L, y, CONTENT_W, 16.5, 1, 1, 'FD');

  const checkboxes = [
    { label: 'Body camera used', val: flags.bodyCam },
    { label: 'CCTV available', val: flags.cctv },
    { label: 'Police called', val: flags.police },
    { label: 'EMS called', val: flags.ems },
    { label: 'Fire called', val: flags.fire },
    { label: 'Weapon involved', val: flags.weapon },
    { label: 'Use of force', val: flags.useOfForce },
    { label: 'Arrest / detention', val: flags.arrest },
  ];

  for (let idx = 0; idx < checkboxes.length; idx++) {
    const cb = checkboxes[idx];
    const col = idx % 4;
    const row = Math.floor(idx / 4);

    const cbX = MARGIN_L + 4 + col * 44;
    const cbY = y + 3.2 + row * 6.5;

    // Small checkbox outline
    doc.setFillColor(...WHITE);
    doc.setDrawColor(...RAM_BLUE);
    doc.setLineWidth(0.35);
    doc.rect(cbX, cbY, 3.2, 3.2, 'FD');

    if (cb.val) {
      doc.setFont(FONT_BOLD, 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...RAM_BLUE);
      doc.text('X', cbX + 0.7, cbY + 2.5);
    }

    doc.setFont(FONT_NORMAL, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...BLACK);
    doc.text(cb.label, cbX + 4.8, cbY + 2.4);
  }
  y += 19.5;

  // ── 04. PERSONS INVOLVED + WITNESSES
  y = drawSectionHeader(doc, y, '04', 'PERSONS INVOLVED + WITNESSES', 'Add primary involved parties, witnesses, officers, or employees.');
  
  // Table Header
  doc.setFillColor(...DARK_NAVY);
  doc.rect(MARGIN_L, y, CONTENT_W, 6.2, 'F');
  
  doc.setFont(FONT_BOLD, 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...WHITE);
  doc.text('FULL NAME', MARGIN_L + 2, y + 4.2);
  doc.text('ROLE', MARGIN_L + 55, y + 4.2);
  doc.text('CONTACT / ID', MARGIN_L + 91, y + 4.2);
  doc.text('DISPOSITION / NOTES', MARGIN_L + 137, y + 4.2);

  const witnessList = parseWitnesses(textData.witnesses);
  const wCols = [53, 34, 44, 47];
  
  for (let i = 0; i < 4; i++) {
    const rowY = y + 6.2 + i * 7.5;
    const wit = witnessList[i];

    let startX = MARGIN_L;
    const rowFields = [
      { val: wit.name },
      { val: wit.role },
      { val: wit.contact },
      { val: wit.notes }
    ];

    for (let c = 0; c < 4; c++) {
      const colW = wCols[c];
      
      // Draw input field inside table cell
      doc.setFillColor(...WHITE);
      doc.setDrawColor(...BORDER_COLOR);
      doc.setLineWidth(0.25);
      doc.roundedRect(startX + 1, rowY + 0.8, colW - 2, 6, 0.8, 0.8, 'FD');

      if (rowFields[c].val) {
        doc.setFont(FONT_NORMAL, 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...BLACK);
        doc.text(rowFields[c].val, startX + 2.5, rowY + 4.8);
      }

      startX += colW;
    }
  }
  y += 38.5;

  // ── 05. INCIDENT NARRATIVE
  y = drawSectionHeader(doc, y, '05', 'INCIDENT NARRATIVE', 'Objective sequence of events: who, what, when, where, and how.');
  
  const narrativeLines = doc.splitTextToSize(textData.narrative || 'No narrative provided.', CONTENT_W - 8);
  let yBoxStart = y;
  
  doc.setFillColor(...WHITE);
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.35);
  
  doc.setFont(FONT_BOLD, 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...RAM_BLUE);
  doc.text('NARRATIVE', MARGIN_L + 3, yBoxStart + 3.8);

  let yText = yBoxStart + 8.5;
  for (const line of narrativeLines) {
    if (yText > 276) {
      // Close box
      const hBox = 278 - yBoxStart;
      doc.roundedRect(MARGIN_L, yBoxStart, CONTENT_W, hBox, 1, 1, 'S');

      doc.addPage();
      yBoxStart = 42;
      yText = yBoxStart + 8.5;

      doc.setFont(FONT_BOLD, 'bold');
      doc.setFontSize(6);
      doc.setTextColor(...RAM_BLUE);
      doc.text('NARRATIVE (CONTINUED)', MARGIN_L + 3, yBoxStart + 3.8);
    }

    doc.setFont(FONT_NORMAL, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...BLACK);
    doc.text(line, MARGIN_L + 3, yText);
    yText += 4.5;
  }

  // Draw final box border
  const finalH = yText - yBoxStart + 1.5;
  doc.roundedRect(MARGIN_L, yBoxStart, CONTENT_W, finalH, 1, 1, 'S');

  // ── ATTACHED IMAGES SECTION (Rendered on separate page if images exist)
  let images: string[] = [];
  if (incidentObj?.images && Array.isArray(incidentObj.images)) {
    images = incidentObj.images;
  } else if (incidentObj?.image) {
    if (typeof incidentObj.image === 'string') {
      try {
        const parsed = JSON.parse(incidentObj.image);
        if (Array.isArray(parsed)) images = parsed;
        else if (parsed) images = [String(parsed)];
      } catch (e) {
        if (incidentObj.image.startsWith('[') && incidentObj.image.endsWith(']')) {
          images = incidentObj.image.slice(1, -1).split(',').map((s: string) => s.trim().replace(/^["']|["']$/g, ''));
        } else {
          images = incidentObj.image.split(',').map((s: string) => s.trim());
        }
      }
    } else if (Array.isArray(incidentObj.image)) {
      images = incidentObj.image;
    }
  }

  if (images.length > 0) {
    doc.addPage();
    y = 42;
    drawSectionHeader(doc, y, '06', 'ATTACHED EVIDENCE / MEDIA', 'Official photos attached by the reporting security officer.');
    y += 8;

    let col = 0;
    let row = 0;
    for (let imgUrl of images) {
      if (!imgUrl) continue;
      // Prepend base URL if it is a relative path
      if (!imgUrl.startsWith('http') && !imgUrl.startsWith('data:')) {
        imgUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001'}${imgUrl}`;
      }

      const imgBase64 = await fetchImageAsBase64(imgUrl);
      if (imgBase64) {
        const imgX = MARGIN_L + col * 92;
        const imgY = y + row * 62;

        doc.setDrawColor(...BORDER_COLOR);
        doc.rect(imgX, imgY, 88, 58, 'S');
        
        try {
          doc.addImage(imgBase64, 'JPEG', imgX + 1, imgY + 1, 86, 56);
        } catch (e) {
          console.error('Failed to add image to PDF:', e);
        }

        col++;
        if (col >= 2) {
          col = 0;
          row++;
        }
        if (y + row * 62 > 260) {
          doc.addPage();
          y = 42;
          row = 0;
          col = 0;
        }
      }
    }
  }

  // ── Draw Header & Footer on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawHeaderAndFooter(doc, i, totalPages, logoDataUrl);
  }

  // ── Save File
  const safeName = incidentTitle.replace(/[^a-z0-9_\-]/gi, '_').toLowerCase();
  doc.save(`incident_report_${safeName}_${textData.dateOfReport.replace(/\./g, '')}.pdf`);
}
