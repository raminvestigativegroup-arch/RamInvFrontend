
import { ReactNode } from "react";

export const DEMO_CREDENTIALS = {
  email: "admin@securepro.com",
  password: "admin123",
};

export interface Guard {
  avatar: ReactNode;
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  site: string;
  status: "on-duty" | "off-duty" | "break";
  licenseExpiry: string;
  complianceStatus: "valid" | "expiring" | "expired";
  lastSeen: string;
  lat: number;
  lng: number;
  profilePhoto?: Text;
  hoursThisWeek: number;
  scheduledHours: number;
  geofenceAlert?: boolean;
  nextShift?: string;
  isVerified?: boolean;
  roleId?: string;
}

export interface Manager {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  profilePhoto?: Text;
  role: string;
  sites: string[];
  status: "active" | "inactive";
  licenseExpiry: string;
  isVerified?: boolean;
  roleId?: string;
}

export interface Site {
  id: string;
  name: string;
  address: string;
  guards: string[];
  manager: string;
  status: "active" | "inactive";
  lat: number;
  lng: number;
  geofenceRadius?: number; // meters
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  site: string;
  guard: string;
  priority: "high" | "medium" | "low";
  status: "open" | "in-progress" | "resolved";
  type: string;
  date: string;
  time: string;
  hasPhotos: boolean;
}

export interface ScheduleEntry {
  id: string;
  guard: string;
  site: string;
  date: string;
  shiftStart: string;
  shiftEnd: string;
  actualStart?: string;
  actualEnd?: string;
  status: "scheduled" | "in-progress" | "completed" | "missed";
}

export interface ComplianceDoc {
  id: string;
  personName: string;
  personType: "guard" | "manager";
  docType: string;
  expiryDate: string;
  status: "valid" | "expiring" | "expired";
  uploadDate: string;
  docImage?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "incident" | "compliance" | "schedule" | "system";
  priority: "high" | "medium" | "low";
  read: boolean;
  date: string;
}

export const guards: Guard[] = [
  { id: "G001", name: "James Wilson", email: "james.w@securepro.com", phoneNumber: "+1 555-0101", site: "Downtown Office Complex", status: "on-duty", licenseExpiry: "2026-08-15", complianceStatus: "valid", lastSeen: "2 min ago", lat: 40.7128, lng: -74.006, avatar: "JW", hoursThisWeek: 38, scheduledHours: 40, geofenceAlert: true, isVerified: true },
  { id: "G002", name: "Maria Santos", email: "maria.s@securepro.com", phoneNumber: "+1 555-0102", site: "Tech Park Campus", status: "on-duty", licenseExpiry: "2026-03-10", complianceStatus: "expiring", lastSeen: "3 min ago", lat: 40.7589, lng: -73.9851, avatar: "MS", hoursThisWeek: 42, scheduledHours: 40, isVerified: true },
  { id: "G003", name: "Robert Chen", email: "robert.c@securepro.com", phoneNumber: "+1 555-0103", site: "Harbor Warehouse", status: "off-duty", licenseExpiry: "2025-12-01", complianceStatus: "expired", lastSeen: "1 hr ago", lat: 40.6892, lng: -74.0445, avatar: "RC", hoursThisWeek: 32, scheduledHours: 40, nextShift: "Tomorrow 6:00 AM" },
  { id: "G004", name: "Sarah Johnson", email: "sarah.j@securepro.com", phoneNumber: "+1 555-0104", site: "Mall Central", status: "on-duty", licenseExpiry: "2026-11-20", complianceStatus: "valid", lastSeen: "1 min ago", lat: 40.7484, lng: -73.9857, avatar: "SJ", hoursThisWeek: 40, scheduledHours: 40 },
  { id: "G005", name: "Michael Brown", email: "michael.b@securepro.com", phoneNumber: "+1 555-0105", site: "Downtown Office Complex", status: "break", licenseExpiry: "2026-06-30", complianceStatus: "valid", lastSeen: "15 min ago", lat: 40.7138, lng: -74.002, avatar: "MB", hoursThisWeek: 36, scheduledHours: 40 },
  { id: "G006", name: "Emily Davis", email: "emily.d@securepro.com", phoneNumber: "+1 555-0106", site: "Residential Tower A", status: "on-duty", licenseExpiry: "2026-09-05", complianceStatus: "valid", lastSeen: "3 min ago", lat: 40.7282, lng: -73.7949, avatar: "ED", hoursThisWeek: 39, scheduledHours: 40 },
  { id: "G007", name: "David Kim", email: "david.k@securepro.com", phoneNumber: "+1 555-0107", site: "Tech Park Campus", status: "off-duty", licenseExpiry: "2026-04-18", complianceStatus: "expiring", lastSeen: "3 hrs ago", lat: 40.7300, lng: -73.9950, avatar: "DK", hoursThisWeek: 28, scheduledHours: 40, nextShift: "Tomorrow 2:00 PM" },
  { id: "G008", name: "Lisa Patel", email: "lisa.p@securepro.com", phoneNumber: "+1 555-0108", site: "Harbor Warehouse", status: "on-duty", licenseExpiry: "2026-12-31", complianceStatus: "valid", lastSeen: "5 min ago", lat: 40.6782, lng: -73.9442, avatar: "LP", hoursThisWeek: 41, scheduledHours: 40 },
];

