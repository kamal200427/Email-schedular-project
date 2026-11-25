
import api from "./api";

export interface AuthUser {
  id: string;
  googleId: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface AuthResponse {
  message?: string;
  user: AuthUser;
}

export interface AuthStatusResponse {
  isAuthenticated: boolean;
  user: AuthUser | null;
}

const authService = {

  // Start Google OAuth authentication.
  login: () => {
    window.location.assign(
      `${api.defaults.baseURL}/auth/google`
    );
  },

  // Get the currently authenticated user.
  getCurrentUser: async (): Promise<AuthUser> => {
    const response = await api.get<AuthResponse>(
      "/auth/me"
    );

    return response.data.user;
  },

  // Check authentication status.
  checkAuth: async (): Promise<AuthStatusResponse> => {
    const response = await api.get<AuthStatusResponse>(
      "/auth/status"
    );

    return response.data;
  },

  // Logout the current user.
  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },

  // Refresh user information.
  refreshUser: async (): Promise<AuthUser> => {
    const response = await api.get<AuthResponse>(
      "/auth/me"
    );

    return response.data.user;
  },

};

export default authService;
