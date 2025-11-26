# DeRadar Android Release Guide - Version 1.0.0

## Prerequisites

Before creating a release, ensure you have:

- ✅ Android Studio installed
- ✅ Google Play Console account set up
- ✅ Signing key generated (for production builds)
- ✅ All features tested and working
- ✅ Firebase configured (Analytics, Crashlytics, Performance)
- ✅ Privacy Policy published at https://deradar.derad.network/privacy

---

## Step 1: Update Version Information

### 1.1 Update Android Version

Edit `android/app/build.gradle`:

```gradle
defaultConfig {
    applicationId "network.derad.deradar"
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 1          // Increment for each release (1, 2, 3...)
    versionName "1.0.0"    // User-visible version (1.0.0, 1.0.1, 1.1.0...)
    // ...
}
```

**Version Naming Convention:**
- `versionCode`: Integer that must increase with each release (1, 2, 3, 4...)
- `versionName`: User-friendly version string (1.0.0, 1.0.1, 1.1.0, 2.0.0...)

### 1.2 Update Capacitor Config (Optional)

Edit `capacitor.config.ts` if you want to include version info:

```typescript
const config: CapacitorConfig = {
  appId: 'network.derad.deradar',
  appName: 'DeRadar',
  webDir: 'out',
  // ...
};
```

### 1.3 Update package.json Version

```bash
npm version 1.0.0
```

Or manually edit `package.json`:

```json
{
  "name": "deradar",
  "version": "1.0.0",
  // ...
}
```

---

## Step 2: Generate Signing Key (First Time Only)

You need a signing key to publish to Google Play Store.

### 2.1 Generate Release Keystore

```bash
keytool -genkey -v -keystore deradar-release.keystore -alias deradar -keyalg RSA -keysize 2048 -validity 10000
```

You'll be prompted for:
- Keystore password (remember this!)
- Key password (remember this!)
- Your name and organization details

**IMPORTANT:**
- Store the keystore file securely (backup in multiple locations)
- Never commit the keystore to git
- If you lose this, you cannot update your app on Play Store

### 2.2 Create keystore.properties

Create `android/keystore.properties` (this file is not committed to git):

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=deradar
storeFile=../deradar-release.keystore
```

### 2.3 Add to .gitignore

Ensure these are in `.gitignore`:

```
android/keystore.properties
*.keystore
*.jks
```

### 2.4 Update android/app/build.gradle

Add before the `android` block:

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing config ...

    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## Step 3: Build the App

### 3.1 Build Web Assets

```bash
npm run build
```

### 3.2 Sync with Capacitor

```bash
npx cap sync android
```

### 3.3 Build Release AAB/APK

#### Option A: Using Android Studio (Recommended)

1. Open Android project:
   ```bash
   npx cap open android
   ```

2. In Android Studio:
   - Click **Build** → **Generate Signed Bundle / APK**
   - Select **Android App Bundle** (AAB) for Play Store
   - Click **Next**
   - Choose your keystore file or create new one
   - Enter keystore and key passwords
   - Click **Next**
   - Select **release** build variant
   - Check both signature versions (V1 and V2)
   - Click **Finish**

3. Find your AAB at:
   ```
   android/app/release/app-release.aab
   ```

#### Option B: Using Command Line

```bash
cd android
./gradlew bundleRelease
```

Output will be at: `android/app/build/outputs/bundle/release/app-release.aab`

For APK (testing only, use AAB for Play Store):
```bash
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

---

## Step 4: Test the Release Build

### 4.1 Install Release APK on Test Device

```bash
# Build APK
cd android
./gradlew assembleRelease

# Install on connected device
adb install app/build/outputs/apk/release/app-release.apk
```

### 4.2 Test Checklist

- [ ] App launches successfully
- [ ] All screens load properly
- [ ] Flight data loads correctly
- [ ] Map renders and functions
- [ ] SkyQuery integration works
- [ ] Settings are saved
- [ ] No crashes occur
- [ ] Network requests work
- [ ] Firebase tracking is working (check Firebase Console)
- [ ] Performance is acceptable

---

## Step 5: Prepare Play Store Assets

### 5.1 Required Assets

Create these assets for Google Play Console:

1. **App Icon** (Already done: 512x512 PNG)
   - Located at: `/Users/dev/Downloads/deradar-main.png`

2. **Feature Graphic** (1024x500 PNG)
   - Create a banner with DeRadar branding
   - Include app name and tagline

3. **Screenshots** (Phone: 16:9 or 9:16)
   - Minimum 2, maximum 8 screenshots
   - Recommended: 1080x1920 or 1080x2400
   - Take screenshots of:
     - Home screen with radar
     - Flight list view
     - Flight details
     - Map view
     - Mini apps view
     - Charts/analytics

4. **Promo Video** (Optional but recommended)
   - YouTube video showcasing the app
   - 30 seconds to 2 minutes

### 5.2 Store Listing Details

Use content from `play-store-listing.md`:

**Short Description:**
```
Decentralized aircraft tracking powered by AR.IO & Arweave blockchain
```

**Full Description:**
```
See play-store-listing.md for complete description
```

**App Category:** Travel & Local

**Content Rating:** Everyone

**Privacy Policy URL:**
```
https://deradar.derad.network/privacy
```

---

## Step 6: Upload to Google Play Console

### 6.1 Create App in Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **Create app**
3. Fill in:
   - App name: **DeRadar**
   - Default language: English (United States)
   - App or game: App
   - Free or paid: Free
4. Accept declarations and create app

### 6.2 Set Up Store Listing

1. Navigate to **Store listing**
2. Fill in all required fields using `play-store-listing.md`
3. Upload graphics:
   - App icon
   - Feature graphic
   - Screenshots (at least 2)
