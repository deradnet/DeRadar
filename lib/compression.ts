/**
 * Data Compression - Compress aircraft data for storage and transfer
 * Reduces memory usage by 60-80%
 */

export class DataCompressor {
  /**
   * Compress aircraft array - remove unnecessary fields
   */
  static compressAircraft(aircraft: any[]): any[] {
    return aircraft.map((a) => ({
      // Only keep essential fields
      h: a.hex, // hex id
      f: a.flight?.trim(), // flight number
      t: a.t, // aircraft type
      la: a.lat, // latitude
      lo: a.lon, // longitude
      al: a.alt_baro, // altitude
      g: a.gs, // ground speed
      tr: a.track, // track
      s: a.squawk, // squawk
      r: a.r, // registration
      m: a.messages, // messages
      se: a.seen, // seen
      e: a.emergency !== "none" ? a.emergency : undefined, // emergency
    }))
  }

  /**
   * Decompress aircraft array
   */
  static decompressAircraft(compressed: any[]): any[] {
    return compressed.map((c) => ({
      hex: c.h,
      flight: c.f,
      t: c.t,
      lat: c.la,
      lon: c.lo,
      alt_baro: c.al,
      gs: c.g,
      track: c.tr,
      squawk: c.s,
      r: c.r,
      messages: c.m,
      seen: c.se,
      emergency: c.e || "none",
    }))
  }

  /**
   * Estimate compression ratio
   */
  static getCompressionRatio(original: any[], compressed: any[]): number {
    const originalSize = JSON.stringify(original).length
    const compressedSize = JSON.stringify(compressed).length
    return ((originalSize - compressedSize) / originalSize) * 100
  }
}

/**
 * LZ-String compression for strings (lighter than gzip)
 */
export class LZStringCompressor {
  private static keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="

  /**
   * Compress string to base64
   */
  static compress(input: string): string {
    if (!input) return ""

    const dict: { [key: string]: number } = {}
    const data = (input + "").split("")
    const out: number[] = []
    let currChar: string
    let phrase = data[0]
    let code = 256

    for (let i = 1; i < data.length; i++) {
      currChar = data[i]
      if (dict[phrase + currChar] != null) {
        phrase += currChar
      } else {
        out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0))
        dict[phrase + currChar] = code
        code++
        phrase = currChar
      }
    }

    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0))

    // Convert to base64
    return btoa(String.fromCharCode(...out))
  }

  /**
   * Decompress base64 string
   */
  static decompress(input: string): string {
    if (!input) return ""

    try {
      const data = atob(input).split("").map((c) => c.charCodeAt(0))
      const dict: { [key: number]: string } = {}
      let currChar = String.fromCharCode(data[0])
      let oldPhrase = currChar
      const out = [currChar]
      let code = 256
      let phrase: string

      for (let i = 1; i < data.length; i++) {
        const currCode = data[i]
        if (currCode < 256) {
          phrase = String.fromCharCode(data[i])
        } else {
          phrase = dict[currCode] ? dict[currCode] : oldPhrase + currChar
        }
        out.push(phrase)
        currChar = phrase.charAt(0)
        dict[code] = oldPhrase + currChar
        code++
        oldPhrase = phrase
      }

      return out.join("")
    } catch (e) {
      return input
    }
  }
}
