/**
 * HTTP Client Setup with Axios
 * This file sets up the HTTP client with interceptors for:
 * - Adding authentication tokens to requests
 * - Handling errors globally
 * - Refreshing tokens when expired
 */

import axios, {
  AxiosInstance,
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

// Get API base URL from environment variables
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4001/api/v1";
const API_TIMEOUT = parseInt(
  import.meta.env.VITE_API_TIMEOUT || "10000",
  10
);

// Create Axios instance
export const httpClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  withCredentials: true, // Crucial for sending/receiving cookies
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request Interceptor
 * Browser automatically sends cookies with withCredentials: true
 * If you still need to send other headers, do it here.
 */
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles errors and refreshes token if needed
 */
httpClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized (token expired or invalid)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If the request that failed is already the refresh token request, 
      // don't try to refresh again, just logout.
      if (originalRequest.url?.includes("/auth/refresh-token")) {
        console.error("Refresh token expired or invalid");
        localStorage.removeItem("user");
        localStorage.removeItem("securepro_auth");
        window.location.href = "/";
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        console.log("Access token expired, attempting to refresh...");
        // Try to refresh token - browser will send the refresh token cookie
        // Using direct axios call to avoid interceptor loop
        await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {}, // No body needed as it's in cookies
          { withCredentials: true }
        );

        console.log("Token refreshed successfully, retrying original request:", originalRequest.url);
        // Retry original request
        return httpClient(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed, redirecting to login:", refreshError);
        // Refresh failed, redirect to login or clear auth state
        localStorage.removeItem("user");
        localStorage.removeItem("securepro_auth");
        window.location.href = "/"; // The correct login route in this app
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status === 403) {
      console.error("Forbidden: You don't have permission to access this resource");
    }

    if (error.response?.status === 404) {
      console.error("Not Found: Resource does not exist");
    }

    if (error.response?.status === 500) {
      console.error("Server Error: Something went wrong on the backend");
    }

    return Promise.reject(error);
  }
);

export default httpClient;
