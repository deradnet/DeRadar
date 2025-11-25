"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import { Aircraft } from "@/types/aircraft"
import airlineColors from "@/public/airline-colors.json"
import { Building2 } from "lucide-react"

interface AirlinesViewProps {
  aircraft: Aircraft[]
  isNativeApp?: boolean
}

export function AirlinesView({ aircraft, isNativeApp = false }: AirlinesViewProps) {
  const [treemapLoaded, setTreemapLoaded] = useState(false)
  const airlineChartRef = useRef<any>(null)

  // Load treemap module
  useEffect(() => {
    if (typeof window !== "undefined" && !treemapLoaded) {
      try {
        const treemapModule = require("highcharts/modules/treemap")
        if (typeof treemapModule === "function") {
          treemapModule(Highcharts)
        } else if (typeof treemapModule.default === "function") {
          treemapModule.default(Highcharts)
        }
        setTreemapLoaded(true)
      } catch (error) {
        console.error("Failed to load treemap module:", error)
      }
    }
  }, [treemapLoaded])

  // Process airline data
  const airlineData = useMemo(() => {
    const airlineCounts = new Map<string, number>()
    aircraft.forEach((a) => {
      if (a.flight) {
        const code = a.flight.trim().substring(0, 3).toUpperCase()
        if (code && /^[A-Z0-9]{2,3}$/.test(code)) {
          airlineCounts.set(code, (airlineCounts.get(code) || 0) + 1)
        }
      }
    })

    const colorMap = airlineColors as Record<string, string>

    return Array.from(airlineCounts.entries())
      .map(([code, count]) => ({
        name: code,
        value: count,
        color: colorMap[code] || `hsl(${Math.random() * 360}, 70%, 50%)`,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 50) // Top 50 airlines
  }, [aircraft])

  const airlineChartOptions = useMemo(() => {
    if (!airlineData.length) return null

    return {
      chart: {
        type: "treemap",
        backgroundColor: "transparent",
        height: isNativeApp ? "100%" : 600,
      },
      title: {
        text: "Airlines Distribution",
        style: { color: "#cbd5e1", fontSize: "20px", fontWeight: "600" },
      },
      subtitle: {
        text: `Top ${airlineData.length} airlines by aircraft count`,
        style: { color: "#94a3b8", fontSize: "14px" },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        borderColor: "#334155",
        style: { color: "#e2e8f0" },
        pointFormat: "<b>{point.name}</b>: {point.value} aircraft",
      },
      plotOptions: {
        treemap: {
          layoutAlgorithm: "squarified",
          borderWidth: 2,
          borderColor: "#0f172a",
          dataLabels: {
            enabled: true,
            style: {
              color: "#ffffff",
              textOutline: "2px #000000",
              fontWeight: "bold",
              fontSize: "14px",
            },
            format: "{point.name}<br>{point.value}",
          },
          tooltip: {
            pointFormat: "<b>{point.name}</b>: {point.value} aircraft",
          },
        },
      },
      series: [
        {
          name: "Aircraft Count",
          type: "treemap",
          data: airlineData,
        },
      ],
      credits: { enabled: false },
    }
  }, [airlineData, isNativeApp])

  if (!treemapLoaded || !airlineChartOptions) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
        <Building2 className="w-16 h-16 text-slate-600 animate-pulse" />
        <p>Loading airlines data...</p>
      </div>
    )
  }

  return (
    <div
      className={`${isNativeApp ? "h-full w-full flex items-center justify-center p-4" : "p-6"} bg-slate-950`}
      style={{ touchAction: "pan-y" }} // Allow vertical scrolling only
    >
      <div className="w-full max-w-6xl">
        <HighchartsReact
          ref={airlineChartRef}
          highcharts={Highcharts}
          options={airlineChartOptions}
          containerProps={{
            style: { height: isNativeApp ? "calc(100vh - 180px)" : "600px", touchAction: "none" }
          }}
        />
      </div>
    </div>
  )
}
