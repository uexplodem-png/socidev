import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, AuthResponse, ValidateTokenResponse } from "../lib/api/auth";
import { formatBalance } from "../utils/format";

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
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  user: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

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
        } else {
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          setUser(null);
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response: AuthResponse = await authApi.login({ email, password });

      // Check if response has the correct structure
      if (!response || !response.data || !response.data.user) {
        throw new Error("Invalid response structure from server");
      }

      const completeUser: User = {
        id: response.data.user.id,
        email: response.data.user.email,
        firstName: response.data.user.firstName,
        lastName: response.data.user.lastName,
        username: response.data.user.username,
        phone: response.data.user.phone || "",
        balance: Number(response.data.user.balance) || 0,
        createdAt: response.data.user.createdAt || new Date().toISOString(),
      };

      // Dispatch a custom event to notify other contexts
      window.dispatchEvent(new CustomEvent("userLoggedIn"));

      localStorage.setItem("token", response.data.token);
      setUser(completeUser);
      setIsAuthenticated(true);
      navigate("/dashboard");
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
    // Dispatch a custom event to notify other contexts
    window.dispatchEvent(new CustomEvent("userLoggedOut"));
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, user }}>
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