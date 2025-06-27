"use client"

import { Globe, Mail, Radar, Github, Satellite, Zap, Star } from "lucide-react"
import { APP_CONFIG } from "@/config/app.config"
import { useState, useEffect } from "react"

export function Footer() {
  const currentYear = new Date().getFullYear()
  const appVersion = APP_CONFIG.app.version

  const [starCount, setStarCount] = useState<number | string>("Loading...")

  useEffect(() => {
    const repo = "deradnet/deradar"
    const url = `https://api.github.com/repos/${repo}`

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        setStarCount(data.stargazers_count || "Error")
      })
      .catch((error) => {
        console.error("Error fetching star count:", error)
        setStarCount("Error")
      })
  }, [])

  return (
    <footer className="bg-slate-950/50 border-t border-slate-800/50 backdrop-blur-xl mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Mobile Layout */}
        <div className="block md:hidden space-y-8">
          {/* Brand Section - Mobile */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl shadow-lg bg-gradient-to-r from-blue-600 to-blue-700">
                <Radar className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">DeRadar</span>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              DeRadar provides real-time and historical aircraft tracking, leveraging the power of Ar.io, Arweave, Derad
              Network Ground Stations.
            </p>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Satellite className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>Intercepting the skies</span>
                <Zap className="w-3 h-3 text-yellow-400" />
                <span>one signal at a time</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <a href="mailto:info@derad.net" className="text-slate-400 hover:text-white transition-colors">
                  info@derad.net
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4 text-slate-400" />
                <a
                  href="https://github.com/deradnet/DeRadar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Source Code
                </a>
                <div className="flex items-center gap-1 text-slate-400">
                  <Star className="w-3 h-3" />
                  <span className="text-xs">{starCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* References Section - Mobile */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">References</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://ar.io?ref=derad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  AR.IO Network
                </a>
              </li>
              <li>
                <a
                  href="https://arweave.org?ref=derad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Arweave
                </a>
              </li>
              <li>
                <a
                  href="https://derad.net/?=deradar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Derad Network
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:grid grid-cols-3 gap-8">
          {/* Brand Section - Desktop */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl shadow-lg bg-gradient-to-r from-blue-600 to-blue-700">
                <Radar className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">DeRadar</span>
            </div>
            <p className="text-slate-400 text-sm mb-4 max-w-md">
              DeRadar provides real-time and historical aircraft tracking, leveraging the power of Ar.io, Arweave, Derad
              Network Ground Stations.
            </p>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Satellite className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>Intercepting the skies</span>
                <Zap className="w-3 h-3 text-yellow-400" />
                <span>one signal at a time</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <a href="mailto:info@derad.net" className="text-slate-400 hover:text-white transition-colors">
                  info@derad.net
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4 text-slate-400" />
                <a
                  href="https://github.com/deradnet/DeRadar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Source Code
                </a>
                <div className="flex items-center gap-1 text-slate-400">
                  <Star className="w-3 h-3" />
                  <span className="text-xs">{starCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* References Section - Desktop */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">References</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://ar.io?ref=derad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  AR.IO Network
                </a>
              </li>
              <li>
                <a
                  href="https://arweave.org?ref=derad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Arweave
                </a>
              </li>
              <li>
                <a
                  href="https://derad.net/?=deradar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Derad Network
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section - Shared */}
        <div className="border-t border-slate-800/50 mt-8 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              <span>© {currentYear} DeRadar </span>
              <span className="mx-1 sm:mx-2">|</span>
              <span>v{appVersion}</span>
              <span className="mx-1 sm:mx-2">|</span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-400 rounded-md font-medium text-xs">
                BETA SOFTWARE
              </span>
              <span className="mx-1 sm:mx-2 text-orange-400/70 text-xs">
                Data quality may vary, features subject to change
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>Decentralized Data</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live & Historical Tracking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

