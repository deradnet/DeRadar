# DeRadar Mobile App Setup Guide

This guide covers the complete setup for building DeRadar as native iOS and Android apps using Capacitor.

## ✅ What's Been Completed

The `mobile-app` branch now has:

1. ✅ **Capacitor Core** - Installed and configured
2. ✅ **Android Platform** - Ready for development
3. ✅ **iOS Platform** - Ready for development (requires macOS + Xcode)
4. ✅ **Geolocation Plugin** - Native GPS support for both platforms
5. ✅ **Status Bar Plugin** - Dark theme status bar
6. ✅ **Splash Screen Plugin** - Launch screen configuration
7. ✅ **Build Scripts** - npm scripts for easy building
8. ✅ **Unified Geolocation** - Works on web and mobile seamlessly

## 📱 Current Branch Status

You are now on the `mobile-app` branch. This branch contains:
- All web functionality from `main` branch
- Mobile-specific Capacitor configuration
- Native Android and iOS projects
- Mobile build scripts

## 🚀 Quick Start

### Build the App

```bash
# Build Next.js and sync to native platforms
npm run cap:build

# Open in Android Studio
npm run cap:android

# Open in Xcode (macOS only)
npm run cap:ios
```

### Development Workflow

```bash
# 1. Make changes to your Next.js code
# 2. Build and sync
npm run cap:build

# 3. Open native IDE and run
npm run cap:android  # for Android
npm run cap:ios      # for iOS
```

## 📋 Requirements

### For Android Development

1. **Android Studio** (latest version)
   - Download: https://developer.android.com/studio
   - Install Android SDK API 35 (Android 15)
   - Install JDK 17+ (included with Android Studio)

2. **System Requirements**
   - 8GB RAM minimum (16GB recommended)
   - 8GB+ free disk space
   - Any OS (Windows, macOS, Linux)

### For iOS Development (Optional)

1. **macOS** with **Xcode** (latest version)
   - Download Xcode from Mac App Store
   - Install Xcode Command Line Tools
   - Requires macOS 13.5 or later

2. **Apple Developer Account**
   - Free account: Can test on physical devices for 7 days
   - Paid account ($99/year): Required for App Store distribution

3. **CocoaPods**
   ```bash
   sudo gem install cocoapods
   ```

## 🏗️ Building for Android

### First Time Setup

1. **Open Project in Android Studio**
   ```bash
   npm run cap:android
   ```

2. **Wait for Gradle Sync** (first time takes 5-10 minutes)

3. **Configure Signing** (for release builds)
   - Build → Generate Signed Bundle / APK
   - Create new keystore
   - **Save keystore file securely** (you'll need it for updates)

### Building APK (Debug)

1. In Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s)
2. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### Building AAB (Release - for Google Play)

1. In Android Studio: Build → Generate Signed Bundle / APK
2. Select "Android App Bundle"
3. Sign with your keystore
4. AAB location: `android/app/release/app-release.aab`

### Testing on Device

