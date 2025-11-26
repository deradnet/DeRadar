# Debug Symbols Guide for DeRadar

## What Are Debug Symbols?

Debug symbols are files that help translate obfuscated/minified code back into readable stack traces when crashes occur. When you enable ProGuard/R8 in release builds, your code gets optimized and obfuscated, making crash reports hard to understand.

### Example of Obfuscated Crash:
```
at com.a.b.c.d(SourceFile:123)
at com.x.y.z.a(Unknown Source)
```

### With Debug Symbols:
```
at network.derad.deradar.MainActivity.onCreate(MainActivity.java:45)
at network.derad.deradar.FlightService.loadFlights(FlightService.java:123)
```

---

## The Warning Explained

**Warning from Play Console:**
> "This App Bundle contains native code, and you've not uploaded debug symbols. We recommend you upload a symbol file to make your crashes and ANRs easier to analyze and debug."

**Why it appears:**
- Your app has `minifyEnabled true` which obfuscates code
- ProGuard/R8 creates mapping files during build
- These mapping files need to be uploaded to Play Console and Firebase Crashlytics

---

## Solution Implemented

### 1. Native Debug Symbols (NDK)

Added to `android/app/build.gradle`:

```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'

        // Upload native debug symbols to Play Console and Crashlytics
        ndk {
            debugSymbolLevel 'FULL'
        }
    }
}
```

**What this does:**
- `debugSymbolLevel 'FULL'`: Includes full debug symbols in the AAB
- Automatically uploads symbols to Play Console when you upload AAB
- Helps deobfuscate native crashes (from C/C++ libraries)

### Debug Symbol Levels:
- `NONE`: No debug symbols (not recommended)
- `SYMBOL_TABLE`: Basic symbols (minimal size)
- `FULL`: Complete debug info (recommended, larger size but best debugging)

---

## What Happens Automatically

When you build with `debugSymbolLevel 'FULL'`:

1. **AAB Build**: Debug symbols are included in the AAB file
2. **Play Console Upload**: Symbols are automatically extracted and stored
3. **Crash Reports**: Play Console can deobfuscate stack traces
4. **Firebase Crashlytics**: Also receives mapping files automatically

---

## ProGuard Mapping Files

### What Are Mapping Files?

When R8/ProGuard obfuscates your code, it creates mapping files:
- `mapping.txt`: Maps obfuscated names back to original names
- `seeds.txt`: Lists classes/members not obfuscated
- `usage.txt`: Lists removed code
- `configuration.txt`: ProGuard configuration used

### Location:
```
android/app/build/outputs/mapping/release/
├── mapping.txt       ← Most important for deobfuscation
├── configuration.txt
├── seeds.txt
└── usage.txt
```

---

## Firebase Crashlytics Integration

Firebase Crashlytics automatically receives mapping files because:

1. The Crashlytics Gradle plugin hooks into your build
2. When you build a release, it uploads mapping files to Firebase
3. Crash reports are automatically deobfuscated

### Manual Upload (if needed):

If automatic upload fails, you can manually upload:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Upload mapping file
firebase crashlytics:symbols:upload \
  --app=1:423337500644:android:97709f9a40a95b052cf1f1 \
  android/app/build/outputs/mapping/release/mapping.txt
```

---

## Play Console Symbol Upload

### Automatic Upload (Recommended)

With `debugSymbolLevel 'FULL'`, symbols are automatically included in your AAB and uploaded to Play Console.

### Manual Upload (Alternative)

If you need to upload manually:

1. Go to [Play Console](https://play.google.com/console)
2. Select your app
3. Navigate to **Release** → **App bundle explorer**
4. Select your version
5. Go to **Downloads** tab
6. Upload the mapping file or native debug symbols

---

## Verifying Symbol Upload

### Check Firebase Crashlytics:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **deradar-11421**
3. Go to **Crashlytics**
4. Trigger a test crash
5. Verify stack traces are readable (not obfuscated)

### Check Play Console:

1. Go to [Play Console](https://play.google.com/console)
2. Navigate to **Release** → **App bundle explorer**
3. Select your app version
4. Check **Downloads** tab for available symbols

---

## Testing Debug Symbol Upload

### 1. Build Release APK/AAB:

```bash
cd android
./gradlew bundleRelease
```

### 2. Check for Mapping Files:

```bash
ls -la app/build/outputs/mapping/release/
```

You should see:
- `mapping.txt` (most important)
- `configuration.txt`
- `seeds.txt`
- `usage.txt`

### 3. Verify AAB Contains Symbols:

```bash
# Extract AAB to check contents
unzip -l app/build/outputs/bundle/release/app-release.aab | grep -i symbol
```

### 4. Test Crash Deobfuscation:

Force a crash in your app and check if the stack trace in Firebase Crashlytics is readable.

---

## ProGuard Rules for Capacitor

Ensure you have proper ProGuard rules. Check `android/app/proguard-rules.pro`:

```proguard
# Capacitor
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * {
    @com.getcapacitor.annotation.PermissionCallback *;
    @com.getcapacitor.PluginMethod public *;
}

