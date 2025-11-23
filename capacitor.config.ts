import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'network.derad.deradar',
  appName: 'DeRadar',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // Enable hardware acceleration
    allowNavigation: ['*'],
    cleartext: true
  },
  android: {
    // Enable Android-specific optimizations
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      showSpinner: false,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
      splashFullScreen: true,
      splashImmersive: true,
      androidScaleType: 'CENTER_CROP'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0f172a'
    },
    App: {
      // Optimize app lifecycle
      appRestoredResult: false
    }
  }
};

export default config;
