
import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,

  withCredentials: true,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor.
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add additional request configuration here if needed.
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor.
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;

      switch (status) {
        case 401:
          // Authentication expired or user is not logged in.
          // AuthContext handles session restoration and logout.
          break;

        case 403:
          console.error("Access denied.");
          break;

        case 404:
          console.error("Requested resource was not found.");
          break;

        case 429:
          console.error("Too many requests. Please try again later.");
          break;

        case 500:
          console.error("Internal server error.");
          break;

        default:
          console.error("API request failed:", status);
      }
    } else if (error.request) {
      console.error(
        "Unable to connect to the backend server."
      );
    } else {
      console.error("Request configuration error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
