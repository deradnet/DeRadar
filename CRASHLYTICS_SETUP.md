# Firebase Monitoring Setup for DeRadar

## What's Been Configured

Firebase Crashlytics and Performance Monitoring have been added to your Android app to automatically track crash reports, errors, and performance metrics.

### Configuration Changes Made:

1. **Project-level build.gradle** - Added Crashlytics Gradle plugin
2. **App-level build.gradle** - Applied Crashlytics plugin and added dependency
3. **Firebase Console** - Connected via google-services.json

## How Crashlytics Works

Once your app is built and running:

1. **Automatic Crash Detection**: Crashlytics automatically captures unhandled exceptions and fatal crashes
2. **Real-time Reporting**: Crashes are uploaded to Firebase Console when the app restarts
3. **Detailed Stack Traces**: View full stack traces, device info, and user actions leading to crashes
4. **Analytics Integration**: Crashes are automatically linked to Firebase Analytics events

## Viewing Crash Reports

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **deradar-11421**
3. Navigate to **Crashlytics** in the left sidebar
4. View crashes, errors, and analytics

## Testing Crashlytics (Optional)

To test that Crashlytics is working, you can add a test crash button in your app:

### JavaScript/TypeScript Code (Add to any component):

```typescript
import { Capacitor } from '@capacitor/core';

// Function to force a test crash
const testCrash = () => {
  if (Capacitor.isNativePlatform()) {
    // This will cause a native crash for testing
    window.location.href = 'deradar://crash-test';
  }
};

// Or log a custom error
const logCustomError = (error: Error) => {
  if (Capacitor.isNativePlatform()) {
    console.error('Custom error:', error);
    // Errors logged to console are automatically captured by Crashlytics
  }
};
```

### Alternative: Native Test Crash

Add this to any Activity in your Android app:

```java
import com.google.firebase.crashlytics.FirebaseCrashlytics;

// Force a crash for testing
Button crashButton = new Button(this);
crashButton.setText("Test Crash");
crashButton.setOnClickListener(new View.OnClickListener() {
    public void onClick(View view) {
        throw new RuntimeException("Test Crash"); // Force crash
    }
});
```

## Custom Logging (Optional)

You can also log custom events and errors:

### Log Non-Fatal Errors:

```typescript
try {
  // Your code that might fail
  await someRiskyOperation();
} catch (error) {
  // This error will be logged but won't crash the app
  console.error('Non-fatal error:', error);
}
```

### Using Capacitor Plugin (Optional Enhancement):

For more control, you can install the Capacitor Crashlytics plugin:

```bash
npm install @capacitor-firebase/crashlytics
npx cap sync
```

Then use it in your code:

```typescript
import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics';

// Log custom message
await FirebaseCrashlytics.log({ message: 'User tapped flight card' });

// Log non-fatal error
await FirebaseCrashlytics.recordException({
  message: 'Failed to load flight data',
});

// Set user identifier
await FirebaseCrashlytics.setUserId({ userId: 'anonymous-user-123' });

// Set custom key-value pairs
await FirebaseCrashlytics.setCustomKey({ key: 'flight_id', value: 'ABC123' });
```

## What Gets Reported Automatically

✅ **Crashes**: All unhandled exceptions and fatal errors
✅ **Device Info**: Model, OS version, memory, storage
✅ **App Info**: Version, build number, package name
✅ **Stack Traces**: Full error stack with file names and line numbers
✅ **User Actions**: Recent logs and events before crash
✅ **Custom Data**: Any custom keys or logs you set

## Privacy Considerations

- Crashlytics does NOT collect personally identifiable information (PII) by default
- Device identifiers are anonymized
- Only crash-related data is collected
- Users can opt-out through device settings

## Disabling Crashlytics for Debug Builds (Optional)

To disable crash reporting during development, add to `android/app/build.gradle`:

```gradle
buildTypes {
    debug {
        minifyEnabled false
        // Disable Crashlytics for debug builds
        FirebaseCrashlytics {
            mappingFileUploadEnabled false
        }
    }
}
```

## Build Your App

After configuration, build your app:

```bash
npm run build
npx cap sync
npx cap open android
```

Then build and run from Android Studio.

## Important Notes

1. **First Crash Takes Time**: The first crash report may take a few minutes to appear in Firebase Console
2. **Requires Internet**: Crash reports are uploaded when the app has internet connectivity
3. **Obfuscation**: If using ProGuard/R8, mapping files are automatically uploaded for deobfuscation
4. **Testing**: Use debug builds for testing crashes before releasing

## Firebase Console Crashlytics Features

- **Issue Grouping**: Similar crashes are grouped together
- **Priority Sorting**: Most impactful crashes shown first
- **Version Tracking**: See which app versions have crashes
- **Velocity Alerts**: Get notified when crash rate increases
- **Stack Traces**: Full details of what caused the crash
- **Breadcrumbs**: User actions leading up to crash

## Need Help?

