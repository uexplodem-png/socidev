# Build Instructions - SociDev Desktop App

## 🏗️ Building Production Release

### Prerequisites

1. **Node.js 18+** installed
2. **Git** installed
3. **Platform-specific requirements**:
   - **Windows**: Windows SDK (for signing - optional)
   - **macOS**: Xcode Command Line Tools
   - **Linux**: Standard build tools

### Installation

```bash
cd socidev-desktop-app
npm install
```

### Build Steps

#### 1. Build All Code
```bash
# Build main process (Electron)
npm run build:main

# Build renderer process (React)
npm run build:renderer

# Or build both at once
npm run build
```

#### 2. Create Distribution Package

**For Current Platform:**
```bash
npm run dist
```

**For Specific Platform:**
```bash
# macOS (requires macOS)
npm run dist:mac

# Windows (can be built on any platform)
npm run dist:win

# Linux (can be built on any platform)
npm run dist:linux
```

**For All Platforms:**
```bash
npm run dist:all
```

### Output Location

All distribution files will be in the `release/` directory:

```
release/
├── SociDev-1.0.0-mac.dmg              # macOS installer
├── SociDev-1.0.0-mac.zip              # macOS portable
├── SociDev-1.0.0-win-x64.exe          # Windows installer (64-bit)
├── SociDev-1.0.0-win-ia32.exe         # Windows installer (32-bit)
├── SociDev-1.0.0-portable.exe         # Windows portable
├── SociDev-1.0.0.AppImage             # Linux AppImage
├── SociDev-1.0.0.deb                  # Debian package
└── SociDev-1.0.0.rpm                  # Red Hat package
```

## 🔒 Security Features

### ASAR Packaging
All source code is automatically packed into an encrypted ASAR archive:
- Users cannot access source files
- Code is compressed
- Integrity protected

### Code Protection
- Production builds use `asar: true` (enabled by default)
- Maximum compression enabled
- Unused node_modules excluded
- Source maps excluded

### Encrypted Storage
- API credentials encrypted with AES-256
- Machine-specific encryption keys
- Instagram sessions encrypted

## 📦 Distribution Formats

### Windows

**NSIS Installer (.exe)**
- Full installer with wizard
- Desktop shortcut option
- Start menu shortcut
- Uninstaller included
- Per-machine or per-user installation

**Portable (.exe)**
- Single executable file
- No installation required
- Runs from any location
- Settings stored in app directory

### macOS

**DMG Installer (.dmg)**
- Drag-and-drop installation
- Beautiful installer window
- Automatic code signing (if configured)
- Notarization ready

**ZIP Archive (.zip)**
- Portable version
- Extract and run
- No installation required

### Linux

**AppImage**
- Universal Linux package
- No installation required
- Works on all distributions
- Just `chmod +x` and run

**DEB Package (.deb)**
- For Debian/Ubuntu systems
- `sudo dpkg -i` to install
- System integration

**RPM Package (.rpm)**
- For Red Hat/Fedora systems
- `sudo rpm -i` to install
- System integration

## 🎨 Icons

### Required Icon Files

Place in `build/` directory:

- **icon.icns** - macOS icon (512x512)
- **icon.ico** - Windows icon (256x256)
- **icon.png** - Linux icon (512x512)

### Generate Icons

From a single 1024x1024 PNG:

```bash
# macOS (requires iconutil)
iconutil -c icns -o build/icon.icns icon.iconset/

# Windows (requires ImageMagick)
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 build/icon.ico

# Linux
cp icon.png build/icon.png
```

Or use online tools:
- https://cloudconvert.com/png-to-icns
- https://cloudconvert.com/png-to-ico

## 🔐 Code Signing (Optional)

### macOS Code Signing

1. **Get Apple Developer Certificate**
2. **Set environment variables:**
   ```bash
   export APPLE_ID="your@email.com"
   export APPLE_ID_PASSWORD="app-specific-password"
   export TEAM_ID="your-team-id"
   ```
3. **Build with signing:**
   ```bash
   npm run dist:mac
   ```

### Windows Code Signing

1. **Get Code Signing Certificate**
2. **Set in package.json:**
   ```json
   "win": {
     "certificateFile": "path/to/cert.pfx",
     "certificatePassword": "password"
   }
   ```
3. **Build with signing:**
   ```bash
   npm run dist:win
   ```

## 🚀 Quick Build Checklist

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md` (if exists)
- [ ] Run `npm install` to ensure dependencies are up to date
- [ ] Run `npm run build` to compile all code
- [ ] Test in development: `npm run dev`
- [ ] Build distribution: `npm run dist` or `npm run dist:all`
- [ ] Test installers on target platforms
- [ ] Upload to releases

## 🐛 Troubleshooting

### "electron-builder not found"
```bash
npm install electron-builder --save-dev
```

### "Cannot find module"
```bash
npm install
npm run build
```

### "ASAR integrity error"
Clear dist and rebuild:
```bash
rm -rf dist release
npm run build
npm run dist
```

### Windows: "NSIS error"
Make sure NSIS is installed or use Docker:
```bash
docker run --rm -v $(pwd):/project electronuserland/builder npm run dist:win
```

### macOS: "Code signing failed"
Disable code signing for testing:
```json
"mac": {
  "identity": null
}
```

## 📊 Build Size Optimization

Current package sizes (approximate):

- **macOS DMG**: ~150 MB (includes Chromium)
- **Windows EXE**: ~120 MB (includes Chromium)
- **Linux AppImage**: ~140 MB (includes Chromium)

To reduce size:
1. Remove unused dependencies
2. Enable maximum compression
3. Exclude unnecessary files
4. Use `externals` in webpack config

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Build Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: npm install
      - run: npm run build
      - run: npm run dist
      
      - uses: actions/upload-artifact@v3
        with:
          name: release-${{ matrix.os }}
          path: release/*
```

## 📝 Version Management

Update version before building:

```bash
# Patch: 1.0.0 -> 1.0.1
npm version patch

# Minor: 1.0.0 -> 1.1.0
npm version minor

# Major: 1.0.0 -> 2.0.0
npm version major
```

This automatically:
- Updates package.json
- Creates git tag
- Commits changes

## 🎯 Production Checklist

Before releasing to users:

- [ ] All features working
- [ ] No console errors
- [ ] Test on all platforms
- [ ] Icons included
- [ ] License file included
- [ ] README updated
- [ ] Version number updated
- [ ] Build and test installers
- [ ] Test installation process
- [ ] Test auto-update (if configured)
- [ ] Test uninstall process
- [ ] Security review complete
- [ ] Performance optimized
- [ ] Error handling tested
- [ ] Backup/restore tested

## 📮 Publishing

After building, distribute via:
- GitHub Releases
- Company website
- Auto-update server
- Third-party platforms

---

**Questions?** Check the main README.md or open an issue on GitHub.
