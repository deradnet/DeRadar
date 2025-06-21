/**
 * This file contains code based on tar1090:
 * https://github.com/wiedehopf/tar1090
 *
 * The original code is licensed under GPL v2 or later.
 * See https://www.gnu.org/licenses/old-licenses/gpl-2.0.html for license details.
 */


// Various reverse-engineered versions of the allocation algorithms
// used by different countries to allocate 24-bit ICAO addresses based
// on the aircraft registration.

interface StrideMapping {
  start: number
  s1: number
  s2: number
  prefix: string
  alphabet?: string
  first?: string
  last?: string
  offset?: number
  end?: number
}

interface NumericMapping {
  start: number
  first: number
  count: number
  template: string
  end?: number
}

const limited_alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ" // 24 chars; no I, O
const full_alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" // 26 chars

// handles 3-letter suffixes assigned with a regular pattern
const stride_mappings: StrideMapping[] = [
  { start: 0x380000, s1: 1024, s2: 32, prefix: "F-B" },
  { start: 0x388000, s1: 1024, s2: 32, prefix: "F-I" },
  { start: 0x390000, s1: 1024, s2: 32, prefix: "F-G" },
  { start: 0x398000, s1: 1024, s2: 32, prefix: "F-H" },
  { start: 0x3a0000, s1: 1024, s2: 32, prefix: "F-O" },

  { start: 0x3c4421, s1: 1024, s2: 32, prefix: "D-A", first: "AAA", last: "OZZ" },
  { start: 0x3c0001, s1: 26 * 26, s2: 26, prefix: "D-A", first: "PAA", last: "ZZZ" },
  { start: 0x3c8421, s1: 1024, s2: 32, prefix: "D-B", first: "AAA", last: "OZZ" },
  { start: 0x3c2001, s1: 26 * 26, s2: 26, prefix: "D-B", first: "PAA", last: "ZZZ" },
  { start: 0x3cc000, s1: 26 * 26, s2: 26, prefix: "D-C" },
  { start: 0x3d04a8, s1: 26 * 26, s2: 26, prefix: "D-E" },
  { start: 0x3d4950, s1: 26 * 26, s2: 26, prefix: "D-F" },
  { start: 0x3d8df8, s1: 26 * 26, s2: 26, prefix: "D-G" },
  { start: 0x3dd2a0, s1: 26 * 26, s2: 26, prefix: "D-H" },
  { start: 0x3e1748, s1: 26 * 26, s2: 26, prefix: "D-I" },

  { start: 0x448421, s1: 1024, s2: 32, prefix: "OO-" },
  { start: 0x458421, s1: 1024, s2: 32, prefix: "OY-" },
  { start: 0x460000, s1: 26 * 26, s2: 26, prefix: "OH-" },
  { start: 0x468421, s1: 1024, s2: 32, prefix: "SX-" },
  { start: 0x490421, s1: 1024, s2: 32, prefix: "CS-" },
  { start: 0x4a0421, s1: 1024, s2: 32, prefix: "YR-" },
  { start: 0x4b8421, s1: 1024, s2: 32, prefix: "TC-" },
  { start: 0x740421, s1: 1024, s2: 32, prefix: "JY-" },
  { start: 0x760421, s1: 1024, s2: 32, prefix: "AP-" },
  { start: 0x768421, s1: 1024, s2: 32, prefix: "9V-" },
  { start: 0x778421, s1: 1024, s2: 32, prefix: "YK-" },
  { start: 0xc00001, s1: 26 * 26, s2: 26, prefix: "C-F" },
  { start: 0xc044a9, s1: 26 * 26, s2: 26, prefix: "C-G" },
  { start: 0xe01041, s1: 4096, s2: 64, prefix: "LV-" },
]

// numeric registrations
const numeric_mappings: NumericMapping[] = [
  { start: 0x140000, first: 0, count: 100000, template: "RA-00000" },
  { start: 0x0b03e8, first: 1000, count: 1000, template: "CU-T0000" },
]

// fill in some derived data
for (let i = 0; i < stride_mappings.length; ++i) {
  const mapping = stride_mappings[i]

  if (!mapping.alphabet) {
    mapping.alphabet = full_alphabet
  }

  if (mapping.first) {
    const c1 = mapping.alphabet.indexOf(mapping.first.charAt(0))
    const c2 = mapping.alphabet.indexOf(mapping.first.charAt(1))
    const c3 = mapping.alphabet.indexOf(mapping.first.charAt(2))
    mapping.offset = c1 * mapping.s1 + c2 * mapping.s2 + c3
  } else {
    mapping.offset = 0
  }

  if (mapping.last) {
    const c1 = mapping.alphabet.indexOf(mapping.last.charAt(0))
    const c2 = mapping.alphabet.indexOf(mapping.last.charAt(1))
    const c3 = mapping.alphabet.indexOf(mapping.last.charAt(2))
    mapping.end = mapping.start - mapping.offset + c1 * mapping.s1 + c2 * mapping.s2 + c3
  } else {
    mapping.end =
      mapping.start -
      mapping.offset +
      (mapping.alphabet.length - 1) * mapping.s1 +
      (mapping.alphabet.length - 1) * mapping.s2 +
      (mapping.alphabet.length - 1)
  }
}

for (let i = 0; i < numeric_mappings.length; ++i) {
  numeric_mappings[i].end = numeric_mappings[i].start + numeric_mappings[i].count - 1
}

function lookup(hexid: string): string | null {
  const hexValue = Number.parseInt(hexid, 16)

  if (isNaN(hexValue)) {
    return null
  }

  let reg: string | null

  reg = n_reg(hexValue)
  if (reg) return reg

  reg = ja_reg(hexValue)
  if (reg) return reg

  reg = hl_reg(hexValue)
  if (reg) return reg

  reg = numeric_reg(hexValue)
  if (reg) return reg

  reg = stride_reg(hexValue)
  if (reg) return reg

  return null
}

