"use client"

import { Suspense, useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { useGLTF, Environment, OrbitControls } from "@react-three/drei"
import * as THREE from "three"

const AVAILABLE_MODELS: Record<string, { file: string; scale: number }> = {
  // Airbus family
  a318: { file: "a318.glb", scale: 0.1 },
  a319: { file: "a319.glb", scale: 0.1 },
  a320: { file: "a320.glb", scale: 0.1 },
  a321: { file: "a321.glb", scale: 0.1 },
  a332: { file: "a332.glb", scale: 0.09 },
  a333: { file: "a333.glb", scale: 0.09 },
  a343: { file: "a343.glb", scale: 0.085 },
  a346: { file: "a346.glb", scale: 0.085 },
  a359: { file: "a359.glb", scale: 0.09 },
  a380: { file: "a380.glb", scale: 0.08 },

  // Boeing family
  b736: { file: "b736.glb", scale: 0.1 },
  b737: { file: "b737.glb", scale: 0.1 },
  b738: { file: "b738.glb", scale: 0.1 },
  b739: { file: "b739.glb", scale: 0.1 },
  b744: { file: "b744.glb", scale: 0.08 },
  b748: { file: "b748.glb", scale: 0.08 },
  b752: { file: "b752.glb", scale: 0.095 },
  b753: { file: "b753.glb", scale: 0.095 },
  b762: { file: "b762.glb", scale: 0.09 },
  b763: { file: "b763.glb", scale: 0.09 },
  b764: { file: "b764.glb", scale: 0.09 },
  b772: { file: "b772.glb", scale: 0.085 },
  b773: { file: "b773.glb", scale: 0.085 },
  b788: { file: "b788.glb", scale: 0.09 },
  b789: { file: "b789.glb", scale: 0.09 },

  // Regional jets
  crj700: { file: "crj700.glb", scale: 0.11 },
  crj900: { file: "crj900.glb", scale: 0.11 },
  cs100: { file: "cs100.glb", scale: 0.105 },
  cs300: { file: "cs300.glb", scale: 0.105 },
  e170: { file: "e170.glb", scale: 0.11 },
  e190: { file: "e190.glb", scale: 0.105 },
  bae146: { file: "bae146.glb", scale: 0.105 },
  atr42: { file: "atr42.glb", scale: 0.115 },
  q400: { file: "q400.glb", scale: 0.11 },

  // Special aircraft
  beluga: { file: "beluga.glb", scale: 0.09 },
  an225: { file: "an225.gltf", scale: 0.075 },

  // Business jets
  citation: { file: "citation.glb", scale: 0.12 },

  // Light aircraft
  ask21: { file: "ask21.glb", scale: 0.13 },
  pa28: { file: "pa28.glb", scale: 0.13 },

  // Helicopters (fixed scale)
  heli: { file: "heli.glb", scale: 0.1 },
  h25b: { file: "heli.glb", scale: 0.1 },
  h25c: { file: "heli.glb", scale: 0.1 },
  h60: { file: "heli.glb", scale: 0.1 },
  ec35: { file: "heli.glb", scale: 0.1 },
  ec45: { file: "heli.glb", scale: 0.1 },
  as50: { file: "heli.glb", scale: 0.1 },
  as55: { file: "heli.glb", scale: 0.1 },
  as65: { file: "heli.glb", scale: 0.1 },
}

// Aircraft type code aliases - maps ICAO codes to model names
const TYPE_ALIASES: Record<string, string> = {
  // Airbus A380 variants
  a388: "a380",  // A380-800

  // Airbus BelugaXL
  a337: "beluga",  // A330-700 Beluga XL
  a3st: "beluga",  // A300-600ST Beluga (original)

  // Airbus A320 family variants
  a20n: "a320",  // A320neo
  a19n: "a319",  // A319neo
  a21n: "a321",  // A321neo

  // Airbus A330 variants
  a339: "a333",  // A330-900neo
  a338: "a332",  // A330-800neo
  a33b: "a332",  // A330-200F
  a33f: "a332",  // A330-200F (freighter)

  // Airbus A350 variants
  a35k: "a359",  // A350-1000
  a358: "a359",  // A350-800

  // Boeing 737 MAX variants
  b37m: "b738",  // 737 MAX 7
  b38m: "b738",  // 737 MAX 8
  b39m: "b739",  // 737 MAX 9
  b3jm: "b739",  // 737 MAX 10

  // Boeing 787 variants
  b78x: "b788",  // 787-10

  // Boeing 747 variants
  b74r: "b748",  // 747-8F
  b74s: "b748",  // 747SP
  b74d: "b744",  // 747-400D
  b74f: "b744",  // 747-400F

  // Boeing 777 variants
  b77l: "b773",  // 777-200LR
  b77f: "b773",  // 777F
  b77w: "b773",  // 777-300ER
  b779: "b773",  // 777-9
  b778: "b773",  // 777-8

  // Embraer E-Jets
  e75l: "e170",  // E175 (long wing)
  e75s: "e170",  // E175 (short wing)
  e195: "e190",  // E195

  // Bombardier CRJ variants
  crj7: "crj700", // CRJ-700
  crj9: "crj900", // CRJ-900
  crj1: "crj700", // CRJ-100
  crj2: "crj700", // CRJ-200

  // Bombardier CSeries / Airbus A220
  a221: "cs100",  // A220-100 (formerly CS100)
  a223: "cs300",  // A220-300 (formerly CS300)

  // ATR variants
  at43: "atr42",  // ATR 42-300
  at45: "atr42",  // ATR 42-500
  at72: "atr42",  // ATR 72
  at73: "atr42",  // ATR 72-600
  at75: "atr42",  // ATR 72-500
  at76: "atr42",  // ATR 72-600

  // Dash 8 / Q400 variants
  dh8d: "q400",   // Dash 8 Q400
  dhc8: "q400",   // DHC-8

  // BAe 146 / Avro RJ variants
  b461: "bae146", // BAe 146-100
  b462: "bae146", // BAe 146-200
  b463: "bae146", // BAe 146-300
  rj70: "bae146", // Avro RJ70
  rj85: "bae146", // Avro RJ85
  rj1h: "bae146", // Avro RJ100
}

function isHelicopterType(aircraftType: string): boolean {
  const type = aircraftType?.toLowerCase().replace(/[^a-z0-9]/g, "") || ""
  const originalType = aircraftType?.toLowerCase() || ""

  const helicopterPatterns = [
    /^h\d/,        // H followed by number (H25, H60, etc.)
    /^ec\d/,       // Eurocopter (EC35, EC45, EC135, EC145, etc.)
    /^as\d/,       // Airbus Helicopters (AS50, AS55, AS350, AS365, etc.)
    /^uh\d/,       // Military helicopters (UH-60, UH-1, etc.)
    /^ah\d/,       // Attack helicopters (AH-64, AH-1, etc.)
    /^ch\d/,       // Cargo helicopters (CH-47, CH-53, etc.)
    /^mi\d/,       // Mil helicopters (Mi-8, Mi-24, etc.)
    /^ka\d/,       // Kamov helicopters (Ka-52, Ka-27, etc.)
    /^bell/,       // Bell helicopters (Bell 206, 407, etc.)
    /^sikorsky/,   // Sikorsky (S-76, S-92, etc.)
    /^robinson/,   // Robinson (R22, R44, etc.)
    /^md\d/,       // MD helicopters (MD500, MD900, etc.)
    /^r\d\d/,      // Robinson R22, R44, R66
    /^s\d\d/,      // Sikorsky S-series
    /helicopter/i, // Contains "helicopter"
    /heli/i,       // Contains "heli"
    /chopper/i,    // Slang for helicopter
  ]

  return helicopterPatterns.some(pattern => pattern.test(originalType) || pattern.test(type))
}

function getModelInfo(aircraftType: string): { url: string; scale: number } | null {
  const type = aircraftType?.toLowerCase().replace(/[^a-z0-9]/g, "") || ""

  // Check if it's a helicopter based on common patterns
  if (isHelicopterType(aircraftType)) {
    return {
      url: `https://glb.derad.org/glb/heli.glb`,
      scale: 0.1
    }
  }

  // Check if there's an alias for this type code
  const resolvedType = TYPE_ALIASES[type] || type

  // Try match with resolved type
  if (AVAILABLE_MODELS[resolvedType]) {
    return {
      url: `https://glb.derad.org/glb/${AVAILABLE_MODELS[resolvedType].file}`,
      scale: AVAILABLE_MODELS[resolvedType].scale
    }
  }

  // No match found - return null
  return null
}

function Aircraft({ url, scale }: { url: string; scale: number }) {
  const { scene } = useGLTF(url)
  const meshRef = useRef<THREE.Group>(null)

  // Clone the scene to avoid issues and enhance materials
  const clonedScene = useMemo(() => {
    const cloned = scene.clone()
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh

        // Create or enhance material
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial

          // If material exists, enhance it
          if (mat.isMeshStandardMaterial || (mat as any).isMeshPhysicalMaterial) {
            mat.roughness = 0.3
            mat.metalness = 0.8
            mat.envMapIntensity = 1.2

            // If no color or texture, set a nice metallic color
            if (!mat.map && (!mat.color || mat.color.getHex() === 0xffffff || mat.color.getHex() === 0x000000)) {
              mat.color = new THREE.Color(0xe8e8e8) // Light metallic gray
            }

            // Ensure material is visible
            mat.transparent = false
            mat.opacity = 1
            mat.needsUpdate = true
          }
        } else {
          // Create new material if none exists
          mesh.material = new THREE.MeshStandardMaterial({
            color: 0xe8e8e8,
            roughness: 0.3,
            metalness: 0.8,
            envMapIntensity: 1.2,
          })
        }
      }
    })
    return cloned
  }, [scene])

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime

      // Smooth banking turn animation
      const baseYaw = Math.PI / 1.6
      const yaw = baseYaw + Math.sin(t * 0.3) * 0.15

      // Dynamic pitch with smoother transitions
      const pitch = Math.sin(t * 0.4) * 0.08 + Math.cos(t * 0.2) * 0.03

      // Coordinated roll that follows the yaw (banking turn)
      const roll = Math.sin(t * 0.3) * 0.12 + Math.sin(t * 0.6) * 0.04

      // Subtle vertical movement (altitude changes)
      meshRef.current.position.y = Math.sin(t * 0.35) * 0.08

      meshRef.current.rotation.set(pitch, yaw, roll)
    }
  })

  return (
    <group ref={meshRef}>
      <primitive object={clonedScene} scale={scale} />
    </group>
  )
}

