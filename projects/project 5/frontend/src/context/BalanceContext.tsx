import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { balanceApi } from "../lib/api/balance";
import { toast } from "react-hot-toast";
import { useAuth } from "./AuthContext";

interface BalanceContextType {
  balance: number;
  updateBalance: (newBalance: number) => void;
  refreshBalance: () => Promise<void>;
  isLoading: boolean;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export const BalanceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const updateBalance = (newBalance: number) => {
    setBalance(newBalance);
  };

  const refreshBalance = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token || !isAuthenticated) {
        setBalance(0); // Reset balance when not authenticated
        return;
      }

      const response = await balanceApi.getBalance(token);
      setBalance(response.balance);
    } catch (error) {
      console.error("Error refreshing balance:", error);
      toast.error("Failed to update balance");
      setBalance(0); // Reset balance on error
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshBalance();

      // Set up WebSocket or polling for real-time balance updates
      const interval = setInterval(refreshBalance, 30000); // Poll every 30 seconds

      return () => clearInterval(interval);
    } else {
      // Clear balance when user is not authenticated
      setBalance(0);
      return () => { };
    }
  }, [isAuthenticated, refreshBalance]);

  // Listen for logout events
  useEffect(() => {
    const handleLogout = () => {
      setBalance(0);
    };

    window.addEventListener("userLoggedOut", handleLogout);
    return () => {
      window.removeEventListener("userLoggedOut", handleLogout);
    };
  }, []);

  // Listen for login events
  useEffect(() => {
    const handleLogin = () => {
      refreshBalance(); // Refresh balance when user logs in
    };

    window.addEventListener("userLoggedIn", handleLogin);
    return () => {
      window.removeEventListener("userLoggedIn", handleLogin);
    };
  }, [refreshBalance]);

  return (
    <BalanceContext.Provider
      value={{ balance, updateBalance, refreshBalance, isLoading }}>
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = () => {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error("useBalance must be used within a BalanceProvider");
  }
  return context;
};
