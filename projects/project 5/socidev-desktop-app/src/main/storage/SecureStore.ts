import Store from 'electron-store';
import CryptoJS from 'crypto-js';
import { machineIdSync } from 'node-machine-id';

interface SecureStoreData {
    apiKey?: string;
    apiSecret?: string;
    instagramCookies?: any[];
    instagramSession?: any;
    instagramUsername?: string;
    settings?: {
        autoLaunch?: boolean;
        notifications?: boolean;
        minimizeOnClose?: boolean;
    };
}

class SecureStore {
    private store: Store<SecureStoreData>;
    private encryptionKey: string;

    constructor() {
        this.store = new Store<SecureStoreData>({
            name: 'socidev-secure-store',
            encryptionKey: undefined, // We'll handle encryption manually
        });

        // Generate encryption key from machine ID (unique per machine)
        const machineId = machineIdSync();
        this.encryptionKey = CryptoJS.SHA256(machineId).toString();
    }

    private encrypt(data: any): string {
        const jsonString = JSON.stringify(data);
        return CryptoJS.AES.encrypt(jsonString, this.encryptionKey).toString();
    }

    private decrypt(encryptedData: string): any {
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
            const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
            return JSON.parse(decryptedString);
        } catch (error) {
            console.error('Decryption failed:', error);
            return null;
        }
    }

    // API Credentials
    saveApiCredentials(apiKey: string, apiSecret: string): void {
        const encrypted = this.encrypt({ apiKey, apiSecret });
        this.store.set('apiKey', encrypted);
    }

    getApiCredentials(): { apiKey: string; apiSecret: string } | null {
        const encrypted = this.store.get('apiKey');
        if (!encrypted) return null;
        return this.decrypt(encrypted as string);
    }

    clearApiCredentials(): void {
        this.store.delete('apiKey');
    }

    // Instagram Session
    saveInstagramSession(cookies: any[], session: any, username: string): void {
        const encrypted = this.encrypt({ cookies, session, username });
        this.store.set('instagramSession', encrypted);
    }

    getInstagramSession(): { cookies: any[]; session: any; username: string } | null {
        const encrypted = this.store.get('instagramSession');
        if (!encrypted) return null;
        return this.decrypt(encrypted as string);
    }

    clearInstagramSession(): void {
        this.store.delete('instagramSession');
    }

    // Settings
    saveSetting<K extends keyof NonNullable<SecureStoreData['settings']>>(
        key: K,
        value: NonNullable<SecureStoreData['settings']>[K]
    ): void {
        const settings = this.store.get('settings', {});
        this.store.set('settings', { ...settings, [key]: value });
    }

    getSetting<K extends keyof NonNullable<SecureStoreData['settings']>>(
        key: K
    ): NonNullable<SecureStoreData['settings']>[K] | undefined {
        const settings = this.store.get('settings', {});
        return settings[key];
    }

    getAllSettings(): NonNullable<SecureStoreData['settings']> {
        return this.store.get('settings', {});
    }

    // Generic encrypted storage
    saveEncrypted(key: string, value: any): void {
        const encrypted = this.encrypt(value);
        this.store.set(key as any, encrypted);
    }

    getEncrypted(key: string): any {
        const encrypted = this.store.get(key as any);
        if (!encrypted) return null;
        if (typeof encrypted !== 'string') return encrypted; // Not encrypted
        return this.decrypt(encrypted);
    }

    deleteKey(key: string): void {
        this.store.delete(key as any);
    }

    // Clear all data
    clearAll(): void {
        this.store.clear();
    }

    // Check if user is authenticated
    isAuthenticated(): boolean {
        return this.getApiCredentials() !== null;
    }

    // Check if Instagram is logged in
    isInstagramLoggedIn(): boolean {
        return this.getInstagramSession() !== null;
    }
}

// Singleton instance
export const secureStore = new SecureStore();
export default SecureStore;
