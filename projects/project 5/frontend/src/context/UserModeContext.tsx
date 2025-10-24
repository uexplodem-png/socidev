import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

type UserMode = 'taskDoer' | 'taskGiver';

interface UserModeContextType {
  userMode: UserMode;
  setUserMode: (mode: UserMode) => void;
  isTaskGiver: boolean;
  isTaskDoer: boolean;
  toggleUserMode: () => void;
}

const UserModeContext = createContext<UserModeContextType | undefined>(undefined);

const taskGiverOnlyRoutes = ['/new-order', '/my-orders', '/add-balance'];

export const UserModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userMode, setUserMode] = useState<UserMode>(() => 
    (localStorage.getItem('userMode') as UserMode) || 'taskDoer'
  );

  const isTaskGiver = userMode === 'taskGiver';
  const isTaskDoer = userMode === 'taskDoer';

  useEffect(() => {
    // Handle route access control when mode changes
    if (!isTaskGiver && taskGiverOnlyRoutes.some(route => location.pathname.startsWith(route))) {
      navigate('/dashboard');
    }
  }, [userMode, location.pathname, navigate]);

  const handleModeChange = (newMode: UserMode) => {
    setUserMode(newMode);
    localStorage.setItem('userMode', newMode);

    // Dispatch custom event for other components to react
    window.dispatchEvent(new CustomEvent('userModeChange', { detail: newMode }));
  };

  const toggleUserMode = () => {
    const newMode = userMode === 'taskDoer' ? 'taskGiver' : 'taskDoer';
    handleModeChange(newMode);
  };

  return (
    <UserModeContext.Provider value={{
      userMode,
      setUserMode: handleModeChange,
      isTaskGiver,
      isTaskDoer,
      toggleUserMode
    }}>
      {children}
    </UserModeContext.Provider>
  );
};

export const useUserMode = () => {
  const context = useContext(UserModeContext);
  if (context === undefined) {
    throw new Error('useUserMode must be used within a UserModeProvider');
  }
  return context;
};