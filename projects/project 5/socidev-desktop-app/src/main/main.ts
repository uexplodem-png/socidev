import { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } from 'electron';
// Initialize puppeteer-in-electron at startup (must be before app is ready)
// Using require to avoid ESM/CJS interop issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pie: any = require('puppeteer-in-electron');
try {
    pie.initialize(app);
    // eslint-disable-next-line no-console
    console.log('puppeteer-in-electron initialized');
} catch (e: any) {
    // eslint-disable-next-line no-console
    console.warn('PIE init warning:', e?.message || e);
}
import path from 'path';
import AutoLaunch from 'auto-launch';
import { secureStore } from './storage/SecureStore';
import { sociDevClient } from './api/SociDevClient';
import { instagramBot } from './instagram/InstagramBot';

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// Auto-launch configuration
const autoLauncher = new AutoLaunch({
    name: 'SociDev Desktop',
    path: app.getPath('exe'),
});

// Development check
const isDevelopment = !app.isPackaged;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        show: false,
        icon: path.join(__dirname, '../../assets/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    // Load renderer
    if (isDevelopment) {
        mainWindow.loadURL('http://localhost:5175');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    // Minimize to tray instead of closing
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow?.hide();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function createTray() {
    // Create tray icon
    const icon = nativeImage.createFromPath(
        path.join(__dirname, '../../assets/tray-icon.png')
    );
    tray = new Tray(icon.resize({ width: 16, height: 16 }));

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App',
            click: () => {
                mainWindow?.show();
            },
        },
        {
            label: 'Hide App',
            click: () => {
                mainWindow?.hide();
            },
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                isQuitting = true;
                app.quit();
            },
        },
    ]);

    tray.setToolTip('SociDev Desktop');
    tray.setContextMenu(contextMenu);

    // Show window on tray click
    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
            }
        }
    });
}

// App ready
app.whenReady().then(() => {
    createWindow();
    createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows closed (except macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle second instance
app.on('second-instance', () => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
    }
});

// IPC Handlers
ipcMain.handle('get-auto-launch-status', async () => {
    try {
        return await autoLauncher.isEnabled();
    } catch (error) {
        console.error('Failed to get auto-launch status:', error);
        return false;
    }
});

ipcMain.handle('set-auto-launch', async (_event, enabled: boolean) => {
    try {
        if (enabled) {
            await autoLauncher.enable();
        } else {
            await autoLauncher.disable();
        }
        return { success: true };
    } catch (error) {
        console.error('Failed to set auto-launch:', error);
        return { success: false, error: (error as Error).message };
    }
});

ipcMain.handle('minimize-to-tray', () => {
    mainWindow?.hide();
    return { success: true };
});

ipcMain.handle('quit-app', () => {
    isQuitting = true;
    app.quit();
});

// Forward console logs from renderer
ipcMain.on('log', (_event, level: string, ...args: any[]) => {
    if (level === 'error') console.error(...args);
    else if (level === 'warn') console.warn(...args);
    else console.log(...args);
});

// Storage IPC Handlers
ipcMain.handle('storage-save', async (_event, key: string, value: any) => {
    try {
        secureStore.saveEncrypted(key, value);
        return { success: true };
    } catch (error) {
        console.error('Storage save error:', error);
        return { success: false, error: (error as Error).message };
    }
});

ipcMain.handle('storage-get', async (_event, key: string) => {
    try {
        return secureStore.getEncrypted(key);
    } catch (error) {
        console.error('Storage get error:', error);
        return null;
    }
});

ipcMain.handle('storage-delete', async (_event, key: string) => {
    try {
        secureStore.deleteKey(key);
        return { success: true };
    } catch (error) {
        console.error('Storage delete error:', error);
        return { success: false, error: (error as Error).message };
    }
});

// SociDev API IPC Handlers
ipcMain.handle('api-authenticate', async (_event, apiKey: string, apiSecret: string) => {
    try {
        const result = await sociDevClient.authenticate(apiKey, apiSecret);
        return result;
    } catch (error) {
        console.error('API authentication error:', error);
        return { success: false, error: (error as Error).message };
    }
});

ipcMain.handle('api-get-user-info', async () => {
    try {
        const result = await sociDevClient.getUserInfo();
        return result.data;
    } catch (error) {
        console.error('API get user info error:', error);
        return null;
    }
});

ipcMain.handle('api-get-tasks', async () => {
    try {
        const result = await sociDevClient.getTasks();
        return result.data || [];
    } catch (error) {
        console.error('API get tasks error:', error);
        return [];
    }
});

ipcMain.handle('api-report-task-result', async (_event, taskId: string, result: any) => {
    try {
        const response = await sociDevClient.reportTaskResult(taskId, result);
        return response;
    } catch (error) {
        console.error('API report task result error:', error);
        return { success: false, error: (error as Error).message };
    }
});

// Instagram IPC Handlers
ipcMain.handle('instagram-login', async () => {
    try {
        const result = await instagramBot.login();
        return result;
    } catch (error) {
        console.error('Instagram login error:', error);
        return { success: false, error: (error as Error).message };
    }
});

ipcMain.handle('instagram-status', async () => {
    try {
        return instagramBot.getStatus();
    } catch (error) {
        console.error('Instagram status error:', error);
        return { loggedIn: false };
    }
});

ipcMain.handle('instagram-logout', async () => {
    try {
        return await instagramBot.logout();
    } catch (error) {
        console.error('Instagram logout error:', error);
        return { success: true };
    }
});

ipcMain.handle('instagram-execute-task', async (_event, task: any) => {
    try {
        const result = await instagramBot.executeTask(task);
        return result;
    } catch (error) {
        console.error('Instagram execute task error:', error);
        return { success: false, error: (error as Error).message };
    }
});
