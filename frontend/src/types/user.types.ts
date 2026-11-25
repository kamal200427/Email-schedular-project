
/* =========================================
   USER
========================================= */

export interface User {
  id: string;

  googleId: string;

  name: string;

  email: string;

  avatar?: string;

  createdAt?: string;

  updatedAt?: string;
}


/* =========================================
   USER PROFILE
========================================= */

export interface UserProfile {
  id: string;

  name: string;

  email: string;

  avatar?: string;
}


/* =========================================
   AUTHENTICATION RESPONSE
========================================= */

export interface AuthResponse {
  message?: string;

  user: User;
}


/* =========================================
   AUTHENTICATION STATUS
========================================= */

export interface AuthStatusResponse {
  isAuthenticated: boolean;

  user: User | null;
}


/* =========================================
   AUTHENTICATION CONTEXT
========================================= */

export interface AuthContextType {
  user: User | null;

  isAuthenticated: boolean;

  loading: boolean;

  login: () => void;

  logout: () => Promise<void>;

  fetchUser: () => Promise<void>;
}


/* =========================================
   LOGIN RESPONSE
========================================= */

export interface LoginResponse {
  message: string;

  user?: User;
}


/* =========================================
   LOGOUT RESPONSE
========================================= */

export interface LogoutResponse {
  message: string;
}


/* =========================================
   USER SESSION
========================================= */

export interface UserSession {
  user: User;

  isAuthenticated: boolean;

  expiresAt?: string;
}


/* =========================================
   API ERROR
========================================= */

export interface AuthErrorResponse {
  message: string;

  error?: string;

  code?: string;
}