4. Save changes

### 6.3 Set Up Content Rating

1. Navigate to **Content rating**
2. Fill out questionnaire
3. Calculate rating (should be Everyone)
4. Save

### 6.4 Set Up Privacy Policy

1. Navigate to **App content**
2. Add Privacy Policy URL: `https://deradar.derad.network/privacy`
3. Complete all policy declarations

### 6.5 Upload App Bundle

1. Navigate to **Release** → **Production**
2. Click **Create new release**
3. Upload your AAB file: `app-release.aab`
4. Add release notes:

```
Initial Release - Version 1.0.0

New features:
• Real-time aircraft tracking with interactive map
• Decentralized data storage via Arweave blockchain
• AR.IO gateway integration for fast data access
• SkyQuery mini app for advanced flight search
• Airlines and aircraft analytics
• Beautiful dark theme interface
• Haptic feedback for better UX
• Performance optimizations

Built on decentralized technologies:
• AR.IO gateways for data delivery
• Arweave permanent storage
• Derad Network infrastructure
```

5. Review and roll out to production

---

## Step 7: Release Checklist

Before submitting to Play Store:

### Technical Checklist
- [ ] Version code and name updated
- [ ] App signed with release keystore
- [ ] ProGuard/R8 enabled and tested
- [ ] All third-party API keys configured
- [ ] Firebase properly configured
- [ ] No debug code or logs in production
- [ ] All permissions justified in manifest
- [ ] Privacy policy accessible and updated

### Content Checklist
- [ ] Store listing complete with description
- [ ] App icon uploaded (512x512)
- [ ] Feature graphic uploaded (1024x500)
- [ ] At least 2 screenshots uploaded
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars max)
- [ ] Content rating completed
- [ ] Privacy policy URL added
- [ ] Contact email provided

### Testing Checklist
- [ ] Tested on multiple Android versions
- [ ] Tested on different screen sizes
- [ ] No crashes in release build
- [ ] All features working correctly
- [ ] Performance is acceptable
- [ ] Network requests succeed
- [ ] Firebase tracking verified

---

## Step 8: Post-Release

### 8.1 Monitor Release

After publishing:

1. **Watch Firebase Console**
   - Analytics: User engagement
   - Crashlytics: Crash reports
   - Performance: App performance metrics

2. **Monitor Play Console**
   - Install statistics
   - Ratings and reviews
   - Crash reports (Play Console also tracks crashes)

3. **Check User Feedback**
   - Read and respond to reviews
   - Monitor support channels

### 8.2 Create Git Tag

```bash
git tag -a v1.0.0 -m "Release version 1.0.0 - Initial production release"
git push origin v1.0.0
```

### 8.3 Create GitHub Release (Optional)

1. Go to GitHub repository
2. Click **Releases** → **Create a new release**
3. Tag version: `v1.0.0`
4. Release title: `DeRadar v1.0.0 - Initial Release`
5. Add release notes
6. Publish release

---

## Version Update Strategy

For future releases:

### Patch Release (1.0.0 → 1.0.1)
- Bug fixes only
- No new features
- Increment: `versionCode: 2`, `versionName: "1.0.1"`

### Minor Release (1.0.0 → 1.1.0)
- New features
- Backwards compatible
- Increment: `versionCode: 3`, `versionName: "1.1.0"`

### Major Release (1.0.0 → 2.0.0)
- Breaking changes
- Major new features
- Increment: `versionCode: 4`, `versionName: "2.0.0"`

---

## Troubleshooting

### Build Fails

**Error: Signing key not found**
- Ensure `keystore.properties` exists
- Check keystore file path is correct
- Verify passwords are correct

**Error: Duplicate classes**
- Clean build: `./gradlew clean`
- Invalidate caches in Android Studio

**Error: Out of memory**
- Increase heap size in `gradle.properties`:
  ```
  org.gradle.jvmargs=-Xmx4096m
  ```

### Upload Issues

**Error: Version code already used**
- Increment `versionCode` in build.gradle

**Error: Package name already exists**
- Your package name `network.derad.deradar` must be unique globally
- Cannot change after first upload

### Testing Issues

**App crashes on startup**
- Check ProGuard rules aren't removing required code
- Test with ProGuard enabled: `./gradlew assembleRelease`
- Check Crashlytics for stack traces

---

## Important Notes

1. **Keystore Security**: Your keystore file is THE KEY to updating your app. Losing it means you cannot update the app on Play Store. Back it up securely.

2. **Version Codes**: Must always increase. You cannot reuse a version code.

3. **Review Time**: Google Play review typically takes 1-7 days.

4. **Staged Rollout**: Consider releasing to a percentage of users first (10% → 50% → 100%).

5. **Beta Testing**: Use Internal Testing or Closed Testing tracks before production release.

---

## Quick Release Commands

```bash
# 1. Update version in android/app/build.gradle manually

# 2. Build web assets
npm run build

# 3. Sync with Capacitor
npx cap sync android

# 4. Build release bundle
cd android
./gradlew bundleRelease

# 5. AAB location
# android/app/build/outputs/bundle/release/app-release.aab

# 6. Upload to Play Console
# Upload the AAB file to Google Play Console

# 7. Tag release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

---

## Resources

- [Google Play Console](https://play.google.com/console)
- [Android App Bundle Documentation](https://developer.android.com/guide/app-bundle)
- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [Firebase Console](https://console.firebase.google.com/)
- [Play Store Listing Assets Requirements](https://support.google.com/googleplay/android-developer/answer/9866151)

Good luck with your 1.0.0 release! 🚀
