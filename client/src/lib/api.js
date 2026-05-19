import axios from "axios";
import { useAuthStore } from "../store/authStore.js";

/**
 * Configure central Axios instance for communicating with the backend API
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach credentials dynamically on each dispatch
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Seamlessly capture expired session token events (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("[API] Session expired or invalid token detected (401). Forcing logout.");
      useAuthStore.getState().clearAuth();
      
      // Prevent infinite redirect loop if already on login page
      if (!window.location.pathname.endsWith("/login")) {
        window.location.href = "/dashboard/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
