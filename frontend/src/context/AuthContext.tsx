
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

// User interface
export interface User {
  id: string;
  googleId: string;
  name: string;
  email: string;
  avatar?: string;
}

// Authentication context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// Auth Provider
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check current authentication
  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get("/auth/me");

      setUser(response.data.user);
    } catch (error) {
      setUser(null);
    }
  }, []);

  // Restore session on page refresh
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await fetchUser();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [fetchUser]);

  // Google OAuth login
  const login = useCallback(() => {
    window.location.assign(
      `${api.defaults.baseURL}/auth/google`
    );
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
      window.location.assign("/login");
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: Boolean(user),
    loading,
    login,
    logout,
    fetchUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider"
    );
  }

  return context;
};

export default AuthContext;
