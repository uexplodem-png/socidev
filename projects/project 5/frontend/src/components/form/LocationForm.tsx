import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';

interface LocationFormProps {
  onLocationChange: (location: {
    country: string;
    state: string;
    city: string;
  }) => void;
}

interface LocationState {
  country: string;
  state: string;
  city: string;
  loading: boolean;
  error: string | null;
}

export const LocationForm: React.FC<LocationFormProps> = ({ onLocationChange }) => {
  const [location, setLocation] = useState<LocationState>({
    country: '',
    state: '',
    city: '',
    loading: true,
    error: null
  });

  const updateLocationData = useCallback((newLocation: Partial<LocationState>) => {
    setLocation(prev => {
      const updated = { ...prev, ...newLocation };
      if ('country' in newLocation || 'state' in newLocation || 'city' in newLocation) {
        onLocationChange({
          country: updated.country,
          state: updated.state,
          city: updated.city
        });
      }
      return updated;
    });
  }, [onLocationChange]);

  useEffect(() => {
    let mounted = true;

    const detectLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) {
          throw new Error('Failed to fetch location');
        }
        
        const data = await response.json();
        
        if (!mounted) return;
        
        if (data.error) {
          throw new Error(data.error || 'Could not detect location');
        }

        updateLocationData({
          country: data.country_name || '',
          state: data.region || '',
          city: data.city || '',
          loading: false,
          error: null
        });
      } catch (error) {
        if (!mounted) return;
        updateLocationData({
          loading: false,
          error: 'Could not detect location'
        });
      }
    };

    detectLocation();

    return () => {
      mounted = false;
    };
  }, [updateLocationData]);

  const handleChange = (field: keyof Omit<LocationState, 'loading' | 'error'>, value: string) => {
    updateLocationData({ [field]: value });
  };

  if (location.loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-gray-100 rounded-lg"></div>
        <div className="h-10 bg-gray-100 rounded-lg"></div>
        <div className="h-10 bg-gray-100 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {location.error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{location.error}</p>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Country
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={location.country}
            onChange={(e) => handleChange('country', e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-violet-500 focus:ring-violet-200"
            placeholder="Enter country"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          State/Region
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={location.state}
            onChange={(e) => handleChange('state', e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-violet-500 focus:ring-violet-200"
            placeholder="Enter state or region"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          City
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={location.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-violet-500 focus:ring-violet-200"
            placeholder="Enter city"
          />
        </div>
      </div>
    </div>
  );
};