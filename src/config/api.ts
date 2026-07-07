/**
 * API Configuration and Endpoints
 * Centralized location for all API endpoint paths and configuration
 */

// API Base URL (from environment or default)
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4001/api/v1";

import httpClient from "@/lib/httpClient";

/**
 * API Endpoints Configuration
 * Organize all endpoints by feature/module
 */
const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const convertUTCToLocal = (startDateStr: string, endDateStr: string, shiftStartStr: string, shiftEndStr: string) => {
  try {
    if (!startDateStr || !shiftStartStr) {
      return { startDate: startDateStr, endDate: endDateStr, shiftStart: shiftStartStr, shiftEnd: shiftEndStr };
    }
    const cleanStartStr = shiftStartStr.substring(0, 5);
    const cleanEndStr = (shiftEndStr || shiftStartStr).substring(0, 5);

    const startUTC = new Date(`${startDateStr}T${cleanStartStr}Z`);
    if (isNaN(startUTC.getTime())) {
      return { startDate: startDateStr, endDate: endDateStr, shiftStart: shiftStartStr, shiftEnd: shiftEndStr };
    }
    const startMins = timeToMinutes(cleanStartStr);
    let endMins = timeToMinutes(cleanEndStr);
    if (endMins === startMins) {
      endMins = startMins + 24 * 60;
    } else if (endMins < startMins) {
      endMins += 24 * 60;
    }
    const durationMins = endMins - startMins;

    const endUTC = new Date(startUTC.getTime() + durationMins * 60 * 1000);

    const localStartDate = `${startUTC.getFullYear()}-${String(startUTC.getMonth() + 1).padStart(2, "0")}-${String(startUTC.getDate()).padStart(2, "0")}`;
    const localShiftStart = `${String(startUTC.getHours()).padStart(2, "0")}:${String(startUTC.getMinutes()).padStart(2, "0")}:00`;

    const startDiffMs = new Date(localStartDate).getTime() - new Date(startDateStr).getTime();
    const localEndDateObj = new Date(new Date(endDateStr || startDateStr).getTime() + startDiffMs);
    const localEndDate = `${localEndDateObj.getFullYear()}-${String(localEndDateObj.getMonth() + 1).padStart(2, "0")}-${String(localEndDateObj.getDate()).padStart(2, "0")}`;

    const localShiftEnd = `${String(endUTC.getHours()).padStart(2, "0")}:${String(endUTC.getMinutes()).padStart(2, "0")}:00`;

    return {
      startDate: localStartDate,
      endDate: localEndDate,
      shiftStart: localShiftStart,
      shiftEnd: localShiftEnd
    };
  } catch {
    return { startDate: startDateStr, endDate: endDateStr, shiftStart: shiftStartStr, shiftEnd: shiftEndStr };
  }
};

const convertLocalToUTC = (startDateStr: string, endDateStr: string, shiftStartStr: string, shiftEndStr: string) => {
  try {
    if (!startDateStr || !shiftStartStr) {
      return { startDate: startDateStr, endDate: endDateStr, shiftStart: shiftStartStr, shiftEnd: shiftEndStr };
    }
    const cleanStartStr = shiftStartStr.substring(0, 5);
    const cleanEndStr = (shiftEndStr || shiftStartStr).substring(0, 5);

    const startLocal = new Date(`${startDateStr}T${cleanStartStr}`);
    if (isNaN(startLocal.getTime())) {
      return { startDate: startDateStr, endDate: endDateStr, shiftStart: shiftStartStr, shiftEnd: shiftEndStr };
    }
    const startMins = timeToMinutes(cleanStartStr);
    let endMins = timeToMinutes(cleanEndStr);
    if (endMins === startMins) {
      endMins = startMins + 24 * 60;
    } else if (endMins < startMins) {
      endMins += 24 * 60;
    }
    const durationMins = endMins - startMins;

    const endLocal = new Date(startLocal.getTime() + durationMins * 60 * 1000);

    const utcStartISO = startLocal.toISOString();
    const utcEndISO = endLocal.toISOString();

    const utcStartDate = utcStartISO.split('T')[0];
    const utcShiftStart = `${utcStartISO.split('T')[1].substring(0, 5)}:00`;

    const startDiffMs = new Date(utcStartDate).getTime() - new Date(startDateStr).getTime();
    const utcEndDateObj = new Date(new Date(endDateStr || startDateStr).getTime() + startDiffMs);
    const utcEndDate = utcEndDateObj.toISOString().split('T')[0];

    const utcShiftEnd = `${utcEndISO.split('T')[1].substring(0, 5)}:00`;

    return {
      startDate: utcStartDate,
      endDate: utcEndDate,
      shiftStart: utcShiftStart,
      shiftEnd: utcShiftEnd
    };
  } catch {
    return { startDate: startDateStr, endDate: endDateStr, shiftStart: shiftStartStr, shiftEnd: shiftEndStr };
  }
};

