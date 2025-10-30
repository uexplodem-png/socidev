import puppeteer, { Browser, Page } from 'puppeteer';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createCursor, GhostCursor } from 'ghost-cursor';
import UserAgent from 'user-agents';
import randomstring from 'randomstring';
import { secureStore } from '../storage/SecureStore';

// Add stealth plugin to avoid detection
puppeteerExtra.use(StealthPlugin());

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
    await this.page!.evaluate((amount) => {
      window.scrollBy({ top: amount, behavior: 'smooth' });
    }, scrollAmount);
    await this.randomDelay(1000, 2000);
  }

  // Launch browser with stealth settings
  async launch(): Promise<void> {
    console.log('Launching browser with stealth mode...');

    const userAgent = new UserAgent({ deviceCategory: 'desktop' });

    this.browser = await puppeteerExtra.launch({
      headless: false, // Use real browser for first login
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-blink-features=AutomationControlled',
        `--window-size=${1280 + Math.floor(Math.random() * 200)},${800 + Math.floor(Math.random() * 200)}`,
      ],
      defaultViewport: null,
    });

    this.page = await this.browser.newPage();

    // Set realistic user agent
    await this.page.setUserAgent(userAgent.toString());

    // Set extra headers
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    // Randomize viewport
    await this.page.setViewport({
      width: 1280 + Math.floor(Math.random() * 200),
      height: 800 + Math.floor(Math.random() * 200),
    });

    // Initialize ghost cursor for human-like mouse movements
    this.cursor = createCursor(this.page);

    // Load saved cookies if available
    const session = secureStore.getInstagramSession();
    if (session && session.cookies) {
      console.log('Loading saved cookies...');
      await this.page.setCookie(...session.cookies);
      this.isLoggedIn = true;
      this.username = session.username;
    }

    console.log('Browser launched successfully');
  }

  // Manual login flow (one-time)
  async login(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.browser || !this.page) {
        await this.launch();
      }

      console.log('Navigating to Instagram login page...');
      await this.page!.goto('https://www.instagram.com/accounts/login/', {
        waitUntil: 'networkidle2',
      });

      await this.randomDelay(2000, 4000);

      // Wait for user to manually log in
      console.log('Waiting for manual login... (Please log in manually)');

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
      const username = await this.page!.evaluate(() => {
        const profileLink = document.querySelector('a[href*="/"][aria-label*="Profile"]');
        if (profileLink) {
          const href = profileLink.getAttribute('href');
          return href?.replace(/\//g, '') || '';
        }
        return '';
      });

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
