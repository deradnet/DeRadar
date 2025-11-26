"use client"

import { X, Share2, Download, Palette } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { haptic } from "@/lib/haptics"

export interface ColorPalette {
  name: string
  gradient: { start: string; mid: string; end: string }
  accent: string
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    name: "Aviation Blue",
    gradient: { start: "#0a1929", mid: "#1e3a5f", end: "#0f2744" },
    accent: "#3b82f6"
  },
  {
    name: "Dark Navy",
    gradient: { start: "#0c1821", mid: "#1a2332", end: "#111927" },
    accent: "#60a5fa"
  },
  {
    name: "Midnight",
    gradient: { start: "#050505", mid: "#0f0f0f", end: "#0a0a0a" },
    accent: "#818cf8"
  },
  {
    name: "Ocean Deep",
    gradient: { start: "#0a1f2e", mid: "#164e63", end: "#0e3a4a" },
    accent: "#22d3ee"
  },
  {
    name: "Military Green",
    gradient: { start: "#0f1e13", mid: "#1e3d29", end: "#142820" },
    accent: "#10b981"
  },
  {
    name: "Sunset Red",
    gradient: { start: "#1f0c0c", mid: "#4a1414", end: "#2e1010" },
    accent: "#f87171"
  }
]

interface SharePreviewModalProps {
  imageUrl: string | null
  isOpen: boolean
  onClose: () => void
  onConfirmShare: () => void
  onColorChange?: (palette: ColorPalette) => void
  isSharing: boolean
  isRegenerating?: boolean
}

export function SharePreviewModal({
  imageUrl,
  isOpen,
  onClose,
  onConfirmShare,
  onColorChange,
  isSharing,
  isRegenerating = false,
}: SharePreviewModalProps) {
  if (!isOpen || !imageUrl) return null

  const handleDownload = async () => {
    await haptic.light()

    try {
      // Check if running on native platform
      const isNative = typeof (window as any).Capacitor !== 'undefined'

      if (isNative) {
        // Use Capacitor Filesystem to save on mobile
        const { Filesystem, Directory } = await import('@capacitor/filesystem')

        // Convert blob URL back to blob
        const response = await fetch(imageUrl)
        const blob = await response.blob()

        // Convert to base64
        const reader = new FileReader()
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })

        const base64Data = base64.split(',')[1]
        const fileName = `deradar-flight-${Date.now()}.png`

        // Save to Photos/Downloads
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
        })

        await haptic.success()
        alert('Image saved successfully!')
      } else {
        // Web download
        const link = document.createElement('a')
        link.href = imageUrl
        link.download = `deradar-flight-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        await haptic.success()
      }
    } catch (error) {
      console.error('Download failed:', error)
      await haptic.error()
      alert('Failed to save image')
    }
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10001]"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[10002] bg-slate-900 rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 pt-2">
          <h3 className="text-xl font-bold text-white">Share Preview</h3>
          <button
            onClick={() => {
              haptic.light()
              onClose()
            }}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors active:scale-95"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Image Preview with better styling */}
        <div className="flex-1 overflow-auto px-4 bg-gradient-to-b from-slate-900 to-slate-950">
          <div className="relative max-w-full mx-auto">
            <img
              src={imageUrl}
              alt="Flight share preview"
              className="w-full h-auto rounded-2xl shadow-2xl border-2 border-slate-700"
            />
            {isRegenerating && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="text-white text-sm font-medium">Updating colors...</p>
                </div>
              </div>
            )}
          </div>

          {/* Color Palette Selector - Spotify Style */}
          {onColorChange && (
            <div className="mt-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">Choose Your Color</span>
                </div>
                <span className="text-xs text-slate-500">{COLOR_PALETTES.length} themes</span>
              </div>
              <div className="grid grid-cols-6 gap-2 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                {COLOR_PALETTES.map((palette) => (
                  <button
                    key={palette.name}
                    onClick={async () => {
                      await haptic.light()
                      onColorChange(palette)
                    }}
                    disabled={isRegenerating}
                    className="group relative aspect-square rounded-lg overflow-hidden transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:ring-2 hover:ring-white/60 hover:shadow-lg"
                    title={palette.name}
                  >
                    <div
                      className="w-full h-full"
                      style={{
                        background: `linear-gradient(135deg, ${palette.gradient.start}, ${palette.gradient.mid}, ${palette.gradient.end})`
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions with improved styling */}
        <div className="p-4 bg-slate-800/80 backdrop-blur-sm border-t-2 border-slate-700 flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-4 bg-blue-500/20 hover:bg-blue-500/30 active:bg-blue-500/40 border border-blue-500/50 text-blue-300 rounded-xl transition-all active:scale-95 font-bold shadow-lg"
          >
            <Download className="w-5 h-5" />
            <span>Save</span>
          </button>
          <button
            onClick={() => {
              haptic.light()
              onConfirmShare()
            }}
            disabled={isSharing}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-4 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-xl transition-all active:scale-95 font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSharing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sharing...</span>
              </>
            ) : (
              <>
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
