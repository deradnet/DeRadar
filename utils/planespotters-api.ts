// This code is getting aircrafts images from planespotters
// and showing on aircraft details panel

import type { AircraftImage } from "@/types/aircraft"

// Static configuration for S3 deployment
const PLANESPOTTERS_CONFIG = {
  baseUrl: "https://api.planespotters.net/pub/photos/hex",
  timeout: 5000,
}

export async function fetchAircraftImage(registration?: string, hex?: string): Promise<AircraftImage | null> {
  if (!registration && !hex) return null

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), PLANESPOTTERS_CONFIG.timeout)

    const response = await fetch(`${PLANESPOTTERS_CONFIG.baseUrl}/${hex}`, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      if (data.photos && data.photos.length > 0) {
        return {
          url: data.photos[0].thumbnail_large.src,
          photographer: data.photos[0].photographer,
          link: data.photos[0].link,
        }
      }
    }

    return {
      url: `/placeholder.svg?height=200&width=300&text=Aircraft+Image`,
      photographer: "No image available",
      link: null,
    }
  } catch (error) {
    console.error("Failed to fetch aircraft image:", error)
    return {
      url: `/placeholder.svg?height=200&width=300&text=Aircraft+Image`,
      photographer: "No image available",
      link: null,
    }
  }
}
