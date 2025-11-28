"use client"

import { useEffect, useState, useRef } from "react"

interface CompassProps {
  heading: number
  size?: number
  animate?: boolean
}

export function Compass({ heading, size = 56, animate = false }: CompassProps) {
  const [displayHeading, setDisplayHeading] = useState(animate ? 0 : heading)
  const [velocity, setVelocity] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(!animate)
  const animationRef = useRef<number | undefined>(undefined)
  const lastTimeRef = useRef<number>(0)

  useEffect(() => {
    if (animate && !hasAnimated) {
      const targetHeading = heading
      let currentHeading = 0
      let currentVelocity = 0
      const stiffness = 0.08
      const damping = 0.85
      const threshold = 0.1

      const animateFrame = (timestamp: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = timestamp

        // Spring physics
        const displacement = targetHeading - currentHeading
        const springForce = displacement * stiffness
        currentVelocity = (currentVelocity + springForce) * damping
        currentHeading += currentVelocity

        setDisplayHeading(currentHeading)

        // Stop when settled
        if (Math.abs(currentVelocity) < threshold && Math.abs(displacement) < threshold) {
          setDisplayHeading(targetHeading)
          setHasAnimated(true)
        } else {
          animationRef.current = requestAnimationFrame(animateFrame)
        }
      }

      animationRef.current = requestAnimationFrame(animateFrame)

      return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
      }
    } else if (hasAnimated) {
      setDisplayHeading(heading)
    }
  }, [animate, hasAnimated, heading])

  const center = size / 2
  const radius = center - 2

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(145deg, #2a2a2e 0%, #1a1a1c 100%)",
        boxShadow: `
          0 1px 3px rgba(0,0,0,0.4),
          0 4px 12px rgba(0,0,0,0.3),
          inset 0 1px 0 rgba(255,255,255,0.08)
        `,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* Outer ring */}
      <div
        style={{
          position: "absolute",
          width: size - 4,
          height: size - 4,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      />

      {/* Rotating compass rose */}
      <div
        style={{
          position: "absolute",
          width: size - 8,
          height: size - 8,
          transform: `rotate(${-displayHeading}deg)`,
          transition: hasAnimated ? "transform 0.1s ease-out" : "none",
        }}
      >
        {/* Cardinal ticks */}
        {[0, 90, 180, 270].map((deg) => (
          <div
            key={deg}
            style={{
              position: "absolute",
              width: 2,
              height: deg === 0 ? 8 : 6,
              background: deg === 0 ? "#ff3b30" : "rgba(255,255,255,0.5)",
              borderRadius: 1,
              left: "50%",
              top: 0,
              marginLeft: -1,
              transformOrigin: `50% ${(size - 8) / 2}px`,
              transform: `rotate(${deg}deg)`,
            }}
          />
        ))}
      </div>

      {/* Center display */}
      <div
        style={{
          width: size * 0.6,
          height: size * 0.6,
          borderRadius: "50%",
          background: "linear-gradient(180deg, #1f1f21 0%, #0f0f10 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5)",
          zIndex: 1,
        }}
      >
        <span
          style={{
            color: "#ffffff",
            fontSize: size * 0.22,
            fontWeight: 600,
            fontFamily: "ui-monospace, SF Mono, monospace",
            letterSpacing: -0.5,
          }}
        >
          {Math.round(displayHeading < 0 ? displayHeading + 360 : displayHeading % 360)}°
        </span>
      </div>

      {/* North indicator dot */}
      <div
        style={{
          position: "absolute",
          top: 2,
          left: "50%",
          marginLeft: -2,
          width: 4,
          height: 4,
          borderRadius: "50%",
          background: "#ff3b30",
          boxShadow: "0 0 4px rgba(255,59,48,0.6)",
        }}
      />
    </div>
  )
}