export const managers: Manager[] = [
  { id: "M001", name: "Thomas Anderson", email: "thomas.a@securepro.com", phoneNumber: "+1 555-0201", role: "Regional Manager", sites: ["Downtown Office Complex", "Mall Central"], status: "active", licenseExpiry: "2026-10-15", isVerified: true },
  { id: "M002", name: "Jennifer Lopez", email: "jennifer.l@securepro.com", phoneNumber: "+1 555-0202", role: "Site Manager", sites: ["Tech Park Campus"], status: "active", licenseExpiry: "2026-07-20", isVerified: true },
  { id: "M003", name: "William Park", email: "william.p@securepro.com", phoneNumber: "+1 555-0203", role: "Operations Manager", sites: ["Harbor Warehouse", "Residential Tower A"], status: "active", licenseExpiry: "2026-05-01" },
];

export const sites: Site[] = [
  { id: "S001", name: "Downtown Office Complex", address: "123 Main Street, New York, NY 10001", guards: ["G001", "G005"], manager: "Thomas Anderson", status: "active", lat: 40.7128, lng: -74.006, geofenceRadius: 300 },
  { id: "S002", name: "Tech Park Campus", address: "456 Innovation Blvd, New York, NY 10018", guards: ["G002", "G007"], manager: "Jennifer Lopez", status: "active", lat: 40.7589, lng: -73.9851, geofenceRadius: 500 },
  { id: "S003", name: "Harbor Warehouse", address: "789 Dock Road, New York, NY 10004", guards: ["G003", "G008"], manager: "William Park", status: "active", lat: 40.6892, lng: -74.0445, geofenceRadius: 400 },
  { id: "S004", name: "Mall Central", address: "321 Shopping Ave, New York, NY 10016", guards: ["G004"], manager: "Thomas Anderson", status: "active", lat: 40.7484, lng: -73.9857, geofenceRadius: 350 },
  { id: "S005", name: "Residential Tower A", address: "654 Park Lane, Queens, NY 11101", guards: ["G006"], manager: "William Park", status: "active", lat: 40.7282, lng: -73.7949, geofenceRadius: 200 },
  { id: "S006", name: "Old Factory Site", address: "999 Industrial Rd, Brooklyn, NY 11201", guards: [], manager: "William Park", status: "inactive", lat: 40.6782, lng: -73.9442 },
];

export const incidents: Incident[] = [
  { id: "INC001", title: "Unauthorized Access Attempt", description: "Individual attempted to enter restricted area without valid credentials at the east entrance.", site: "Downtown Office Complex", guard: "James Wilson", priority: "high", status: "open", type: "Security Breach", date: "2026-02-25", time: "08:30 AM", hasPhotos: true },
  { id: "INC002", title: "Fire Alarm Triggered", description: "Fire alarm activated on 3rd floor. Area evacuated. False alarm confirmed by fire department.", site: "Tech Park Campus", guard: "Maria Santos", priority: "high", status: "resolved", type: "Emergency", date: "2026-02-25", time: "07:15 AM", hasPhotos: false },
  { id: "INC003", title: "Parking Lot Vandalism", description: "Vehicle in lot B found with broken window. Owner notified.", site: "Mall Central", guard: "Sarah Johnson", priority: "medium", status: "in-progress", type: "Vandalism", date: "2026-02-24", time: "11:45 PM", hasPhotos: true },
  { id: "INC004", title: "Suspicious Package", description: "Unattended package found near loading dock. Area cordoned off pending inspection.", site: "Harbor Warehouse", guard: "Lisa Patel", priority: "high", status: "open", type: "Suspicious Activity", date: "2026-02-24", time: "09:20 PM", hasPhotos: true },
  { id: "INC005", title: "Slip and Fall", description: "Visitor slipped on wet floor in lobby. Minor injury. First aid administered.", site: "Residential Tower A", guard: "Emily Davis", priority: "low", status: "resolved", type: "Accident", date: "2026-02-24", time: "03:00 PM", hasPhotos: false },
  { id: "INC006", title: "Tailgating Incident", description: "Two individuals entered through secure door behind authorized employee.", site: "Downtown Office Complex", guard: "Michael Brown", priority: "medium", status: "open", type: "Security Breach", date: "2026-02-24", time: "01:30 PM", hasPhotos: false },
  { id: "INC007", title: "Equipment Malfunction", description: "CCTV camera 14 went offline in sector C.", site: "Tech Park Campus", guard: "David Kim", priority: "low", status: "in-progress", type: "Maintenance", date: "2026-02-23", time: "10:00 AM", hasPhotos: false },
];

