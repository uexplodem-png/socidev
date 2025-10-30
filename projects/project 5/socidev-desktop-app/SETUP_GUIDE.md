# SociDev Desktop App - Installation & Setup Guide

## Quick Start

### 1. Install Dependencies

Navigate to the desktop app directory and install all required packages:

```bash
cd socidev-desktop-app
npm install
```

This will install:
- Electron 28 (desktop app framework)
- Puppeteer + Stealth Plugin (Instagram automation)
- React 18 + TypeScript (UI)
- Electron-store + Crypto-js (encrypted storage)
- Ghost-cursor (human-like mouse movements)
- Auto-launch (start on boot)
- And many more...

### 2. Development Mode

Run the app in development mode:

```bash
npm run dev
```

This will:
- Compile TypeScript for main process
- Start Vite dev server for React UI (localhost:5175)
- Launch Electron window
- Enable hot reload for UI changes

### 3. First Time Setup

#### Step 1: Get API Credentials
1. Open SociDev web app (http://localhost:5174)
2. Log in to your account
3. Go to Settings > API tab
4. Click "Generate API Key"
5. **IMPORTANT**: Copy both API Key and Secret (secret shown only once!)

#### Step 2: Launch Desktop App
1. Run `npm run dev` in socidev-desktop-app folder
2. App window will open with login screen

#### Step 3: Authenticate
1. Paste your API Key (starts with `sk_`)
2. Paste your API Secret
3. Click "Login"
4. If successful, you'll see the dashboard

#### Step 4: Connect Instagram
1. Click "Connect Instagram" button
2. Browser will open with Instagram login page
3. **Manually log in** to your Instagram account
4. Complete any 2FA/verification if needed
5. Wait for redirect to Instagram home page
6. Session will be saved automatically
7. You can close the browser - session persists!

### 4. Usage

Once authenticated and Instagram is connected:

1. **Task Fetching**: App automatically fetches tasks from SociDev API
2. **Task Execution**: Tasks executed with human-like behavior
3. **Progress Reporting**: Results sent back to SociDev API
4. **Rate Limiting**: Max 30 actions/hour to avoid detection

### 5. Building for Production

#### Build All Code
```bash
npm run build
```

This compiles:
- Main process TypeScript → `dist/main/`
- Renderer React app → `dist/renderer/`

#### Package for Distribution
```bash
# Current platform only
npm run package

# All platforms (Mac, Windows, Linux)
npm run package:all
```

Installers will be created in `release/` folder:
- **macOS**: `.dmg` and `.zip` files
- **Windows**: `.exe` installer and portable version
- **Linux**: `.AppImage` and `.deb` packages

## Configuration

### Auto-Launch on Boot

To make the app start automatically when your computer boots:

1. Open the app
2. Go to Settings
3. Enable "Start on Boot"

### Rate Limiting

Default: 30 actions per hour (Instagram safety limit)

To change:
- Edit `src/main/instagram/InstagramBot.ts`
- Modify `maxActionsPerHour` property
- **WARNING**: Higher limits increase detection risk!

### Backend API URL

Default: `http://localhost:3000/api`

To change for production:
- Edit `src/main/api/SociDevClient.ts`
- Update `API_BASE_URL` constant
- Example: `https://api.socidev.com/api`

## Troubleshooting

### TypeScript Errors

If you see TypeScript compilation errors:

```bash
# Clean build
rm -rf dist/
npm run build
```

### Module Not Found

If you see "Cannot find module" errors:

```bash
# Reinstall dependencies
rm -rf node_modules/
npm install
```

### Instagram Login Fails

Common issues:
- **2FA Required**: Complete verification in browser
- **Suspicious Login**: Instagram might require captcha
- **Timeout**: You have 5 minutes to log in manually
- **Wrong Credentials**: Double-check username/password

Solutions:
- Try logging in from same device/network previously
- Use VPN if Instagram blocks your region
- Clear Instagram cookies and try again

### Session Lost

If Instagram session expires:

1. Click "Logout" in app
2. Click "Connect Instagram" again
3. Log in manually
4. New session will be saved

### High CPU Usage

Puppeteer uses Chrome browser which can be resource-intensive:
- Close other applications
- Monitor task execution frequency
- Consider reducing rate limits

### App Won't Minimize to Tray

macOS/Linux:
- Make sure system tray is enabled
- Check notification area settings

Windows:
- Check taskbar settings
- Enable "Show hidden icons"

## Security Best Practices

1. **Never share API credentials** - They have full access to your account
2. **Keep sessions private** - Encrypted locally, never shared
3. **Use VPN** - Protect your IP address from Instagram
4. **Monitor rate limits** - Avoid excessive automation
5. **Regular logouts** - Clear sessions periodically

## API Integration

### Authentication Flow

```typescript
// Desktop app authenticates with SociDev backend
const result = await window.electronAPI.apiAuthenticate(apiKey, apiSecret);

// All subsequent requests include credentials in headers:
// X-API-Key: sk_xxxxx
// X-API-Secret: xxxxx
```

### Task Fetching

```typescript
// Get available tasks
const tasks = await window.electronAPI.apiGetTasks();

// Execute task
const result = await window.electronAPI.instagramExecuteTask(task);

// Report result
await window.electronAPI.apiReportTaskResult(taskId, result);
```

### Rate Limit Checking

```typescript
// Check remaining API requests
const rateLimit = await sociDevClient.getRateLimitStatus();
console.log(`Remaining: ${rateLimit.remaining}/${rateLimit.limit}`);
```

## Development Tips

### Hot Reload

- **Renderer changes**: Auto-reload (Vite HMR)
- **Main process changes**: Restart required (`Ctrl+C` then `npm run dev`)

### Debugging

Enable DevTools in main process:
```typescript
// src/main/main.ts (already included in dev mode)
mainWindow.webContents.openDevTools();
```

### Console Logs

All logs from renderer forwarded to main process:
```typescript
// In renderer
console.log('Debug info', data);

// Shows in terminal where you ran `npm run dev`
```

### Testing Instagram Bot

Test bot without full app:
```typescript
// Create test file: test-bot.ts
import { instagramBot } from './src/main/instagram/InstagramBot';

(async () => {
  await instagramBot.launch();
  await instagramBot.login();
  // Test tasks here
})();
```

## Production Deployment

### Backend Configuration

1. Update API URL in `SociDevClient.ts`
2. Add backend endpoints for desktop app:
   - `POST /api/desktop/tasks` - Fetch tasks
   - `POST /api/desktop/tasks/:id/start` - Start task
   - `POST /api/desktop/tasks/:id/result` - Report result
   - `PATCH /api/desktop/tasks/:id/progress` - Update progress

### Code Signing (macOS)

For distribution on macOS:
```bash
# Get Apple Developer certificate
# Add to electron-builder config
{
  "mac": {
    "identity": "Developer ID Application: Your Name",
    "hardenedRuntime": true,
    "gatekeeperAssess": false
  }
}
```

### Auto-Update

Add electron-updater for automatic updates:
```bash
npm install electron-updater
```

Configure in `package.json`:
```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "uexplodem-png",
      "repo": "socidev"
    }
  }
}
```

## Next Steps

1. **Install dependencies**: `npm install`
2. **Run development mode**: `npm run dev`
3. **Get API credentials** from web app
4. **Connect Instagram** account
5. **Start automating** tasks!

## Support

For issues or questions:
- Check logs in terminal
- Review Instagram bot console output
- Check backend API logs
- Open GitHub issue if needed

---

**Remember**: This app is for legitimate automation only. Always respect Instagram's terms of service and rate limits!
