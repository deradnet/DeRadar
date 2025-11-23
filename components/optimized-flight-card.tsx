"use client"

import { memo } from "react"
import type { Aircraft } from "@/types/aircraft"
import { CountryFlag } from "./country-flag"
import { registration_from_hexid } from "@/lib/registration-lookup"

interface OptimizedFlightCardProps {
  flight: Aircraft
  onClick: () => void
  airline: any
  isEmergency: boolean
  showDebug: boolean
}

/**
 * Optimized flight card component with GPU acceleration
 * Memoized to prevent re-renders
 */
export const OptimizedFlightCard = memo(
  function OptimizedFlightCard({ flight, onClick, airline, isEmergency, showDebug }: OptimizedFlightCardProps) {
    const registration = flight.r || registration_from_hexid(flight.hex)

    return (
      <div
        className={`p-3 rounded-lg border cursor-pointer transition-all duration-150 hover:scale-[1.01] ${
          isEmergency
            ? "bg-red-500/10 border-red-500/30 hover:bg-red-500/20"
            : "bg-slate-800/30 border-slate-700/50 hover:bg-slate-700/50"
        } backdrop-blur-sm`}
        onClick={onClick}
        style={{
          contain: "layout style paint",
          willChange: "transform",
          transform: "translateZ(0)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CountryFlag icao={flight.hex} size="sm" debug={showDebug} />
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2">
                  {airline && (
                    <img
                      src={`https://airline-logo-api.derad.org/${airline.IATA}.png`}
                      alt={airline.Name}
                      className="w-5 h-5 object-contain"
                      loading="lazy"
                      decoding="async"
                      style={{ willChange: "transform", transform: "translateZ(0)" }}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  )}
                  <span className="font-semibold text-white">{flight.flight || flight.hex}</span>
                  {isEmergency && (
                    <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded border border-red-500/30">
                      {flight.emergency}
                    </span>
                  )}
                </div>
                {registration && <div className="text-xs text-slate-400">{registration}</div>}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="text-slate-400">
                  Alt:{" "}
                  {flight.alt_baro !== undefined
                    ? `${Math.round(flight.alt_baro).toLocaleString()}ft`
                    : flight.alt_geom !== undefined
                      ? `${Math.round(flight.alt_geom).toLocaleString()}ft`
                      : "--"}
                </span>
              </div>
              <div>
                <span className="text-slate-400">
                  Speed: {flight.gs !== undefined ? `${Math.round(flight.gs)}kts` : "--"}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Squawk: {flight.squawk || "--"}</span>
              </div>
              <div>
                <span className="text-slate-400">Type: {flight.t || "--"}</span>
              </div>
            </div>
          </div>
          <div className="ml-4">
            <div
              className={`w-3 h-3 rounded-full ${
                flight.seen && flight.seen < 5 ? "bg-green-500" : flight.seen && flight.seen < 15 ? "bg-yellow-500" : "bg-slate-500"
              }`}
            ></div>
          </div>
        </div>
      </div>
    )
  },
  (prevProps, nextProps) => {
    // Custom comparison - only re-render if these change
    return (
      prevProps.flight.hex === nextProps.flight.hex &&
      prevProps.flight.alt_baro === nextProps.flight.alt_baro &&
      prevProps.flight.gs === nextProps.flight.gs &&
      prevProps.flight.seen === nextProps.flight.seen &&
      prevProps.isEmergency === nextProps.isEmergency
    )
  }
)
