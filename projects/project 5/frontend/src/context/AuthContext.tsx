import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, ValidateTokenResponse } from "../lib/api/auth";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  phone?: string;
  balance: number;
  profileImage?: string;
  createdAt?: string;
  permissions?: string[];
  roles?: Array<{ id: number; key: string; label: string }>;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  user: User | null;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const navigate = useNavigate();

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    // If no token exists, just mark loading as complete
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return;
    }

    // Only validate token if it exists
    authApi
      .validateToken(token)
      .then((response: ValidateTokenResponse) => {
        if (response && response.data && response.data.user) {
          setUser({
            ...response.data.user,
            balance: Number(response.data.user.balance) || 0,
          });
          setIsAuthenticated(true);
          
          // Extract permissions from JWT token
          try {
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            setPermissions(tokenPayload.permissions || []);
          } catch (decodeError) {
            console.error('Failed to decode token:', decodeError);
            setPermissions([]);
          }
        } else {
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          setUser(null);
          setPermissions([]);
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setUser(null);
        setPermissions([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      localStorage.setItem('token', response.data.token);
      setUser({
        ...response.data.user,
        balance: Number(response.data.user.balance) || 0,
      });
      setIsAuthenticated(true);
      
      // Extract permissions from JWT token
      try {
        const tokenPayload = JSON.parse(atob(response.data.token.split('.')[1]));
        setPermissions(tokenPayload.permissions || []);
      } catch (decodeError) {
        console.error('Failed to decode token:', decodeError);
        setPermissions([]);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
    setPermissions([]);
    // Dispatch a custom event to notify other contexts
    window.dispatchEvent(new CustomEvent("userLoggedOut"));
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, user, permissions, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};