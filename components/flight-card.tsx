"use client"

import { useState, useEffect, useRef } from "react"
import { X, Plane, Share2, Locate, ExternalLink } from "lucide-react"
import type { SelectedFlight } from "@/types/aircraft"
import { CountryFlag } from "@/components/country-flag"
import { motion, AnimatePresence } from "framer-motion"
import { haptic } from "@/lib/haptics"
import { generateFlightShareImage, shareFlightInfo } from "@/lib/flight-share"
import { SharePreviewModal, type ColorPalette } from "@/components/share-preview-modal"
import { Compass } from "@/components/compass"
import { Aircraft3DViewer, has3DModel } from "@/components/aircraft-3d-viewer"

interface FlightCardProps {
  selectedFlight: SelectedFlight
  onClose: () => void
  onShowOnMap?: (hex: string) => void
  allFlights?: SelectedFlight[]
  onNavigate?: (flight: SelectedFlight) => void
  onQueryInSkyQuery?: (callsign: string, icao: string) => void
}

interface PhotoMetadata {
  imageUrl: string
  link: string
  photographer: string
}

export function FlightCard({ selectedFlight, onClose, onShowOnMap, allFlights = [], onNavigate, onQueryInSkyQuery }: FlightCardProps) {
  const [aircraftImage, setAircraftImage] = useState<string | null>(null)
  const [photoMetadata, setPhotoMetadata] = useState<PhotoMetadata | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette | undefined>(undefined)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [swipeStartX, setSwipeStartX] = useState(0)
  const [swipeStartY, setSwipeStartY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [loaded3DModels, setLoaded3DModels] = useState<Set<string>>(new Set())
  const [loading3DModels, setLoading3DModels] = useState<Set<string>>(new Set())
  const [modelLoadProgress, setModelLoadProgress] = useState<Map<string, number>>(new Map())
  const [crossSearchEnabled, setCrossSearchEnabled] = useState(false)
  const [displayedAltitude, setDisplayedAltitude] = useState(selectedFlight.altitude)
  const swipeDirectionDetermined = useRef(false)
  const isHorizontalSwipe = useRef(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const dragXRef = useRef(0)
  const allFlightsRef = useRef(allFlights)
  const prevAltitudeRef = useRef(selectedFlight.altitude)

  // Check if cross search is enabled in settings
  useEffect(() => {
    const checkSetting = () => {
      const saved = localStorage.getItem('skyquery_cross_search_enabled')
      setCrossSearchEnabled(saved === 'true')
    }
    checkSetting()
  }, [])

  // Disable background scrolling when card is open
  useEffect(() => {
    // Store original overflow style
    const originalOverflow = document.body.style.overflow
    const originalPosition = document.body.style.position
    const originalWidth = document.body.style.width

    // Prevent scrolling
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'

    return () => {
      // Restore original styles when card closes
      document.body.style.overflow = originalOverflow
      document.body.style.position = originalPosition
      document.body.style.width = originalWidth
    }
  }, [])

  useEffect(() => {
    setAircraftImage(null)
    setPhotoMetadata(null)
    setImageLoading(true)
    setImageError(false)

    const loadImages = async () => {
      if (selectedFlight.registration || selectedFlight.hex) {
        try {
          const query = selectedFlight.registration || selectedFlight.hex
          const response = await fetch(`https://api.planespotters.net/pub/photos/reg/${query}`, {
            headers: {
              Accept: "application/json",
            },
          })

          if (response.ok) {
            const data = await response.json()
            if (data.photos && data.photos.length > 0) {
              const photo = data.photos[0]
              const imageUrl = photo.thumbnail_large?.src || photo.thumbnail?.src
              if (imageUrl) {
                setAircraftImage(imageUrl)
                setPhotoMetadata({
                  imageUrl,
                  link: photo.link || `https://www.planespotters.net/photo/${photo.id}`,
                  photographer: photo.photographer || "Unknown",
                })
                setImageLoading(false)
              } else {
                setImageError(true)
                setImageLoading(false)
              }
            } else {
              setImageError(true)
              setImageLoading(false)
            }
          } else {
            setImageError(true)
            setImageLoading(false)
          }
        } catch (error) {
          console.log("Planespotters image not available")
          setImageError(true)
          setImageLoading(false)
        }
      } else {
        setImageLoading(false)
      }
    }

    loadImages()
  }, [selectedFlight.hex, selectedFlight.registration])

  // Preload images and 3D models for nearby flights (±4 flights)
  useEffect(() => {
    const preloadNearbyFlights = async () => {
      const preloadRange = 4
      const currentIdx = allFlights.findIndex(f => f.hex === selectedFlight.hex)

      if (currentIdx === -1) return

      // Get flights to preload (previous 4 and next 4)
      const startIdx = Math.max(0, currentIdx - preloadRange)
      const endIdx = Math.min(allFlights.length - 1, currentIdx + preloadRange)
      const flightsToPreload = allFlights.slice(startIdx, endIdx + 1)
        .filter(f => f.hex !== selectedFlight.hex) // Don't preload current flight

      // Preload aircraft images
      flightsToPreload.forEach(async (flight) => {
        const query = flight.registration || flight.hex
        try {
          const response = await fetch(`https://api.planespotters.net/pub/photos/reg/${query}`, {
            headers: { Accept: "application/json" },
          })
          if (response.ok) {
            const data = await response.json()
            if (data.photos?.[0]) {
              const imageUrl = data.photos[0].thumbnail_large?.src || data.photos[0].thumbnail?.src
              if (imageUrl) {
                // Preload image by creating an Image object
                const img = new Image()
                img.src = imageUrl
              }
            }
          }
        } catch (error) {
          // Silently fail for preloading
        }
      })

      // Preload 3D models
      const modelsToPreload = new Set<string>()
      flightsToPreload.forEach(flight => {
        const type = flight.type || ""
        const cleanType = type.toLowerCase().replace(/[^a-z0-9]/g, "")

        // Check if it's a helicopter
        const isHeli = /^h\d|^ec\d|^as\d|^uh\d|^ah\d|^ch\d|^mi\d|^ka\d|^bell|^sikorsky|^robinson|^md\d|^r\d\d|^s\d\d|helicopter|heli|chopper/i.test(type)

        if (isHeli) {
          modelsToPreload.add(`https://glb.derad.org/glb/heli.glb`)
        } else if (cleanType) {
          // Common aircraft types that exist
          const commonTypes = [
            'a318', 'a319', 'a320', 'a321', 'a332', 'a333', 'a343', 'a346', 'a359', 'a380',
            'b736', 'b737', 'b738', 'b739', 'b744', 'b748', 'b752', 'b753', 'b762', 'b763', 'b764', 'b772', 'b773', 'b788', 'b789',
            'crj700', 'crj900', 'cs100', 'cs300', 'e170', 'e190', 'bae146', 'atr42', 'q400', 'beluga', 'an225', 'citation', 'ask21', 'pa28'
          ]

          if (commonTypes.includes(cleanType)) {
            modelsToPreload.add(`https://glb.derad.org/glb/${cleanType}.glb`)
          }
        }
      })

      // Preload GLB models using link prefetch
      const prefetchLinks: HTMLLinkElement[] = []
      modelsToPreload.forEach(url => {
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = url
        link.as = 'fetch'
        link.crossOrigin = 'anonymous'
        document.head.appendChild(link)
        prefetchLinks.push(link)
      })

      // Return cleanup function
      return prefetchLinks
    }

    // Small delay before preloading to prioritize current flight
    const timer = setTimeout(async () => {
      const links = await preloadNearbyFlights()
      // Cleanup function will remove links when effect re-runs or unmounts
      return () => {
        links?.forEach(link => {
          if (link.parentNode) {
            link.parentNode.removeChild(link)
          }
        })
      }
    }, 500)

    return () => {
      clearTimeout(timer)
    }
  }, [selectedFlight.hex, allFlights])

  // Animate altitude changes
  useEffect(() => {
    const startAltitude = prevAltitudeRef.current
    const endAltitude = selectedFlight.altitude
    const duration = 800 // milliseconds
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
      const easedProgress = easeOutCubic(progress)

      const currentAltitude = startAltitude + (endAltitude - startAltitude) * easedProgress
      setDisplayedAltitude(currentAltitude)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        prevAltitudeRef.current = endAltitude
      }
    }

    requestAnimationFrame(animate)
  }, [selectedFlight.altitude])

  const handleShare = async () => {
    setIsSharing(true)
    await haptic.light()

    try {
      const imageBlob = await generateFlightShareImage({
        flight: selectedFlight,
        colorPalette: selectedPalette,
      })

      const imageUrl = URL.createObjectURL(imageBlob)
      setPreviewImageUrl(imageUrl)
      setShowPreview(true)
      setIsSharing(false)
      await haptic.success()
    } catch (error) {
      console.error("Preview generation error:", error)
      await haptic.error()
      alert(`Failed to generate preview: ${error instanceof Error ? error.message : "Unknown error"}`)
      setIsSharing(false)
    }
  }

  const handleColorChange = async (palette: ColorPalette) => {
    setIsRegenerating(true)
    setSelectedPalette(palette)
    await haptic.light()

    try {
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl)
      }

      const imageBlob = await generateFlightShareImage({
        flight: selectedFlight,
        colorPalette: palette,
      })

      const imageUrl = URL.createObjectURL(imageBlob)
      setPreviewImageUrl(imageUrl)
      setIsRegenerating(false)
      await haptic.success()
    } catch (error) {
      console.error("Color change error:", error)
      await haptic.error()
      setIsRegenerating(false)
    }
  }

  const handleConfirmShare = async () => {
    setIsSharing(true)
    await haptic.light()

    try {
      const success = await shareFlightInfo(selectedFlight, selectedPalette)
      if (success) {
        await haptic.success()
        setShowPreview(false)
        if (previewImageUrl) {
          URL.revokeObjectURL(previewImageUrl)
          setPreviewImageUrl(null)
        }
      } else {
        await haptic.error()
      }
    } catch (error) {
      console.error("Share error:", error)
      await haptic.error()
      alert(`Share failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsSharing(false)
    }
  }

  const handleClosePreview = () => {
    setShowPreview(false)
    if (previewImageUrl) {
      URL.revokeObjectURL(previewImageUrl)
      setPreviewImageUrl(null)
    }
  }

  // Find current flight index and navigate to next/previous
  const currentIndex = allFlights.findIndex(f => f.hex === selectedFlight.hex)
  const hasNext = currentIndex >= 0 && currentIndex < allFlights.length - 1
  const hasPrevious = currentIndex > 0

  const navigateToNext = () => {
    if (hasNext && onNavigate) {
      haptic.light()
      onNavigate(allFlights[currentIndex + 1])
    }
  }

  const navigateToPrevious = () => {
    if (hasPrevious && onNavigate) {
      haptic.light()
      onNavigate(allFlights[currentIndex - 1])
    }
  }

  // Swipe gesture handlers - optimized for performance
  const handleTouchStart = (e: React.TouchEvent) => {
    setSwipeStartX(e.touches[0].clientX)
    setSwipeStartY(e.touches[0].clientY)
    swipeDirectionDetermined.current = false
    isHorizontalSwipe.current = false
    setIsDragging(false)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    // Determine swipe direction only once at the start
    if (!swipeDirectionDetermined.current) {
      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY
      const deltaX = currentX - swipeStartX
      const deltaY = currentY - swipeStartY

      // Only determine direction after sufficient movement
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        swipeDirectionDetermined.current = true

        // Check if horizontal swipe (more horizontal than vertical)
        if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
          isHorizontalSwipe.current = true
          setIsDragging(true)
        }
      }
    }

    // Only track and prevent default if it's a horizontal swipe
    if (isHorizontalSwipe.current) {
      const deltaX = e.touches[0].clientX - swipeStartX
      dragXRef.current = deltaX

      // Use direct DOM manipulation with will-change for GPU acceleration
      if (cardRef.current) {
        cardRef.current.style.willChange = 'transform'
        cardRef.current.style.transform = `translate3d(${deltaX * 0.3}px, 0, 0)`
      }

      // Update state less frequently for indicators (every 20px instead of 10px)
      if (Math.abs(deltaX - dragX) > 20) {
        setDragX(deltaX)
      }

      e.preventDefault()
    }
  }

  const handleTouchEnd = () => {
    // Reset card position with fast animation
    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
      cardRef.current.style.transform = 'translate3d(0, 0, 0)'
      cardRef.current.style.willChange = 'auto'

      // Remove transition after animation completes
      setTimeout(() => {
        if (cardRef.current) {
          cardRef.current.style.transition = ''
        }
      }, 150)
    }

    if (!isHorizontalSwipe.current) {
      setDragX(0)
      setIsDragging(false)
      swipeDirectionDetermined.current = false
      dragXRef.current = 0
      return
    }

    const swipeThreshold = 80 // Lower threshold for easier swipes

    if (Math.abs(dragXRef.current) > swipeThreshold) {
      if (dragXRef.current > 0 && hasPrevious) {
        navigateToPrevious()
      } else if (dragXRef.current < 0 && hasNext) {
        navigateToNext()
      }
    }

    setDragX(0)
    setIsDragging(false)
    swipeDirectionDetermined.current = false
    isHorizontalSwipe.current = false
    dragXRef.current = 0
  }

  return (
    <AnimatePresence>
      {/* Backdrop - prevents all background interaction */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999]"
        onTouchMove={(e) => e.preventDefault()}
        onWheel={(e) => e.preventDefault()}
        style={{ touchAction: 'none' }}
      />

      {/* Card */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: "100%" }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: "100%" }}
        transition={{
          type: "spring",
          damping: 25,
          stiffness: 300,
        }}
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="relative w-full max-w-md pointer-events-auto">
          {/* Swipe indicators - simplified for performance */}
          {allFlights.length > 1 && isDragging && (
            <>
              {/* Previous indicator - blue when available, red when at start */}
              {dragX > 50 && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 z-[10001] pointer-events-none">
                  {hasPrevious ? (
                    <div className="bg-blue-500/80 backdrop-blur-xl rounded-r-2xl px-3 py-6 border-y border-r border-blue-400/50">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="bg-red-500/80 backdrop-blur-xl rounded-r-2xl px-3 py-6 border-y border-r border-red-400/50 animate-pulse">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                </div>
              )}
              {/* Next indicator - blue when available, red when at end */}
              {dragX < -50 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 z-[10001] pointer-events-none">
                  {hasNext ? (
                    <div className="bg-blue-500/80 backdrop-blur-xl rounded-l-2xl px-3 py-6 border-y border-l border-blue-400/50">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="bg-red-500/80 backdrop-blur-xl rounded-l-2xl px-3 py-6 border-y border-l border-red-400/50 animate-pulse">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Glass Card */}
          <div
            ref={cardRef}
            className="relative bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden min-h-[400px] max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Light effect at top */}
            <div className="absolute top-0 left-[10%] w-[80%] h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            {/* Glow blob */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-[80px] -z-10" />

            <div className="p-6">
              {/* Aircraft Image Section - Always show to prevent layout shift */}
              <div className="mb-4 relative h-40">
                {/* Live badge - positioned in top left corner */}
                <div className="absolute top-2 left-2 z-10">
                  {selectedFlight.status === "Emergency" ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-b from-red-600 to-red-500 border border-red-400 rounded-full shadow-lg shadow-red-500/20 animate-pulse">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      <span className="text-[10px] font-semibold text-white uppercase tracking-wide">
                        Emergency
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-b from-blue-600 to-blue-500 border border-blue-500/40 rounded-full shadow-lg shadow-blue-500/20">
                      <div className="w-1 h-1 bg-white rounded-full" />
                      <span className="text-[8px] font-semibold text-white uppercase tracking-wide">Live</span>
                    </div>
                  )}
                </div>

                {imageLoading ? (
                  // Skeleton placeholder while loading
                  <div className="relative bg-white/5 rounded-xl overflow-hidden border border-white/10 h-full animate-pulse">
                    <div className="w-full h-full bg-gradient-to-br from-white/10 via-white/5 to-white/10" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Plane className="w-12 h-12 text-white/20 animate-pulse" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between">
                      <div className="h-3 w-24 bg-white/10 rounded" />
                      <div className="h-6 w-16 bg-white/10 rounded" />
                    </div>
                  </div>
                ) : aircraftImage && photoMetadata ? (
                  // Actual image
                  <div className="relative bg-white/5 rounded-xl overflow-hidden border border-white/10 h-full">
                    <img
                      src={aircraftImage}
                      alt="Aircraft"
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between">
                      <p className="text-[10px] text-white/70">© {photoMetadata.photographer}</p>
                      <a
                        href={photoMetadata.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={async (e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          await haptic.light()

                          const isNative = typeof (window as any).Capacitor !== "undefined"

                          if (isNative) {
                            try {
                              const { Browser } = await import("@capacitor/browser")
                              await Browser.open({ url: photoMetadata.link })
                            } catch (error) {
                              console.error("Failed to open browser:", error)
                              window.open(photoMetadata.link, "_blank", "noopener,noreferrer")
                            }
                          } else {
                            window.open(photoMetadata.link, "_blank", "noopener,noreferrer")
                          }
                        }}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 border border-blue-500/40 rounded text-[10px] text-blue-300"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        <span>View</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  // No image available
                  <div className="relative bg-white/5 rounded-xl overflow-hidden border border-white/10 h-full flex flex-col items-center justify-center">
                    <Plane className="w-12 h-12 text-white/20 mb-2" />
                    <p className="text-xs text-white/40 font-medium">Aircraft image not available</p>
                  </div>
                )}
              </div>

              {/* Header with Logo and Status */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <CountryFlag icao={selectedFlight.hex} size="lg" />
                  <div className="flex flex-col">
                    <div className="text-lg text-white/90 font-bold">
                      {selectedFlight.callsign || selectedFlight.registration || selectedFlight.hex}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onShowOnMap && selectedFlight.lat && selectedFlight.lng && (
                    <button
                      onClick={() => {
                        onShowOnMap(selectedFlight.hex)
                        haptic.light()
                      }}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded-xl transition-all active:scale-95"
                    >
                      <Locate className="w-5 h-5 text-blue-400" />
                    </button>
                  )}
                  <button
                    onClick={handleShare}
                    disabled={isSharing}
                    className="p-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSharing ? (
                      <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Share2 className="w-5 h-5 text-green-400" />
                    )}
                  </button>
                  {crossSearchEnabled && onQueryInSkyQuery && (selectedFlight.callsign?.trim() || selectedFlight.hex) && (
                    <button
                      onClick={() => {
                        const callsign = selectedFlight.callsign?.trim() || selectedFlight.hex
                        onQueryInSkyQuery(callsign, selectedFlight.hex)
                        haptic.light()
                      }}
                      className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-xl transition-all active:scale-95"
                    >
                      <img
                        src="https://app-icons.deradar.app/skyquery%20(1).png"
                        alt="SkyQuery"
                        className="w-5 h-5 rounded"
                      />
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-4 relative">
                <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                  <div className="flex items-center justify-center gap-4">
                    {/* Coordinates - left side */}
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-[10px] text-white/50 uppercase">Lat</div>
                      <div className="text-xs font-semibold text-white" style={{ fontFamily: "monospace" }}>
                        {selectedFlight.lat.toFixed(4)}°
                      </div>
                    </div>

                    {/* Compass - centered, smaller */}
                    <Compass heading={selectedFlight.heading} size={56} animate={true} />

                    {/* Coordinates - right side */}
                    <div className="flex flex-col items-start gap-1">
                      <div className="text-[10px] text-white/50 uppercase">Lng</div>
                      <div className="text-xs font-semibold text-white" style={{ fontFamily: "monospace" }}>
                        {selectedFlight.lng.toFixed(4)}°
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Flight Stats - 2 columns with 30% less height */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {/* Speed Box with Full-Size Speedometer */}
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 rounded-xl border border-white/10 overflow-hidden" style={{ height: '84px' }}>
                  {(() => {
                    const maxRange = Math.max(1000, Math.ceil(selectedFlight.speed / 100) * 100)
                    const percentage = (selectedFlight.speed / maxRange)
                    const maxLabel = maxRange >= 1000 ? `${(maxRange / 1000).toFixed(0)}K` : maxRange.toString()

                    // Generate tick marks for the arc
                    const numTicks = 20
                    const ticks = []
                    for (let i = 0; i <= numTicks; i++) {
                      const tickAngle = Math.PI + (i / numTicks) * Math.PI
                      const tickPercentage = i / numTicks
                      const isLarge = i % 5 === 0
                      const innerRadius = isLarge ? 38 : 42
                      const outerRadius = 48
                      const x1 = 60 + innerRadius * Math.cos(tickAngle)
                      const y1 = 60 + innerRadius * Math.sin(tickAngle)
                      const x2 = 60 + outerRadius * Math.cos(tickAngle)
                      const y2 = 60 + outerRadius * Math.sin(tickAngle)

                      ticks.push({
                        x1, y1, x2, y2,
                        isLarge,
                        value: Math.round(tickPercentage * maxRange),
                        angle: tickAngle
                      })
                    }

                    return (
                      <>
                        {/* Compact speedometer gauge */}
                        <div className="absolute inset-0 p-1">
                          <svg viewBox="0 0 120 70" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                            {/* Background arc - compact */}
                            <path
                              d="M 15 55 A 42 42 0 0 1 105 55"
                              fill="none"
                              stroke="rgba(255,255,255,0.08)"
                              strokeWidth="10"
                              strokeLinecap="round"
                            />

                            {/* Active speed arc - gradient */}
                            <defs>
                              <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="rgba(34, 197, 94, 0.6)" />
                                <stop offset="50%" stopColor="rgba(59, 130, 246, 0.7)" />
                                <stop offset="100%" stopColor="rgba(168, 85, 247, 0.8)" />
                              </linearGradient>
                            </defs>
                            <path
                              d="M 15 55 A 42 42 0 0 1 105 55"
                              fill="none"
                              stroke="url(#speedGradient)"
                              strokeWidth="10"
                              strokeDasharray={`${percentage * 132} 132`}
                              strokeLinecap="round"
                            />

                            {/* Compact tick marks - fewer marks */}
                            {ticks.filter((_, i) => i % 2 === 0).map((tick, i) => {
                              const angle = Math.PI + (i * 2 / numTicks) * Math.PI
                              const isLarge = (i * 2) % 5 === 0
                              const innerR = isLarge ? 32 : 36
                              const outerR = 42
                              const x1 = 60 + innerR * Math.cos(angle)
                              const y1 = 55 + innerR * Math.sin(angle)
                              const x2 = 60 + outerR * Math.cos(angle)
                              const y2 = 55 + outerR * Math.sin(angle)

                              return (
                                <line
                                  key={i}
                                  x1={x1}
                                  y1={y1}
                                  x2={x2}
                                  y2={y2}
                                  stroke={isLarge ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)"}
                                  strokeWidth={isLarge ? "1.5" : "1"}
                                  strokeLinecap="round"
                                />
                              )
                            })}

                            {/* Speed value labels - 0 and max */}
                            <text x="18" y="62" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="monospace" fontWeight="bold">0</text>
                            <text x="102" y="62" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="end">{maxLabel}</text>

                            {/* Center needle */}
                            <defs>
                              <filter id="needleShadow" x="-50%" y="-50%" width="200%" height="200%">
                                <feDropShadow dx="0" dy="0.5" stdDeviation="1" floodOpacity="0.4"/>
                              </filter>
                            </defs>
                            <line
                              x1="60"
                              y1="55"
                              x2={60 + 36 * Math.cos((Math.PI * percentage) - Math.PI)}
                              y2={55 + 36 * Math.sin((Math.PI * percentage) - Math.PI)}
                              stroke="rgba(255,255,255,0.95)"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              filter="url(#needleShadow)"
                            />

                            {/* Center hub - smaller */}
                            <circle cx="60" cy="55" r="4" fill="rgba(59, 130, 246, 0.8)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                            <circle cx="60" cy="55" r="1.5" fill="rgba(255,255,255,0.9)" />
                          </svg>
                        </div>

                        {/* Speed value display - compact */}
                        <div className="absolute bottom-1 left-0 right-0 flex flex-col items-center pointer-events-none z-10">
                          <div className="flex items-baseline gap-1 bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20">
                            <span className="text-[10px] text-white/50 uppercase font-semibold">Speed</span>
                            <span className="text-xl font-bold text-white tabular-nums">{selectedFlight.speed}</span>
                            <span className="text-[9px] text-white/60 font-semibold">KTS</span>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>

                <div className="relative flex flex-col items-center justify-center bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-2 border border-white/10 overflow-hidden" style={{ height: '84px' }}>
                  {/* Altitude Ruler - Background */}
                  {(() => {
                    const maxAlt = 60000 // Maximum altitude in feet
                    const boxHeight = 80 // Height of the visible box in pixels

                    // Calculate the ruler's pixel position based on altitude
                    // We want the ruler to scroll through the window
                    const pixelsPerFoot = 0.05 // 0.05 pixels per foot (adjustable for sensitivity)
                    const rulerOffset = displayedAltitude * pixelsPerFoot

                    // Generate scale marks every 1000 feet for smoother appearance
                    const marks = []
                    const startAlt = Math.floor(Math.max(0, displayedAltitude - 15000) / 1000) * 1000
                    const endAlt = Math.min(maxAlt, displayedAltitude + 15000)

                    for (let alt = startAlt; alt <= endAlt; alt += 1000) {
                      const isMajor = alt % 5000 === 0
                      const isVeryMajor = alt % 10000 === 0
                      marks.push({ alt, isMajor, isVeryMajor })
                    }

                    return (
                      <>
                        {/* Ruler strip */}
                        <div className="absolute left-0 right-0 top-0 bottom-0 flex items-center">
                          <div className="relative w-full h-full overflow-hidden">
                            {/* Vertical ruler marks */}
                            <div
                              className="absolute left-0 right-0 transition-transform duration-700 ease-out"
                              style={{
                                transform: `translateY(${boxHeight / 2 - rulerOffset}px)`,
                              }}
                            >
                              {marks.map(({ alt, isMajor, isVeryMajor }) => {
                                const yPos = alt * pixelsPerFoot
                                return (
                                  <div
                                    key={alt}
                                    className="absolute left-0 right-0 flex items-center justify-between px-2"
                                    style={{
                                      top: `${yPos}px`,
                                      transform: 'translateY(-50%)',
                                    }}
                                  >
                                    {/* Left tick mark */}
                                    <div
                                      className={`${isVeryMajor ? 'bg-blue-400/60' : isMajor ? 'bg-white/40' : 'bg-white/20'}`}
                                      style={{
                                        width: isVeryMajor ? '24px' : isMajor ? '16px' : '10px',
                                        height: isVeryMajor ? '2.5px' : isMajor ? '2px' : '1px',
                                      }}
                                    />

                                    {/* Altitude label */}
                                    {isVeryMajor && (
                                      <div className="absolute left-1/2 transform -translate-x-1/2 px-2 py-0.5 bg-slate-900/80 rounded">
                                        <span className="text-[9px] font-bold text-white/70 font-mono whitespace-nowrap">
                                          {alt === 0 ? 'GND' : `FL${Math.round(alt / 100)}`}
                                        </span>
                                      </div>
                                    )}
                                    {isMajor && !isVeryMajor && (
                                      <span className="absolute left-1/2 transform -translate-x-1/2 text-[7px] font-semibold text-white/40 font-mono">
                                        {Math.round(alt / 100)}
                                      </span>
                                    )}

                                    {/* Right tick mark */}
                                    <div
                                      className={`${isVeryMajor ? 'bg-blue-400/60' : isMajor ? 'bg-white/40' : 'bg-white/20'}`}
                                      style={{
                                        width: isVeryMajor ? '24px' : isMajor ? '16px' : '10px',
                                        height: isVeryMajor ? '2.5px' : isMajor ? '2px' : '1px',
                                      }}
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Center indicator window with pointer */}
                        <div className="absolute left-0 right-0 top-1/2 pointer-events-none z-20" style={{ transform: 'translateY(-50%)' }}>
                          {/* Horizontal center line */}
                          <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent" />

                          {/* Left pointer */}
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
                            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-blue-400/80" />
                          </div>

                          {/* Right pointer */}
                          <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-blue-400/80" />
                          </div>
                        </div>

                        {/* Top and bottom fade */}
                        <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-slate-900/90 to-transparent pointer-events-none z-10" />
                        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-slate-900/90 to-transparent pointer-events-none z-10" />
                      </>
                    )
                  })()}

                  {/* Foreground content */}
                  <div className="relative z-30 flex flex-col items-center pointer-events-none">
                    <div className="text-[9px] text-white/50 uppercase mb-0.5 flex items-center gap-1">
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22V2M12 2L8 6M12 2L16 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Altitude
                    </div>
                    <div className="text-lg font-bold text-white bg-slate-900/50 px-2 py-0.5 rounded">
                      {displayedAltitude > 0 ? Math.round(displayedAltitude / 100) : "GND"}
                    </div>
                    <div className="text-[9px] text-white/50">{displayedAltitude > 0 ? "FL" : "GROUND"}</div>
                  </div>
                </div>
              </div>

              {/* Aircraft Info */}
              <div className="bg-white/5 rounded-xl p-2 mb-4 border border-white/10">
                <div className="flex items-center gap-2 mb-1 px-1">
                  <Plane className="w-3.5 h-3.5 text-white/50" />
                  <span className="text-[11px] font-semibold text-white/70 uppercase">Aircraft Model</span>
                </div>

                {/* Aircraft Type Label and 3D Viewer */}
                {loaded3DModels.has(selectedFlight.hex) && has3DModel(selectedFlight.type || "") ? (
                  <div>
                    <Aircraft3DViewer aircraftType={selectedFlight.type || "A320"} />
                  </div>
                ) : (
                  <div className="relative w-full overflow-hidden flex items-center" style={{ height: '55px' }}>
                    {/* Left side - Aircraft type label (always shown) */}
                    <div className="flex-shrink-0 pl-2 pr-2">
                      <div className="text-[8px] font-bold text-white/40 uppercase tracking-wider">Aircraft</div>
                      <div className="text-base font-bold text-white uppercase tracking-tight leading-tight">
                        {selectedFlight.type || "Unknown"}
                      </div>
                    </div>

                    {/* Right side - Load Button or No Model */}
                    <div className="flex-1 h-full relative">
                      {has3DModel(selectedFlight.type || "") ? (
                        <div
                          onClick={() => {
                            const flightId = selectedFlight.hex
                            setLoading3DModels(prev => new Set(prev).add(flightId))
                            haptic.light()
                            // Simulate loading progress
                            let progress = 0
                            const interval = setInterval(() => {
                              progress += 10
                              setModelLoadProgress(prev => {
                                const newMap = new Map(prev)
                                newMap.set(flightId, progress)
                                return newMap
                              })
                              if (progress >= 100) {
                                clearInterval(interval)
                                setLoading3DModels(prev => {
                                  const newSet = new Set(prev)
                                  newSet.delete(flightId)
                                  return newSet
                                })
                                setLoaded3DModels(prev => new Set(prev).add(flightId))
                              }
                            }, 50)
                          }}
                          className="h-full flex flex-col items-center justify-center cursor-pointer active:scale-[0.98] transition-transform px-4"
                        >
                          {loading3DModels.has(selectedFlight.hex) ? (
                            <div className="w-full flex flex-col items-center gap-2">
                              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-blue-400 h-full transition-all duration-300 ease-out"
                                  style={{ width: `${modelLoadProgress.get(selectedFlight.hex) || 0}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-white/50">
                                Loading {modelLoadProgress.get(selectedFlight.hex) || 0}%
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <Plane className="w-8 h-8 text-white/30" />
                              <span className="text-[10px] text-white/50 font-medium">Tap to load</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <span className="text-xs text-white/30">No 3D model</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Bottom Info Grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-white/10 p-3 rounded-xl">
                  <div className="flex items-center gap-1 text-[10px] text-white/50 uppercase mb-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    Squawk
                  </div>
                  <div className="text-sm font-semibold text-white" style={{ fontFamily: "monospace" }}>
                    {selectedFlight.squawk || "N/A"}
                  </div>
                </div>

                <div className="bg-white/10 p-3 rounded-xl">
                  <div className="flex items-center gap-1 text-[10px] text-white/50 uppercase mb-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                      <path d="M2 17L12 22L22 17" />
                      <path d="M2 12L12 17L22 12" />
                    </svg>
                    Reg
                  </div>
                  <div className="text-sm font-semibold text-white" style={{ fontFamily: "monospace" }}>
                    {selectedFlight.registration || "N/A"}
                  </div>
                </div>

                <div className="bg-white/10 p-3 rounded-xl">
                  <div className="flex items-center gap-1 text-[10px] text-white/50 uppercase mb-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18" />
                    </svg>
                    ICAO
                  </div>
                  <div className="text-sm font-semibold text-white" style={{ fontFamily: "monospace" }}>
                    {selectedFlight.hex.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Controls - Positioned outside and below the aircraft card */}
          {allFlights.length > 1 ? (
            <div className="flex items-center justify-between px-4 mt-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/10 shadow-lg">
                <button
                  onClick={navigateToPrevious}
                  disabled={!hasPrevious}
                  className="p-1 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity active:scale-95"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="flex flex-col items-center">
                  <span className="text-xs text-white/70 font-medium min-w-[40px] text-center" style={{ fontFamily: "monospace" }}>
                    {currentIndex + 1} / {allFlights.length}
                  </span>
                  <div className="text-[9px] text-white/30 flex items-center gap-1">
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Swipe
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                <button
                  onClick={navigateToNext}
                  disabled={!hasNext}
                  className="p-1 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity active:scale-95"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Close Button - Positioned next to navigation */}
              <button
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full transition-all active:scale-95 border border-white/10 shadow-lg"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center mt-4">
              <button
                onClick={onClose}
                className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full transition-all active:scale-95 border border-white/20"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Share Preview Modal */}
      <SharePreviewModal
        imageUrl={previewImageUrl}
        isOpen={showPreview}
        onClose={handleClosePreview}
        onConfirmShare={handleConfirmShare}
        onColorChange={handleColorChange}
        isSharing={isSharing}
        isRegenerating={isRegenerating}
      />
    </AnimatePresence>
  )
}
