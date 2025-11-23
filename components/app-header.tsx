"use client"

import { Radar } from "lucide-react"

interface AppHeaderProps {
  lastUpdate: Date
  isNativeApp?: boolean
}

export function AppHeader({
  lastUpdate,
  isNativeApp = false,
}: AppHeaderProps) {
  return (
    <div
      className="bg-slate-900/30 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-50"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div
                className="group relative p-3 rounded-xl shadow-lg overflow-hidden cursor-pointer transition-all duration-500 ease-out hover:scale-125 hover:rotate-3 bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-800 hover:shadow-[0_0_40px_rgba(59,130,246,0.8)] hover:border hover:border-white/30"
                style={{
                  background: "linear-gradient(135deg, #2563eb 0%, #0891b2 25%, #0284c7 50%, #0369a1 75%, #1e3a8a 100%)",
                }}
              >
                <Radar
                  className="w-6 h-6 text-white relative z-20 transition-all duration-700 ease-out will-change-transform group-hover:rotate-[360deg] group-hover:scale-150 group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,1)] group-hover:text-cyan-100"
                  style={{
                    filter: "drop-shadow(0 0 8px rgba(255,255,255,0.5))",
                  }}
                />

                {/* Hover effects */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse rounded-xl"></div>

                  <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-conic-fast from-transparent via-white/40 to-transparent animate-spin-fast rounded-full"></div>
                    <div className="absolute inset-0 bg-gradient-conic-slow from-transparent via-cyan-300/30 to-transparent animate-spin-slow rounded-full"></div>
                  </div>

                  <div className="absolute inset-0">
                    <div className="absolute inset-0 border-2 border-white/20 rounded-full animate-ping"></div>
                    <div className="absolute inset-1 border border-cyan-300/30 rounded-full animate-ping" style={{ animationDelay: "200ms" }}></div>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-energy-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-white">DeRadar</h1>
                  <span className="relative -top-1 px-1.5 py-0.5 text-[10px] font-semibold bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-sm backdrop-blur-sm">
                    BETA
                  </span>
                </div>
                <p className="text-sm text-slate-400 hidden sm:block">
                  Real-time aircraft monitoring
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>{lastUpdate.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