export const api = {
  // Authentication
  auth: {
    login: (data: LoginRequest) => httpClient.post<LoginResponse>("/auth/admin", data),
    logout: () => httpClient.post("/auth/logout"),
    refresh: (data?: AuthRefreshRequest) => httpClient.post<ApiResponse<AuthRefreshResponse>>("/auth/refresh-token", data),
    me: () => httpClient.get("/auth/me"),
    register: (data: any) => httpClient.post("/auth/register", data),
    forgotPassword: (email: string) => httpClient.post("/auth/forgot-password", { email }),
    resetPassword: (data: any) => httpClient.post("/auth/reset-password", data),
    changePassword: (data: any) => httpClient.post("/auth/change-password", data),
  },

  // Guards Management
  guards: {
    list: (params?: any) => httpClient.get("/auth/guard", { params }),
    create: (data: any) => httpClient.post("/auth/guard", data),
    getById: async (id: string) => {
      const res = await httpClient.get<any>(`/guard/${id}`);
      if (res.data && res.data.data && Array.isArray(res.data.data.schedules)) {
        res.data.data.schedules = res.data.data.schedules.map((item: any) => {
          const local = convertUTCToLocal(item.startDate, item.endDate, item.shiftStart, item.shiftEnd);
          return {
            ...item,
            startDate: local.startDate,
            endDate: local.endDate,
            shiftStart: local.shiftStart,
            shiftEnd: local.shiftEnd,
          };
        });
      }
      return res;
    },
    update: (id: string, data: any) => httpClient.patch(`/guard/${id}`, data),
    delete: (id: string) => httpClient.delete(`/guard/${id}`),
    search: (params?: any) => httpClient.get("/guard/search", { params }),
  },

  // Managers Management
  managers: {
    list: (params?: any) => httpClient.get("/auth/manager", { params }),
    create: (data: any) => httpClient.post("/auth/manager", data),
    getById: (id: string) => httpClient.get(`/manager/${id}`),
    update: (id: string, data: any) => httpClient.patch(`/manager/${id}`, data),
    delete: (id: string) => httpClient.delete(`/manager/${id}`),
  },

  // Sites Management
  sites: {
    list: (params?: any) => httpClient.get("/auth/site", { params }),
    create: (data: any) => httpClient.post("/auth/site", data),
    getById: (id: string) => httpClient.get(`/site/${id}`),
    update: (id: string, data: any) => httpClient.patch(`/site/${id}`, data),
    delete: (id: string) => httpClient.delete(`/site/${id}`),
    geocode: (address: string) => httpClient.get("/site/geocode", { params: { address } }),
  },

  // Incidents Management
  incidents: {
    list: (params?: any) => httpClient.get("/guard/incidents", { params }),
    getById: (id: string) => httpClient.get(`/guard/incident/${id}`),
    update: (id: string, data: any) => httpClient.patch(`/guard/incident/${id}`, data),
    create: (data: any) => httpClient.post("/guard", data),
    refine: (id: string) => httpClient.post(`/guard/incident/${id}/refine`),
    delete: (id: string) => httpClient.delete(`/guard/incident/${id}`),
  },

  // Scheduling
  scheduling: {
    list: async (params?: unknown) => {
      const res = await httpClient.get<any>("/schedule", { params });
      if (res.data) {
        const convertItem = (item: any) => {
          const local = convertUTCToLocal(item.startDate, item.endDate, item.shiftStart, item.shiftEnd);
          return {
            ...item,
            startDate: local.startDate,
            endDate: local.endDate,
            shiftStart: local.shiftStart,
            shiftEnd: local.shiftEnd,
          };
        };
        if (Array.isArray(res.data)) {
          res.data = res.data.map(convertItem);
        } else if (res.data.data && Array.isArray(res.data.data)) {
          res.data.data = res.data.data.map(convertItem);
        } else if (res.data.schedules && Array.isArray(res.data.schedules)) {
          res.data.schedules = res.data.schedules.map(convertItem);
        }
      }
      return res;
    },
    create: (data: any) => {
      const utc = convertLocalToUTC(data.startDate, data.endDate, data.shiftStart, data.shiftEnd);
      const payload = {
        ...data,
        startDate: utc.startDate,
        endDate: utc.endDate,
        shiftStart: utc.shiftStart,
        shiftEnd: utc.shiftEnd,
      };
      return httpClient.post("/schedule", payload);
    },
    getById: async (id: string) => {
      const res = await httpClient.get<any>(`/schedule/${id}`);
      if (res.data && res.data.data) {
        const item = res.data.data;
        const local = convertUTCToLocal(item.startDate, item.endDate, item.shiftStart, item.shiftEnd);
        res.data.data = {
          ...item,
          startDate: local.startDate,
          endDate: local.endDate,
          shiftStart: local.shiftStart,
          shiftEnd: local.shiftEnd,
        };
      }
      return res;
    },
    update: (id: string, data: any) => {
      const utc = convertLocalToUTC(data.startDate, data.endDate, data.shiftStart, data.shiftEnd);
      const payload = {
        ...data,
        startDate: utc.startDate,
        endDate: utc.endDate,
        shiftStart: utc.shiftStart,
        shiftEnd: utc.shiftEnd,
      };
      return httpClient.put(`/schedule/${id}`, payload);
    },
    delete: (id: string) => httpClient.delete(`/schedule/${id}`),
    getByMonth: (year: number, month: number) => httpClient.get(`/schedule/${year}/${month}`),
  },

  // Compliance
  compliance: {
    list: (params?: any) => httpClient.get("/compliance", { params }),
    getAlerts: () => httpClient.get("/compliance/alerts"),
    getById: (id: string) => httpClient.get(`/compliance/${id}`),
    update: (id: string, data: any) => httpClient.put(`/compliance/${id}`, data),
  },

  // Documents
  documents: {
    list: (params?: any) => httpClient.get("/documents", { params }),
    getById: (id: string) => httpClient.get(`/documents/${id}`),
    create: (data: FormData) => httpClient.post("/documents", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
    update: (id: string, data: any) => httpClient.patch(`/documents/${id}`, data),
    delete: (id: string) => httpClient.delete(`/documents/${id}`),
  },

  // Hours Tracking
  hoursTracking: {
    list: (params?: any) => httpClient.get("/attendance/hours", { params }),
    getById: (id: string) => httpClient.get(`/attendance/hours/${id}`),
    getSummary: (params?: any) => httpClient.get("/attendance/hours/summary", { params }),
    clockIn: (data: any) => httpClient.post("/attendance/hours/clock-in", data),
    clockOut: (data: any) => httpClient.post("/attendance/hours/clock-out", data),
  },

  // Attendance details and clock-in images
  attendance: {
    getDetails: async (params: { guardId: string; date?: string; startDate?: string; endDate?: string }) => {
      const res = await httpClient.get<any>("/attendance/details", { params });
      if (res.data && Array.isArray(res.data.details)) {
        res.data.details = res.data.details.map((item: any) => {
          const local = convertUTCToLocal(item.date, item.date, item.scheduledStart, item.scheduledEnd);
          return {
            ...item,
            date: local.startDate,
            scheduledStart: local.shiftStart,
            scheduledEnd: local.shiftEnd,
          };
        });
      }
      return res;
    },
  },

  // Reports
  reports: {
    list: (params?: any) => httpClient.get("/reports", { params }),
    getById: (id: string) => httpClient.get(`/reports/${id}`),
    generate: (data: any) => httpClient.post("/reports/generate", data),
    download: (id: string) => httpClient.get(`/reports/${id}/download`, { responseType: 'blob' }),
    getStats: () => httpClient.get("/reports/stats"),
    getPreview: (id: string) => httpClient.get(`/reports/${id}/preview`),
  },

  // Notifications
  notifications: {
    list: (params?: any) => httpClient.get("/notifications", { params }),
    getById: (id: string) => httpClient.get(`/notifications/${id}`),
    markAsRead: (id: string) => httpClient.put(`/notifications/${id}/read`),
    markAllAsRead: () => httpClient.put("/notifications/read-all"),
  },

  // Alert Configuration
  alerts: {
    list: (params?: any) => httpClient.get("/alerts", { params }),
    upsert: (data: any) => httpClient.post("/alerts", data),
  },

  // Roles & Permissions
  roles: {
    list: (params?: any) => httpClient.get("/role", { params }),
    create: (data: any) => httpClient.post("/role", data),
    getById: (id: string) => httpClient.get(`/role/${id}`),
    update: (id: string, data: any) => httpClient.put(`/role/${id}`, data),
    delete: (id: string) => httpClient.delete(`/role/${id}`),
    permissions: () => httpClient.get("/permissions"),
    assignPermissions: (data: { roleId: string; permission: string[] }) => httpClient.post("/permissions", data),
  },

  // System Settings
  settings: {
    get: () => httpClient.get("/settings"),
    update: (data: any) => httpClient.put("/settings", data),
  },

  // Dashboard
  dashboard: {
    kpis: () => httpClient.get("/dashboard/kpis"),
    guardStatus: async () => {
      const res = await httpClient.get<any>("/dashboard/guard-status");
      if (res.data && Array.isArray(res.data.data)) {
        res.data.data = res.data.data.map((guard: any) => {
          if (guard.nextShift && typeof guard.nextShift === 'string' && guard.nextShift.startsWith('Today ')) {
            const timesStr = guard.nextShift.substring(6); // "HH:MM - HH:MM"
            const [startStr, endStr] = timesStr.split(' - ');
            if (startStr && endStr) {
              const todayStr = new Date().toISOString().split('T')[0];
              const local = convertUTCToLocal(todayStr, todayStr, startStr, endStr);
              const localTodayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
              const prefix = local.startDate === localTodayStr ? 'Today' : 'Tomorrow';
              return {
                ...guard,
                nextShift: `${prefix} ${local.shiftStart.substring(0, 5)} - ${local.shiftEnd.substring(0, 5)}`
              };
            }
          }
          return guard;
        });
      }
      return res;
    },
    recentIncidents: () => httpClient.get("/dashboard/recent-incidents"),
    complianceAlerts: () => httpClient.get("/dashboard/compliance-alerts"),
    hoursSummary: () => httpClient.get("/dashboard/hours-summary"),
  },
};

/**
 * API Error Messages
 * Standard error messages to show users
 */
export const API_ERROR_MESSAGES = {
  UNAUTHORIZED: "You are not authenticated. Please login.",
  FORBIDDEN: "You don't have permission to access this resource.",
  NOT_FOUND: "Resource not found.",
  BAD_REQUEST: "Invalid request. Please check your input.",
  SERVER_ERROR: "Server error. Please try again later.",
  NETWORK_ERROR: "Network error. Please check your connection.",
  TIMEOUT: "Request timeout. Please try again.",
};

/**
 * Request Configuration
 */
export const REQUEST_CONFIG = {
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || "10000", 10),
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // milliseconds
};

/**
 * Response Type Guards
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  statusCode: number;
  message?: string;
  details?: Record<string, string[]>;
}

export interface LoginRequest {
  email: string;
  password: string;
  type: "admin";
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  data: LoginUser;
}

export interface LoginUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthRefreshRequest {
  refreshToken?: string;
}

export interface AuthRefreshResponse {
  token: string;
}
