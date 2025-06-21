/**
 * This file contains code based on tar1090:
 * https://github.com/wiedehopf/tar1090
 *
 * The original code is licensed under GPL v2 or later.
 * See https://www.gnu.org/licenses/old-licenses/gpl-2.0.html for license details.
 */

// ICAO aircraft registration address ranges and country lookup
// Based on ICAO Annex 10 Vol III assignments

interface ICAORange {
  start: number
  end: number
  country: string
  country_code: string | null
}

const ICAO_Ranges: ICAORange[] = [
  // Mostly generated from the assignment table in the appendix to Chapter 9 of
  // Annex 10 Vol III, Second Edition, July 2007 (with amendments through 88-A, 14/11/2013)

  { start: 0x004000, end: 0x0043ff, country: "Zimbabwe", country_code: "zw" },
  { start: 0x006000, end: 0x006fff, country: "Mozambique", country_code: "mz" },
  { start: 0x008000, end: 0x00ffff, country: "South Africa", country_code: "za" },
  { start: 0x010000, end: 0x017fff, country: "Egypt", country_code: "eg" },
  { start: 0x018000, end: 0x01ffff, country: "Libya", country_code: "ly" },
  { start: 0x020000, end: 0x027fff, country: "Morocco", country_code: "ma" },
  { start: 0x028000, end: 0x02ffff, country: "Tunisia", country_code: "tn" },
  { start: 0x030000, end: 0x0303ff, country: "Botswana", country_code: "bw" },
  { start: 0x032000, end: 0x032fff, country: "Burundi", country_code: "bi" },
  { start: 0x034000, end: 0x034fff, country: "Cameroon", country_code: "cm" },
  { start: 0x035000, end: 0x0353ff, country: "Comoros", country_code: "km" },
  { start: 0x036000, end: 0x036fff, country: "Congo", country_code: "cg" },
  { start: 0x038000, end: 0x038fff, country: "Cote d'Ivoire", country_code: "ci" },
  { start: 0x03e000, end: 0x03efff, country: "Gabon", country_code: "ga" },
  { start: 0x040000, end: 0x040fff, country: "Ethiopia", country_code: "et" },
  { start: 0x042000, end: 0x042fff, country: "Equatorial Guinea", country_code: "gq" },
  { start: 0x044000, end: 0x044fff, country: "Ghana", country_code: "gh" },
  { start: 0x046000, end: 0x046fff, country: "Guinea", country_code: "gn" },
  { start: 0x048000, end: 0x0483ff, country: "Guinea-Bissau", country_code: "gw" },
  { start: 0x04a000, end: 0x04a3ff, country: "Lesotho", country_code: "ls" },
  { start: 0x04c000, end: 0x04cfff, country: "Kenya", country_code: "ke" },
  { start: 0x050000, end: 0x050fff, country: "Liberia", country_code: "lr" },
  { start: 0x054000, end: 0x054fff, country: "Madagascar", country_code: "mg" },
  { start: 0x058000, end: 0x058fff, country: "Malawi", country_code: "mw" },
  { start: 0x05a000, end: 0x05a3ff, country: "Maldives", country_code: "mv" },
  { start: 0x05c000, end: 0x05cfff, country: "Mali", country_code: "ml" },
  { start: 0x05e000, end: 0x05e3ff, country: "Mauritania", country_code: "mr" },
  { start: 0x060000, end: 0x0603ff, country: "Mauritius", country_code: "mu" },
  { start: 0x062000, end: 0x062fff, country: "Niger", country_code: "ne" },
  { start: 0x064000, end: 0x064fff, country: "Nigeria", country_code: "ng" },
  { start: 0x068000, end: 0x068fff, country: "Uganda", country_code: "ug" },
  { start: 0x06a000, end: 0x06a3ff, country: "Qatar", country_code: "qa" },
  { start: 0x06c000, end: 0x06cfff, country: "Central African Republic", country_code: "cf" },
  { start: 0x06e000, end: 0x06efff, country: "Rwanda", country_code: "rw" },
  { start: 0x070000, end: 0x070fff, country: "Senegal", country_code: "sn" },
  { start: 0x074000, end: 0x0743ff, country: "Seychelles", country_code: "sc" },
  { start: 0x076000, end: 0x0763ff, country: "Sierra Leone", country_code: "sl" },
  { start: 0x078000, end: 0x078fff, country: "Somalia", country_code: "so" },
  { start: 0x07a000, end: 0x07a3ff, country: "Eswatini", country_code: "sz" },
  { start: 0x07c000, end: 0x07cfff, country: "Sudan", country_code: "sd" },
  { start: 0x080000, end: 0x080fff, country: "Tanzania", country_code: "tz" },
  { start: 0x084000, end: 0x084fff, country: "Chad", country_code: "td" },
  { start: 0x088000, end: 0x088fff, country: "Togo", country_code: "tg" },
  { start: 0x08a000, end: 0x08afff, country: "Zambia", country_code: "zm" },
  { start: 0x08c000, end: 0x08cfff, country: "DR Congo", country_code: "cd" },
  { start: 0x090000, end: 0x090fff, country: "Angola", country_code: "ao" },
  { start: 0x094000, end: 0x0943ff, country: "Benin", country_code: "bj" },
  { start: 0x096000, end: 0x0963ff, country: "Cabo Verde", country_code: "cv" },
  { start: 0x098000, end: 0x0983ff, country: "Djibouti", country_code: "dj" },
  { start: 0x09a000, end: 0x09afff, country: "Gambia", country_code: "gm" },
  { start: 0x09c000, end: 0x09cfff, country: "Burkina Faso", country_code: "bf" },
  { start: 0x09e000, end: 0x09e3ff, country: "Sao Tome and Principe", country_code: "st" },
  { start: 0x0a0000, end: 0x0a7fff, country: "Algeria", country_code: "dz" },
  { start: 0x0a8000, end: 0x0a8fff, country: "Bahamas", country_code: "bs" },
  { start: 0x0aa000, end: 0x0aa3ff, country: "Barbados", country_code: "bb" },
  { start: 0x0ab000, end: 0x0ab3ff, country: "Belize", country_code: "bz" },
  { start: 0x0ac000, end: 0x0acfff, country: "Colombia", country_code: "co" },
  { start: 0x0ae000, end: 0x0aefff, country: "Costa Rica", country_code: "cr" },
  { start: 0x0b0000, end: 0x0b0fff, country: "Cuba", country_code: "cu" },
  { start: 0x0b2000, end: 0x0b2fff, country: "El Salvador", country_code: "sv" },
  { start: 0x0b4000, end: 0x0b4fff, country: "Guatemala", country_code: "gt" },
  { start: 0x0b6000, end: 0x0b6fff, country: "Guyana", country_code: "gy" },
  { start: 0x0b8000, end: 0x0b8fff, country: "Haiti", country_code: "ht" },
  { start: 0x0ba000, end: 0x0bafff, country: "Honduras", country_code: "hn" },
  { start: 0x0bc000, end: 0x0bc3ff, country: "Saint Vincent and the Grenadines", country_code: "vc" },
  { start: 0x0be000, end: 0x0befff, country: "Jamaica", country_code: "jm" },
  { start: 0x0c0000, end: 0x0c0fff, country: "Nicaragua", country_code: "ni" },
  { start: 0x0c2000, end: 0x0c2fff, country: "Panama", country_code: "pa" },
  { start: 0x0c4000, end: 0x0c4fff, country: "Dominican Republic", country_code: "do" },
  { start: 0x0c6000, end: 0x0c6fff, country: "Trinidad and Tobago", country_code: "tt" },
  { start: 0x0c8000, end: 0x0c8fff, country: "Suriname", country_code: "sr" },
  { start: 0x0ca000, end: 0x0ca3ff, country: "Antigua and Barbuda", country_code: "ag" },
  { start: 0x0cc000, end: 0x0cc3ff, country: "Grenada", country_code: "gd" },
  { start: 0x0d0000, end: 0x0d7fff, country: "Mexico", country_code: "mx" },
  { start: 0x0d8000, end: 0x0dffff, country: "Venezuela", country_code: "ve" },
  { start: 0x100000, end: 0x1fffff, country: "Russia", country_code: "ru" },
  { start: 0x201000, end: 0x2013ff, country: "Namibia", country_code: "na" },
  { start: 0x202000, end: 0x2023ff, country: "Eritrea", country_code: "er" },
  { start: 0x300000, end: 0x33ffff, country: "Italy", country_code: "it" },
  { start: 0x340000, end: 0x37ffff, country: "Spain", country_code: "es" },
  { start: 0x380000, end: 0x3bffff, country: "France", country_code: "fr" },
  { start: 0x3c0000, end: 0x3fffff, country: "Germany", country_code: "de" },
  // UK territories are officially part of the UK range
  // add extra entries that are above the UK and take precedence
  { start: 0x400000, end: 0x4001bf, country: "Bermuda", country_code: "bm" },
  { start: 0x4001c0, end: 0x4001ff, country: "Cayman Islands", country_code: "ky" },
  { start: 0x400300, end: 0x4003ff, country: "Turks and Caicos Islands", country_code: "tc" },
  { start: 0x424135, end: 0x4241f2, country: "Cayman Islands", country_code: "ky" },
  { start: 0x424200, end: 0x4246ff, country: "Bermuda", country_code: "bm" },
  { start: 0x424700, end: 0x424899, country: "Cayman Islands", country_code: "ky" },
  { start: 0x424b00, end: 0x424bff, country: "Isle of Man", country_code: "im" },
  { start: 0x43be00, end: 0x43beff, country: "Bermuda", country_code: "bm" },
  { start: 0x43e700, end: 0x43eafd, country: "Isle of Man", country_code: "im" },
  { start: 0x43eafe, end: 0x43eeff, country: "Guernsey", country_code: "gg" },
  // catch all United Kingdom for the even more obscure stuff
  { start: 0x400000, end: 0x43ffff, country: "United Kingdom", country_code: "gb" },
  { start: 0x440000, end: 0x447fff, country: "Austria", country_code: "at" },
  { start: 0x448000, end: 0x44ffff, country: "Belgium", country_code: "be" },
  { start: 0x450000, end: 0x457fff, country: "Bulgaria", country_code: "bg" },
  { start: 0x458000, end: 0x45ffff, country: "Denmark", country_code: "dk" },
  { start: 0x460000, end: 0x467fff, country: "Finland", country_code: "fi" },
  { start: 0x468000, end: 0x46ffff, country: "Greece", country_code: "gr" },
  { start: 0x470000, end: 0x477fff, country: "Hungary", country_code: "hu" },
  { start: 0x478000, end: 0x47ffff, country: "Norway", country_code: "no" },
  { start: 0x480000, end: 0x487fff, country: "Kingdom of the Netherlands", country_code: "nl" },
  { start: 0x488000, end: 0x48ffff, country: "Poland", country_code: "pl" },
  { start: 0x490000, end: 0x497fff, country: "Portugal", country_code: "pt" },
  { start: 0x498000, end: 0x49ffff, country: "Czechia", country_code: "cz" },
  { start: 0x4a0000, end: 0x4a7fff, country: "Romania", country_code: "ro" },
  { start: 0x4a8000, end: 0x4affff, country: "Sweden", country_code: "se" },
  { start: 0x4b0000, end: 0x4b7fff, country: "Switzerland", country_code: "ch" },
  { start: 0x4b8000, end: 0x4bffff, country: "Turkey", country_code: "tr" },
  { start: 0x4c0000, end: 0x4c7fff, country: "Serbia", country_code: "rs" },
  { start: 0x4c8000, end: 0x4c83ff, country: "Cyprus", country_code: "cy" },
  { start: 0x4ca000, end: 0x4cafff, country: "Ireland", country_code: "ie" },
  { start: 0x4cc000, end: 0x4ccfff, country: "Iceland", country_code: "is" },
  { start: 0x4d0000, end: 0x4d03ff, country: "Luxembourg", country_code: "lu" },
  { start: 0x4d2000, end: 0x4d2fff, country: "Malta", country_code: "mt" },
  { start: 0x4d4000, end: 0x4d43ff, country: "Monaco", country_code: "mc" },
  { start: 0x500000, end: 0x5003ff, country: "San Marino", country_code: "sm" },
  { start: 0x501000, end: 0x5013ff, country: "Albania", country_code: "al" },
  { start: 0x501c00, end: 0x501fff, country: "Croatia", country_code: "hr" },
  { start: 0x502c00, end: 0x502fff, country: "Latvia", country_code: "lv" },
  { start: 0x503c00, end: 0x503fff, country: "Lithuania", country_code: "lt" },
  { start: 0x504c00, end: 0x504fff, country: "Moldova", country_code: "md" },
  { start: 0x505c00, end: 0x505fff, country: "Slovakia", country_code: "sk" },
  { start: 0x506c00, end: 0x506fff, country: "Slovenia", country_code: "si" },
  { start: 0x507c00, end: 0x507fff, country: "Uzbekistan", country_code: "uz" },
  { start: 0x508000, end: 0x50ffff, country: "Ukraine", country_code: "ua" },
  { start: 0x510000, end: 0x5103ff, country: "Belarus", country_code: "by" },
  { start: 0x511000, end: 0x5113ff, country: "Estonia", country_code: "ee" },
  { start: 0x512000, end: 0x5123ff, country: "Macedonia", country_code: "mk" },
  { start: 0x513000, end: 0x5133ff, country: "Bosnia and Herzegovina", country_code: "ba" },
  { start: 0x514000, end: 0x5143ff, country: "Georgia", country_code: "ge" },
  { start: 0x515000, end: 0x5153ff, country: "Tajikistan", country_code: "tj" },
  { start: 0x516000, end: 0x5163ff, country: "Montenegro", country_code: "me" },
  { start: 0x600000, end: 0x6003ff, country: "Armenia", country_code: "am" },
  { start: 0x600800, end: 0x600bff, country: "Azerbaijan", country_code: "az" },
  { start: 0x601000, end: 0x6013ff, country: "Kyrgyzstan", country_code: "kg" },
  { start: 0x601800, end: 0x601bff, country: "Turkmenistan", country_code: "tm" },
  { start: 0x680000, end: 0x6803ff, country: "Bhutan", country_code: "bt" },
  { start: 0x681000, end: 0x6813ff, country: "Micronesia, Federated States of", country_code: "fm" },
  { start: 0x682000, end: 0x6823ff, country: "Mongolia", country_code: "mn" },
  { start: 0x683000, end: 0x6833ff, country: "Kazakhstan", country_code: "kz" },
  { start: 0x684000, end: 0x6843ff, country: "Palau", country_code: "pw" },
  { start: 0x700000, end: 0x700fff, country: "Afghanistan", country_code: "af" },
  { start: 0x702000, end: 0x702fff, country: "Bangladesh", country_code: "bd" },
  { start: 0x704000, end: 0x704fff, country: "Myanmar", country_code: "mm" },
  { start: 0x706000, end: 0x706fff, country: "Kuwait", country_code: "kw" },
  { start: 0x708000, end: 0x708fff, country: "Laos", country_code: "la" },
  { start: 0x70a000, end: 0x70afff, country: "Nepal", country_code: "np" },
  { start: 0x70c000, end: 0x70c3ff, country: "Oman", country_code: "om" },
  { start: 0x70e000, end: 0x70efff, country: "Cambodia", country_code: "kh" },
  { start: 0x710000, end: 0x717fff, country: "Saudi Arabia", country_code: "sa" },
  { start: 0x718000, end: 0x71ffff, country: "South Korea", country_code: "kr" },
  { start: 0x720000, end: 0x727fff, country: "North Korea", country_code: "kp" },
  { start: 0x728000, end: 0x72ffff, country: "Iraq", country_code: "iq" },
  { start: 0x730000, end: 0x737fff, country: "Iran", country_code: "ir" },
  { start: 0x738000, end: 0x73ffff, country: "Israel", country_code: "il" },
  { start: 0x740000, end: 0x747fff, country: "Jordan", country_code: "jo" },
  { start: 0x748000, end: 0x74ffff, country: "Lebanon", country_code: "lb" },
  { start: 0x750000, end: 0x757fff, country: "Malaysia", country_code: "my" },
  { start: 0x758000, end: 0x75ffff, country: "Philippines", country_code: "ph" },
  { start: 0x760000, end: 0x767fff, country: "Pakistan", country_code: "pk" },
  { start: 0x768000, end: 0x76ffff, country: "Singapore", country_code: "sg" },
  { start: 0x770000, end: 0x777fff, country: "Sri Lanka", country_code: "lk" },
  { start: 0x778000, end: 0x77ffff, country: "Syria", country_code: "sy" },
  { start: 0x789000, end: 0x789fff, country: "Hong Kong", country_code: "hk" },
  { start: 0x780000, end: 0x7bffff, country: "China", country_code: "cn" },
  { start: 0x7c0000, end: 0x7fffff, country: "Australia", country_code: "au" },
  { start: 0x800000, end: 0x83ffff, country: "India", country_code: "in" },
  { start: 0x840000, end: 0x87ffff, country: "Japan", country_code: "jp" },
  { start: 0x880000, end: 0x887fff, country: "Thailand", country_code: "th" },
  { start: 0x888000, end: 0x88ffff, country: "Viet Nam", country_code: "vn" },
  { start: 0x890000, end: 0x890fff, country: "Yemen", country_code: "ye" },
  { start: 0x894000, end: 0x894fff, country: "Bahrain", country_code: "bh" },
  { start: 0x895000, end: 0x8953ff, country: "Brunei", country_code: "bn" },
  { start: 0x896000, end: 0x896fff, country: "United Arab Emirates", country_code: "ae" },
  { start: 0x897000, end: 0x8973ff, country: "Solomon Islands", country_code: "sb" },
  { start: 0x898000, end: 0x898fff, country: "Papua New Guinea", country_code: "pg" },
  { start: 0x899000, end: 0x8993ff, country: "Taiwan", country_code: "tw" },
  { start: 0x8a0000, end: 0x8a7fff, country: "Indonesia", country_code: "id" },
  { start: 0x900000, end: 0x9003ff, country: "Marshall Islands", country_code: "mh" },
  { start: 0x901000, end: 0x9013ff, country: "Cook Islands", country_code: "ck" },
  { start: 0x902000, end: 0x9023ff, country: "Samoa", country_code: "ws" },
  { start: 0xa00000, end: 0xafffff, country: "United States", country_code: "us" },
  { start: 0xc00000, end: 0xc3ffff, country: "Canada", country_code: "ca" },
  { start: 0xc80000, end: 0xc87fff, country: "New Zealand", country_code: "nz" },
  { start: 0xc88000, end: 0xc88fff, country: "Fiji", country_code: "fj" },
  { start: 0xc8a000, end: 0xc8a3ff, country: "Nauru", country_code: "nr" },
  { start: 0xc8c000, end: 0xc8c3ff, country: "Saint Lucia", country_code: "lc" },
  { start: 0xc8d000, end: 0xc8d3ff, country: "Tonga", country_code: "to" },
  { start: 0xc8e000, end: 0xc8e3ff, country: "Kiribati", country_code: "ki" },
  { start: 0xc90000, end: 0xc903ff, country: "Vanuatu", country_code: "vu" },
  { start: 0xe00000, end: 0xe3ffff, country: "Argentina", country_code: "ar" },
  { start: 0xe40000, end: 0xe7ffff, country: "Brazil", country_code: "br" },
  { start: 0xe80000, end: 0xe80fff, country: "Chile", country_code: "cl" },
  { start: 0xe84000, end: 0xe84fff, country: "Ecuador", country_code: "ec" },
  { start: 0xe88000, end: 0xe88fff, country: "Paraguay", country_code: "py" },
  { start: 0xe8c000, end: 0xe8cfff, country: "Peru", country_code: "pe" },
  { start: 0xe90000, end: 0xe90fff, country: "Uruguay", country_code: "uy" },
  { start: 0xe94000, end: 0xe94fff, country: "Bolivia", country_code: "bo" },
  { start: 0xf00000, end: 0xf07fff, country: "ICAO (temporary)", country_code: null },
  { start: 0xf09000, end: 0xf093ff, country: "ICAO (special use)", country_code: null },

  // Block assignments mentioned in Chapter 9 section 4, at the end so they are only used if
  // nothing above applies
  { start: 0x200000, end: 0x27ffff, country: "Unassigned (AFI region)", country_code: null },
  { start: 0x280000, end: 0x28ffff, country: "Unassigned (SAM region)", country_code: null },
  { start: 0x500000, end: 0x5fffff, country: "Unassigned (EUR / NAT regions)", country_code: null },
  { start: 0x600000, end: 0x67ffff, country: "Unassigned (MID region)", country_code: null },
  { start: 0x680000, end: 0x6fffff, country: "Unassigned (ASIA region)", country_code: null },
  { start: 0x900000, end: 0x9fffff, country: "Unassigned (NAM / PAC regions)", country_code: null },
  { start: 0xb00000, end: 0xbfffff, country: "Unassigned (reserved for future use)", country_code: null },
  { start: 0xec0000, end: 0xefffff, country: "Unassigned (CAR region)", country_code: null },
  { start: 0xd00000, end: 0xdfffff, country: "Unassigned (reserved for future use)", country_code: null },
  { start: 0xf00000, end: 0xffffff, country: "Unassigned (reserved for future use)", country_code: null },
]

const unassigned_range = {
  country: "Unassigned",
  country_code: null,
}

// Given a (hex string) ICAO address, return an object describing that ICAO range.
// Always returns a non-null object.
export function findICAORange(icao: string): ICAORange {
  const hexa = Number.parseInt(icao, 16)

  for (let i = 0; i < ICAO_Ranges.length; ++i) {
    if (hexa >= ICAO_Ranges[i].start && hexa <= ICAO_Ranges[i].end) {
      return ICAO_Ranges[i]
    }
  }

  return unassigned_range
}

// Helper function to get country info from ICAO hex
export function getCountryFromICAO(icao: string): { country: string; countryCode: string | null } {
  const range = findICAORange(icao)
  return {
    country: range.country,
    countryCode: range.country_code,
  }
}
