import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: 'admin' | 'user' | 'super_admin' | 'moderator';
  adminRole?: 'super_admin' | 'admin' | 'moderator';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('auth-token');

      if (storedToken) {
        try {
          const response = await fetch('/api/auth/validate', {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            // Map role to adminRole for backward compatibility
            const userData = {
              ...data.user,
              adminRole: data.user.role === 'super_admin' || data.user.role === 'admin' || data.user.role === 'moderator'
                ? data.user.role
                : undefined
            };
            setUser(userData);
            setToken(storedToken);
          } else {
            localStorage.removeItem('auth-token');
          }
        } catch (error) {
          console.error('Auth validation failed:', error);
          localStorage.removeItem('auth-token');
        }
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const data = await response.json();

      // Clear all storage first to ensure fresh state
      localStorage.clear();
      sessionStorage.clear();

      // Map role to adminRole for backward compatibility
      const userData = {
        ...data.user,
        adminRole: data.user.role === 'super_admin' || data.user.role === 'admin' || data.user.role === 'moderator'
          ? data.user.role
          : undefined
      };

      // Set new auth data
      setUser(userData);
      setToken(data.token);
      localStorage.setItem('auth-token', data.token);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    // Clear all localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
  };

  const value = {
    user,
    token,
    login,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};