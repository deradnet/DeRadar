"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plane, Radio, Radar } from "lucide-react"

interface SplashScreenProps {
  onFinish: () => void
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    // Auto-hide splash screen after animation completes
    const timer = setTimeout(() => {
      setShow(false)
      setTimeout(onFinish, 500) // Wait for fade-out animation
    }, 3000)

    return () => clearTimeout(timer)
  }, [onFinish])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[99999] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col items-center justify-center"
        >
          {/* Animated radar circles */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 3], opacity: [0.3, 0.2, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
              className="absolute w-80 h-80 border border-blue-400/30 rounded-full"
            />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 3], opacity: [0.3, 0.2, 0] }}
              transition={{ duration: 2.5, delay: 0.8, repeat: Infinity, ease: "easeOut" }}
              className="absolute w-80 h-80 border border-blue-400/30 rounded-full"
            />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 3], opacity: [0.3, 0.2, 0] }}
              transition={{ duration: 2.5, delay: 1.6, repeat: Infinity, ease: "easeOut" }}
              className="absolute w-80 h-80 border border-blue-400/30 rounded-full"
            />
          </div>

          {/* Center content */}
          <div className="relative z-10 flex flex-col items-center gap-6">
            {/* Logo with pulsing animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                {/* Outer glow ring */}
                <div className="absolute inset-0 -m-10 bg-blue-500/20 rounded-full blur-3xl" />

                {/* Main icon container */}
                <div className="relative w-40 h-40 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-full shadow-2xl shadow-blue-500/50 flex items-center justify-center overflow-hidden">
                  {/* Animated radar sweep */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0"
                  >
                    {/* Radar sweep line */}
                    <div className="absolute top-1/2 left-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent transform -translate-y-1/2 origin-left" />
                    {/* Radar sweep dot */}
                    <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                  </motion.div>

                  {/* Radar icon */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="relative z-10"
                  >
                    <Radar className="w-16 h-16 text-white drop-shadow-lg" />
                  </motion.div>

                  {/* Signal waves */}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-4 -right-4"
                  >
                    <Radio className="w-7 h-7 text-green-400 drop-shadow-lg" />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>

            {/* App name with stagger animation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-col items-center gap-3"
            >
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="text-6xl font-bold text-white tracking-tight text-center"
              >
                <motion.span
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.4, duration: 0.4 }}
                  className="inline-block"
                >
                  DE
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.6, duration: 0.4 }}
                  className="inline-block bg-gradient-to-r from-blue-300 via-blue-400 to-blue-500 bg-clip-text text-transparent"
                >
                  RADAR
                </motion.span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.8, duration: 0.5 }}
                className="text-blue-200 text-sm tracking-widest uppercase font-medium"
              >
                Decentralized ADS-B Tracking
              </motion.p>
            </motion.div>

            {/* Enhanced loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 0.6 }}
              className="mt-4"
            >
              {/* Animated pulsing circle */}
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <div className="w-10 h-10 rounded-full border border-blue-400/30 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                </div>
              </motion.div>
            </motion.div>

            {/* Powered by text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2, duration: 0.6 }}
              className="mt-6 text-center"
            >
              <p className="text-blue-300/70 text-xs font-light">
                Powered by{" "}
                <span className="text-blue-400 font-semibold">AR.IO & Derad Network</span>
              </p>
            </motion.div>
          </div>

          {/* Subtle bottom gradient */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-blue-500/20 to-transparent"
          />

          {/* Floating elements */}
          <motion.div
            initial={{ x: -100, y: 100, opacity: 0 }}
            animate={{ x: typeof window !== 'undefined' ? window.innerWidth + 100 : 1000, y: -100, opacity: [0, 0.2, 0] }}
            transition={{ duration: 5, ease: "linear", repeat: Infinity, repeatDelay: 3 }}
            className="absolute"
          >
            <Plane className="w-6 h-6 text-blue-400/30" style={{ transform: "rotate(45deg)" }} />
          </motion.div>

          <motion.div
            initial={{ x: typeof window !== 'undefined' ? window.innerWidth + 100 : 1000, y: -150, opacity: 0 }}
            animate={{ x: -100, y: 150, opacity: [0, 0.2, 0] }}
            transition={{ duration: 6, ease: "linear", repeat: Infinity, repeatDelay: 4 }}
            className="absolute"
          >
            <Radio className="w-5 h-5 text-green-400/30" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
