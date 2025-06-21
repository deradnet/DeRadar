import type { Aircraft, AircraftStats, Alert } from "@/types/aircraft"
import { registration_from_hexid } from "@/lib/registration-lookup"
import APP_CONFIG from "@/config/app.config"

/**
 * Convenience aliases to avoid deep config look-ups
 */
const { baseUrl, corsProxy, timeout, retries } = APP_CONFIG.api.aircraft

const EMERGENCY_SQUAWKS = APP_CONFIG.aircraft.emergencySquawks
const ALERT_THRESHOLDS = APP_CONFIG.alerts.thresholds

/* ------------------------------------------------------------------ */
/* Data Fetch Helpers                                                 */
/* ------------------------------------------------------------------ */

export async function fetchAircraftData(customCorsProxy?: string, useCustomProxy?: boolean): Promise<Aircraft[]> {
  // Determine which CORS proxy to use
  const activeCorsProxy = useCustomProxy && customCorsProxy ? customCorsProxy : corsProxy

  // First try direct URL, then fallback to CORS proxy
  const urls = [baseUrl, `${activeCorsProxy}${baseUrl}`]

  for (const url of urls) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const isDirectUrl = url === baseUrl
        const proxyType = isDirectUrl
          ? "direct URL"
          : useCustomProxy && customCorsProxy
            ? "custom CORS proxy"
            : "default CORS proxy"

        console.log(`Attempting to fetch from: ${proxyType}`)

        const response = await fetch(url, {
          mode: "cors",
          signal: AbortSignal.timeout(timeout),
        })

        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const data = await response.json()

        // API returns { aircraft: [...] }
        if (Array.isArray(data?.aircraft)) {
          console.log(`✓ Successfully fetched ${data.aircraft.length} aircraft from ${proxyType}`)
          return data.aircraft.map((a: Aircraft) => {
            if (!a.r && a.hex) {
              const reg = registration_from_hexid(a.hex)
              if (reg) a.r = reg
            }
            return a
          })
        }

        return []
      } catch (err) {
        const isDirectUrl = url === baseUrl
        const proxyType = isDirectUrl
          ? "Direct URL"
          : useCustomProxy && customCorsProxy
            ? "Custom CORS proxy"
            : "Default CORS proxy"

        console.log(`✗ ${proxyType} attempt ${attempt + 1}/${retries} failed:`, err)

        if (attempt === retries - 1) {
          // If this was the last attempt with the current URL, try next URL
          if (isDirectUrl) {
            console.log("Direct URL failed, trying CORS proxy...")
            break // Move to CORS proxy
          } else {
            console.error("Both direct URL and CORS proxy failed")
            return []
          }
        }
        // Brief back-off before retry
        await new Promise((r) => setTimeout(r, 500))
      }
    }
  }

  return []
}

/* ------------------------------------------------------------------ */
/* Statistics                                                         */
/* ------------------------------------------------------------------ */

export function calculateStats(aircraft: Aircraft[]): AircraftStats {
  if (!aircraft.length) {
    return {
      fastest: null,
      highest: null,
      lowest: null,
      mostMessages: null,
      emergency: null,
      totalAircraft: 0,
      lastUpdate: null,
      avgAltitude: 0,
      avgSpeed: 0,
    }
  }

  const fastest = aircraft.reduce((p, c) => (p.gs! > (c.gs ?? 0) ? p : c))
  const highest = aircraft.reduce((p, c) => (p.alt_baro! > (c.alt_baro ?? 0) ? p : c))
  const lowest = aircraft.reduce((p, c) => (p.alt_baro! < (c.alt_baro ?? Number.POSITIVE_INFINITY) ? p : c))
  const mostMessages = aircraft.reduce((p, c) => ((p.messages ?? 0) > (c.messages ?? 0) ? p : c))
  const emergency = aircraft.find((a) => a.emergency && a.emergency !== "none") ?? null

  const totalAltitude = aircraft.reduce((s, a) => s + (a.alt_baro ?? 0), 0)
  const totalSpeed = aircraft.reduce((s, a) => s + (a.gs ?? 0), 0)

  return {
    fastest,
    highest,
    lowest,
    mostMessages,
    emergency,
    totalAircraft: aircraft.length,
    lastUpdate: new Date(),
    avgAltitude: Math.round(totalAltitude / aircraft.length),
    avgSpeed: Math.round(totalSpeed / aircraft.length),
  }
}

/* ------------------------------------------------------------------ */
/* Alerts                                                             */
/* ------------------------------------------------------------------ */

export function generateAlerts(aircraft: Aircraft[]): Alert[] {
  const alerts: Alert[] = []
  const now = new Date().toLocaleTimeString()

  /* Emergency squawk codes */
  aircraft
    .filter((a) => EMERGENCY_SQUAWKS.includes(a.squawk ?? ""))
    .forEach((a) =>
      alerts.push({
        id: `squawk-${a.hex}`,
        type: "emergency",
        message: `EMERGENCY: ${label(a)} squawking ${a.squawk} ${describeSquawk(a.squawk!)}`,
        time: now,
      }),
    )

  /* Explicit emergency flag */
  aircraft
    .filter((a) => a.emergency && a.emergency !== "none")
    .forEach((a) =>
      alerts.push({
        id: `emergency-${a.hex}`,
        type: "emergency",
        message: `EMERGENCY: ${label(a)} – ${a.emergency}`,
        time: now,
      }),
    )

  /* Very low altitude while moving */
  aircraft
    .filter(
      (a) =>
        (a.alt_baro ?? 0) > 0 &&
        (a.alt_baro ?? 0) < ALERT_THRESHOLDS.veryLowAltitude &&
        (a.gs ?? 0) > ALERT_THRESHOLDS.lowSpeed,
    )
    .forEach((a) =>
      alerts.push({
        id: `lowalt-${a.hex}`,
        type: "warning",
        message: `Very low altitude: ${label(a)} at ${a.alt_baro} ft / ${a.gs} kts`,
        time: now,
      }),
    )

  /* Very high speed */
  aircraft
    .filter((a) => (a.gs ?? 0) > ALERT_THRESHOLDS.veryHighSpeed)
    .forEach((a) =>
      alerts.push({
        id: `highspeed-${a.hex}`,
        type: "warning",
        message: `High speed: ${label(a)} at ${a.gs} kts`,
        time: now,
      }),
    )

  /* Very high altitude */
  aircraft
    .filter((a) => (a.alt_baro ?? 0) > ALERT_THRESHOLDS.veryHighAltitude)
    .forEach((a) =>
      alerts.push({
        id: `highalt-${a.hex}`,
        type: "info",
        message: `High altitude: ${label(a)} at ${Math.round((a.alt_baro ?? 0) / 1000)} k ft`,
        time: now,
      }),
    )

  /* No position data */
  const noPos = aircraft.filter((a) => !a.lat || !a.lon).length
  if (noPos)
    alerts.push({
      id: `nopos-${Date.now()}`,
      type: "info",
      message: `${noPos} aircraft transmitting without position data`,
      time: now,
    })

  /* Priority sort */
  return alerts.sort((a, b) => priority(b.type) - priority(a.type))
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const label = (a: Aircraft) => a.flight || a.r || a.hex

const priority = (t: Alert["type"]) => (({ emergency: 3, warning: 2, info: 1 }) as const)[t]

function describeSquawk(s: string) {
  switch (s) {
    case "7500":
      return "(Hijacking)"
    case "7600":
      return "(Radio Failure)"
    case "7700":
      return "(General Emergency)"
    default:
      return ""
  }
}