function Scene({ modelUrl, scale }: { modelUrl: string; scale: number }) {
  return (
    <>
      {/* Enhanced lighting setup for maximum aircraft visibility */}
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" castShadow />
      <directionalLight position={[-5, 3, -5]} intensity={0.8} color="#b3d9ff" />
      <directionalLight position={[0, -3, 2]} intensity={0.6} color="#ffffff" />
      <pointLight position={[0, 3, 3]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-3, 0, -2]} intensity={0.5} color="#ffd4a3" />

      {/* Rim lighting for better aircraft definition */}
      <spotLight position={[3, 2, -3]} intensity={1.2} angle={0.6} penumbra={0.5} color="#ffffff" />

      {/* Interactive controls */}
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={2}
        maxDistance={6}
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.5}
      />

      <Suspense fallback={null}>
        {/* Aircraft */}
        <Aircraft url={modelUrl} scale={scale} />
      </Suspense>

      <Environment preset="sunset" />
    </>
  )
}

function LoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <span className="text-[10px] text-white/50">Loading 3D Model</span>
      </div>
    </div>
  )
}

interface Aircraft3DViewerProps {
  aircraftType: string
}

// Helper function to check if 3D model is available for an aircraft type
export function has3DModel(aircraftType: string): boolean {
  return getModelInfo(aircraftType) !== null
}

