export interface FilterCriteria {
  showEmergencyOnly: boolean
  minAltitude: number
  maxAltitude: number
  minSpeed: number
  maxSpeed: number
  aircraftType: "all" | "airliner" | "fighter" | "heavy" | "cessna" | "glider" | "helicopter"
}
