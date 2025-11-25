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
      launchShowDuration: 500, // Reduced to minimum to show our custom splash only
      launchAutoHide: true,
      backgroundColor: '#0f172a', // Match our splash screen background
      showSpinner: false,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
      splashFullScreen: true,
      splashImmersive: true,
      androidScaleType: 'CENTER_CROP',
      androidSplashResourceName: 'splash' // Use the existing splash resource as a fallback
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0f172a'
    }
  }
};

export default config;