- [Firebase Crashlytics Documentation](https://firebase.google.com/docs/crashlytics)
- [Capacitor Firebase Crashlytics](https://github.com/capawesome-team/capacitor-firebase/tree/main/packages/crashlytics)

Your app is now configured to automatically track and report crashes! 🎉

---

## Firebase Performance Monitoring

### What Gets Tracked Automatically

Firebase Performance Monitoring is now enabled and will automatically track:

✅ **App Start Time**: How long it takes for your app to launch
✅ **Screen Rendering**: Frame rates and screen load times
✅ **Network Requests**: HTTP/HTTPS request duration and success rates
✅ **Custom Traces**: Any custom performance traces you add

### Automatic Network Monitoring

All HTTP/HTTPS requests are automatically monitored, including:
- Request duration
- Response payload size
- Success and failure rates
- Response codes

### Viewing Performance Data

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **deradar-11421**
3. Navigate to **Performance** in the left sidebar
4. View metrics for:
   - App startup time
   - Screen rendering
   - Network requests
   - Custom traces

### Custom Performance Traces (Optional)

You can add custom traces to measure specific operations:

#### Using Capacitor Plugin:

```bash
npm install @capacitor-firebase/performance
npx cap sync
```

Then in your code:

```typescript
import { FirebasePerformance } from '@capacitor-firebase/performance';

// Start a custom trace
const traceResult = await FirebasePerformance.startTrace({ traceName: 'load_flight_data' });
const traceId = traceResult.traceName;

// Your code to measure
await fetchFlightData();

// Stop the trace
await FirebasePerformance.stopTrace({ traceName: traceId });

// Add custom metrics
await FirebasePerformance.incrementMetric({
  traceName: traceId,
  metricName: 'flights_loaded',
  incrementBy: 50
});

// Add custom attributes
await FirebasePerformance.setTraceAttribute({
  traceName: traceId,
  attribute: 'data_source',
  value: 'arweave'
});
```

#### Using HTTP Request Monitoring:

All fetch() and XMLHttpRequest calls are automatically monitored. No additional code needed!

```typescript
// This request is automatically monitored by Performance Monitoring
const response = await fetch('https://api.deradar.app/flights');
```

### Performance Metrics Available

**App Start Metrics:**
- Cold start time
- Warm start time
- App in foreground/background

**Screen Rendering:**
- Slow rendering frames
- Frozen frames
- Screen load times

**Network Requests:**
- Request duration
- Success rate
- Failure rate
- Response size
- By URL pattern

**Custom Traces:**
- Any traces you define
- Custom metrics within traces
- Custom attributes for filtering

### Performance Thresholds

Firebase automatically alerts you when:
- App start time increases significantly
- Screen rendering becomes slow
- Network request duration increases
- Custom traces exceed expected duration

### Debug Logging

Performance events are logged to Logcat (enabled in AndroidManifest.xml):
- Filter by tag: `FirebasePerformance`
- View trace starts/stops
- See network request monitoring
- Debug custom traces

### Best Practices

1. **Measure Key User Flows**: Add traces for important operations like:
   - Loading flight data
   - Searching for flights
   - Opening maps
   - Querying SkyQuery

2. **Monitor Network Requests**: Performance Monitoring automatically tracks all HTTP requests

3. **Set Performance Budgets**: Define acceptable thresholds for key operations

4. **Compare Across Versions**: Track performance improvements/regressions across app versions

### Example: Measuring Flight Data Load

```typescript
import { FirebasePerformance } from '@capacitor-firebase/performance';

async function loadFlights() {
  // Start performance trace
  const { traceName } = await FirebasePerformance.startTrace({
    traceName: 'load_flights'
  });

  try {
    const startTime = Date.now();

    // Load flight data
    const flights = await fetchFlightData();

    // Add custom metrics
    await FirebasePerformance.incrementMetric({
      traceName,
      metricName: 'flight_count',
      incrementBy: flights.length
    });

    // Add attributes for filtering
    await FirebasePerformance.setTraceAttribute({
      traceName,
      attribute: 'data_source',
      value: 'arweave'
    });

    const duration = Date.now() - startTime;
    console.log(`Loaded ${flights.length} flights in ${duration}ms`);

  } finally {
    // Always stop the trace
    await FirebasePerformance.stopTrace({ traceName });
  }
}
```

### Disabling Performance Monitoring (Optional)

To disable for debug builds, add to `android/app/build.gradle`:

```gradle
android {
    buildTypes {
        debug {
            FirebasePerformance {
                // Disable Performance Monitoring for debug builds
                instrumentationEnabled false
            }
        }
    }
}
```

### Performance Monitoring Features

- **Real-time Monitoring**: See performance data as it happens
- **Historical Analysis**: Compare performance across time
- **Version Comparison**: Track changes between app versions
- **Percentile Analysis**: See P50, P90, P99 metrics
- **Device Segmentation**: Filter by device model, OS version
- **Network Segmentation**: Filter by country, carrier
- **Custom Dashboards**: Create custom views of your data

### Important Notes

1. **Data Collection Delay**: Performance data may take a few hours to appear in Firebase Console
2. **Automatic Instrumentation**: HTTP requests are automatically tracked
3. **Battery Impact**: Minimal - Firebase uses efficient sampling
4. **Data Retention**: Performance data is retained for 90 days

### Firebase Console Performance Features

- **Trends**: See performance trends over time
- **Slow Rendering**: Identify screens with rendering issues
- **Network Requests**: See which API calls are slow
- **Custom Traces**: Monitor your custom performance traces
- **Alerts**: Get notified of performance regressions

Your app now has comprehensive performance monitoring! 📊
