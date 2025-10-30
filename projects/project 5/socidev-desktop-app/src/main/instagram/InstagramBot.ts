import puppeteer, { Browser, Page } from 'puppeteer';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createCursor, GhostCursor } from 'ghost-cursor';
import UserAgent from 'user-agents';
import randomstring from 'randomstring';
import { secureStore } from '../storage/SecureStore';

// Configure stealth plugin with maximum evasion
const stealth = StealthPlugin();
stealth.enabledEvasions.delete('iframe.contentWindow');
stealth.enabledEvasions.delete('navigator.plugins');
puppeteerExtra.use(stealth);

interface InstagramSession {
    cookies: any[];
    session: any;
    username: string;
}

interface TaskAction {
    type: 'like' | 'follow' | 'comment' | 'dm' | 'view_story' | 'view_profile';
    targetUrl: string;
    targetUsername?: string;
    commentText?: string;
    dmText?: string;
}

interface TaskResult {
    success: boolean;
    completed: number;
    failed: number;
    errors: string[];
    screenshots: string[];
    logs: string[];
}

class InstagramBot {
    private browser: Browser | null = null;
    private page: Page | null = null;
    private cursor: GhostCursor | null = null;
    private isLoggedIn: boolean = false;
    private username: string = '';
    private actionsPerformed: number = 0;
    private maxActionsPerHour: number = 30; // Instagram rate limit safety
    private lastActionTime: number = 0;
    private chromeProcess: any = null;
    private pieWindow: any = null;

    constructor() {
        this.loadSession();
    }

    // Load saved session from secure storage
    private loadSession(): void {
        const session = secureStore.getInstagramSession();
        if (session) {
            this.isLoggedIn = true;
            this.username = session.username;
            console.log(`Loaded Instagram session for @${this.username}`);
        }
    }

