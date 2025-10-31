# Socidev Desktop App - Copilot Instructions

## Project Overview
Cross-platform desktop application built with Electron, React, and Node.js, designed to run on Windows, macOS, and Linux.

## Technology Stack
- **Framework**: Electron
- **UI Library**: React 18+ with TypeScript
- **Runtime**: Node.js with advanced libraries
- **State Management**: Zustand
- **Routing**: React Router v6
- **Build Tools**: Vite + electron-builder
- **Styling**: Tailwind CSS
- **Icons**: React Icons

## Advanced Node.js Libraries
- **fs-extra**: Enhanced file system operations
- **node-notifier**: Cross-platform system notifications
- **systeminformation**: System and hardware information
- **electron-store**: Persistent user data storage
- **electron-updater**: Auto-update functionality
- **electron-log**: Advanced logging
- **node-schedule**: Task scheduling
- **axios**: HTTP client
- **socket.io-client**: Real-time communication

## Advanced React Libraries
- **React Query**: Data fetching and caching
- **Framer Motion**: Animations
- **React Hook Form**: Form management
- **date-fns**: Date manipulation
- **chart.js / recharts**: Data visualization
- **react-dropzone**: File upload
- **react-toastify**: Notifications

## Project Structure
```
socidev desktop app/
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.ts
│   │   └── ipc/        # IPC handlers
│   ├── preload/        # Preload scripts
│   │   └── preload.ts
│   ├── renderer/       # React application
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── utils/
│   │   └── styles/
│   └── shared/         # Shared types and constants
├── assets/             # Static resources
├── build/              # Build configuration
└── dist/               # Built application
```

## Development Guidelines
- Use TypeScript for type safety
- Follow React best practices and hooks patterns
- Implement secure IPC communication
- Use modern ES6+ features
- Follow Electron security best practices
- Implement proper error handling
- Use async/await for asynchronous operations

## Security
- Context isolation enabled
- nodeIntegration disabled
- Secure IPC communication via preload script
- CSP (Content Security Policy) implementation
