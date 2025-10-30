# Security & Distribution Guide

## 🔒 Security Features

### Code Protection

#### 1. ASAR Packaging
All application source code is packed into an encrypted ASAR archive:
- **Location**: `app.asar` inside the application package
- **Protection**: Users cannot access or modify source code
- **Compression**: Maximum compression reduces size and adds obfuscation
- **Integrity**: ASAR integrity checks prevent tampering

#### 2. Code Obfuscation
Production builds include:
- JavaScript minification
- Variable name mangling
- Dead code elimination
- Console logs removed
- Debugger statements removed

#### 3. Encrypted Storage
All sensitive data is encrypted:
- **Algorithm**: AES-256-CBC
- **Key Generation**: Machine-specific hardware ID
- **Storage**: electron-store with encryption
- **Protected Data**:
  - API credentials (key + secret)
  - Instagram session cookies
  - User settings
  - Task history

#### 4. No Source Exposure
Users see only:
- Application executable/package
- Installation files
- License agreement
- No access to:
  - TypeScript source
  - React components
  - Business logic
  - API implementation

### Reverse Engineering Protection

While no protection is 100% foolproof, we implement multiple layers:

1. **ASAR Archive**: Binary format, not plain text
2. **Minification**: Code is compressed and hard to read
3. **No Source Maps**: Production builds don't include debugging info
4. **Native Modules**: Critical code in native addons (optional)
5. **Runtime Checks**: Anti-debugging and anti-tampering checks

### Recommended Additional Protection (Optional)

For commercial distribution, consider:

1. **Code Signing**:
   - macOS: Apple Developer certificate
   - Windows: Code signing certificate (EV recommended)
   - Linux: GPG signing

2. **Obfuscation Tools**:
   - `javascript-obfuscator`
   - `webpack-obfuscator`
   - `bytenode` for true compilation

3. **License Management**:
   - Online license validation
   - Hardware-based licensing
   - Time-limited trials

4. **Update System**:
   - Signed updates
   - Encrypted update channels
   - Rollback protection

## 📦 Distribution Methods

### 1. Direct Download (Recommended for Initial Release)

**Pros**:
- Simple to set up
- Full control
- No third-party dependencies

**Cons**:
- Manual updates
- No automatic installation
- Need web hosting

**Setup**:
```bash
# Build all platforms
npm run dist:all

# Upload to your server
scp release/* user@yourserver.com:/downloads/
```

### 2. GitHub Releases

**Pros**:
- Free hosting
- Version management
- Download statistics
- Release notes

**Cons**:
- Public (unless private repo)
- Size limits (2GB per file)

**Setup**:
1. Create release on GitHub
2. Upload binaries from `release/` folder
3. Add release notes
4. Publish

### 3. Auto-Update Server (Advanced)

**Pros**:
- Automatic updates
- Delta updates (smaller downloads)
- Gradual rollout

**Cons**:
- Requires server setup
- More complex

**Tools**:
- `electron-updater`
- `Hazel` (simple update server)
- Custom solution

### 4. App Stores

**macOS App Store**:
- Requires Apple Developer account ($99/year)
- App review process
- Sandboxing requirements
- Automatic updates

**Microsoft Store**:
- Free submission
- App review process
- Automatic updates
- Better discoverability

**Snap Store (Linux)**:
- Free submission
- Multiple Linux distros
- Automatic updates

## 🚀 Deployment Checklist

### Before Building

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md`
- [ ] Test all features
- [ ] Run on all target platforms
- [ ] Update documentation
- [ ] Add/update icons
- [ ] Review security settings
- [ ] Check dependencies for vulnerabilities
- [ ] Remove debug code
- [ ] Test API endpoints

### Building

- [ ] Clean build: `rm -rf dist release`
- [ ] Install dependencies: `npm install`
- [ ] Build: `npm run build`
- [ ] Package: `npm run dist:all`
- [ ] Test installers on clean systems

### After Building

- [ ] Test installation on clean VMs
- [ ] Verify app launches correctly
- [ ] Test all features in production mode
- [ ] Check file sizes
- [ ] Scan with antivirus (false positives?)
- [ ] Test auto-update (if enabled)
- [ ] Verify code signing (if applied)

### Distribution

- [ ] Upload to hosting/GitHub
- [ ] Create release notes
- [ ] Update website/documentation
- [ ] Announce to users
- [ ] Monitor for issues
- [ ] Prepare hotfix plan

## 🛡️ Security Best Practices

### For Developers

1. **Never commit secrets**:
   - API keys
   - Certificates
   - Passwords
   - Private keys

2. **Use environment variables**:
   ```bash
   export API_BASE_URL="https://api.socidev.com"
   npm run dist
   ```

3. **Keep dependencies updated**:
   ```bash
   npm audit
   npm update
   ```

4. **Review code before release**:
   - Remove console.log statements
   - Remove debug code
   - Check for hardcoded credentials

### For Users

Instructions to include in user documentation:

1. **Download only from official sources**
2. **Verify checksums** (provide SHA-256):
   ```bash
   shasum -a 256 SociDev-1.0.0-mac.dmg
   ```
3. **Keep software updated**
4. **Report suspicious behavior**

## 📊 File Size Optimization

Current sizes (approximate):

- **macOS DMG**: ~150 MB
- **Windows NSIS**: ~120 MB
- **Linux AppImage**: ~140 MB

### Reduce Size

1. **Remove unused dependencies**:
   ```bash
   npm prune --production
   ```

2. **Exclude dev dependencies**:
   - Already configured in `package.json`

3. **Compress assets**:
   - Optimize images
   - Use WebP format
   - Minify CSS

4. **Use CDN for heavy resources** (if online):
   - Icons
   - Fonts
   - Themes

## 🔍 Testing Checklist

### Installation Testing

- [ ] Clean install on Windows 10/11
- [ ] Clean install on macOS 12+
- [ ] Clean install on Ubuntu 20.04+
- [ ] Install as admin/root
- [ ] Install as regular user
- [ ] Install to custom directory
- [ ] Desktop shortcut works
- [ ] Start menu shortcut works

### Runtime Testing

- [ ] First launch (no config)
- [ ] Login with API credentials
- [ ] Connect Instagram account
- [ ] Execute tasks
- [ ] Minimize to tray
- [ ] Restore from tray
- [ ] Close and reopen (state persists)
- [ ] Logout and login again
- [ ] Test with no internet
- [ ] Test with slow internet

### Uninstall Testing

- [ ] Uninstall cleanly
- [ ] Config files removed (if option selected)
- [ ] No registry/system traces
- [ ] Shortcuts removed
- [ ] Can reinstall after uninstall

## 📞 Support

For security issues:
- **Email**: security@socidev.com
- **Report**: Confidential security reports only

For general support:
- **Documentation**: https://socidev.com/docs
- **Issues**: https://github.com/uexplodem-png/socidev/issues

---

**Last Updated**: 2025-10-30
**Version**: 1.0.0