export const scheduleEntries: ScheduleEntry[] = [
  { id: "SCH001", guard: "James Wilson", site: "Downtown Office Complex", date: "2026-02-25", shiftStart: "06:00", shiftEnd: "14:00", actualStart: "05:55", status: "in-progress" },
  { id: "SCH002", guard: "Maria Santos", site: "Tech Park Campus", date: "2026-02-25", shiftStart: "06:00", shiftEnd: "14:00", actualStart: "06:02", status: "in-progress" },
  { id: "SCH003", guard: "Sarah Johnson", site: "Mall Central", date: "2026-02-25", shiftStart: "07:00", shiftEnd: "15:00", actualStart: "06:58", status: "in-progress" },
  { id: "SCH004", guard: "Emily Davis", site: "Residential Tower A", date: "2026-02-25", shiftStart: "08:00", shiftEnd: "16:00", actualStart: "08:00", status: "in-progress" },
  { id: "SCH005", guard: "Lisa Patel", site: "Harbor Warehouse", date: "2026-02-25", shiftStart: "06:00", shiftEnd: "14:00", actualStart: "05:50", status: "in-progress" },
  { id: "SCH006", guard: "Michael Brown", site: "Downtown Office Complex", date: "2026-02-25", shiftStart: "14:00", shiftEnd: "22:00", status: "scheduled" },
  { id: "SCH007", guard: "Robert Chen", site: "Harbor Warehouse", date: "2026-02-25", shiftStart: "14:00", shiftEnd: "22:00", status: "scheduled" },
  { id: "SCH008", guard: "David Kim", site: "Tech Park Campus", date: "2026-02-25", shiftStart: "14:00", shiftEnd: "22:00", status: "scheduled" },
  { id: "SCH009", guard: "James Wilson", site: "Downtown Office Complex", date: "2026-02-24", shiftStart: "06:00", shiftEnd: "14:00", actualStart: "05:58", actualEnd: "14:05", status: "completed" },
  { id: "SCH010", guard: "Maria Santos", site: "Tech Park Campus", date: "2026-02-24", shiftStart: "06:00", shiftEnd: "14:00", actualStart: "06:10", actualEnd: "14:00", status: "completed" },
];

export const complianceDocs: ComplianceDoc[] = [
  { id: "DOC001", personName: "Maria Santos", personType: "guard", docType: "Security License", expiryDate: "2026-03-10", status: "expiring", uploadDate: "2025-03-10" },
  { id: "DOC002", personName: "Robert Chen", personType: "guard", docType: "Security License", expiryDate: "2025-12-01", status: "expired", uploadDate: "2024-12-01" },
  { id: "DOC003", personName: "David Kim", personType: "guard", docType: "First Aid Certificate", expiryDate: "2026-04-18", status: "expiring", uploadDate: "2025-04-18" },
  { id: "DOC004", personName: "William Park", personType: "manager", docType: "Operations License", expiryDate: "2026-05-01", status: "expiring", uploadDate: "2025-05-01" },
  { id: "DOC005", personName: "James Wilson", personType: "guard", docType: "Security License", expiryDate: "2026-08-15", status: "valid", uploadDate: "2025-08-15" },
  { id: "DOC006", personName: "Sarah Johnson", personType: "guard", docType: "Security License", expiryDate: "2026-11-20", status: "valid", uploadDate: "2025-11-20" },
  { id: "DOC007", personName: "Thomas Anderson", personType: "manager", docType: "Management Certificate", expiryDate: "2026-10-15", status: "valid", uploadDate: "2025-10-15" },
  { id: "DOC008", personName: "Lisa Patel", personType: "guard", docType: "Fire Safety Certificate", expiryDate: "2026-12-31", status: "valid", uploadDate: "2025-12-31" },
];

export const notifications: Notification[] = [
  { id: "N001", title: "High Priority Incident", message: "Unauthorized access attempt reported at Downtown Office Complex", type: "incident", priority: "high", read: false, date: "2026-02-25 08:30" },
  { id: "N002", title: "License Expiring Soon", message: "Maria Santos' Security License expires on March 10, 2026", type: "compliance", priority: "medium", read: false, date: "2026-02-25 08:00" },
  { id: "N003", title: "Suspicious Package Alert", message: "Suspicious package reported at Harbor Warehouse", type: "incident", priority: "high", read: false, date: "2026-02-24 21:20" },
  { id: "N004", title: "Expired License", message: "Robert Chen's Security License expired on Dec 1, 2025", type: "compliance", priority: "high", read: true, date: "2026-02-24 09:00" },
  { id: "N005", title: "Schedule Conflict", message: "Overlapping shifts detected for David Kim on Feb 26", type: "schedule", priority: "medium", read: true, date: "2026-02-24 08:00" },
  { id: "N006", title: "System Update", message: "SecurePro v2.5 deployed successfully", type: "system", priority: "low", read: true, date: "2026-02-23 22:00" },
];

export const kpiData = {
  activeGuards: guards.filter(g => g.status === "on-duty").length,
  totalGuards: guards.length,
  activeSites: sites.filter(s => s.status === "active").length,
  totalSites: sites.length,
  incidentsToday: incidents.filter(i => i.date === "2026-02-25").length,
  openIncidents: incidents.filter(i => i.status === "open").length,
  complianceAlerts: complianceDocs.filter(d => d.status === "expiring" || d.status === "expired").length,
  scheduledHoursToday: 64,
  workedHoursToday: 52,
};
