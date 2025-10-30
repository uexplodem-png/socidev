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

    try {
      this.browser = await puppeteerExtra.launch({
        headless: false, // MUST be false for Instagram
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--disable-infobars',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--disable-hang-monitor',
          '--disable-client-side-phishing-detection',
          '--disable-popup-blocking',
          '--disable-prompt-on-repost',
          '--disable-domain-reliability',
          '--disable-component-extensions-with-background-pages',
          '--disable-default-apps',
          '--mute-audio',
          '--no-default-browser-check',
          '--no-first-run',
          '--ignore-certificate-errors',
          '--ignore-ssl-errors',
          '--ignore-certificate-errors-spki-list',
          '--disable-site-isolation-trials',
          '--enable-features=NetworkService,NetworkServiceInProcess',
          '--window-size=1440,900', // Common resolution
          '--start-maximized',
          '--disable-notifications',
          `--user-agent=${userAgent}`,
        ],
        defaultViewport: null,
        ignoreHTTPSErrors: true,
        protocolTimeout: 180000,
        dumpio: false,
        executablePath: puppeteer.executablePath(), // Use bundled Chromium
      });
    } catch (error) {
      console.error('Failed to launch browser:', error);
      throw new Error('Failed to launch browser. Please try again.');
    }

    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    // Create new page
    const pages = await this.browser.pages();
    this.page = pages[0] || await this.browser.newPage();
    
    if (!this.page) {
      throw new Error('Failed to create new page');
    }

    // Enhanced anti-detection: Override navigator properties
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

    // Set realistic user agent
    await this.page.setUserAgent(userAgent);

    // Set realistic headers
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

    // Set realistic viewport
    await this.page.setViewport({
      width: 1440,
      height: 900,
      deviceScaleFactor: 2, // Retina display
      hasTouch: false,
      isLandscape: true,
      isMobile: false,
    });

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
      
      // First visit instagram.com to make it look natural
      await this.page.goto('https://www.instagram.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      await this.randomDelay(2000, 4000);
      await this.simulateReading();
      
      // Now navigate to login page
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

      console.log('Login successful! Extracting session data...');

      // Extract cookies
      const cookies = await this.page!.cookies();

      // Get username from page
      await this.randomDelay(2000, 3000);
      const username = await this.page!.evaluate(`
        (() => {
          const profileLink = document.querySelector('a[href*="/"][aria-label*="Profile"]');
          if (profileLink) {
            const href = profileLink.getAttribute('href');
            return href ? href.replace(/\\//g, '') : '';
          }
          return '';
        })()
      `) as string;

      if (!username) {
        throw new Error('Could not extract username');
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
        this.actionsPerformed++;
        this.lastActionTime = now;
      }

      return result;
    } catch (error) {
      console.error('Task execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Task execution failed',
      };
    }
  }

  // Close browser
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

// Singleton instance
export const instagramBot = new InstagramBot();
export default InstagramBot;
