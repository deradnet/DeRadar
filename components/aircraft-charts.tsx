"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import { Aircraft } from "@/types/aircraft"
import flagColors from "@/public/flags/flag-colors.json"
import airlineColors from "@/public/airline-colors.json"
import { BarChart3, Gauge, PieChart, Activity, Globe, Radio, Building2 } from "lucide-react"
import { Haptics, ImpactStyle } from "@capacitor/haptics"

interface AircraftChartsProps {
  aircraft: Aircraft[]
  isNativeApp?: boolean
  isMobile?: boolean
  isVisible?: boolean
  onActiveChartChange?: (index: number) => void
}

export default function AircraftCharts({ aircraft, isNativeApp = false, isMobile = false, isVisible = true, onActiveChartChange }: AircraftChartsProps) {
  const [chartData, setChartData] = useState<any>(null)
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const [nextUpdateIn, setNextUpdateIn] = useState<number>(10)
  const [treemapLoaded, setTreemapLoaded] = useState(false)
  const [activeChartIndex, setActiveChartIndex] = useState(0)
  const activeChartIndexRef = useRef(0) // Track current index in ref to avoid stale closure
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Chart refs for direct updates without re-rendering
  const altitudeChartRef = useRef<any>(null)
  const speedChartRef = useRef<any>(null)
  const categoryChartRef = useRef<any>(null)
  const scatterChartRef = useRef<any>(null)
  const countryChartRef = useRef<any>(null)
  const squawkChartRef = useRef<any>(null)
  const airlineChartRef = useRef<any>(null)

  // Chart navigation data
  const chartNavItems = [
    { icon: BarChart3, label: "Altitude" },
    { icon: Gauge, label: "Speed" },
    { icon: PieChart, label: "Category" },
    { icon: Activity, label: "Scatter" },
    { icon: Globe, label: "Country" },
    { icon: Radio, label: "Squawk" },
    { icon: Building2, label: "Airline" },
  ]

  // Load treemap module
  useEffect(() => {
    if (typeof window !== "undefined" && !treemapLoaded) {
      try {
        // Use require for synchronous loading
        const treemapModule = require("highcharts/modules/treemap")
        // The module might be wrapped, try both .default and direct call
        if (typeof treemapModule === "function") {
          treemapModule(Highcharts)
        } else if (typeof treemapModule.default === "function") {
          treemapModule.default(Highcharts)
        } else {
          console.error("Treemap module is not a function:", treemapModule)
        }
        console.log("Treemap module loaded successfully")
        setTreemapLoaded(true)
      } catch (error) {
        console.error("Failed to load treemap module:", error)
      }
    }
  }, [])

  // Refs for each chart section
  const chartSectionRefs = useRef<(HTMLDivElement | null)[]>([])

  // Intersection Observer for active chart detection
  useEffect(() => {
    if (!isNativeApp || !isMobile) return
    if (!scrollContainerRef.current) return

    const scrollContainer = scrollContainerRef.current

    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        // Find the most visible entry
        let maxRatio = 0
        let targetIndex = -1

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio
            const index = chartSectionRefs.current.indexOf(entry.target as HTMLDivElement)
            if (index !== -1) {
              targetIndex = index
            }
          }
        })

        // Update active chart if we found a visible one with at least 50% visibility
        if (targetIndex !== -1 && maxRatio > 0.5) {
          setActiveChartIndex(targetIndex)
          onActiveChartChange?.(targetIndex)
        }
      },
      {
        root: scrollContainer,
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        rootMargin: '0px'
      }
    )

    // Wait for next tick to ensure refs are populated
    const timeoutId = setTimeout(() => {
      chartSectionRefs.current.forEach((section) => {
        if (section) {
          observer.observe(section)
        }
      })
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [isNativeApp, isMobile, onActiveChartChange])

  // Navigate to specific chart
  const navigateToChart = async (index: number) => {
    if (!scrollContainerRef.current) return

    // Haptic feedback
    try {
      await Haptics.impact({ style: ImpactStyle.Light })
    } catch (e) {
      // Haptics not available
    }

    // Update active index immediately for instant UI feedback
    activeChartIndexRef.current = index
    setActiveChartIndex(index)
    onActiveChartChange?.(index)

    const windowHeight = window.innerHeight
    scrollContainerRef.current.scrollTo({
      top: index * windowHeight,
      behavior: 'smooth'
    })
  }

  // Scroll listener to detect active chart - runs immediately for instant feedback
  useEffect(() => {
    if (!isNativeApp || !isMobile) return
    if (!scrollContainerRef.current) return

    const scrollContainer = scrollContainerRef.current
    let scrollTimeout: NodeJS.Timeout
    let rafId: number

    const updateIndex = () => {
      if (!scrollContainer) return

      const scrollTop = scrollContainer.scrollTop
      const windowHeight = window.innerHeight
      const currentIndex = Math.round(scrollTop / windowHeight)

      // Always update to ensure it stays in sync
      if (currentIndex >= 0 && currentIndex < chartNavItems.length) {
        if (currentIndex !== activeChartIndexRef.current) {
          activeChartIndexRef.current = currentIndex
          setActiveChartIndex(currentIndex)
          onActiveChartChange?.(currentIndex)
        }
      }
    }

    const handleScroll = () => {
      // Cancel any pending animation frame
      if (rafId) cancelAnimationFrame(rafId)

      // Update on next animation frame for smooth performance
      rafId = requestAnimationFrame(updateIndex)

      // Also update after scroll stops (debounced for snap scroll)
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(updateIndex, 150)
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })

    // Initial update
    updateIndex()

    return () => {
      clearTimeout(scrollTimeout)
      if (rafId) cancelAnimationFrame(rafId)
      scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [isNativeApp, isMobile, chartNavItems.length, onActiveChartChange])

  // Countdown timer for next update
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceLastUpdate = Date.now() - lastUpdateRef.current
      const remaining = Math.max(0, Math.ceil((10000 - timeSinceLastUpdate) / 1000))
      setNextUpdateIn(remaining)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const forceUpdate = () => {
    lastUpdateRef.current = 0 // Reset to force immediate update
    setNextUpdateIn(10)
  }

  useEffect(() => {
    if (!aircraft || aircraft.length === 0) return

    // Only update charts when visible to save CPU
    if (!isVisible) {
      console.log('📊 Charts hidden, skipping update')
      return
    }

    // Filter valid aircraft with data
    const validAircraft = aircraft.filter(
      (a) => a.lat && a.lon && a.alt_baro !== undefined && a.gs !== undefined
    )

    // 1. Altitude Distribution
    const altitudeRanges = {
      "0-5k ft": 0,
      "5k-10k ft": 0,
      "10k-20k ft": 0,
      "20k-30k ft": 0,
      "30k-40k ft": 0,
      "40k+ ft": 0,
    }

    validAircraft.forEach((a) => {
      const alt = a.alt_baro || 0
      if (alt < 5000) altitudeRanges["0-5k ft"]++
      else if (alt < 10000) altitudeRanges["5k-10k ft"]++
      else if (alt < 20000) altitudeRanges["10k-20k ft"]++
      else if (alt < 30000) altitudeRanges["20k-30k ft"]++
      else if (alt < 40000) altitudeRanges["30k-40k ft"]++
      else altitudeRanges["40k+ ft"]++
    })

    // 2. Speed Distribution
    const speedRanges = {
      "0-100 kts": 0,
      "100-200 kts": 0,
      "200-300 kts": 0,
      "300-400 kts": 0,
      "400-500 kts": 0,
      "500+ kts": 0,
    }

    validAircraft.forEach((a) => {
      const speed = a.gs || 0
      if (speed < 100) speedRanges["0-100 kts"]++
      else if (speed < 200) speedRanges["100-200 kts"]++
      else if (speed < 300) speedRanges["200-300 kts"]++
      else if (speed < 400) speedRanges["300-400 kts"]++
      else if (speed < 500) speedRanges["400-500 kts"]++
      else speedRanges["500+ kts"]++
    })

    // 3. Aircraft by Type/Category
    const categories: { [key: string]: number } = {}
    validAircraft.forEach((a) => {
      const cat = a.category || a.t || "Unknown"
      categories[cat] = (categories[cat] || 0) + 1
    })

    // Convert to array and get top 10
    const categoryData = Object.entries(categories)
      .map(([name, count]) => ({ name, y: count }))
      .sort((a, b) => b.y - a.y)
      .slice(0, 10)

    // 4. Altitude vs Speed Scatter
    const scatterData = validAircraft
      .filter((a) => a.alt_baro && a.gs)
      .slice(0, 500) // Limit to 500 points for performance
      .map((a) => [a.alt_baro!, a.gs!])

    // 5. Registration Country Distribution
    // Extract country from hex code (ICAO aircraft address)
    const getCountryFromHex = (hex: string): { name: string; code: string } => {
      if (!hex) return { name: "Unknown", code: "" }
      const prefix = hex.substring(0, 2).toUpperCase()

      // Common ICAO country prefixes mapped to country names and ISO codes
      const countryMap: { [key: string]: { name: string; code: string } } = {
        "A0": { name: "United States", code: "US" }, "A1": { name: "United States", code: "US" },
        "A2": { name: "United States", code: "US" }, "A3": { name: "United States", code: "US" },
        "A4": { name: "United States", code: "US" }, "A5": { name: "United States", code: "US" },
        "A6": { name: "United States", code: "US" }, "A7": { name: "United States", code: "US" },
        "A8": { name: "United States", code: "US" }, "A9": { name: "United States", code: "US" },
        "AA": { name: "United States", code: "US" }, "AB": { name: "United States", code: "US" },
        "AC": { name: "United States", code: "US" }, "AD": { name: "United States", code: "US" },
        "AE": { name: "United States", code: "US" }, "AF": { name: "United States", code: "US" },
        "C0": { name: "Canada", code: "CA" }, "C1": { name: "Canada", code: "CA" },
        "C2": { name: "Canada", code: "CA" }, "C3": { name: "Canada", code: "CA" },
        "C4": { name: "Canada", code: "CA" }, "C5": { name: "Canada", code: "CA" },
        "C6": { name: "Canada", code: "CA" }, "C7": { name: "Canada", code: "CA" },
        "0A": { name: "United Kingdom", code: "GB" }, "40": { name: "United Kingdom", code: "GB" },
        "43": { name: "United Kingdom", code: "GB" },
        "3C": { name: "Germany", code: "DE" }, "3D": { name: "Germany", code: "DE" },
        "3E": { name: "Germany", code: "DE" }, "3F": { name: "Germany", code: "DE" },
        "38": { name: "France", code: "FR" }, "39": { name: "France", code: "FR" },
        "3A": { name: "France", code: "FR" }, "3B": { name: "France", code: "FR" },
        "30": { name: "Spain", code: "ES" }, "34": { name: "Turkey", code: "TR" },
        "44": { name: "Austria", code: "AT" }, "45": { name: "Belgium", code: "BE" },
        "46": { name: "Luxembourg", code: "LU" }, "47": { name: "Netherlands", code: "NL" },
        "48": { name: "Switzerland", code: "CH" }, "49": { name: "Denmark", code: "DK" },
        "4A": { name: "Norway", code: "NO" }, "4B": { name: "Sweden", code: "SE" },
        "4C": { name: "Finland", code: "FI" }, "50": { name: "Poland", code: "PL" },
        "51": { name: "Romania", code: "RO" }, "52": { name: "Russia", code: "RU" },
        "70": { name: "Afghanistan", code: "AF" }, "71": { name: "Albania", code: "AL" },
        "72": { name: "Algeria", code: "DZ" }, "73": { name: "Andorra", code: "AD" },
        "74": { name: "Angola", code: "AO" }, "75": { name: "Antigua", code: "AG" },
        "76": { name: "Argentina", code: "AR" }, "77": { name: "Armenia", code: "AM" },
        "78": { name: "Australia", code: "AU" }, "7C": { name: "New Zealand", code: "NZ" },
        "80": { name: "India", code: "IN" }, "88": { name: "China", code: "CN" },
        "89": { name: "China", code: "CN" }, "8A": { name: "Indonesia", code: "ID" },
        "8Q": { name: "Maldives", code: "MV" }, "E4": { name: "Brazil", code: "BR" },
      }

      return countryMap[prefix] || { name: "Other", code: "" }
    }

    const countryCount: { [key: string]: { count: number; code: string } } = {}
    validAircraft.forEach((a) => {
      const country = getCountryFromHex(a.hex)
      if (!countryCount[country.name]) {
        countryCount[country.name] = { count: 0, code: country.code }
      }
      countryCount[country.name].count++
    })

    // Convert to array and get top 10
    const countryData = Object.entries(countryCount)
      .map(([name, data]) => ({
        name,
        y: data.count,
        code: data.code,
        color: (flagColors as any)[data.code] || flagColors.XX, // Use flag color from JSON
      }))
      .sort((a, b) => b.y - a.y)
      .slice(0, 10)

    // 6. Squawk Code Distribution
    const squawkCount: { [key: string]: number } = {}
    validAircraft.forEach((a) => {
      if (a.squawk) {
        const squawk = a.squawk
        // Highlight special squawk codes
        let category = squawk
        if (squawk === "7700") category = "7700 (Emergency)"
        else if (squawk === "7600") category = "7600 (Radio Failure)"
        else if (squawk === "7500") category = "7500 (Hijack)"
        else if (squawk.startsWith("77")) category = "77xx (Emergency)"
        else if (squawk === "1200") category = "1200 (VFR)"
        else if (squawk.startsWith("12")) category = "12xx (VFR)"
        else category = "Other Squawk"

        squawkCount[category] = (squawkCount[category] || 0) + 1
      }
    })

    const squawkData = Object.entries(squawkCount)
      .map(([name, count]) => ({
        name,
        y: count,
        // Color code special squawks
        color: name.includes("Emergency") || name.includes("7700") ? "#ef4444" :
               name.includes("Radio Failure") || name.includes("7600") ? "#f59e0b" :
               name.includes("Hijack") || name.includes("7500") ? "#dc2626" :
               name.includes("VFR") ? "#10b981" : "#22d3ee"
      }))
      .sort((a, b) => b.y - a.y)

    // 7. Airline Distribution (from callsign)
    const airlineCount: { [key: string]: number } = {}
    validAircraft.forEach((a) => {
      if (a.flight) {
        // Extract airline code from callsign (first 3 characters typically)
        const callsign = a.flight.trim()
        const airlineCode = callsign.substring(0, 3).toUpperCase()

        // Only count if it looks like an airline code (3 letters)
        if (/^[A-Z]{3}$/.test(airlineCode)) {
          airlineCount[airlineCode] = (airlineCount[airlineCode] || 0) + 1
        }
      }
    })

    // Convert to heatmap data format and get top 20 airlines
    const airlineData = Object.entries(airlineCount)
      .map(([code, count]) => ({
        code,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 40)

    // Update charts directly using Highcharts API (no re-render)
    if (altitudeChartRef.current?.chart) {
      altitudeChartRef.current.chart.series[0].setData(Object.values(altitudeRanges), true)
    }

    if (speedChartRef.current?.chart) {
      speedChartRef.current.chart.series[0].setData(Object.values(speedRanges), true)
    }

    if (categoryChartRef.current?.chart) {
      categoryChartRef.current.chart.series[0].setData(categoryData, true)
    }

    if (scatterChartRef.current?.chart) {
      scatterChartRef.current.chart.series[0].setData(scatterData, true)
    }

    if (countryChartRef.current?.chart) {
      countryChartRef.current.chart.series[0].setData(countryData, true)
    }

    if (squawkChartRef.current?.chart) {
      squawkChartRef.current.chart.series[0].setData(squawkData, true)
    }

    if (airlineChartRef.current?.chart) {
      // Update treemap data
      const treemapData = airlineData.map((airline) => ({
        name: airline.code,
        value: airline.count,
        colorValue: airline.count,
      }))
      airlineChartRef.current.chart.series[0].setData(treemapData, true)
    }

    // Set initial chart data if not set (for first render)
    if (!chartData) {
      setChartData({
        altitudeRanges,
        speedRanges,
        categoryData,
        scatterData,
        countryData,
        squawkData,
        airlineData,
        totalAircraft: validAircraft.length,
      })
    }
  }, [aircraft, chartData, isVisible])

  // Chart configurations - memoized to prevent unnecessary re-renders
  // These must be defined before any conditional returns to follow Rules of Hooks
  const altitudeChartOptions: Highcharts.Options = useMemo(() => {
    if (!chartData) return {} as Highcharts.Options
    return {
    chart: {
      type: "column",
      backgroundColor: "transparent",
      height: 300,
    },
    title: {
      text: "Altitude Distribution",
      style: { color: "#e2e8f0", fontSize: "16px" },
    },
    xAxis: {
      categories: Object.keys(chartData.altitudeRanges),
      labels: { style: { color: "#94a3b8" } },
    },
    yAxis: {
      title: { text: "Number of Aircraft", style: { color: "#94a3b8" } },
      labels: { style: { color: "#94a3b8" } },
      gridLineColor: "#334155",
    },
    legend: { enabled: false },
    series: [
      {
        name: "Aircraft",
        type: "column",
        data: Object.values(chartData.altitudeRanges),
        color: "#3b82f6",
      },
    ],
    credits: { enabled: false },
    tooltip: {
      backgroundColor: "#1e293b",
      style: { color: "#e2e8f0" },
    },
  }}, [chartData])

  const speedChartOptions: Highcharts.Options = useMemo(() => {
    if (!chartData) return {} as Highcharts.Options
    return {
    chart: {
      type: "bar",
      backgroundColor: "transparent",
      height: 300,
    },
    title: {
      text: "Speed Distribution",
      style: { color: "#e2e8f0", fontSize: "16px" },
    },
    xAxis: {
      categories: Object.keys(chartData.speedRanges),
      labels: { style: { color: "#94a3b8" } },
    },
    yAxis: {
      title: { text: "Number of Aircraft", style: { color: "#94a3b8" } },
      labels: { style: { color: "#94a3b8" } },
      gridLineColor: "#334155",
    },
    legend: { enabled: false },
    series: [
      {
        name: "Aircraft",
        type: "bar",
        data: Object.values(chartData.speedRanges),
        color: "#10b981",
      },
    ],
    credits: { enabled: false },
    tooltip: {
      backgroundColor: "#1e293b",
      style: { color: "#e2e8f0" },
    },
  }}, [chartData])

  const categoryChartOptions: Highcharts.Options = useMemo(() => {
    if (!chartData) return {} as Highcharts.Options
    return {
    chart: {
      type: "pie",
      backgroundColor: "transparent",
      height: 350,
    },
    title: {
      text: "Aircraft by Category",
      style: { color: "#e2e8f0", fontSize: "16px" },
    },
    tooltip: {
      pointFormat: "<b>{point.y}</b> aircraft ({point.percentage:.1f}%)",
      backgroundColor: "#1e293b",
      style: { color: "#e2e8f0" },
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        dataLabels: {
          enabled: true,
          format: "<b>{point.name}</b>: {point.percentage:.1f}%",
          style: { color: "#e2e8f0", fontSize: "11px" },
        },
      },
    },
    series: [
      {
        name: "Aircraft",
        type: "pie",
        data: chartData.categoryData,
      },
    ],
    credits: { enabled: false },
  }}, [chartData])

  const scatterChartOptions: Highcharts.Options = useMemo(() => {
    if (!chartData) return {} as Highcharts.Options
    return {
    chart: {
      type: "scatter",
      backgroundColor: "transparent",
      height: 350,
      zoomType: "xy",
    },
    title: {
      text: "Altitude vs Speed",
      style: { color: "#e2e8f0", fontSize: "16px" },
    },
    xAxis: {
      title: { text: "Altitude (ft)", style: { color: "#94a3b8" } },
      labels: { style: { color: "#94a3b8" } },
      gridLineColor: "#334155",
    },
    yAxis: {
      title: { text: "Ground Speed (kts)", style: { color: "#94a3b8" } },
      labels: { style: { color: "#94a3b8" } },
      gridLineColor: "#334155",
    },
    legend: { enabled: false },
    plotOptions: {
      scatter: {
        marker: {
          radius: 3,
          states: {
            hover: {
              enabled: true,
              lineColor: "#94a3b8",
            },
          },
        },
        tooltip: {
          headerFormat: "",
          pointFormat: "Altitude: <b>{point.x}</b> ft<br/>Speed: <b>{point.y}</b> kts",
        },
      },
    },
    series: [
      {
        name: "Aircraft",
        type: "scatter",
        data: chartData.scatterData,
        color: "#f59e0b",
      },
    ],
    credits: { enabled: false },
    tooltip: {
      backgroundColor: "#1e293b",
      style: { color: "#e2e8f0" },
    },
  }}, [chartData])

  const countryChartOptions: Highcharts.Options = useMemo(() => {
    if (!chartData) return {} as Highcharts.Options
    return {
    chart: {
      type: "bar",
      backgroundColor: "transparent",
      height: 350,
      spacingLeft: 0,
      marginLeft: 0,
    },
    title: {
      text: "Aircraft by Registration Country",
      style: { color: "#e2e8f0", fontSize: "16px" },
    },
    xAxis: {
      title: { text: "" },
      labels: { enabled: false },
      gridLineWidth: 0,
    },
    yAxis: {
      type: "category",
      title: { text: "" },
      labels: {
        enabled: false,
      },
      gridLineWidth: 0,
    },
    legend: { enabled: false },
    plotOptions: {
      bar: {
        dataLabels: {
          enabled: true,
          useHTML: true,
          align: "left",
          inside: true,
          x: -3,
          formatter: function (this: any) {
            const point = this.point as any
            const flagCode = point.code || "XX"
            return `<div style="display: flex; align-items: center; gap: 8px; margin: 0; padding: 0;">
              <img src="/flags/${flagCode}.svg" width="24" height="16" style="border-radius: 2px; display: block;" />
              <span style="color: #e2e8f0; font-size: 11px;">${this.y}</span>
            </div>`
          },
        },
      },
    },
    series: [
      {
        name: "Aircraft",
        type: "bar",
        data: chartData.countryData,
      },
    ],
    credits: { enabled: false },
    tooltip: {
      backgroundColor: "#1e293b",
      style: { color: "#e2e8f0" },
      useHTML: true,
      formatter: function (this: any) {
        const point = this.point as any
        const flagCode = point.code || "XX"
        return `<div style="display: flex; align-items: center; gap: 8px;">
          <img src="/flags/${flagCode}.svg" width="24" height="16" style="border-radius: 2px;" />
          <span><b>${point.name}</b>: ${this.y} aircraft</span>
        </div>`
      },
    },
  }}, [chartData])

  const squawkChartOptions: Highcharts.Options = useMemo(() => {
    if (!chartData) return {} as Highcharts.Options
    return {
    chart: {
      type: "pie",
      backgroundColor: "transparent",
      height: 350,
    },
    title: {
      text: "Squawk Code Distribution",
      style: { color: "#e2e8f0", fontSize: "16px" },
    },
    tooltip: {
      pointFormat: "<b>{point.y}</b> aircraft ({point.percentage:.1f}%)",
      backgroundColor: "#1e293b",
      style: { color: "#e2e8f0" },
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        dataLabels: {
          enabled: true,
          format: "<b>{point.name}</b>: {point.y}",
          style: { color: "#e2e8f0", fontSize: "11px" },
        },
      },
    },
    series: [
      {
        name: "Squawk",
        type: "pie",
        data: chartData.squawkData,
      },
    ],
    credits: { enabled: false },
  }}, [chartData])

  const airlineChartOptions: Highcharts.Options = useMemo(() => {
    if (!chartData) return {} as Highcharts.Options

    // Convert airline data to treemap format with colors
    const treemapData = chartData.airlineData.map((airline: any) => ({
      name: airline.code,
      value: airline.count,
      color: (airlineColors as any)[airline.code] || "#3b82f6",
    }))

    return {
      chart: {
        type: "treemap",
        backgroundColor: "transparent",
        height: 600,
      },
      title: {
        text: "Airlines Distribution",
        style: { color: "#e2e8f0", fontSize: "16px" },
      },
      tooltip: {
        backgroundColor: "#1e293b",
        style: { color: "#e2e8f0" },
        useHTML: true,
        formatter: function (this: any) {
          const point = this.point
          return `<div style="text-align: center; padding: 8px;">
            <img src="https://content.airhex.com/content/logos/airlines_${point.name}_200_100_r.png"
                 style="width: 100px; height: auto; object-fit: contain; margin-bottom: 8px; background: white; padding: 8px; border-radius: 4px;"
                 onerror="this.style.display='none'" />
            <div style="font-weight: bold; margin-bottom: 4px;">${point.name}</div>
            <div>${point.value} aircraft</div>
          </div>`
        },
      },
      plotOptions: {
        treemap: {
          layoutAlgorithm: "squarified",
          clip: false,
          dataLabels: {
            enabled: true,
            useHTML: true,
            align: "center",
            verticalAlign: "middle",
            style: { textOutline: "none" },
            formatter: function (this: any) {
              const point = this.point
              return `<div style="text-align: center; padding: 4px;">
                <img src="https://content.airhex.com/content/logos/airlines_${point.name}_140_40_r.png"
                     style="max-width: 70px; max-height: 20px; object-fit: contain; display: block; margin: 0 auto 4px; background: white; padding: 2px; border-radius: 2px;"
                     onerror="this.style.display='none'" />
                <div style="color: #e2e8f0; font-weight: bold; font-size: 11px; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">${point.name}</div>
                <div style="color: #94a3b8; font-size: 10px; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">${point.value}</div>
              </div>`
            },
          },
          borderColor: "#334155",
          borderWidth: 2,
        },
      },
      series: [
        {
          name: "Aircraft Count",
          type: "treemap",
          data: treemapData,
        },
      ],
      credits: { enabled: false },
    }
  }, [chartData])

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Loading charts...
      </div>
    )
  }

  return (
    <>
      <div ref={scrollContainerRef} className={isNativeApp && isMobile ? "fixed inset-0 h-screen overflow-y-scroll snap-y snap-mandatory bg-slate-950" : "space-y-6 p-6 bg-slate-900/50 rounded-lg"}>
        {!isNativeApp && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-2xl font-bold text-slate-100">Aircraft Analytics</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-400">
              Analyzing <span className="text-blue-400 font-semibold">{chartData.totalAircraft}</span>{" "}
              aircraft
            </div>
            {nextUpdateIn > 0 && (
              <div className="text-xs text-slate-500">
                Next update: {nextUpdateIn}s
              </div>
            )}
          </div>
        </div>
        )}

      <div className={isNativeApp && isMobile ? "space-y-0" : "grid grid-cols-1 lg:grid-cols-2 gap-6"}>
        {/* Altitude Distribution */}
        <div ref={(el) => { chartSectionRefs.current[0] = el }} className={isNativeApp && isMobile ? "h-screen snap-start snap-always flex items-center justify-center px-4 bg-slate-950" : "bg-slate-800/50 rounded-lg p-4 border border-slate-700"}>
          <div className="w-full max-w-2xl">
            <HighchartsReact ref={altitudeChartRef} highcharts={Highcharts} options={altitudeChartOptions} />
          </div>
        </div>

        {/* Speed Distribution */}
        <div ref={(el) => { chartSectionRefs.current[1] = el }} className={isNativeApp && isMobile ? "h-screen snap-start snap-always flex items-center justify-center px-4 bg-slate-950" : "bg-slate-800/50 rounded-lg p-4 border border-slate-700"}>
          <div className="w-full max-w-2xl">
            <HighchartsReact ref={speedChartRef} highcharts={Highcharts} options={speedChartOptions} />
          </div>
        </div>

        {/* Category Pie Chart */}
        <div ref={(el) => { chartSectionRefs.current[2] = el }} className={isNativeApp && isMobile ? "h-screen snap-start snap-always flex items-center justify-center px-4 bg-slate-950" : "bg-slate-800/50 rounded-lg p-4 border border-slate-700"}>
          <div className="w-full max-w-2xl">
            <HighchartsReact ref={categoryChartRef} highcharts={Highcharts} options={categoryChartOptions} />
          </div>
        </div>

        {/* Altitude vs Speed Scatter */}
        <div ref={(el) => { chartSectionRefs.current[3] = el }} className={isNativeApp && isMobile ? "h-screen snap-start snap-always flex items-center justify-center px-4 bg-slate-950" : "bg-slate-800/50 rounded-lg p-4 border border-slate-700"}>
          <div className="w-full max-w-2xl">
            <HighchartsReact ref={scatterChartRef} highcharts={Highcharts} options={scatterChartOptions} />
          </div>
        </div>

        {/* Registration Country */}
        <div ref={(el) => { chartSectionRefs.current[4] = el }} className={isNativeApp && isMobile ? "h-screen snap-start snap-always flex items-center justify-center px-4 bg-slate-950" : "bg-slate-800/50 rounded-lg p-4 border border-slate-700"}>
          <div className="w-full max-w-2xl">
            <HighchartsReact ref={countryChartRef} highcharts={Highcharts} options={countryChartOptions} />
          </div>
        </div>

        {/* Squawk Code Distribution */}
        <div ref={(el) => { chartSectionRefs.current[5] = el }} className={isNativeApp && isMobile ? "h-screen snap-start snap-always flex items-center justify-center px-4 bg-slate-950" : "bg-slate-800/50 rounded-lg p-4 border border-slate-700"}>
          <div className="w-full max-w-2xl">
            <HighchartsReact ref={squawkChartRef} highcharts={Highcharts} options={squawkChartOptions} />
          </div>
        </div>

        {/* Airline Treemap */}
        <div ref={(el) => { chartSectionRefs.current[6] = el }} className={isNativeApp && isMobile ? "h-screen snap-start snap-always flex items-center justify-center px-4 bg-slate-950" : "bg-slate-800/50 rounded-lg p-4 border border-slate-700 lg:col-span-2"}>
          <div className="w-full max-w-2xl">
            {treemapLoaded ? (
              <HighchartsReact ref={airlineChartRef} highcharts={Highcharts} options={airlineChartOptions} />
            ) : (
              <div className="flex items-center justify-center h-96 text-slate-400">
                Loading airline treemap...
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Chart Navigation Mini Icons - Only show in native app mobile */}
      {isNativeApp && isMobile && (
        <div className="fixed bottom-20 left-0 right-0 z-40 pointer-events-none">
          <div className="flex justify-center items-center gap-1.5 px-4 pb-3">
            <div className="bg-gradient-to-r from-slate-900/80 via-slate-800/70 to-slate-900/80 backdrop-blur-[40px] border border-white/10 rounded-full px-3 py-2 shadow-2xl pointer-events-auto">
              <div className="flex gap-2">
                {chartNavItems.map((item, index) => {
                  const Icon = item.icon
                  const isActive = activeChartIndex === index
                  return (
                    <button
                      key={index}
                      onClick={() => navigateToChart(index)}
                      className={`relative transition-all duration-300 touch-manipulation ${
                        isActive ? "scale-110" : "scale-100 opacity-60"
                      }`}
                      aria-label={item.label}
                    >
                      <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                        isActive
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-slate-700/30 text-slate-400 active:bg-slate-600/40"
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      {isActive && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50"></div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
