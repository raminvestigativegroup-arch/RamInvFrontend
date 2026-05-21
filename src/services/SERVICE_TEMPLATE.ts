/**
 * Generic Service Template
 * Use this as a template for creating other services (guardService, incidentService, etc.)
 * 
 * How to use this template:
 * 1. Copy this file and rename it to your specific service (e.g., guardService.ts)
 * 2. Replace "Guard" with your entity name throughout
 * 3. Replace the API_ENDPOINTS.guards with your specific endpoint
 * 4. Adjust the type interfaces to match your data structure
 * 5. Add/remove methods as needed for your specific service
 */

import { api, ApiResponse } from "@/config/api";

/**
 * Type Definitions (Replace with your actual data types)
 * These should match your backend response structure
 */
interface Guard {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  status: "active" | "inactive" | "on_leave";
  siteId: string;
  joinDate: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateGuardRequest {
  name: string;
  email: string;
  phoneNumber: string;
  siteId: string;
}

interface UpdateGuardRequest extends Partial<CreateGuardRequest> {
  id: string;
}

interface GuardFilters {
  search?: string;
  status?: string;
  siteId?: string;
  page?: number;
  limit?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Guard Service
 * Handles all guard-related API operations
 */
export const guardService = {
  /**
   * Get all guards with optional filters
   * @param filters - Optional filter parameters
   * @returns Promise with paginated guards list
   *
   * @example
   * const response = await guardService.getGuards({ status: 'active', page: 1 });
   * console.log(response.data);
   */
  async getGuards(
    filters?: GuardFilters
  ): Promise<PaginatedResponse<Guard>> {
    try {
      const response = await api.guards.list(filters);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || "Failed to fetch guards");
    } catch (error) {
      console.error("Get guards error:", error);
      throw error;
    }
  },

  /**
   * Get a single guard by ID
   * @param id - Guard ID
   * @returns Promise with guard data
   *
   * @example
   * const guard = await guardService.getGuardById('guard-123');
   */
  async getGuardById(id: string): Promise<Guard> {
    try {
      const response = await api.guards.getById(id);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || "Failed to fetch guard");
    } catch (error) {
      console.error("Get guard by ID error:", error);
      throw error;
    }
  },

  /**
   * Create a new guard
   * @param guardData - Guard data to create
   * @returns Promise with created guard
   *
   * @example
   * const newGuard = await guardService.createGuard({
   *   name: 'John Doe',
   *   email: 'john@example.com',
   *   phoneNumber: '1234567890',
   *   siteId: 'site-123'
   * });
   */
  async createGuard(guardData: CreateGuardRequest): Promise<Guard> {
    try {
      const response = await api.guards.create(guardData);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || "Failed to create guard");
    } catch (error) {
      console.error("Create guard error:", error);
      throw error;
    }
  },

  /**
   * Update an existing guard
   * @param id - Guard ID
   * @param guardData - Updated guard data
   * @returns Promise with updated guard
   *
   * @example
   * const updated = await guardService.updateGuard('guard-123', { status: 'inactive' });
   */
  async updateGuard(id: string, guardData: Partial<CreateGuardRequest>): Promise<Guard> {
    try {
      const response = await api.guards.update(id, guardData);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || "Failed to update guard");
    } catch (error) {
      console.error("Update guard error:", error);
      throw error;
    }
  },

  /**
   * Delete a guard
   * @param id - Guard ID
   * @returns Promise
   *
   * @example
   * await guardService.deleteGuard('guard-123');
   */
  async deleteGuard(id: string): Promise<void> {
    try {
      const response = await api.guards.delete(id);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete guard");
      }
    } catch (error) {
      console.error("Delete guard error:", error);
      throw error;
    }
  },

  /**
   * Search guards
   * @param query - Search query
   * @returns Promise with search results
   *
   * @example
   * const results = await guardService.searchGuards('John');
   */
  async searchGuards(query: string): Promise<Guard[]> {
    try {
      const response = await api.guards.search({ q: query });

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || "Search failed");
    } catch (error) {
      console.error("Search guards error:", error);
      throw error;
    }
  },
};

export default guardService;

/**
 * HOW TO USE THIS SERVICE IN REACT COMPONENTS
 * 
 * Using with React Query (Recommended):
 * =====================================
 * 
 * import { useQuery, useMutation } from '@tanstack/react-query';
 * import { guardService } from '@/services/guardService';
 * 
 * export function GuardsList() {
 *   // Fetch data
 *   const { data, isLoading, error } = useQuery({
 *     queryKey: ['guards'],
 *     queryFn: () => guardService.getGuards()
 *   });
 * 
 *   // Create/Update/Delete mutations
 *   const createMutation = useMutation({
 *     mutationFn: (guardData) => guardService.createGuard(guardData),
 *     onSuccess: () => {
 *       // Invalidate and refetch
 *       queryClient.invalidateQueries({ queryKey: ['guards'] });
 *     }
 *   });
 * 
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 * 
 *   return (
 *     <div>
 *       {data?.data.map(guard => (
 *         <div key={guard.id}>{guard.name}</div>
 *       ))}
 *       <button onClick={() => createMutation.mutate(newGuardData)}>
 *         Add Guard
 *       </button>
 *     </div>
 *   );
 * }
 */
