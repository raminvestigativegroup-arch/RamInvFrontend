/**
 * Authentication Service
 * Handles all authentication-related API calls
 * Example service showing the pattern for other services
 */

import {
  api,
  LoginResponse,
  AuthRefreshResponse,
} from "@/config/api";

/**
 * AuthService Object
 * Contains all authentication-related methods
 */
export const authService = {
  /**
   * Login with email and password
   * @param email - User email
   * @param password - User password
   * @returns Promise with login response containing token and user info
   *
   * @example
   * const response = await authService.login('user@example.com', 'password');
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await api.auth.login({
        email,
        password,
        type: "admin",
      });

      if (response.data.success) {
        return response.data;
      }

      throw new Error(response.data.message || "Login failed");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  /**
   * Logout the current user
   * @returns Promise
   *
   * @example
   * await authService.logout();
   */
  async logout(): Promise<void> {
    try {
      await api.auth.logout();
      localStorage.removeItem("user");
    } catch (error) {
      console.error("Logout error:", error);
      // Logout even if request fails
      localStorage.removeItem("user");
    }
  },

  /**
   * Refresh authentication token
   * @returns Promise with new token
   *
   * @example
   * const response = await authService.refreshToken();
   */
  async refreshToken(): Promise<AuthRefreshResponse> {
    try {
      const response = await api.auth.refresh();

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || "Token refresh failed");
    } catch (error) {
      console.error("Token refresh error:", error);
      throw error;
    }
  },

  /**
   * Get current user information
   * @returns Promise with current user data
   *
   * @example
   * const user = await authService.getCurrentUser();
   * console.log(user.email);
   */
  async getCurrentUser() {
    try {
      const response = await api.auth.me();
      return response.data.data;
    } catch (error) {
      console.error("Get current user error:", error);
      throw error;
    }
  },

  /**
   * Register a new user
   * @param email - User email
   * @param password - User password
   * @param name - User name
   * @returns Promise with registration response
   *
   * @example
   * const response = await authService.register('user@example.com', 'password', 'John Doe');
   */
  async register(email: string, password: string, name: string) {
    try {
      const response = await api.auth.register({
        email,
        password,
        name,
      });

      return response.data.data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  /**
   * Request password reset OTP
   * @param email - User email
   */
  async forgotPassword(email: string) {
    try {
      const response = await api.auth.forgotPassword(email);
      return response.data;
    } catch (error) {
      console.error("Forgot password error:", error);
      throw error;
    }
  },

  /**
   * Reset password using OTP
   * @param data - { email, otp, newPassword }
   */
  async resetPassword(data: any) {
    try {
      const response = await api.auth.resetPassword(data);
      return response.data;
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  },

  /**
   * Change password for logged-in user
   * @param data - { oldPassword, newPassword }
   */
  async changePassword(data: any) {
    try {
      const response = await api.auth.changePassword(data);
      return response.data;
    } catch (error) {
      console.error("Change password error:", error);
      throw error;
    }
  },
};

/**
 * Export for use in components and other services
 */
export default authService;
