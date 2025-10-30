# SociDev Desktop App

Cross-platform desktop automation app for SociDev with ultra human-like Instagram bot capabilities.

## Features

- 🔐 **Secure Authentication** - API key + secret authentication with SociDev backend
- 🤖 **Instagram Automation** - Human-like bot with stealth capabilities
- 🔒 **Encrypted Storage** - All session data encrypted with machine-specific keys
- 🎭 **Stealth Mode** - Puppeteer with stealth plugin to avoid bot detection
- 🖱️ **Human Behavior** - Ghost cursor, random delays, realistic typing
- 💾 **Session Persistence** - One-time manual login, sessions saved securely
- 🚀 **Auto-Launch** - Optional start on system boot
- 📊 **Task Management** - Fetch and execute tasks from SociDev API

## Architecture

### Main Process (Electron)
- **main.ts** - Electron main process with IPC handlers
- **SecureStore.ts** - Encrypted storage using electron-store + crypto-js
- **SociDevClient.ts** - API client for backend communication
- **InstagramBot.ts** - Puppeteer automation with stealth

### Renderer Process (React)
- **App.tsx** - Main React application
- Login screen for API authentication
- Instagram connection status
- Task progress viewer

## Security Features

- ❌ **No Instagram API** - Uses real browser automation (Puppeteer) to avoid bot detection
- ❌ **No SQLite** - Simple encrypted key-value storage
- ✅ **One-time manual login** - User logs in once, session persists
- ✅ **Machine-specific encryption** - Encryption key derived from machine ID
- ✅ **Stealth plugin** - Evades all common bot detection tests
- ✅ **Human-like behavior** - Realistic mouse movements, typing, scrolling

## Anti-Detection Measures

1. **Stealth Plugin** - Removes all automation indicators
2. **Ghost Cursor** - Human-like mouse movements with bezier curves
3. **Random Delays** - 2-8 second delays between actions
4. **Realistic Typing** - Variable typing speed with random pauses
5. **User Agent Rotation** - Randomized desktop user agents
6. **Viewport Randomization** - Slight variations in window size
7. **Rate Limiting** - Max 30 actions per hour (Instagram safety)
8. **Random Scrolling** - Mimic human browsing behavior

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Install Dependencies
```bash
npm install
```

### Run Development Mode
```bash
npm run dev
```

This runs:
- Main process: TypeScript compilation + Electron
- Renderer process: Vite dev server (port 5175)

### Build
```bash
npm run build
```

### Package for Distribution
```bash
npm run package       # Current platform
npm run package:all   # All platforms (Mac, Windows, Linux)
```

## Project Structure

```
socidev-desktop-app/
├── src/
│   ├── main/
│   │   ├── main.ts                 # Electron main process
│   │   ├── preload.ts              # IPC bridge
│   │   ├── api/
│   │   │   └── SociDevClient.ts    # Backend API client
│   │   ├── instagram/
│   │   │   └── InstagramBot.ts     # Puppeteer automation
│   │   └── storage/
│   │       └── SecureStore.ts      # Encrypted storage
│   └── renderer/
│       ├── App.tsx                 # Main React component
│       ├── main.tsx                # React entry point
│       └── index.css               # Tailwind CSS
├── dist/                           # Build output
├── release/                        # Packaged apps
├── package.json
├── tsconfig.main.json
├── tsconfig.renderer.json
├── vite.config.ts
└── tailwind.config.js
```

## Usage

1. **Get API Credentials**
   - Log in to SociDev web app
   - Go to Settings > API
   - Generate your API key and secret

2. **Launch Desktop App**
   - Enter your API key and secret
   - Click "Login"

3. **Connect Instagram**
   - Click "Connect Instagram"
   - Browser will open - log in manually
   - Session will be saved securely

4. **Automation**
   - App will fetch tasks from SociDev API
   - Tasks executed with human-like behavior
   - Progress reported back to API

## Task Types

- ✅ **Like** - Like posts
- ✅ **Follow** - Follow users
- 🚧 **Comment** - Coming soon
- 🚧 **DM** - Coming soon
- 🚧 **View Story** - Coming soon
- 🚧 **View Profile** - Coming soon

## Rate Limits

To avoid Instagram detection:
- Max 30 actions per hour
- 2-8 second delays between actions
- Random scrolling and browsing
- Realistic human behavior patterns

## Troubleshooting

### App won't start
- Make sure all dependencies are installed: `npm install`
- Check Node.js version: `node --version` (should be 18+)

### Instagram login fails
- Make sure you're logging in manually (not using credentials in code)
- Check your internet connection
- Try clearing browser data

### Tasks not executing
- Verify API credentials are correct
- Check that Instagram account is logged in
- Review rate limits (max 30/hour)

## License

MIT License - SociDev Team
