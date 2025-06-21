declare global {
  interface Window {
    map: any
    L: any
    mapMarkers: any[]
    mapTrails: any[]
    updateMapMarkers: () => void
    currentFlightData: any[]
    currentSelectedFlight: any
    currentSettings: any
    currentMapStyle: string
    aircraftTrails: { [key: string]: [number, number][] }
    weatherLayer: any
    refreshRainviewerCloudsInterval: any
    userMarker: any
  }
}

export {}