function stride_reg(hexid: number): string | null {
  // try the mappings in stride_mappings
  for (let i = 0; i < stride_mappings.length; ++i) {
    const mapping = stride_mappings[i]
    if (hexid < mapping.start || hexid > (mapping.end || 0)) continue

    const offset = hexid - mapping.start + (mapping.offset || 0)

    const i1 = Math.floor(offset / mapping.s1)
    const remaining1 = offset % mapping.s1
    const i2 = Math.floor(remaining1 / mapping.s2)
    const i3 = remaining1 % mapping.s2

    const alphabet = mapping.alphabet || full_alphabet

    if (i1 < 0 || i1 >= alphabet.length || i2 < 0 || i2 >= alphabet.length || i3 < 0 || i3 >= alphabet.length) continue

    return mapping.prefix + alphabet.charAt(i1) + alphabet.charAt(i2) + alphabet.charAt(i3)
  }

  return null
}

function numeric_reg(hexid: number): string | null {
  for (let i = 0; i < numeric_mappings.length; ++i) {
    const mapping = numeric_mappings[i]
    if (hexid < mapping.start || hexid > (mapping.end || 0)) continue

    const reg = (hexid - mapping.start + mapping.first).toString()
    return mapping.template.substring(0, mapping.template.length - reg.length) + reg
  }

  return null
}

// US N-numbers
function n_letters(rem: number): string {
  if (rem == 0) return ""

  --rem
  return limited_alphabet.charAt(Math.floor(rem / 25)) + n_letter(rem % 25)
}

function n_letter(rem: number): string {
  if (rem == 0) return ""

  --rem
  return limited_alphabet.charAt(rem)
}

function n_reg(hexid: number): string | null {
  const offset = hexid - 0xa00001
  if (offset < 0 || offset >= 915399) {
    return null
  }

  const digit1 = Math.floor(offset / 101711) + 1
  let reg = "N" + digit1
  let remaining = offset % 101711

  if (remaining <= 600) {
    // Na, NaA .. NaZ, NaAA .. NaZZ
    return reg + n_letters(remaining)
  }

  // Na0* .. Na9*
  remaining -= 601

  const digit2 = Math.floor(remaining / 10111)
  reg += digit2
  remaining = remaining % 10111

  if (remaining <= 600) {
    // Nab, NabA..NabZ, NabAA..NabZZ
    return reg + n_letters(remaining)
  }

  // Nab0* .. Nab9*
  remaining -= 601

  const digit3 = Math.floor(remaining / 951)
  reg += digit3
  remaining = remaining % 951

  if (remaining <= 600) {
    // Nabc, NabcA .. NabcZ, NabcAA .. NabcZZ
    return reg + n_letters(remaining)
  }

  // Nabc0* .. Nabc9*
  remaining -= 601

  const digit4 = Math.floor(remaining / 35)
  reg += digit4.toString()
  remaining = remaining % 35

  if (remaining <= 24) {
    // Nabcd, NabcdA .. NabcdZ
    return reg + n_letter(remaining)
  }

  // Nabcd0 .. Nabcd9
  remaining -= 25
  return reg + remaining.toString()
}

// South Korea
function hl_reg(hexid: number): string | null {
  if (hexid >= 0x71ba00 && hexid <= 0x71bf99) {
    return "HL" + (hexid - 0x71ba00 + 0x7200).toString(16).toUpperCase()
  }

  if (hexid >= 0x71c000 && hexid <= 0x71c099) {
    return "HL" + (hexid - 0x71c000 + 0x8000).toString(16).toUpperCase()
  }

  if (hexid >= 0x71c200 && hexid <= 0x71c299) {
    return "HL" + (hexid - 0x71c200 + 0x8200).toString(16).toUpperCase()
  }

  return null
}

// Japan
function ja_reg(hexid: number): string | null {
  const offset = hexid - 0x840000
  if (offset < 0 || offset >= 229840) return null

  let reg = "JA"

  const digit1 = Math.floor(offset / 22984)
  if (digit1 < 0 || digit1 > 9) return null
  reg += digit1
  let remaining = offset % 22984

  const digit2 = Math.floor(remaining / 916)
  if (digit2 < 0 || digit2 > 9) return null
  reg += digit2
  remaining = remaining % 916

  if (remaining < 340) {
    // 3rd is a digit, 4th is a digit or letter
    const digit3 = Math.floor(remaining / 34)
    reg += digit3
    remaining = remaining % 34

    if (remaining < 10) {
      // 4th is a digit
      return reg + remaining
    }

    // 4th is a letter
    remaining -= 10
    return reg + limited_alphabet.charAt(remaining)
  }

  // 3rd and 4th are letters
  remaining -= 340
  const letter3 = Math.floor(remaining / 24)
  return reg + limited_alphabet.charAt(letter3) + limited_alphabet.charAt(remaining % 24)
}

export function registration_from_hexid(hexid: string): string | null {
  // Validate input
  if (!hexid || typeof hexid !== "string") {
    return null
  }

  // Clean the hex ID
  const cleanHex = hexid.replace(/^0x/i, "").trim()

  // Validate hex format
  if (!/^[0-9a-fA-F]{1,6}$/.test(cleanHex)) {
    return null
  }

  const result = lookup(cleanHex)

  // Additional validation - ensure we return a proper registration or null
  if (
    (result && result.length >= 3 && result.includes("-")) ||
    result?.startsWith("N") ||
    result?.startsWith("JA") ||
    result?.startsWith("HL")
  ) {
    return result
  }

  return null
}

export default registration_from_hexid
