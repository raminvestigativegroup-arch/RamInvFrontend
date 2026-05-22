import { api } from "@/config/api";

export interface SystemSettingsData {
  id?: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
}

export const settingsService = {
  async getSettings(): Promise<SystemSettingsData> {
    try {
      const response = await api.settings.get();
      const responseData = response.data as any;
      if (responseData.success && responseData.data) {
        return responseData.data;
      }
      throw new Error(responseData.message || "Failed to fetch settings");
    } catch (error) {
      console.error("Fetch settings error:", error);
      throw error;
    }
  },

  async updateSettings(data: SystemSettingsData): Promise<SystemSettingsData> {
    try {
      const response = await api.settings.update(data);
      const responseData = response.data as any;
      if (responseData.success && responseData.data) {
        return responseData.data;
      }
      throw new Error(responseData.message || "Failed to update settings");
    } catch (error) {
      console.error("Update settings error:", error);
      throw error;
    }
  },
};

export default settingsService;
