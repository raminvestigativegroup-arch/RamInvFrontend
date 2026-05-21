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
export const api = {
  // Authentication
  auth: {
    login: (data: LoginRequest) => httpClient.post<LoginResponse>("/auth/admin", data),
    logout: () => httpClient.post("/auth/logout"),
    refresh: (data?: AuthRefreshRequest) => httpClient.post<ApiResponse<AuthRefreshResponse>>("/auth/refresh-token", data),
    me: () => httpClient.get("/auth/me"),
    register: (data: any) => httpClient.post("/auth/register", data),
  },

  // Guards Management
  guards: {
    list: (params?: any) => httpClient.get("/auth/guard", { params }),
    create: (data: any) => httpClient.post("/auth/guard", data),
    getById: (id: string) => httpClient.get(`/guard/${id}`),
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
    create: (data: any) => httpClient.post("/", data),
    delete: (id: string) => httpClient.delete(`/${id}`),
  },

  // Scheduling
  scheduling: {
    list: (params?: unknown) => httpClient.get("/schedule", { params }),
    create: (data: any) => httpClient.post("/schedule", data),
    getById: (id: string) => httpClient.get(`/schedule/${id}`),
    update: (id: string, data: any) => httpClient.put(`/schedule/${id}`, data),
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
  },

  // Hours Tracking
  hoursTracking: {
    list: (params?: any) => httpClient.get("/hours", { params }),
    getById: (id: string) => httpClient.get(`/hours/${id}`),
    getSummary: (params?: any) => httpClient.get("/hours/summary", { params }),
    clockIn: (data: any) => httpClient.post("/hours/clock-in", data),
    clockOut: (data: any) => httpClient.post("/hours/clock-out", data),
  },

  // Reports
  reports: {
    list: (params?: any) => httpClient.get("/reports", { params }),
    getById: (id: string) => httpClient.get(`/reports/${id}`),
    generate: (data: any) => httpClient.post("/reports/generate", data),
    download: (id: string) => httpClient.get(`/reports/${id}/download`, { responseType: 'blob' }),
  },

  // Notifications
  notifications: {
    list: (params?: any) => httpClient.get("/notifications", { params }),
    getById: (id: string) => httpClient.get(`/notifications/${id}`),
    markAsRead: (id: string) => httpClient.put(`/notifications/${id}/read`),
    markAllAsRead: () => httpClient.put("/notifications/read-all"),
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
    guardStatus: () => httpClient.get("/dashboard/guard-status"),
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
