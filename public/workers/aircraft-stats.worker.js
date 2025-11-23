/**
 * Web Worker for heavy aircraft statistics calculations
 * Offloads CPU-intensive tasks from the main thread
 */

self.addEventListener('message', (event) => {
  const { type, data } = event.data

  switch (type) {
    case 'CALCULATE_STATS':
      const stats = calculateStats(data)
      self.postMessage({ type: 'STATS_RESULT', data: stats })
      break

    case 'FILTER_AIRCRAFT':
      const filtered = filterAircraft(data.aircraft, data.criteria)
      self.postMessage({ type: 'FILTER_RESULT', data: filtered })
      break

    case 'GENERATE_ALERTS':
      const alerts = generateAlerts(data)
      self.postMessage({ type: 'ALERTS_RESULT', data: alerts })
      break

    default:
      console.warn('Unknown worker message type:', type)
  }
})

/**
 * Calculate aircraft statistics (offloaded from main thread)
 */
function calculateStats(aircraft) {
  let fastest = null
  let highest = null
  let lowest = null
  let mostMessages = null
  let emergency = null
  let totalAltitude = 0
  let totalSpeed = 0
  let aircraftWithAltitude = 0
  let aircraftWithSpeed = 0

  for (const a of aircraft) {
    // Fastest aircraft
    if (a.gs && (!fastest || a.gs > fastest.gs)) {
      fastest = a
    }

    // Highest aircraft
    if (a.alt_baro && (!highest || a.alt_baro > highest.alt_baro)) {
      highest = a
    }

    // Lowest aircraft (above ground)
    if (a.alt_baro && a.alt_baro > 100 && (!lowest || a.alt_baro < lowest.alt_baro)) {
      lowest = a
    }

    // Most messages
    if (a.messages && (!mostMessages || a.messages > mostMessages.messages)) {
      mostMessages = a
    }

    // Emergency aircraft
    if (a.emergency && a.emergency !== 'none' && !emergency) {
      emergency = a
    }

    // Average calculations
    if (a.alt_baro) {
      totalAltitude += a.alt_baro
      aircraftWithAltitude++
    }
    if (a.gs) {
      totalSpeed += a.gs
      aircraftWithSpeed++
    }
  }

  return {
    fastest,
    highest,
    lowest,
    mostMessages,
    emergency,
    totalAircraft: aircraft.length,
    lastUpdate: Date.now(),
    avgAltitude: aircraftWithAltitude > 0 ? Math.round(totalAltitude / aircraftWithAltitude) : 0,
    avgSpeed: aircraftWithSpeed > 0 ? Math.round(totalSpeed / aircraftWithSpeed) : 0,
  }
}

/**
 * Filter aircraft based on criteria (offloaded from main thread)
 */
function filterAircraft(aircraft, criteria) {
  return aircraft.filter((flight) => {
    const matchesEmergency = !criteria.showEmergencyOnly || (flight.emergency && flight.emergency !== 'none')
    const matchesAltitude =
      !flight.alt_baro ||
      (flight.alt_baro >= criteria.minAltitude && flight.alt_baro <= criteria.maxAltitude)
    const matchesSpeed = !flight.gs || (flight.gs >= criteria.minSpeed && flight.gs <= criteria.maxSpeed)

    let matchesType = true
    if (criteria.aircraftType !== 'all') {
      const aircraftType = flight.t?.toLowerCase() || flight.category?.toLowerCase() || ''
      switch (criteria.aircraftType) {
        case 'airliner':
          matchesType = /a3[123]|a33|b73|a32|b77|a35/.test(aircraftType)
          break
        case 'fighter':
          matchesType = /f1|f2|f3|a10|f16|f18/.test(aircraftType)
          break
        case 'heavy':
          matchesType = /c17|b74|a38|b74|a34/.test(aircraftType)
          break
        case 'cessna':
          matchesType = /c172|pa2|sr2|c152|c182/.test(aircraftType)
          break
        case 'glider':
          matchesType = /glid|gli|as2/.test(aircraftType)
          break
        case 'helicopter':
          matchesType = /h25|ec[0-9]|b06|b47|as3|bell|r44/.test(aircraftType)
          break
      }
    }

    return matchesEmergency && matchesAltitude && matchesSpeed && matchesType
  })
}

/**
 * Generate alerts for aircraft (offloaded from main thread)
 */
function generateAlerts(aircraft) {
  const alerts = []
  const now = Date.now()

  for (const a of aircraft) {
    // Emergency alert
    if (a.emergency && a.emergency !== 'none') {
      alerts.push({
        id: `emergency-${a.hex}`,
        type: 'emergency',
        severity: 'critical',
        title: 'Emergency Aircraft Detected',
        message: `${a.flight || a.hex} is squawking ${a.emergency}`,
        timestamp: now,
        aircraft: a,
      })
    }

    // Low altitude alert (below 500ft and moving)
    if (a.alt_baro && a.alt_baro < 500 && a.gs && a.gs > 50) {
      alerts.push({
        id: `low-alt-${a.hex}`,
        type: 'low_altitude',
        severity: 'warning',
        title: 'Low Altitude Aircraft',
        message: `${a.flight || a.hex} is at ${a.alt_baro}ft`,
        timestamp: now,
        aircraft: a,
      })
    }

    // High speed alert (above 600kts)
    if (a.gs && a.gs > 600) {
      alerts.push({
        id: `high-speed-${a.hex}`,
        type: 'high_speed',
        severity: 'info',
        title: 'High Speed Aircraft',
        message: `${a.flight || a.hex} is traveling at ${a.gs}kts`,
        timestamp: now,
        aircraft: a,
      })
    }
  }

  return alerts
}