#### Via USB:
```bash
# Enable USB debugging on Android device
# Connect via USB
adb devices  # Verify device is connected
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

#### Via Drag & Drop:
- Copy APK to device
- Open file manager and install

## 🍎 Building for iOS

### First Time Setup (macOS only)

1. **Install CocoaPods** (if not installed)
   ```bash
   sudo gem install cocoapods
   cd ios/App
   pod install
   cd ../..
   ```

2. **Open Project in Xcode**
   ```bash
   npm run cap:ios
   ```

3. **Configure Signing**
   - Select the "App" target
   - Go to "Signing & Capabilities"
   - Select your development team
   - Xcode will create provisioning profile automatically

### Building for iOS Simulator

1. In Xcode: Select simulator (e.g., iPhone 15 Pro)
2. Click ▶️ Run button
3. App will launch in simulator

### Building for Physical Device

1. Connect iPhone/iPad via USB
2. Trust computer on device
3. In Xcode: Select your device
4. Click ▶️ Run button
5. On device: Settings → General → VPN & Device Management → Trust developer

### Building for App Store

1. In Xcode: Product → Archive
2. Wait for archive to complete
3. Window → Organizer → Archives
4. Select archive → Distribute App
5. Follow App Store Connect workflow

## 🎨 App Icons & Splash Screens

### Current Status

⚠️ **Action Required**: The current logo is 1800x600 (rectangular).

For best results:
1. Create a **square version** of the logo (1024x1024)
2. Place it in `resources/icon.png`
3. Create a splash screen (2732x2732) with logo centered on dark background
4. Place it in `resources/splash.png`

### Generate Assets

Once you have proper assets:

```bash
npm run generate:assets
```

This will create all required sizes for both platforms.

### Manual Creation (Alternative)

If you don't have image tools, you can:
1. Use online tools like https://icon.kitchen
2. Upload your logo
3. Download icon sets for Android and iOS
4. Manually place in native projects

## 📦 Distribution

### Google Play Store

1. **Create Developer Account** ($25 one-time fee)
   - Visit: https://play.google.com/console

2. **Prepare Store Listing**
   - App name: DeRadar
   - Short description (80 chars max)
   - Full description
   - Screenshots (phone + tablet)
   - Feature graphic (1024x500)
   - App icon (512x512)

3. **Upload AAB**
   - Create new app in Play Console
   - Upload signed AAB file
   - Complete all required fields
   - Submit for review

4. **Review Time**: 1-7 days typically

### Apple App Store

1. **Create Apple Developer Account** ($99/year)
   - Visit: https://developer.apple.com

2. **Create App in App Store Connect**
   - Visit: https://appstoreconnect.apple.com
   - Create new app
   - Fill in metadata

3. **Upload Build**
   - Archive in Xcode
   - Upload to App Store Connect
   - Select build in App Store Connect
   - Submit for review

4. **Review Time**: 1-3 days typically

## 🔄 Keeping Web & Mobile in Sync

### Branch Strategy Options

**Option 1: Keep Separate Branches** (Current)
- `main` branch: Web-only version
- `mobile-app` branch: Mobile app version
- Merge `main` → `mobile-app` to get web updates

**Option 2: Merge to Main** (Recommended Long-term)
- Merge `mobile-app` → `main`
- Single codebase for web and mobile
- Web version still works perfectly
- Mobile builds available when needed

### Merging Mobile App to Main

When you're ready to unify:

```bash
git checkout main
git merge mobile-app
npm run build  # Verify web still works
npm run deploy  # Deploy to Arweave
```

The mobile code doesn't affect web deployment since:
- Capacitor only activates on mobile
- Web version uses browser APIs as before
- No breaking changes to existing functionality

## 🐛 Troubleshooting

### Android Build Errors

**"SDK location not found"**
```bash
# Create local.properties in android/
echo "sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk" > android/local.properties
```

**Gradle sync failed**
- File → Invalidate Caches → Invalidate and Restart

**App won't install on device**
- Enable USB debugging
- Check minimum SDK version (API 23+)

### iOS Build Errors

**"Command PhaseScriptExecution failed"**
```bash
cd ios/App
pod deintegrate
pod install
```

**Code signing error**
- Xcode → Preferences → Accounts → Add Apple ID
- Select project → Signing & Capabilities → Select team

**Simulator not showing**
- Xcode → Window → Devices and Simulators → Add simulator

### Capacitor Errors

**"Native project not found"**
```bash
npm run build
npx cap sync
```

**Plugins not found**
```bash
npm install
npx cap sync
```

## 📱 Testing Checklist

Before releasing, test:

### Core Functionality
- [ ] Map loads and displays aircraft
- [ ] Aircraft markers are visible and clickable
- [ ] Charts display correctly
- [ ] Live data updates work
- [ ] Historical playback works
- [ ] Settings persist

### Mobile-Specific
- [ ] Geolocation permission request works
- [ ] "Show My Location" button works
- [ ] Nearest aircraft calculation works
- [ ] App orientation (portrait/landscape)
- [ ] Status bar color (dark theme)
- [ ] Splash screen displays
- [ ] App icon looks good on home screen

### Performance
- [ ] App launches quickly (< 3 seconds)
- [ ] No memory leaks during extended use
- [ ] Battery usage is acceptable
- [ ] Network requests work on cellular
- [ ] Offline behavior is graceful

### Different Devices
- [ ] Phone (small screen)
- [ ] Tablet (large screen)
- [ ] Different Android versions (10+)
- [ ] Different iOS versions (13+)

## 📚 Additional Resources

### Capacitor Documentation
- Official Docs: https://capacitorjs.com/docs
- Plugins: https://capacitorjs.com/docs/plugins
- Config Reference: https://capacitorjs.com/docs/config

### Platform Guidelines
- Android Design: https://m3.material.io/
- iOS Human Interface: https://developer.apple.com/design/

### Build Tools
- Android Studio: https://developer.android.com/studio/intro
- Xcode: https://developer.apple.com/xcode/

## 🎯 Next Steps

1. **Install Android Studio** and open the project
2. **Create square app icon** (1024x1024) from current logo
3. **Generate assets** using `npm run generate:assets`
4. **Build debug APK** and test on device
5. **Configure signing** for release builds
6. **Test all features** thoroughly
7. **Submit to stores** when ready

## 📄 Files Created/Modified

### New Files
- `capacitor.config.ts` - Capacitor configuration
- `lib/geolocation.ts` - Unified geolocation utility
- `resources/README.md` - Asset generation guide
- `MOBILE_APP_SETUP.md` - This file
- `android/` - Android project directory
- `ios/` - iOS project directory

### Modified Files
- `package.json` - Added Capacitor dependencies and scripts
- `.gitignore` - Ignore native build artifacts
- `components/aircraft-map.tsx` - Use Capacitor geolocation

## 💡 Tips

- **Keep building regularly** to catch issues early
- **Test on real devices** not just emulators
- **Monitor bundle size** - web assets are embedded
- **Use release builds** for performance testing
- **Read crash reports** from Play Console / App Store Connect
- **Update dependencies** periodically

## 🆘 Need Help?

- Capacitor Discord: https://discord.gg/UPYYRhtyzp
- Stack Overflow: Tag `capacitor`
- GitHub Issues: https://github.com/ionic-team/capacitor/issues

---

**Good luck with your mobile app! 🚀**

For questions specific to DeRadar, refer to the main README or project documentation.
