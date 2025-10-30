import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Auto-launch
  getAutoLaunchStatus: () => ipcRenderer.invoke('get-auto-launch-status'),
  setAutoLaunch: (enabled: boolean) => ipcRenderer.invoke('set-auto-launch', enabled),

  // Window controls
  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
  quitApp: () => ipcRenderer.invoke('quit-app'),

  // Storage operations
  saveData: (key: string, value: any) => ipcRenderer.invoke('storage-save', key, value),
  getData: (key: string) => ipcRenderer.invoke('storage-get', key),
  deleteData: (key: string) => ipcRenderer.invoke('storage-delete', key),

  // Instagram operations
  instagramLogin: () => ipcRenderer.invoke('instagram-login'),
  instagramGetStatus: () => ipcRenderer.invoke('instagram-status'),
  instagramLogout: () => ipcRenderer.invoke('instagram-logout'),
  instagramExecuteTask: (task: any) => ipcRenderer.invoke('instagram-execute-task', task),

  // SociDev API operations
  apiAuthenticate: (apiKey: string, apiSecret: string) =>
    ipcRenderer.invoke('api-authenticate', apiKey, apiSecret),
  apiGetUserInfo: () => ipcRenderer.invoke('api-get-user-info'),
  apiGetTasks: () => ipcRenderer.invoke('api-get-tasks'),
  apiReportTaskResult: (taskId: string, result: any) =>
    ipcRenderer.invoke('api-report-task-result', taskId, result),

  // Logging
  log: (level: string, ...args: any[]) => ipcRenderer.send('log', level, ...args),

  // Event listeners
  onTaskUpdate: (callback: (task: any) => void) => {
    ipcRenderer.on('task-update', (_event, task) => callback(task));
  },
  onStatusUpdate: (callback: (status: any) => void) => {
    ipcRenderer.on('status-update', (_event, status) => callback(status));
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

// Type definitions for renderer process
export interface ElectronAPI {
  getAutoLaunchStatus: () => Promise<boolean>;
  setAutoLaunch: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
  minimizeToTray: () => Promise<{ success: boolean }>;
  quitApp: () => void;
  saveData: (key: string, value: any) => Promise<void>;
  getData: (key: string) => Promise<any>;
  deleteData: (key: string) => Promise<void>;
  instagramLogin: () => Promise<{ success: boolean; error?: string }>;
  instagramGetStatus: () => Promise<{ loggedIn: boolean; username?: string }>;
  instagramLogout: () => Promise<{ success: boolean }>;
  instagramExecuteTask: (task: any) => Promise<{ success: boolean; result?: any; error?: string }>;
  apiAuthenticate: (
    apiKey: string,
    apiSecret: string
  ) => Promise<{ success: boolean; error?: string }>;
  apiGetUserInfo: () => Promise<any>;
  apiGetTasks: () => Promise<any[]>;
  apiReportTaskResult: (taskId: string, result: any) => Promise<{ success: boolean }>;
  log: (level: string, ...args: any[]) => void;
  onTaskUpdate: (callback: (task: any) => void) => void;
  onStatusUpdate: (callback: (status: any) => void) => void;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
