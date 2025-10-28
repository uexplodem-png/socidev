import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export function MaintenanceBanner() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  useEffect(() => {
    // Check maintenance mode from backend
    const checkMaintenanceMode = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/settings/public`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const maintenanceEnabled = data.data?.maintenance?.enabled || false;
          const message = data.data?.maintenance?.message || 'The system is currently under maintenance. Some features may be unavailable.';
          
          setIsMaintenanceMode(maintenanceEnabled);
          setMaintenanceMessage(message);
        }
      } catch (error) {
        console.error('Failed to check maintenance mode:', error);
      }
    };

    checkMaintenanceMode();
    
    // Check every 5 minutes
    const interval = setInterval(checkMaintenanceMode, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (!isMaintenanceMode) {
    return null;
  }

  return (
    <div className="bg-yellow-500 text-white py-3 px-4 shadow-lg">
      <div className="container mx-auto flex items-center justify-center gap-3">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-medium text-center">
          {maintenanceMessage}
        </p>
      </div>
    </div>
  );
}
