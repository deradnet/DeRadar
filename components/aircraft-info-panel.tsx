"use client"

import { useState, useEffect } from "react"
import { X, Plane, MapPin, Gauge, ArrowUp, Locate, Share2, ExternalLink } from "lucide-react"
import type { SelectedFlight } from "@/types/aircraft"
import { CountryFlag } from "@/components/country-flag"
import { motion, AnimatePresence } from "framer-motion"
import { generateFlightShareImage, shareFlightInfo } from "@/lib/flight-share"
import { haptic } from "@/lib/haptics"
import { SharePreviewModal, type ColorPalette } from "@/components/share-preview-modal"

interface AircraftInfoPanelProps {
  selectedFlight: SelectedFlight
  onClose: () => void
  onShowOnMap?: (hex: string) => void
}

interface PhotoMetadata {
  imageUrl: string
  link: string
  photographer: string
}

export function AircraftInfoPanel({ selectedFlight, onClose, onShowOnMap }: AircraftInfoPanelProps) {
  const [aircraftImage, setAircraftImage] = useState<string | null>(null)
  const [photoMetadata, setPhotoMetadata] = useState<PhotoMetadata | null>(null)
  const [svgImage, setSvgImage] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette | undefined>(undefined)
  const [isRegenerating, setIsRegenerating] = useState(false)

  useEffect(() => {
    // Reset images when aircraft changes
    setAircraftImage(null)
    setPhotoMetadata(null)
    setSvgImage(null)

    const loadImages = async () => {
      // Load Planespotters photo
      if (selectedFlight.registration || selectedFlight.hex) {
        try {
          const query = selectedFlight.registration || selectedFlight.hex
          const response = await fetch(
            `https://api.planespotters.net/pub/photos/reg/${query}`,
            {
              headers: {
                'Accept': 'application/json',
              },
            }
          )

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
                  photographer: photo.photographer || 'Unknown',
                })
              }
            }
          }
        } catch (error) {
          console.log("Planespotters image not available")
        }
      }

      // Load SVG from ADSB2PNG
      if (selectedFlight.lat && selectedFlight.lng) {
        try {
          // Determine aircraft type
          let aircraftType = 'airliner'
          if (selectedFlight.type) {
            const typeUpper = selectedFlight.type.toUpperCase()
            if (typeUpper.includes('HELI') || typeUpper.includes('H-') || (typeUpper.includes('EC') && typeUpper.length <= 4)) {
              aircraftType = 'helicopter'
            } else if (typeUpper.includes('B7') || typeUpper.includes('A3') || typeUpper.includes('B77') || typeUpper.includes('A388')) {
              aircraftType = 'airliner'
            } else if (typeUpper.includes('C1') || typeUpper.includes('GLF') || typeUpper.includes('CL6')) {
              aircraftType = 'bizjet'
            }
          }

          const svgUrl = `https://svg-api.deradar.app/?location=${selectedFlight.lat},${selectedFlight.lng}&type=${aircraftType}&heading=${selectedFlight.heading}`
          const svgResponse = await fetch(svgUrl)

          if (svgResponse.ok) {
            const svgText = await svgResponse.text()
            const svgBlob = new Blob([svgText], { type: 'image/svg+xml' })
            const svgObjectUrl = URL.createObjectURL(svgBlob)
            setSvgImage(svgObjectUrl)
          }
        } catch (error) {
          console.log("SVG image not available")
        }
      }
    }

    loadImages()

    // Cleanup SVG object URL on unmount
    return () => {
      if (svgImage) {
        URL.revokeObjectURL(svgImage)
      }
    }
  }, [selectedFlight.hex, selectedFlight.registration, selectedFlight.lat, selectedFlight.lng, selectedFlight.heading, selectedFlight.type])

  const handleShare = async () => {
    console.log('Share button clicked!')
    setIsSharing(true)
    await haptic.light()

    try {
      console.log('Generating preview image...')
      // Generate the image for preview
      const imageBlob = await generateFlightShareImage({
        flight: selectedFlight,
        colorPalette: selectedPalette,
      })

      // Convert blob to URL for preview
      const imageUrl = URL.createObjectURL(imageBlob)
      setPreviewImageUrl(imageUrl)
      setShowPreview(true)
      setIsSharing(false)
      await haptic.success()
    } catch (error) {
      console.error('Preview generation error:', error)
      await haptic.error()
      alert(`Failed to generate preview: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsSharing(false)
    }
  }

  const handleColorChange = async (palette: ColorPalette) => {
    setIsRegenerating(true)
    setSelectedPalette(palette)
    await haptic.light()

    try {
      // Clean up old preview URL
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl)
      }

      // Regenerate image with new palette
      const imageBlob = await generateFlightShareImage({
        flight: selectedFlight,
        colorPalette: palette,
      })

      // Convert blob to URL for preview
      const imageUrl = URL.createObjectURL(imageBlob)
      setPreviewImageUrl(imageUrl)
      setIsRegenerating(false)
      await haptic.success()
    } catch (error) {
      console.error('Color change error:', error)
      await haptic.error()
      setIsRegenerating(false)
    }
  }

  const handleConfirmShare = async () => {
    setIsSharing(true)
    await haptic.light()

    try {
      console.log('Starting share with flight:', selectedFlight)
      const success = await shareFlightInfo(selectedFlight)
      console.log('Share result:', success)
      if (success) {
        await haptic.success()
        setShowPreview(false)
        // Clean up the preview URL
        if (previewImageUrl) {
          URL.revokeObjectURL(previewImageUrl)
          setPreviewImageUrl(null)
        }
      } else {
        await haptic.error()
      }
    } catch (error) {
      console.error('Share error:', error)
      await haptic.error()
      alert(`Share failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[10000] bg-slate-900 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden"
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
        </div>

        {/* Close Button - top right */}
        <div className="absolute top-5 right-4 z-10">
          <button
            onClick={onClose}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 rounded-full transition-all active:scale-95 shadow-lg"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-3rem)] pb-6">
          {/* Aircraft Images - Side by Side */}
          {(aircraftImage || svgImage) && (
            <div className={`grid gap-2 px-2 pt-2 ${aircraftImage && svgImage ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {/* Planespotters Photo */}
              {aircraftImage && photoMetadata && (
                <div className="relative bg-slate-800 rounded-lg overflow-hidden">
                  <img
                    src={aircraftImage}
                    alt="Aircraft Photo"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[10px] text-slate-300 truncate">
                        © {photoMetadata.photographer}
                      </p>
                      <a
                        href={photoMetadata.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={async (e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          await haptic.light()

                          // Check if running on native platform
                          const isNative = typeof (window as any).Capacitor !== 'undefined'

                          if (isNative) {
                            // Use Capacitor Browser plugin to open in external browser
                            try {
                              const { Browser } = await import('@capacitor/browser')
                              await Browser.open({ url: photoMetadata.link })
                            } catch (error) {
                              console.error('Failed to open browser:', error)
                              // Fallback to window.open
                              window.open(photoMetadata.link, '_blank', 'noopener,noreferrer')
                            }
                          } else {
                            // Web: open in new tab
                            window.open(photoMetadata.link, '_blank', 'noopener,noreferrer')
                          }
                        }}
                        className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded text-[10px] text-blue-300 transition-colors flex-shrink-0"
                        title="View original photo"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        <span>Photo</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* SVG from DeRadar API */}
              {svgImage && (
                <div
                  className="relative bg-slate-800 rounded-lg overflow-hidden cursor-pointer hover:bg-slate-700 transition-colors"
                  onClick={async () => {
                    if (onShowOnMap && selectedFlight.lat && selectedFlight.lng) {
                      await haptic.light()
                      onShowOnMap(selectedFlight.hex)
                    }
                  }}
                  title="Show on map"
                >
                  <img
                    src={svgImage}
                    alt="Aircraft Visualization"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <div className="flex items-center justify-center">
                      <div className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/40 rounded text-[10px] text-purple-300">
                        Live Position
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Header Info */}
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-start gap-3 mb-4">
              <CountryFlag icao={selectedFlight.hex} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-white flex-shrink min-w-0 truncate">
                    {selectedFlight.callsign || selectedFlight.registration || selectedFlight.hex}
                  </h2>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
                    {/* Locate Button */}
                    {onShowOnMap && selectedFlight.lat && selectedFlight.lng && (
                      <button
                        onClick={() => {
                          onShowOnMap(selectedFlight.hex)
                          haptic.light()
                        }}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 active:bg-blue-500/40 border border-blue-500/40 rounded-lg transition-all active:scale-95"
                        title="Locate on map"
                      >
                        <Locate className="w-4 h-4 text-blue-400" />
                      </button>
                    )}
                    {/* Share Button */}
                    <button
                      onClick={handleShare}
                      disabled={isSharing}
                      className="p-2 bg-green-500/20 hover:bg-green-500/30 active:bg-green-500/40 border border-green-500/40 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                      title="Share flight info"
                    >
                      {isSharing ? (
                        <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Share2 className="w-4 h-4 text-green-400" />
                      )}
                    </button>
                  </div>
                </div>
                {selectedFlight.callsign && selectedFlight.registration && (
                  <p className="text-sm text-slate-400">{selectedFlight.registration}</p>
                )}
                {selectedFlight.type && selectedFlight.type !== "Unknown" && (
                  <p className="text-xs text-slate-500 mt-1">{selectedFlight.type}</p>
                )}
              </div>
            </div>

            {/* Status Badge */}
            {selectedFlight.status === "Emergency" && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-full mb-4">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-red-300">EMERGENCY</span>
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="px-4 mb-3">
            <div className="grid grid-cols-3 gap-2">
              {/* Altitude */}
              <div className="text-center p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <ArrowUp className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">
                  {selectedFlight.altitude > 0 ? Math.round(selectedFlight.altitude / 100) : 'GND'}
                </div>
                <div className="text-[10px] text-slate-400 uppercase">
                  {selectedFlight.altitude > 0 ? 'FL' : 'Ground'}
                </div>
              </div>

              {/* Speed */}
              <div className="text-center p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                <Gauge className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">{selectedFlight.speed}</div>
                <div className="text-[10px] text-slate-400 uppercase">kts</div>
              </div>

              {/* Heading */}
              <div className="text-center p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <Plane
                  className="w-4 h-4 text-purple-400 mx-auto mb-1"
                  style={{ transform: `rotate(${selectedFlight.heading}deg)` }}
                />
                <div className="text-lg font-bold text-white">{selectedFlight.heading}°</div>
                <div className="text-[10px] text-slate-400 uppercase">hdg</div>
              </div>
            </div>
          </div>

          {/* Detailed Info */}
          <div className="px-4 space-y-2">
            {/* Position */}
            <div className="p-3 bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs font-semibold text-slate-300 uppercase">Position</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Latitude:</span>
                  <div className="font-mono text-white font-semibold">{selectedFlight.lat.toFixed(5)}</div>
                </div>
                <div>
                  <span className="text-slate-500">Longitude:</span>
                  <div className="font-mono text-white font-semibold">{selectedFlight.lng.toFixed(5)}</div>
                </div>
              </div>
            </div>

            {/* Aircraft Details */}
            <div className="p-3 bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Plane className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-slate-300 uppercase">Aircraft Info</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">ICAO Hex:</span>
                  <span className="font-mono text-white font-semibold">{selectedFlight.hex.toUpperCase()}</span>
                </div>
                {selectedFlight.type && selectedFlight.type !== "Unknown" && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Type:</span>
                    <span className="text-white font-semibold">{selectedFlight.type}</span>
                  </div>
                )}
                {selectedFlight.registration && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Registration:</span>
                    <span className="font-mono text-white font-semibold">{selectedFlight.registration}</span>
                  </div>
                )}
                {selectedFlight.squawk && selectedFlight.squawk !== "N/A" && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Squawk:</span>
                    <span className="font-mono text-white font-semibold">{selectedFlight.squawk}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Full Altitude Display */}
            <div className="p-3 bg-slate-800/50 rounded-xl">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Altitude (ft):</span>
                <span className="text-white font-semibold">
                  {selectedFlight.altitude > 0 ? selectedFlight.altitude.toLocaleString() : 'Ground Level'}
                </span>
              </div>
            </div>
          </div>
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