    // Random delay to mimic human behavior
    private async randomDelay(min: number = 2000, max: number = 5000): Promise<void> {
        const delay = Math.random() * (max - min) + min;
        console.log(`Waiting ${Math.round(delay / 1000)}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // Simulate realistic page reading time
    private async simulateReading(): Promise<void> {
        const readingTime = 3000 + Math.random() * 7000; // 3-10 seconds
        console.log(`Simulating reading... ${Math.round(readingTime / 1000)}s`);

        // Random scrolls during reading
        const scrolls = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < scrolls; i++) {
            await this.randomDelay(readingTime / (scrolls + 1), readingTime / scrolls);
            await this.randomScroll();
        }
    }

    // Simulate mouse hovering over elements
    private async hoverRandomElement(): Promise<void> {
        if (!this.page) return;

        try {
            const elements = await this.page.$$('a, button, img');
            if (elements.length > 0) {
                const randomElement = elements[Math.floor(Math.random() * elements.length)];
                const box = await randomElement.boundingBox();
                if (box) {
                    await this.page.mouse.move(
                        box.x + box.width / 2 + (Math.random() - 0.5) * 10,
                        box.y + box.height / 2 + (Math.random() - 0.5) * 10,
                        { steps: 20 + Math.floor(Math.random() * 20) }
                    );
                    await this.randomDelay(500, 1500);
                }
            }
        } catch (error) {
            // Ignore errors
        }
    }

    // Human-like typing
    private async humanType(selector: string, text: string): Promise<void> {
        const input = await this.page!.$(selector);
        if (!input) throw new Error(`Element not found: ${selector}`);

        await input.click();
        await this.randomDelay(500, 1000);

        for (const char of text) {
            await input.type(char, { delay: Math.random() * 100 + 50 });
            if (Math.random() > 0.9) {
                await this.randomDelay(200, 500); // Random pause while typing
            }
        }
    }

    // Random scroll to mimic browsing
    private async randomScroll(): Promise<void> {
        const scrollAmount = Math.random() * 500 + 200;
        await this.page!.evaluate(`window.scrollBy({ top: ${scrollAmount}, behavior: 'smooth' })`);
        await this.randomDelay(1000, 2000);
    }

    // Launch browser with stealth settings
    async launch(): Promise<void> {
        console.log('Launching browser with maximum stealth mode...');

        // Use realistic user agent (real Chrome on macOS)
        const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

        // Try to find system Chrome first (more reliable on macOS)
        const systemChromePaths = [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Chromium.app/Contents/MacOS/Chromium',
            '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
        ];

        let executablePath: string | undefined;
        const fs = require('fs');

        for (const path of systemChromePaths) {
            try {
                if (fs.existsSync(path)) {
                    executablePath = path;
                    console.log(`Found system browser at: ${path}`);
                    break;
                }
            } catch (e) {
                // Continue to next path
            }
        }

        // Fallback to bundled Chromium if no system browser found
        if (!executablePath) {
            executablePath = puppeteer.executablePath();
            console.log(`Using bundled Chromium at: ${executablePath}`);

            // Try to make it executable
            try {
                const { execSync } = require('child_process');
                execSync(`chmod +x "${executablePath}"`);
                console.log('Set execute permissions on Chromium');
            } catch (e) {
                console.warn('Could not set execute permissions:', e);
            }
        }

        // Create user data directory for persistent session
        const os = require('os');
        const path = require('path');
        const userDataDir = path.join(os.tmpdir(), 'socidev-chrome-data');

        // Platform-specific flags (macOS tuned)
        const commonArgs = [
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--disable-infobars',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI,BlinkGenPropertyTrees',
            '--disable-ipc-flooding-protection',
            '--disable-hang-monitor',
            '--disable-client-side-phishing-detection',
            '--disable-popup-blocking',
            '--disable-prompt-on-repost',
            '--disable-domain-reliability',
            '--disable-component-extensions-with-background-pages',
            '--disable-default-apps',
            '--disable-extensions',
            '--disable-component-update',
            '--disable-background-networking',
            '--mute-audio',
            '--no-default-browser-check',
            '--no-first-run',
            '--no-pings',
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--ignore-certificate-errors-spki-list',
            '--disable-site-isolation-trials',
            '--disable-features=IsolateOrigins,site-per-process',
            '--window-size=1440,900',
            '--disable-notifications',
            `--user-agent=${userAgent}`,
        ];

        const isMac = process.platform === 'darwin';
        const isLinux = process.platform === 'linux';
        const isWin = process.platform === 'win32';

        const platformArgs = [
            ...(isMac ? ['--disable-gpu', '--disable-software-rasterizer'] : []),
            ...(isLinux ? ['--no-sandbox', '--disable-setuid-sandbox'] : []),
            // Avoid unstable process model flags on macOS
        ];

        const { spawn } = require('child_process');
        const chromeArgs = [
            `--user-data-dir=${userDataDir}`,
            '--remote-debugging-port=0', // let Chrome choose an open port
            '--remote-debugging-address=127.0.0.1',
            '--remote-allow-origins=*',
            '--allow-running-insecure-content',
            '--no-default-browser-check',
            '--no-first-run',
            ...commonArgs,
            ...platformArgs,
            'about:blank', // ensure a window opens and stays
        ];

        console.log(`Spawning Chrome: ${executablePath}`);
        this.chromeProcess = spawn(executablePath, chromeArgs, {
            stdio: ['ignore', 'pipe', 'pipe'],
            env: process.env,
        });

        const wsUrl: string = await new Promise((resolve, reject) => {
            let resolved = false;
            const timeout = setTimeout(() => {
                if (!resolved) {
                    reject(new Error('Timed out waiting for DevTools websocket URL'));
                }
            }, 90000);

            const onData = (data: Buffer) => {
                const text = data.toString();
                const match = text.match(/DevTools listening on (ws:\/\/[^\s]+)/);
                if (match && match[1]) {
                    resolved = true;
                    clearTimeout(timeout);
                    resolve(match[1]);
                }
            };

            this.chromeProcess.stdout.on('data', onData);
            this.chromeProcess.stderr.on('data', onData);
            this.chromeProcess.on('exit', (code: number) => {
                if (!resolved) {
                    reject(new Error(`Chrome exited early with code ${code}`));
                }
            });
        });

        console.log(`Connecting to Chrome via ${wsUrl}`);
        const baseUrlMatch = wsUrl.match(/^ws:\/\/(.*?):(\d+)\//);
        const browserURL = baseUrlMatch ? `http://${baseUrlMatch[1]}:${baseUrlMatch[2]}` : '';

        let lastErr: any = null;
        // Try WebSocket first
        for (let attempt = 1; attempt <= 3 && !this.browser; attempt++) {
            try {
                this.browser = await puppeteerExtra.connect({ browserWSEndpoint: wsUrl, protocolTimeout: 180000 });
                console.log(`Browser connected via WS on attempt ${attempt}!`);
            } catch (err: any) {
                lastErr = err;
                console.warn(`WS connect attempt ${attempt} failed:`, err?.message || err);
                await new Promise(r => setTimeout(r, 1200 * attempt));
            }
        }

        // Fallback to browserURL (HTTP) if needed
        if (!this.browser && browserURL) {
            for (let attempt = 1; attempt <= 3 && !this.browser; attempt++) {
                try {
                    this.browser = await puppeteerExtra.connect({ browserURL, protocolTimeout: 180000 });
                    console.log(`Browser connected via HTTP on attempt ${attempt}!`);
                } catch (err: any) {
                    lastErr = err;
                    console.warn(`HTTP connect attempt ${attempt} failed:`, err?.message || err);
                    await new Promise(r => setTimeout(r, 1200 * attempt));
                }
            }
        }

        if (!this.browser) {
            // Ensure spawned Chrome is terminated on failure
            try { this.chromeProcess?.kill('SIGKILL'); } catch { }
            this.chromeProcess = null;

            // Fallback: use puppeteer-in-electron to control an Electron BrowserWindow directly
            console.warn('Falling back to puppeteer-in-electron control...');
            const pie = require('puppeteer-in-electron');
            const { app, BrowserWindow } = require('electron');
            // Don't call pie.initialize again; it was done at startup in main.ts
            const pieBrowser = await pie.connect(app, puppeteer);
            this.pieWindow = new BrowserWindow({
                show: true,
                width: 1440,
                height: 900,
                webPreferences: {
                    partition: 'persist:socidev-instagram',
                    contextIsolation: false, // Allow content scripts
                    nodeIntegration: false,
                    webSecurity: false, // Allow cross-origin for Instagram
                    javascript: true,
                }
            });
            await this.pieWindow.loadURL('about:blank');
            this.page = await pie.getPage(pieBrowser, this.pieWindow);

            // Wait for page to be ready before proceeding
            await new Promise(r => setTimeout(r, 1000));

            // Assign a dummy browser object that exposes minimal API used later
            this.browser = pieBrowser as unknown as Browser;
            console.log('Connected via puppeteer-in-electron');
        }

        if (!this.browser) {
            throw new Error('Browser not initialized');
        }

        // Create new page (skip if already set by PIE)
        if (!this.page) {
            const pages = await this.browser.pages();
            this.page = pages[0] || await this.browser.newPage();

            if (!this.page) {
                throw new Error('Failed to create new page');
            }
        }

        // Enhanced anti-detection: Override navigator properties (skip for PIE if not supported)
        try {
            await this.page.evaluateOnNewDocument(`
        // Override the navigator.webdriver property
        Object.defineProperty(Object.getPrototypeOf(navigator), 'webdriver', {
          get: () => undefined,
          configurable: true
        });
        
        // Override permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: 'denied' }) :
            originalQuery(parameters)
        );

        // Add chrome object
        window.chrome = {
          runtime: {},
          loadTimes: function() {},
          csi: function() {},
          app: {}
        };

        // Override plugins
        Object.defineProperty(Object.getPrototypeOf(navigator), 'plugins', {
          get: () => [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
            { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
            { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' }
          ],
          configurable: true
        });

        // Override languages
        Object.defineProperty(Object.getPrototypeOf(navigator), 'languages', {
          get: () => ['en-US', 'en'],
          configurable: true
        });

        // Override platform
        Object.defineProperty(Object.getPrototypeOf(navigator), 'platform', {
          get: () => 'MacIntel',
          configurable: true
        });

        // Override vendor
        Object.defineProperty(Object.getPrototypeOf(navigator), 'vendor', {
          get: () => 'Google Inc.',
          configurable: true
        });
      `);
        } catch (e) {
            console.warn('evaluateOnNewDocument not supported, skipping...');
        }

        // Set realistic user agent
        try {
            await this.page.setUserAgent(userAgent);
        } catch (e) {
            console.warn('setUserAgent not supported');
        }

        // Set realistic headers
        try {
            await this.page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"macOS"',
                'Upgrade-Insecure-Requests': '1',
            });
        } catch (e) {
            console.warn('setExtraHTTPHeaders not supported');
        }

