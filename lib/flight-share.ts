import type { SelectedFlight } from "@/types/aircraft"
import type { ColorPalette } from "@/components/share-preview-modal"

export interface FlightShareOptions {
  flight: SelectedFlight
  includeImage?: boolean
  colorPalette?: ColorPalette
}

/**
 * Generate a shareable PNG image for a flight
 * Creates a cool branded card with flight details
 */
export async function generateFlightShareImage(
  options: FlightShareOptions
): Promise<Blob> {
  const { flight, colorPalette } = options

  // Default color palette (purple-blue)
  const colors = colorPalette || {
    gradient: { start: "#0f0c29", mid: "#302b63", end: "#24243e" },
    accent: "#3b82f6"
  }

  // Create canvas
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  // Canvas dimensions (larger for better readability on small screens)
  const width = 1200
  const height = 1600  // Taller for better layout
  canvas.width = width
  canvas.height = height

  // Modern gradient background with depth
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, colors.gradient.start)
  gradient.addColorStop(0.4, colors.gradient.mid)
  gradient.addColorStop(1, colors.gradient.end)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Soft radial overlay for depth - positioned higher
  const radialGlow = ctx.createRadialGradient(width / 2, height * 0.25, 0, width / 2, height * 0.25, width * 0.9)
  radialGlow.addColorStop(0, 'rgba(255, 255, 255, 0.04)')
  radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0.25)')
  ctx.fillStyle = radialGlow
  ctx.fillRect(0, 0, width, height)

  // Draw aircraft SVG from ADSB2PNG
  let hasAircraftImage = false
  if (flight.lat && flight.lng) {
    try {
      console.log('Generating aircraft SVG for location:', flight.lat, flight.lng)

      // Determine aircraft type based on available info
      let aircraftType = 'airliner' // default
      if (flight.type) {
        const typeUpper = flight.type.toUpperCase()
        if (typeUpper.includes('HELI') || typeUpper.includes('H-') || typeUpper.includes('EC') && typeUpper.length <= 4) {
          aircraftType = 'helicopter'
        } else if (typeUpper.includes('B7') || typeUpper.includes('A3') || typeUpper.includes('B77') || typeUpper.includes('A388')) {
          aircraftType = 'airliner'
        } else if (typeUpper.includes('C1') || typeUpper.includes('GLF') || typeUpper.includes('CL6')) {
          aircraftType = 'bizjet'
        }
      }

      // Use DeRadar SVG API to get aircraft SVG
      const svgUrl = `https://svg-api.deradar.app/?location=${flight.lat},${flight.lng}&type=${aircraftType}&heading=${flight.heading}`

      console.log('Fetching aircraft SVG from:', svgUrl)

      const response = await fetch(svgUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch aircraft SVG: ${response.status}`)
      }

      const svgText = await response.text()
      console.log('Aircraft SVG fetched, length:', svgText.length)

      // Convert SVG to image
      const svgBlob = new Blob([svgText], { type: 'image/svg+xml' })
      const svgObjectUrl = URL.createObjectURL(svgBlob)
      const img = new Image()

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error('SVG image load timeout after 10s')
          URL.revokeObjectURL(svgObjectUrl)
          reject(new Error('SVG image load timeout'))
        }, 10000) // 10 second timeout

        img.onload = () => {
          clearTimeout(timeout)
          console.log('SVG image loaded successfully:', img.width, 'x', img.height)
          resolve()
        }
        img.onerror = (e) => {
          clearTimeout(timeout)
          console.error('SVG image load error:', e)
          URL.revokeObjectURL(svgObjectUrl)
          reject(new Error('Failed to load SVG image'))
        }
        img.src = svgObjectUrl
      })

      // Aircraft image - Apple-style rounded card with subtle shadow
      const imgPadding = 50
      const imgWidth = width - (imgPadding * 2)
      const imgHeight = 420
      const imgX = imgPadding
      const imgY = 70
      const borderRadius = 28

      ctx.save()

      // Soft shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 40
      ctx.shadowOffsetY = 20

      // Draw rounded rectangle for image container
      roundRect(ctx, imgX, imgY, imgWidth, imgHeight, borderRadius)
      ctx.clip()

      // Center and scale the image to cover
      const scale = Math.max(imgWidth / img.width, imgHeight / img.height)
      const scaledWidth = img.width * scale
      const scaledHeight = img.height * scale
      const offsetX = imgX + (imgWidth - scaledWidth) / 2
      const offsetY = imgY + (imgHeight - scaledHeight) / 2

      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight)

      ctx.restore()

      // Subtle border with accent color
      ctx.save()
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.strokeStyle = `${colors.accent}40`
      ctx.lineWidth = 1
      roundRect(ctx, imgX, imgY, imgWidth, imgHeight, borderRadius, false, true)
      ctx.restore()

      // Clean up
      URL.revokeObjectURL(svgObjectUrl)

      hasAircraftImage = true
      console.log('Aircraft SVG drawn successfully')
    } catch (error) {
      console.error('Failed to load aircraft SVG for canvas:', error)
    }
  }

  // Clean modern design with proper spacing
  let currentY = hasAircraftImage ? 550 : 100

  // Flight callsign/registration - Large, clean title
  const mainTitle = flight.callsign || flight.registration || flight.hex
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 120px -apple-system, SF Pro Display, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(mainTitle, width / 2, currentY)

  currentY += 85

  // Aircraft type - clean subtitle
  if (flight.type && flight.type !== "Unknown") {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '500 40px -apple-system, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(flight.type, width / 2, currentY)
    currentY += 70
  } else {
    currentY += 40
  }

  // Emergency badge if applicable - centered
  if (flight.status === "Emergency") {
    const badgeWidth = 280
    const badgeHeight = 60
    const badgeX = (width - badgeWidth) / 2

    ctx.fillStyle = '#ef4444'
    roundRect(ctx, badgeX, currentY - 50, badgeWidth, badgeHeight, 30, true, false)

    ctx.fillStyle = '#ffffff'
    ctx.font = '700 28px -apple-system, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('⚠ EMERGENCY', width / 2, currentY - 14)
    currentY += 40
  }

  // Stats - clean 3-column grid
  const statsY = currentY
  const statBoxWidth = 340
  const statBoxHeight = 180
  const statSpacing = 30
  const totalStatsWidth = (statBoxWidth * 3) + (statSpacing * 2)
  const statsStartX = (width - totalStatsWidth) / 2

  // Altitude card
  drawAppleStatCard(
    ctx,
    statsStartX,
    statsY,
    statBoxWidth,
    statBoxHeight,
    'Altitude',
    flight.altitude > 0 ? flight.altitude.toLocaleString() : 'Ground',
    flight.altitude > 0 ? 'ft' : '',
    colors.accent
  )

  // Speed card
  drawAppleStatCard(
    ctx,
    statsStartX + statBoxWidth + statSpacing,
    statsY,
    statBoxWidth,
    statBoxHeight,
    'Speed',
    `${flight.speed}`,
    'kts',
    colors.accent
  )

  // Heading card
  drawAppleStatCard(
    ctx,
    statsStartX + (statBoxWidth + statSpacing) * 2,
    statsY,
    statBoxWidth,
    statBoxHeight,
    'Heading',
    `${flight.heading}°`,
    '',
    colors.accent
  )

  currentY = statsY + statBoxHeight + 60

  // Info section - clean centered list with separator lines
  const infoBoxWidth = 1000
  const infoBoxX = (width - infoBoxWidth) / 2

  const drawInfoRow = (label: string, value: string, isLast: boolean = false) => {
    // Label on left
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.font = '500 36px -apple-system, system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(label, infoBoxX, currentY)

    // Value on right
    ctx.fillStyle = '#ffffff'
    ctx.font = '600 36px -apple-system, system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(value, infoBoxX + infoBoxWidth, currentY)

    currentY += 65

    // Separator line
    if (!isLast) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(infoBoxX, currentY - 32)
      ctx.lineTo(infoBoxX + infoBoxWidth, currentY - 32)
      ctx.stroke()
    }
  }

  // Collect all info rows to determine which is last
  const infoRows: Array<{ label: string; value: string }> = []
  infoRows.push({ label: 'ICAO', value: flight.hex.toUpperCase() })
  if (flight.registration) {
    infoRows.push({ label: 'Registration', value: flight.registration })
  }
  if (flight.squawk && flight.squawk !== "N/A") {
    infoRows.push({ label: 'Squawk', value: flight.squawk })
  }

  // Query Derad Network for proof of track
  let proofOfTrackId: string | null = null
  if (flight.callsign) {
    try {
      // Trim callsign to remove trailing spaces
      const trimmedCallsign = flight.callsign.trim()
      console.log('Querying Derad Network for callsign:', trimmedCallsign)

      const graphqlQuery = {
        query: `{
          transactions(
            first: 1
            tags: [
              { name: "App-Name", values: ["DeradNetworkBackup"] }
              { name: "Callsign", values: ["${trimmedCallsign}"] }
            ]
          ) {
            edges {
              cursor
              node {
                id
                owner {
                  address
                }
              }
            }
          }
        }`
      }

      console.log('GraphQL query:', JSON.stringify(graphqlQuery, null, 2))

      const response = await fetch('https://derad.network/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(graphqlQuery),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      console.log('Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('GraphQL response:', JSON.stringify(data, null, 2))

        if (data?.data?.transactions?.edges?.length > 0) {
          proofOfTrackId = data.data.transactions.edges[0].node.id
          console.log('Found proof of track ID:', proofOfTrackId)
        } else {
          console.log('No transactions found for callsign:', flight.callsign)
        }
      } else {
        console.error('GraphQL request failed with status:', response.status)
        const errorText = await response.text()
        console.error('Error response:', errorText)
      }
    } catch (error) {
      console.error('Failed to fetch proof of track:', error)
    }
  } else {
    console.log('No callsign available for proof of track query')
  }

  // Add proof of track if found
  if (proofOfTrackId) {
    console.log('Adding proof of track to image:', proofOfTrackId)
    infoRows.push({ label: 'Proof of Track', value: proofOfTrackId.substring(0, 20) + '...' })
  } else {
    console.log('No proof of track ID to display')
  }

  // Draw all info rows
  infoRows.forEach((row, index) => {
    drawInfoRow(row.label, row.value, index === infoRows.length - 1)
  })

  currentY += 20

  // Timestamp below info rows
  const currentTime = new Date()
  const timeString = currentTime.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.font = '400 28px -apple-system, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(timeString, width / 2, currentY)

  currentY += 60

  // Footer - clean branding
  const footerY = currentY

  // DeRadar branding centered
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 52px -apple-system, SF Pro Display, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('DeRadar', width / 2, footerY + 60)

  // Tagline
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.font = '400 28px -apple-system, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Decentralized Aircraft Tracking', width / 2, footerY + 98)

  // Powered by section with logos
  const poweredByY = footerY + 138

  // "Powered by" text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.font = '400 24px -apple-system, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Powered by', width / 2, poweredByY)

  // Load and draw logos
  try {
    // Load Derad Network logo
    const deradLogo = new Image()
    const deradLogoPromise = new Promise<void>((resolve, reject) => {
      deradLogo.onload = () => resolve()
      deradLogo.onerror = () => reject(new Error('Failed to load Derad logo'))
      deradLogo.src = '/derad-network-logo.png'
    })

    // Load AR.IO logo
    const arIoLogo = new Image()
    const arIoLogoPromise = new Promise<void>((resolve, reject) => {
      arIoLogo.onload = () => resolve()
      arIoLogo.onerror = () => reject(new Error('Failed to load AR.IO logo'))
      arIoLogo.src = '/ar-io-logo.svg'
    })

    await Promise.all([deradLogoPromise, arIoLogoPromise])

    // Draw logos centered below "Powered by" text (larger for readability)
    const logoY = poweredByY + 18
    const deradLogoHeight = 56 // Derad logo larger
    const arIoLogoHeight = 36
    const logoSpacing = 36

    // Calculate Derad logo dimensions (maintain aspect ratio)
    const deradScale = deradLogoHeight / deradLogo.height
    const deradWidth = deradLogo.width * deradScale

    // Calculate AR.IO logo dimensions (maintain aspect ratio)
    const arIoScale = arIoLogoHeight / arIoLogo.height
    const arIoWidth = arIoLogo.width * arIoScale

    // Total width of both logos plus spacing
    const totalWidth = deradWidth + logoSpacing + arIoWidth
    const startX = (width - totalWidth) / 2

    // Draw Derad Network logo (50px, centered vertically with AR.IO)
    const deradY = logoY - (deradLogoHeight - arIoLogoHeight) / 2
    ctx.drawImage(deradLogo, startX, deradY, deradWidth, deradLogoHeight)

    // Draw AR.IO logo
    ctx.drawImage(arIoLogo, startX + deradWidth + logoSpacing, logoY, arIoWidth, arIoLogoHeight)
  } catch (error) {
    console.error('Failed to load logos for share image:', error)
    // Fallback text if logos fail to load
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.font = '400 14px -apple-system, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Derad Network & AR.IO', width / 2, poweredByY + 30)
  }

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create blob'))
        }
      },
      'image/png',
      1.0
    )
  })
}

// Helper function to draw Apple-style stat cards
function drawAppleStatCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string,
  unit: string,
  accentColor: string
) {
  ctx.save()

  // Soft shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
  ctx.shadowBlur = 25
  ctx.shadowOffsetY = 10

  // Card background with subtle gradient
  const cardGradient = ctx.createLinearGradient(x, y, x, y + height)
  cardGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)')
  cardGradient.addColorStop(1, 'rgba(255, 255, 255, 0.04)')
  ctx.fillStyle = cardGradient
  roundRect(ctx, x, y, width, height, 22, true, false)

  // Reset shadow
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0

  // Subtle border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
  ctx.lineWidth = 1.5
  roundRect(ctx, x, y, width, height, 22, false, true)

  // Label - extra large for mobile readability, centered
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.font = '500 28px -apple-system, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(label, x + width / 2, y + 50)

  // Value - extra large, bold, highly readable, centered
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 60px -apple-system, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(value, x + width / 2, y + 110)

  // Unit - larger, accent colored, centered
  if (unit) {
    ctx.fillStyle = accentColor
    ctx.font = '600 28px -apple-system, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(unit, x + width / 2, y + 144)
  }

  ctx.restore()
}

// Helper function to draw rounded rectangles
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: boolean = false,
  stroke: boolean = false
) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
  if (fill) ctx.fill()
  if (stroke) ctx.stroke()
}

/**
 * Share flight info using native share dialog
 */
export async function shareFlightInfo(
  flight: SelectedFlight,
  colorPalette?: ColorPalette
): Promise<boolean> {
  try {
    console.log('1. Starting shareFlightInfo')
    console.log('Flight data:', flight)
    console.log('Color palette:', colorPalette)

    // Generate share image
    console.log('2. Generating share image...')
    const imageBlob = await generateFlightShareImage({
      flight,
      colorPalette,
    })
    console.log('3. Image generated, size:', imageBlob.size)

    // Create file from blob
    const fileName = `deradar-${flight.callsign || flight.hex}-${Date.now()}.png`
    const file = new File([imageBlob], fileName, { type: 'image/png' })
    console.log('4. File created:', fileName)

    // Prepare share text
    const shareText = generateShareText(flight)
    console.log('5. Share text:', shareText)

    // Check if running on native platform
    const isNative = typeof (window as any).Capacitor !== 'undefined'
    console.log('6. Is native platform:', isNative)

    if (isNative) {
      // Use Capacitor Share plugin for native sharing
      try {
        console.log('7. Loading Capacitor plugins...')
        const { Share } = await import('@capacitor/share')
        const { Filesystem, Directory } = await import('@capacitor/filesystem')
        console.log('8. Plugins loaded')

        // Convert blob to base64 (without data URI prefix)
        console.log('9. Converting to base64...')
        const base64Data = await blobToBase64(imageBlob)
        // Remove the data URI prefix (data:image/png;base64,)
        const base64 = base64Data.split(',')[1]
        console.log('10. Base64 length:', base64.length)

        // Save to cache directory
        console.log('11. Saving to filesystem...')
        const result = await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Cache,
        })
        console.log('12. File saved at:', result.uri)

        // Share the file
        console.log('13. Calling Share.share()...')
        await Share.share({
          title: `${flight.callsign || flight.registration || flight.hex} - DeRadar`,
          text: shareText,
          url: result.uri,
          dialogTitle: 'Share Flight Info',
        })
        console.log('14. Share completed successfully')

        // Clean up the file after sharing
        try {
          await Filesystem.deleteFile({
            path: fileName,
            directory: Directory.Cache,
          })
          console.log('15. Temporary file cleaned up')
        } catch (cleanupError) {
          console.log('File cleanup failed (non-critical):', cleanupError)
        }

        return true
      } catch (e) {
        console.error('Native share failed:', e)
        console.log('Falling back to download')
        // Fallback to download
        downloadBlob(imageBlob, fileName)
        return true
      }
    } else {
      // Use Web Share API for web
      console.log('7. Using Web Share API')
      if (navigator.share && navigator.canShare({ files: [file] })) {
        console.log('8. Web Share API supported, sharing...')
        await navigator.share({
          title: `${flight.callsign || flight.registration || flight.hex} - DeRadar`,
          text: shareText,
          files: [file],
        })
        console.log('9. Share completed')
        return true
      } else {
        // Fallback: download the image
        console.log('8. Web Share API not supported, downloading...')
        downloadBlob(imageBlob, fileName)
        return true
      }
    }
  } catch (error) {
    console.error('Share failed with error:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    throw error // Re-throw to show in alert
  }
}

// Helper to generate share text
function generateShareText(flight: SelectedFlight): string {
  const parts = [
    `✈️ ${flight.callsign || flight.registration || flight.hex}`,
  ]

  if (flight.type && flight.type !== "Unknown") {
    parts.push(`Aircraft: ${flight.type}`)
  }

  if (flight.altitude > 0) {
    parts.push(`Altitude: ${flight.altitude.toLocaleString()} ft (FL${Math.round(flight.altitude / 100)})`)
  } else {
    parts.push('Altitude: Ground Level')
  }

  parts.push(`Speed: ${flight.speed} kts`)
  parts.push(`Heading: ${flight.heading}°`)
  parts.push(`\nTracked via DeRadar - Decentralized Aircraft Tracking`)
  parts.push(`Powered by Derad Network, AR.IO & Arweave`)

  return parts.join('\n')
}

// Helper to convert blob to base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert blob to base64'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Helper to download blob
function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
