import { api } from "@/config/api";

export interface DashboardKpis {
  activeGuards: number;
  totalGuards: number;
  activeSites: number;
  totalSites: number;
  incidentsToday: number;
  openIncidents: number;
  complianceAlerts: number;
  scheduledHoursToday: number;
  workedHoursToday: number;
}

export const dashboardService = {
  async getKpis(): Promise<DashboardKpis> {
    try {
      const response = await api.dashboard.kpis();
      // api.ts specifies return type as Promise<AxiosResponse<ApiResponse<T>>>
      // so response.data has { success, data, message }
      const responseData = response.data as any;
      if (responseData.success && responseData.data) {
        return responseData.data;
      }
      throw new Error(responseData.message || "Failed to fetch dashboard KPIs");
    } catch (error) {
      console.error("Dashboard KPI fetch error:", error);
      throw error;
    }
  },
};

export default dashboardService;
