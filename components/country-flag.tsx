"use client"

import { getCountryFromICAO } from "@/lib/icao-country-lookup"

interface CountryFlagProps {
  icao: string
  size?: "xs" | "sm" | "md" | "lg"
  showCountryName?: boolean
  className?: string
  debug?: boolean
}

export function CountryFlag({
  icao,
  size = "sm",
  showCountryName = false,
  className = "",
  debug = false,
}: CountryFlagProps) {
  // Clean the ICAO hex code - remove any prefixes and ensure it's uppercase
  const cleanIcao = icao.replace(/^0x/i, "").toUpperCase()

  const { country, countryCode } = getCountryFromICAO(cleanIcao)

  // Debug logging when enabled
  if (debug) {
    console.log(`Flag lookup for ICAO ${icao} (cleaned: ${cleanIcao}):`, { country, countryCode })
  }

  // Size mappings
  const sizeClasses = {
    xs: "w-3 h-2",
    sm: "w-4 h-3",
    md: "w-6 h-4",
    lg: "w-8 h-6",
  }

  const textSizeClasses = {
    xs: "text-xs",
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  // Don't show flag for unassigned ranges, but show country name if requested
  if (!countryCode) {
    return showCountryName ? (
      <span className={`text-slate-400 ${textSizeClasses[size]} ${className}`}>
        {country}
        {debug && <span className="text-red-400 ml-1">(No flag)</span>}
      </span>
    ) : debug ? (
      <span className="text-red-400 text-xs">No flag for {cleanIcao}</span>
    ) : null
  }

  const flagPath = `/flags/${countryCode.toUpperCase()}.svg`

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <img
        src={flagPath || "/placeholder.svg"}
        alt={`${country} flag`}
        className={`${sizeClasses[size]} object-cover rounded-sm border border-slate-600/30`}
        onError={(e) => {
          if (debug) {
            console.log(`Flag file missing: ${flagPath} for country ${country} (${countryCode})`)
          }
          // Instead of hiding, show country name as fallback
          const target = e.target as HTMLImageElement
          const parent = target.parentElement
          if (parent) {
            target.style.display = "none"
            // Add country name if not already shown
            if (!showCountryName && !parent.querySelector(".fallback-text")) {
              const fallbackText = document.createElement("span")
              fallbackText.className = `fallback-text text-slate-300 ${textSizeClasses[size]} bg-slate-700/50 px-1 rounded text-xs`
              fallbackText.textContent = countryCode?.toUpperCase() || "N/A"
              parent.appendChild(fallbackText)
            }
          }
        }}
        onLoad={() => {
          if (debug) {
            console.log(`Flag loaded successfully: ${flagPath}`)
          }
        }}
      />
      {showCountryName && <span className={`text-slate-300 ${textSizeClasses[size]}`}>{country}</span>}
      {debug && <span className="text-green-400 text-xs ml-1">{countryCode.toUpperCase()}</span>}
    </div>
  )
}
