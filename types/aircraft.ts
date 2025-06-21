export interface Aircraft {
  hex: string
  flight?: string
  lat?: number
  lon?: number
  alt_baro?: number
  alt_geom?: number
  gs?: number
  track?: number
  squawk?: string
  emergency?: string
  category?: string
  t?: string
  r?: string
  messages?: number
  seen?: number
  rssi?: number
}

export interface AircraftStats {
  fastest: Aircraft | null
  highest: Aircraft | null
  lowest: Aircraft | null
  mostMessages: Aircraft | null
  emergency: Aircraft | null
  totalAircraft: number
  lastUpdate: Date | null
  avgAltitude: number
  avgSpeed: number
}

export interface Alert {
  id: string
  type: "emergency" | "warning" | "info"
  message: string
  time: string
}

export interface AircraftImage {
  url: string
  photographer: string
  link: string | null
}

export interface SelectedFlight {
  id: string
  callsign: string
  aircraft: string
  altitude: number
  speed: number
  heading: number
  lat: number
  lng: number
  squawk: string
  status: string
  registration: string | null
  hex: string
  type: string
}