        // Set realistic viewport
        try {
            await this.page.setViewport({
                width: 1440,
                height: 900,
                deviceScaleFactor: 2, // Retina display
                hasTouch: false,
                isLandscape: true,
                isMobile: false,
            });
        } catch (e) {
            console.warn('setViewport not supported');
        }

        // Initialize ghost cursor for human-like mouse movements
        this.cursor = createCursor(this.page);

        // Add random mouse movements to simulate human behavior
        this.startRandomMouseMovements();

        // Load saved cookies if available
        const session = secureStore.getInstagramSession();
        if (session && session.cookies) {
            console.log('Loading saved cookies...');
            await this.page.setCookie(...session.cookies);
            this.isLoggedIn = true;
            this.username = session.username;
        }

        console.log('Browser launched successfully with anti-detection measures');
    }

    // Random mouse movements to simulate human behavior
    private mouseMovementInterval: NodeJS.Timeout | null = null;

    private startRandomMouseMovements(): void {
        if (this.mouseMovementInterval) {
            clearInterval(this.mouseMovementInterval);
        }

        this.mouseMovementInterval = setInterval(async () => {
            if (this.page && this.cursor && Math.random() > 0.7) {
                try {
                    const x = Math.floor(Math.random() * 1440);
                    const y = Math.floor(Math.random() * 900);
                    await this.page.mouse.move(x, y);
                } catch (error) {
                    // Ignore errors during random movements
                }
            }
        }, 15000 + Math.random() * 15000); // Every 15-30 seconds
    }

    // Manual login flow (one-time)
    async login(): Promise<{ success: boolean; error?: string }> {
        try {
            if (!this.browser || !this.page) {
                await this.launch();
            }

            if (!this.page) {
                throw new Error('Browser page not initialized');
            }

            console.log('Navigating to Instagram...');

            // First visit instagram.com to check if already logged in
            await this.page.goto('https://www.instagram.com/', {
                waitUntil: 'domcontentloaded',
                timeout: 30000,
            });

            await this.randomDelay(2000, 4000);

            // Check if already logged in by looking for profile elements
            const isLoggedIn = await this.page.evaluate(`
        (() => {
          // Check for common logged-in indicators
          const indicators = [
            'svg[aria-label="Home"]',
            'svg[aria-label="Search"]',
            'svg[aria-label="New post"]',
            'svg[aria-label="Settings"]',
            'a[href*="/"][aria-label*="Profile"]',
            'a[href="/direct/inbox/"]',
            'input[placeholder*="Search"]'
          ];
          
          for (const selector of indicators) {
            if (document.querySelector(selector)) {
              return true;
            }
          }
          
          // Check if NOT on login page
          return !window.location.href.includes('/accounts/login');
        })()
      `);

            if (isLoggedIn) {
                console.log('✓ Already logged in to Instagram!');
            } else {
                // Not logged in, go to login page
                await this.simulateReading();

                console.log('Going to login page...');
                await this.page.goto('https://www.instagram.com/accounts/login/', {
                    waitUntil: 'networkidle2',
                    timeout: 30000,
                });

                await this.randomDelay(1500, 3000);
                await this.hoverRandomElement();

                // Wait for user to manually log in
                console.log('✓ Browser ready - Please log in manually in the opened window');

                // Wait for navigation to home page (indicates successful login)
                await this.page!.waitForNavigation({
                    waitUntil: 'networkidle2',
                    timeout: 300000, // 5 minutes timeout for manual login
                });

                // Check if login was successful
                const url = this.page!.url();
                if (!url.includes('instagram.com') || url.includes('login')) {
                    throw new Error('Login failed or timed out');
                }
            }

            console.log('Login successful! Extracting session data...');

            // Extract cookies
            const cookies = await this.page!.cookies();

            // Get username - %100 KESIN YÖNTEM: Instagram GraphQL API kullan
            await this.randomDelay(2000, 3000);
            let username = '';

            try {
                console.log('Fetching user info from Instagram API...');

                // Method 1: Instagram accounts endpoint - kendi bilgilerimizi al
                const userInfo: any = await this.page!.evaluate(`
          (() => {
            return fetch('https://www.instagram.com/api/v1/accounts/edit/web_form_data/', {
              method: 'GET',
              headers: {
                'x-ig-app-id': '936619743392459',
                'x-requested-with': 'XMLHttpRequest',
                'x-csrftoken': document.cookie.match(/csrftoken=([^;]+)/)?.[1] || ''
              },
              credentials: 'include'
            })
            .then(res => res.json())
            .then(data => {
              if (data && data.form_data) {
                return {
                  username: data.form_data.username,
                  id: data.form_data.id || '',
                  fullName: data.form_data.first_name || ''
                };
              }
              return null;
            })
            .catch(() => null);
          })()
        `);

                if (userInfo && userInfo.username) {
                    username = userInfo.username;
                    console.log(`✓ Username extracted from API: ${username} (ID: ${userInfo.id})`);
                }
            } catch (e) {
                console.warn('API method failed, trying fallback methods...', e);
            }

            // Method 2: window._sharedData (Instagram'ın global config objesi)
            if (!username) {
                try {
                    const sharedData = await this.page!.evaluate(`
            (() => {
              if (window._sharedData && window._sharedData.config && window._sharedData.config.viewer) {
                return window._sharedData.config.viewer.username;
              }
              return '';
            })()
          `);
                    if (sharedData && typeof sharedData === 'string') {
                        username = sharedData;
                        console.log(`✓ Username extracted from _sharedData: ${username}`);
                    }
                } catch (e) {
                    console.warn('_sharedData method failed:', e);
                }
            }

            // Method 3: localStorage viewer bilgisi
            if (!username) {
                try {
                    const localStorageUser = await this.page!.evaluate(`
            (() => {
              const viewer = localStorage.getItem('x-ig-viewer-username');
              return viewer ? viewer.replace(/['"]/g, '') : '';
            })()
          `);
                    if (localStorageUser && typeof localStorageUser === 'string') {
                        username = localStorageUser;
                        console.log(`✓ Username extracted from localStorage: ${username}`);
                    }
                } catch (e) {
                    console.warn('localStorage method failed:', e);
                }
            }

            // Method 4: Profil linkine git ve URL'den al (fallback)
            if (!username) {
                try {
                    console.log('Navigating to profile page...');
                    await this.page!.goto('https://www.instagram.com/accounts/edit/', { waitUntil: 'domcontentloaded', timeout: 15000 });
                    await this.randomDelay(1500, 2500);

                    const profileUsername = await this.page!.evaluate(`
            (() => {
              const input = document.querySelector('input[name="username"]');
              if (input) return input.value;
              
              const usernameText = document.querySelector('div._aa_c input');
              if (usernameText) return usernameText.value;
              
              return '';
            })()
          `);

                    if (profileUsername && typeof profileUsername === 'string') {
                        username = profileUsername;
                        console.log(`✓ Username extracted from profile edit page: ${username}`);
                    }
                } catch (e) {
                    console.warn('Profile page method failed:', e);
                }
            }

            if (!username) {
                throw new Error('Could not extract username - all methods failed');
            }

            // Save session to secure storage
            secureStore.saveInstagramSession(
                cookies,
                { loginTime: Date.now() },
                username
            );

            this.isLoggedIn = true;
            this.username = username;

            console.log(`✓ Session saved for @${username}`);

            return { success: true };
        } catch (error) {
            console.error('Login failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Login failed',
            };
        }
    }

    // Check login status
    getStatus(): { loggedIn: boolean; username?: string } {
        return {
            loggedIn: this.isLoggedIn,
            username: this.username,
        };
    }

    // Logout and clear session
    async logout(): Promise<{ success: boolean }> {
        try {
            secureStore.clearInstagramSession();
            this.isLoggedIn = false;
            this.username = '';

            // Clear mouse movement interval
            if (this.mouseMovementInterval) {
                clearInterval(this.mouseMovementInterval);
                this.mouseMovementInterval = null;
            }

            if (this.browser) {
                await this.browser.close();
                this.browser = null;
                this.page = null;
            }

            if (this.pieWindow) {
                try { this.pieWindow.close(); } catch { }
                this.pieWindow = null;
            }

            if (this.chromeProcess) {
                try { this.chromeProcess.kill('SIGKILL'); } catch { }
                this.chromeProcess = null;
            }

            console.log('Logged out successfully');
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: true }; // Return success anyway
        }
    }

    // Navigate to URL with human-like behavior
    private async navigateToUrl(url: string): Promise<void> {
        if (!this.page) throw new Error('Browser not initialized');

        console.log(`Navigating to: ${url}`);
        await this.page.goto(url, { waitUntil: 'networkidle2' });
        await this.randomDelay(2000, 4000);

        // Random scroll to appear human
        if (Math.random() > 0.5) {
            await this.randomScroll();
        }
    }

    // Like a post
    private async likePost(url: string): Promise<{ success: boolean; error?: string }> {
        try {
            await this.navigateToUrl(url);

            // Find and click like button
            const likeButton = await this.page!.$('svg[aria-label="Like"]');
            if (!likeButton) {
                // Already liked or button not found
                const unlikeButton = await this.page!.$('svg[aria-label="Unlike"]');
                if (unlikeButton) {
                    console.log('Post already liked');
                    return { success: true };
                }
                throw new Error('Like button not found');
            }

            // Use ghost cursor for human-like click
            await this.cursor!.click(likeButton);
            console.log('✓ Post liked');

            await this.randomDelay(1500, 3000);

            return { success: true };
        } catch (error) {
            console.error('Like failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Like failed',
            };
        }
    }

    // Follow a user
    private async followUser(username: string): Promise<{ success: boolean; error?: string }> {
        try {
            await this.navigateToUrl(`https://www.instagram.com/${username}/`);

            // Find follow button
            const followButton = await this.page!.$('button:has-text("Follow")');
            if (!followButton) {
                console.log('User already followed or button not found');
                return { success: true };
            }

            await this.cursor!.click(followButton);
            console.log(`✓ Followed @${username}`);

            await this.randomDelay(2000, 4000);

            return { success: true };
        } catch (error) {
            console.error('Follow failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Follow failed',
            };
        }
    }

    // Execute task
    async executeTask(task: TaskAction): Promise<{ success: boolean; error?: string }> {
        try {
            if (!this.isLoggedIn) {
                throw new Error('Not logged in to Instagram');
            }

            if (!this.browser || !this.page) {
                await this.launch();
            }

            // Check rate limiting
            const now = Date.now();
            const hourAgo = now - 60 * 60 * 1000;
            if (this.lastActionTime > hourAgo && this.actionsPerformed >= this.maxActionsPerHour) {
                throw new Error('Rate limit reached. Please wait before performing more actions.');
            }

            // Reset counter if hour has passed
            if (this.lastActionTime <= hourAgo) {
                this.actionsPerformed = 0;
            }

            let result: { success: boolean; error?: string };

            switch (task.type) {
                case 'like':
                    result = await this.likePost(task.targetUrl);
                    break;
                case 'follow':
                    result = await this.followUser(task.targetUsername!);
                    break;
                // TODO: Add more task types (comment, dm, view_story, etc.)
                default:
                    throw new Error(`Task type not implemented: ${task.type}`);
            }

            if (result.success) {
                this.actionsPerformed += 1;
                this.lastActionTime = Date.now();
            }

            return result;
        } catch (error) {
            console.error('Execute task failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Task execution failed',
            };
        }
    }
}

// Singleton export used by main process
export const instagramBot = new InstagramBot();
