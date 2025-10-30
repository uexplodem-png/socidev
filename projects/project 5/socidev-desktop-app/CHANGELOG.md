# Changelog

All notable changes to SociDev Desktop App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-30

### Added
- Initial release of SociDev Desktop App
- API key authentication with SociDev backend
- Instagram automation with advanced anti-detection
- Puppeteer-extra with stealth plugin
- Navigator property overrides for bot detection evasion
- Human-like behavior simulation:
  - Random mouse movements
  - Ghost cursor for natural movements
  - Realistic scrolling and reading time
  - Random hover over elements
  - Variable typing speed
- Encrypted credential storage with AES-256
- Machine-specific encryption keys
- Instagram session persistence
- System tray integration
- Auto-launch on system boot (optional)
- Cross-platform support (Windows, macOS, Linux)
- Task management and execution
- Progress tracking and reporting

### Security
- ASAR packaging for code protection
- Maximum compression enabled
- Source code obfuscation
- Encrypted storage for credentials
- Hardware-bound encryption keys
- No source code exposure to users

### Anti-Detection Features
- Stealth plugin configuration
- webdriver property removal
- Chrome object injection
- Realistic plugin list
- Natural user agent strings
- Randomized viewports
- Sec-Fetch headers
- Human behavior patterns
- Rate limiting (30 actions/hour)

## [Unreleased]

### Planned Features
- Comment automation with AI text generation
- Direct Message (DM) automation
- Story viewing automation
- Profile viewing automation
- Screenshot capture for proof
- Multiple Instagram account support
- Task scheduling
- Performance analytics
- Auto-update functionality
- Proxy support
- Custom action sequences

### Known Issues
- Puppeteer WebSocket connection may fail on first launch (restart fixes)
- macOS Gatekeeper warning on first launch (normal for unsigned apps)
- Some antivirus software may flag as false positive (due to Puppeteer)

## Version Guidelines

### Version Format: MAJOR.MINOR.PATCH

- **MAJOR**: Incompatible API changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

### Release Types

- **Alpha**: Early testing (x.x.x-alpha.x)
- **Beta**: Feature complete testing (x.x.x-beta.x)
- **Release Candidate**: Pre-release testing (x.x.x-rc.x)
- **Stable**: Production release (x.x.x)

---

[1.0.0]: https://github.com/uexplodem-png/socidev/releases/tag/v1.0.0
