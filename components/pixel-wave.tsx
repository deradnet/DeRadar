"use client"

import { useEffect, useRef } from "react"

interface PixelWaveProps {
  progress: number // 0 to 1
  isActive: boolean
  height?: number // Optional custom height
}

class Pixel {
  x: number
  y: number
  color: string
  speed: number
  size: number
  sizeStep: number
  minSize: number
  maxSizeAvailable: number
  maxSize: number
  sizeDirection: number
  delay: number
  delayHide: number
  counter: number
  counterHide: number
  counterStep: number
  isHidden: boolean
  isFlicking: boolean

  constructor(x: number, y: number, color: string, speed: number, delay: number, delayHide: number, step: number, boundSize: number) {
    this.x = x
    this.y = y

    this.color = color
    this.speed = this.rand(0.1, 0.9) * speed

    this.size = 0
    this.sizeStep = this.rand(0, 0.5)
    this.minSize = 0.5
    this.maxSizeAvailable = boundSize || 2
    this.maxSize = this.rand(this.minSize, this.maxSizeAvailable)
    this.sizeDirection = 1

    this.delay = delay
    this.delayHide = delayHide
    this.counter = 0
    this.counterHide = 0
    this.counterStep = step

    this.isHidden = false
    this.isFlicking = false
  }

  rand(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  draw(ctx: CanvasRenderingContext2D) {
    const centerOffset = this.maxSizeAvailable * 0.5 - this.size * 0.5

    ctx.fillStyle = this.color
    ctx.fillRect(
      this.x + centerOffset,
      this.y + centerOffset,
      this.size,
      this.size
    )
  }

  show() {
    this.isHidden = false
    this.counterHide = 0

    if (this.counter <= this.delay) {
      this.counter += this.counterStep
      return
    }

    if (this.size >= this.maxSize) {
      this.isFlicking = true
    }

    if (this.isFlicking) {
      this.flicking()
    } else {
      this.size += this.sizeStep
    }
  }

  hide() {
    this.counter = 0

    if (this.counterHide <= this.delayHide) {
      this.counterHide += this.counterStep
      if (this.isFlicking) {
        this.flicking()
      }
      return
    }

    this.isFlicking = false

    if (this.size <= 0) {
      this.size = 0
      this.isHidden = true
      return
    } else {
      this.size -= 0.05
    }
  }

  flicking() {
    if (this.size >= this.maxSize) {
      this.sizeDirection = -1
    } else if (this.size <= this.minSize) {
      this.sizeDirection = 1
    }

    this.size += this.sizeDirection * this.speed
  }
}

export function PixelWave({ progress, isActive, height = 60 }: PixelWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pixelsRef = useRef<Pixel[]>([])
  const tickerRef = useRef(0)
  const animationDirectionRef = useRef(1)
  const rafRef = useRef<number>()
  const lastTimeRef = useRef(0)

  const rand = (min: number, max: number) => {
    return Math.random() * (max - min) + min
  }

  const getDelay = (x: number, y: number, width: number, height: number, direction: boolean) => {
    let dx = x - width * 0.5
    let dy = y - height

    if (direction) {
      dy = y
    }

    return Math.sqrt(dx ** 2 + dy ** 2)
  }

  const initPixels = (width: number, height: number) => {
    const h = Math.floor(rand(200, 220)) // Blue hues
    const colorsLen = 3 // Reduced from 5
    const colors = Array.from({ length: colorsLen }, (_, index) =>
      `hsl(${Math.floor(rand(h, h + (index + 1) * 10))} 100% ${rand(50, 80)}%)`
    )

    const gap = 8 // Increased from 6 - fewer pixels
    const step = (width + height) * 0.005
    const speed = rand(0.008, 0.25)
    const maxSize = Math.floor(gap * 0.5)

    pixelsRef.current = []

    for (let x = 0; x < width; x += gap) {
      for (let y = 0; y < height; y += gap) {
        if (x + maxSize > width || y + maxSize > height) {
          continue
        }

        const color = colors[Math.floor(Math.random() * colorsLen)]
        const delay = getDelay(x, y, width, height, false)
        const delayHide = getDelay(x, y, width, height, false)

        pixelsRef.current.push(new Pixel(x, y, color, speed, delay, delayHide, step, maxSize))
      }
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = window.innerWidth
    const canvasHeight = height // Use prop height

    canvas.width = width
    canvas.height = canvasHeight

    console.log('PixelWave initialized:', { width, height: canvasHeight, isActive, progress })

    initPixels(width, canvasHeight)
    console.log('Pixels created:', pixelsRef.current.length)

    const interval = 1000 / 60
    const maxTicker = 240 // Increased for fuller animation

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate)

      const now = performance.now()
      const diff = now - (lastTimeRef.current || 0)

      if (diff < interval) {
        return
      }

      lastTimeRef.current = now - (diff % interval)

      ctx.clearRect(0, 0, width, canvasHeight)

      // Control animation based on progress - simplified logic
      if (isActive && progress > 0.2) {
        // Show pixels when pulling - slower increment for fuller animation
        if (tickerRef.current < maxTicker) {
          animationDirectionRef.current = 1.5 // Faster show animation
        }
      } else {
        // Hide pixels when not active
        if (tickerRef.current > 0) {
          animationDirectionRef.current = -2 // Faster hide animation
        } else {
          animationDirectionRef.current = 0
        }
      }

      let allHidden = true

      pixelsRef.current.forEach((pixel) => {
        if (animationDirectionRef.current > 0) {
          pixel.show()
        } else if (animationDirectionRef.current < 0) {
          pixel.hide()
          allHidden = allHidden && pixel.isHidden
        }

        pixel.draw(ctx)
      })

      if (animationDirectionRef.current !== 0) {
        tickerRef.current += animationDirectionRef.current
        tickerRef.current = Math.max(0, Math.min(maxTicker, tickerRef.current))
      }
    }

    animate()

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [isActive, progress, height])

  return (
    <canvas
      ref={canvasRef}
      className="w-full block"
      style={{
        height: `${height}px`,
        display: 'block',
        backgroundColor: 'transparent'
      }}
    />
  )
}