# Firebase
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Keep line numbers for better stack traces
-keepattributes LineNumberTable
-renamesourcefileattribute SourceFile
```

---

## Important Notes

### 1. AAB Size Impact

Including `debugSymbolLevel 'FULL'` increases AAB size:
- **Without symbols**: ~10-15 MB (typical)
- **With FULL symbols**: ~15-25 MB (typical)

However, users don't download the symbols - they stay on Play Console servers for crash analysis.

### 2. Mapping File Retention

**Important:** Keep your mapping files for every release!

```bash
# Save mapping files for each version
cp android/app/build/outputs/mapping/release/mapping.txt \
   backups/mapping-v1.0.0.txt
```

Why?
- If you need to analyze old crashes
- If automatic upload failed
- For manual deobfuscation

### 3. Build Variants

Debug symbols only affect release builds:
- **Debug builds**: Not obfuscated, no symbols needed
- **Release builds**: Obfuscated, symbols required

---

## Troubleshooting

### Warning Still Appears

If you still see the warning after adding `debugSymbolLevel`:

1. **Clean and rebuild:**
   ```bash
   cd android
   ./gradlew clean
   ./gradlew bundleRelease
   ```

2. **Check AGP version:** Ensure Android Gradle Plugin is up to date
   ```gradle
   classpath 'com.android.tools.build:gradle:8.13.1'
   ```

3. **Verify NDK is installed:** Check in Android Studio SDK Manager

### Crashes Still Obfuscated

If crash reports are still hard to read:

1. **Check Firebase mapping upload:**
   - Go to Firebase Console → Crashlytics → Settings
   - Verify mapping files are uploaded

2. **Manual upload:**
   ```bash
   firebase crashlytics:symbols:upload \
     --app=YOUR_APP_ID \
     path/to/mapping.txt
   ```

3. **Check ProGuard rules:** Ensure you're not stripping too much

### AAB Rejected

If Play Console rejects your AAB:

1. **Check AAB integrity:**
   ```bash
   bundletool validate --bundle=app-release.aab
   ```

2. **Reduce symbol level if needed:**
   ```gradle
   debugSymbolLevel 'SYMBOL_TABLE'  // Smaller than FULL
   ```

---

## Best Practices

### 1. Always Keep Mapping Files

After each release build, save the mapping file:

```bash
# Create version-specific backup
VERSION="1.0.0"
cp android/app/build/outputs/mapping/release/mapping.txt \
   mappings/mapping-${VERSION}.txt
```

Add to `.gitignore`:
```
android/app/build/
!mappings/
```

### 2. Automate Symbol Upload

Add to your build script:

```bash
#!/bin/bash
# build-release.sh

# Build release
cd android
./gradlew bundleRelease

# Save mapping file
VERSION=$(grep versionName app/build.gradle | awk '{print $2}' | tr -d '"')
cp app/build/outputs/mapping/release/mapping.txt \
   ../mappings/mapping-${VERSION}.txt

echo "✅ Build complete! Mapping saved to mappings/mapping-${VERSION}.txt"
```

### 3. Test Symbol Upload

After uploading to Play Console:

1. Force a test crash
2. Wait 5-10 minutes
3. Check Play Console and Firebase for readable stack traces

### 4. Document Versions

Keep a log of which mapping file goes with which version:

```
mappings/
├── mapping-1.0.0.txt
├── mapping-1.0.1.txt
├── mapping-1.1.0.txt
└── README.md  ← Document version -> mapping file mapping
```

---

## Summary

**What was added:**
```gradle
ndk {
    debugSymbolLevel 'FULL'
}
```

**What this fixes:**
- ✅ Removes Play Console warning
- ✅ Enables readable crash reports
- ✅ Helps debug production issues
- ✅ Automatically uploads symbols with AAB

**No action needed:**
- Symbols upload automatically when you upload AAB to Play Console
- Firebase Crashlytics receives mapping files automatically
- Crash reports will be deobfuscated automatically

**Next steps:**
1. Rebuild your AAB with the new configuration
2. Upload to Play Console
3. Warning should disappear
4. Crash reports will be readable

---

## Resources

- [Android Debug Symbols Documentation](https://developer.android.com/studio/build/shrink-code#native-crash-support)
- [Firebase Crashlytics Deobfuscation](https://firebase.google.com/docs/crashlytics/get-deobfuscated-reports)
- [Play Console Crash Reporting](https://support.google.com/googleplay/android-developer/answer/9848633)

Your app now has proper debug symbol configuration! 🐛✅
