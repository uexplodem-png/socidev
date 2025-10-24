import { fetchApi } from '../api';

export interface DeviceRegistration {
  name: string;
  type: 'PC' | 'Laptop' | 'Mobile';
  notes?: string;
}

export interface DeviceSettings {
  autoRenew?: boolean;
  maxDailyTasks?: number;
  notifications?: {
    email: boolean;
    browser: boolean;
  };
}

export const deviceApi = {
  registerDevice: (token: string, data: DeviceRegistration) =>
    fetchApi('/devices', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),

  getDevices: (token: string, status?: string) => {
    const queryParams = status ? `?status=${status}` : '';
    return fetchApi(`/devices${queryParams}`, { token });
  },

  updateDeviceSettings: (token: string, deviceId: string, settings: DeviceSettings) =>
    fetchApi(`/devices/${deviceId}/settings`, {
      method: 'PUT',
      token,
      body: JSON.stringify(settings),
    }),

  updateDeviceStatus: (token: string, deviceId: string, status: string) =>
    fetchApi(`/devices/${deviceId}/status`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ status }),
    }),

  deleteDevice: (token: string, deviceId: string) =>
    fetchApi(`/devices/${deviceId}`, {
      method: 'DELETE',
      token,
    }),

  getDeviceStats: (token: string, deviceId: string) =>
    fetchApi(`/devices/${deviceId}/stats`, { token }),
};