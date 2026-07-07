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
    config.headers["X-Timezone-Offset"] = String(new Date().getTimezoneOffset());
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Flag to track if token is currently being refreshed
let isRefreshing = false;
// Queue to store requests that failed with 401 while token was refreshing
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

/**
 * Process the queue of pending requests
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

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

    const isPublicRoute =
      originalRequest.url?.includes("/auth/admin") ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/forgot-password") ||
      originalRequest.url?.includes("/auth/reset-password") ||
      originalRequest.url?.includes("/auth/verify-otp") ||
      originalRequest.url?.includes("/auth/resend-otp");

    if (isPublicRoute) {
      return Promise.reject(error);
    }

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

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            originalRequest._retry = true; // Mark as retried to prevent loops
            return httpClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        console.log("Access token expired, attempting to refresh...");
        // Try to refresh token - browser will send the refresh token cookie
        // Using httpClient call to leverage config
        httpClient.post("/auth/refresh-token")
          .then(() => {
            console.log("Token refreshed successfully, scheduling retries...");
            // Yield to browser event loop (50ms) to ensure cookie storage is fully updated
            setTimeout(() => {
              processQueue(null);
              resolve(httpClient(originalRequest));
              isRefreshing = false;
            }, 50);
          })
          .catch((refreshError) => {
            console.error("Token refresh failed, redirecting to login:", refreshError);
            processQueue(refreshError);
            // Refresh failed, redirect to login or clear auth state
            localStorage.removeItem("user");
            localStorage.removeItem("securepro_auth");
            window.location.href = "/"; // The correct login route in this app
            reject(refreshError);
            isRefreshing = false;
          });
      });
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
