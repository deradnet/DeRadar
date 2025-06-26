interface Airline {
  AirlineID: string
  Name: string
  Alias: string | null
  IATA: string
  ICAO: string
  Callsign: string
  Country: string
  Active: string
}

let airlinesData: Airline[] | null = null

async function loadAirlinesData(): Promise<Airline[]> {
  if (airlinesData) {
    return airlinesData
  }

  try {
    const response = await fetch("/data/airlines.json")
    if (!response.ok) {
      throw new Error("Failed to load airlines data")
    }
    airlinesData = await response.json()
    return airlinesData || []
  } catch (error) {
    console.error("Error loading airlines data:", error)
    return []
  }
}

export async function getAirlineByICAO(icao: string): Promise<Airline | null> {
  const airlines = await loadAirlinesData()
  return airlines.find((airline) => airline.ICAO === icao.toUpperCase()) || null
}

export async function getAirlineByIATA(iata: string): Promise<Airline | null> {
  const airlines = await loadAirlinesData()
  return airlines.find((airline) => airline.IATA === iata.toUpperCase()) || null
}

export async function getAirlineByCallsign(callsign: string): Promise<Airline | null> {
  const airlines = await loadAirlinesData()
  return airlines.find((airline) => airline.Callsign.toUpperCase() === callsign.toUpperCase()) || null
}

export async function searchAirlinesByName(name: string): Promise<Airline[]> {
  const airlines = await loadAirlinesData()
  const searchTerm = name.toLowerCase()
  return airlines.filter(
    (airline) =>
      airline.Name.toLowerCase().includes(searchTerm) ||
      (airline.Alias && airline.Alias.toLowerCase().includes(searchTerm)),
  )
}

export async function getActiveAirlines(): Promise<Airline[]> {
  const airlines = await loadAirlinesData()
  return airlines.filter((airline) => airline.Active === "Y")
}

export async function getAirlinesByCountry(country: string): Promise<Airline[]> {
  const airlines = await loadAirlinesData()
  return airlines.filter((airline) => airline.Country.toLowerCase() === country.toLowerCase())
}

export function extractAirlineCode(callsign: string): string | null {
  if (!callsign || callsign.length < 2) return null

  // Extract the alphabetic prefix (airline code)
  const match = callsign.match(/^([A-Z]+)/)
  return match ? match[1] : null
}

export async function getAirlineFromCallsign(callsign: string): Promise<Airline | null> {
  if (!callsign) return null

  const cleanCallsign = callsign.trim().toUpperCase()
  const airlineCode = extractAirlineCode(cleanCallsign)

  if (!airlineCode) return null

  // Try ICAO first, then IATA
  let airline = await getAirlineByICAO(airlineCode)
  if (!airline) {
    airline = await getAirlineByIATA(airlineCode)
  }

  return airline
}

export async function getAllAirlines(): Promise<Airline[]> {
  return await loadAirlinesData()
}