export function Aircraft3DViewer({ aircraftType }: Aircraft3DViewerProps) {
  const modelInfo = getModelInfo(aircraftType)

  // If no model found, only show the aircraft type label
  if (!modelInfo) {
    return (
      <div className="relative w-full overflow-hidden flex items-center" style={{ height: '55px' }}>
        <div className="flex-shrink-0 pl-3 pr-2">
          <div className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Aircraft</div>
          <div className="text-lg font-bold text-white uppercase tracking-tight leading-tight">{aircraftType || "Unknown"}</div>
        </div>
        <div className="flex-1 h-full flex items-center justify-center">
          <span className="text-xs text-white/30">No 3D model available</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-hidden flex items-center" style={{ height: '55px' }}>
      {/* Left side - Aircraft type label */}
      <div className="flex-shrink-0 pl-3 pr-2">
        <div className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Aircraft</div>
        <div className="text-lg font-bold text-white uppercase tracking-tight leading-tight">{aircraftType || "A320"}</div>
      </div>

      {/* Right side - 3D Model */}
      <div className="flex-1 h-full relative">
        <Suspense fallback={<LoadingFallback />}>
          <Canvas
            camera={{ position: [0, 0.1, 3], fov: 45 }}
            style={{ background: "transparent" }}
            gl={{
              antialias: true,
              alpha: true,
              toneMapping: 2, // ACESFilmicToneMapping
              toneMappingExposure: 0.8
            }}
          >
            <Scene modelUrl={modelInfo.url} scale={modelInfo.scale} />
          </Canvas>
        </Suspense>
      </div>
    </div>
  )
}
