import { Geolocation } from '@capacitor/geolocation';

/**
 * Unified geolocation utility that uses Capacitor on mobile
 * and falls back to browser API on web
 */

export interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

export interface GeolocationError {
  code: number;
  message: string;
  PERMISSION_DENIED: number;
  POSITION_UNAVAILABLE: number;
  TIMEOUT: number;
}

/**
 * Check if running in Capacitor (mobile app)
 */
function isCapacitor(): boolean {
  return typeof (window as any).Capacitor !== 'undefined';
}

/**
 * Get current position using Capacitor or browser API
 */
export async function getCurrentPosition(): Promise<GeolocationPosition> {
  if (isCapacitor()) {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      return {
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed
        },
        timestamp: position.timestamp
      };
    } catch (error: any) {
      throw {
        code: error.code || 2,
        message: error.message || 'Position unavailable',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      };
    }
  } else {
    // Browser API fallback
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject({
          code: 2,
          message: 'Geolocation not supported',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed
            },
            timestamp: position.timestamp
          });
        },
        (error) => {
          reject({
            code: error.code,
            message: error.message,
            PERMISSION_DENIED: error.PERMISSION_DENIED,
            POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
            TIMEOUT: error.TIMEOUT
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }
}

/**
 * Check geolocation permission status
 */
export async function checkPermissions(): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> {
  if (isCapacitor()) {
    try {
      const status = await Geolocation.checkPermissions();

      // Map Capacitor permission states to standard states
      if (status.location === 'granted' || status.coarseLocation === 'granted') {
        return 'granted';
      } else if (status.location === 'denied' || status.coarseLocation === 'denied') {
        return 'denied';
      } else if (status.location === 'prompt' || status.coarseLocation === 'prompt') {
        return 'prompt';
      }
      return 'unknown';
    } catch (error) {
      console.error('Error checking permissions:', error);
      return 'unknown';
    }
  } else {
    // Browser API fallback
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        return permission.state as 'granted' | 'denied' | 'prompt';
      } catch (error) {
        console.error('Error checking permissions:', error);
        return 'unknown';
      }
    }
    return 'unknown';
  }
}

/**
 * Request geolocation permissions (mainly for Capacitor)
 */
export async function requestPermissions(): Promise<'granted' | 'denied' | 'prompt'> {
  if (isCapacitor()) {
    try {
      const status = await Geolocation.requestPermissions();

      if (status.location === 'granted' || status.coarseLocation === 'granted') {
        return 'granted';
      } else if (status.location === 'denied' || status.coarseLocation === 'denied') {
        return 'denied';
      }
      return 'prompt';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return 'denied';
    }
  } else {
    // For browser, we can't explicitly request - it happens on first getCurrentPosition call
    // So we check current status
    return checkPermissions();
  }
}
