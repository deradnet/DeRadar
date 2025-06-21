"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Wallet,
  Upload,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Loader2,
  Database,
  Clock,
  FileText,
  History,
  LinkIcon,
  X,
} from "lucide-react"
import {
  arweaveSnapshot,
  type UploadProgress,
  type UploadResult,
  type TransactionHistory,
} from "@/lib/arweave-snapshot"
import { analytics } from "@/lib/analytics"
import Image from "next/image"

interface ArweaveSnapshotPanelProps {
  aircraftData?: any[]
  isVisible: boolean
  onClose: () => void
}

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error"
type UploadStatus = "idle" | "creating" | "uploading" | "success" | "error"

export function ArweaveSnapshotPanel({ aircraftData = [], isVisible, onClose }: ArweaveSnapshotPanelProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected")
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle")
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [estimatedCost, setEstimatedCost] = useState<number>(0)
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistory | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)

  // Check if mobile on mount (we will need to test wallet connection on mobile)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const connectWallet = useCallback(async () => {
    setConnectionStatus("connecting")
    setError(null)

    try {
      await arweaveSnapshot.connectWallet()
      const address = await arweaveSnapshot.getWalletAddress()

      setWalletAddress(address)
      setConnectionStatus("connected")

      // Load transaction history after successful connection
      await loadTransactionHistory()

      analytics.trackEvent("Arweave Panel Wallet Connected")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      setConnectionStatus("error")
    }
  }, [])

  const disconnectWallet = useCallback(async () => {
    try {
      await arweaveSnapshot.disconnectWallet()
      setConnectionStatus("disconnected")
      setWalletAddress(null)
      setUploadResult(null)
      setError(null)
      setTransactionHistory(null)

      analytics.trackEvent("Arweave Panel Wallet Disconnected")
    } catch (err) {
      console.error("Failed to disconnect wallet:", err)
    }
  }, [])

  const createAndUploadSnapshot = useCallback(async () => {
    if (!window.arweaveWallet) {
      setError("Please install wallet extension!")
      return
    }

    // Check if we need to reconnect with proper permissions
    if (!arweaveSnapshot.isWalletConnected()) {
      try {
        setConnectionStatus("connecting")
        await arweaveSnapshot.connectWallet()
        const address = await arweaveSnapshot.getWalletAddress()
        setWalletAddress(address)
        setConnectionStatus("connected")
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(`Failed to connect wallet: ${errorMessage}`)
        setConnectionStatus("error")
        return
      }
    }

    setUploadStatus("creating")
    setError(null)
    setUploadProgress(null)

    try {
      // Create snapshot
      const snapshot = await arweaveSnapshot.createSnapshot(aircraftData)

      setUploadStatus("uploading")

      // Upload to Arweave using the simplified approach
      const result = await arweaveSnapshot.uploadSnapshot(
        snapshot,
        (progress) => {
          setUploadProgress(progress)
        },
        (errorMessage) => {
          setError(errorMessage)
          setUploadStatus("error")
        },
      )

      setUploadResult(result)
      setUploadStatus("success")
      setUploadProgress(null)

      // Refresh transaction history
      try {
        await loadTransactionHistory()
      } catch (historyErr) {
        console.warn("Failed to refresh transaction history:", historyErr)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      setUploadStatus("error")
      setUploadProgress(null)
    }
  }, [aircraftData])

  // Estimate upload cost when aircraft data changes
  useEffect(() => {
    if (aircraftData.length > 0 && connectionStatus === "connected") {
      const estimateSize = new Blob([
        JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            aircraft: aircraftData,
            metadata: {
              totalAircraft: aircraftData.length,
              captureTime: new Date().toISOString(),
              version: "1.0.0",
              source: "ADS-B Tracker",
            },
          },
          null,
          2,
        ),
      ]).size
      arweaveSnapshot
        .estimateUploadCost(estimateSize)
        .then(setEstimatedCost)
        .catch(() => {
          setEstimatedCost(0)
        })
    }
  }, [aircraftData, connectionStatus])

  const loadTransactionHistory = useCallback(async () => {
    if (!arweaveSnapshot.isWalletConnected()) return

    setLoadingHistory(true)
    try {
      const history = await arweaveSnapshot.getUserTransactions(5)
      setTransactionHistory(history)
    } catch (error) {
      console.error("Failed to load transaction history:", error)
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  // Check wallet connection on mount and load transaction history
  useEffect(() => {
    if (arweaveSnapshot.isWalletConnected()) {
      setConnectionStatus("connected")
      arweaveSnapshot
        .getWalletAddress()
        .then(setWalletAddress)
        .catch(() => setWalletAddress(null))

      // Load transaction history
      loadTransactionHistory()
    }
  }, [loadTransactionHistory])

  // Close panel when clicking outside (desktop only)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isMobile && panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [isVisible, onClose, isMobile])

  if (!isVisible) return null

  const formatWinc = (winc: number) => {
    return (winc / 1e12).toFixed(6) // Convert Winston to AR
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatTransactionTime = (timestamp: string) => {
    if (!timestamp) return "Unknown"
    try {
      const date = new Date(timestamp)
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch {
      return "Invalid date"
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm">
      <div
        ref={panelRef}
        className={`fixed ${
          isMobile
            ? "inset-0 bg-slate-950"
            : "right-0 top-0 h-full w-full max-w-md bg-slate-900/95 border-l border-slate-700/50 backdrop-blur-xl"
        } overflow-y-auto`}
      >
        <div className={`${isMobile ? "p-4" : "p-6"} space-y-6`}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-orange-400" />
              <h2 className={`${isMobile ? "text-lg" : "text-xl"} font-bold text-white`}>Arweave Snapshot</h2>
            </div>
            <Button size="sm" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Disclaimer */}
          <Card className="bg-amber-900/20 border-amber-500/30">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-sm font-medium text-amber-300">Early Development Notice</div>
                  <div className="text-xs text-amber-200/80">
                    This feature is still in early development. Use at your own risk. Always verify transactions before
                    confirming.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Connection */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-white">
                <Wallet className="w-4 h-4 text-blue-400" />
                Wallet Connection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {connectionStatus === "disconnected" && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-300">
                    Connect your wallet to upload aircraft data snapshots to the permanent Arweave network.
                  </p>
                  <Button onClick={connectWallet} className="w-full bg-blue-600 hover:bg-blue-700 h-12">
                    <Image
                      src="/images/wander-connect-logo-white.png"
                      alt="Connect Wallet"
                      width={120}
                      height={32}
                      className="object-contain"
                      unoptimized
                      priority
                    />
                  </Button>
                </div>
              )}

              {connectionStatus === "connecting" && (
                <div className="flex items-center gap-2 text-blue-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Connecting to wallet...</span>
                </div>
              )}

              {connectionStatus === "connected" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                    <Button size="sm" variant="outline" onClick={disconnectWallet}>
                      Disconnect
                    </Button>
                  </div>

                  {walletAddress && (
                    <div className="text-xs text-slate-400">
                      <div className="font-medium">Address:</div>
                      <div className="font-mono break-all">{walletAddress}</div>
                    </div>
                  )}
                </div>
              )}

              {connectionStatus === "error" && error && (
                <div className="flex items-start gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">{error}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Snapshot Info */}
          {connectionStatus === "connected" && (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="w-4 h-4 text-green-400" />
                  Snapshot Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-400">Aircraft Count</div>
                    <div className="text-white font-medium">{aircraftData.length.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Data Size</div>
                    <div className="text-white font-medium">
                      {formatBytes(
                        new Blob([
                          JSON.stringify(
                            {
                              timestamp: new Date().toISOString(),
                              aircraft: aircraftData,
                              metadata: {
                                totalAircraft: aircraftData.length,
                                captureTime: new Date().toISOString(),
                                version: "1.0.0",
                                source: "ADS-B Tracker",
                              },
                            },
                            null,
                            2,
                          ),
                        ]).size,
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Estimated Cost</div>
                    <div className="text-white font-medium">{formatWinc(estimatedCost)} AR</div>
                  </div>
                  {new Blob([
                    JSON.stringify(
                      {
                        timestamp: new Date().toISOString(),
                        aircraft: aircraftData,
                        metadata: {
                          totalAircraft: aircraftData.length,
                          captureTime: new Date().toISOString(),
                          version: "1.0.0",
                          source: "ADS-B Tracker",
                        },
                      },
                      null,
                      2,
                    ),
                  ]).size <
                    100 * 1024 && (
                    <div className="col-span-2 text-xs text-green-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Free upload (under 100KB)
                    </div>
                  )}
                  <div>
                    <div className="text-slate-400">Timestamp (UTC)</div>
                    <div className="text-white font-medium">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date()
                        .toISOString()
                        .replace("T", " ")
                        .replace(/\.\d{3}Z$/, " UTC")}
                    </div>
                  </div>
                </div>

                {aircraftData.length === 0 && (
                  <div className="text-sm text-amber-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    No aircraft data available to snapshot
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upload Section */}
          {connectionStatus === "connected" && aircraftData.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Upload className="w-4 h-4 text-purple-400" />
                  Upload Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {uploadStatus === "idle" && (
                  <Button onClick={createAndUploadSnapshot} className="w-full bg-purple-600 hover:bg-purple-700">
                    <Upload className="w-4 h-4 mr-2" />
                    Create & Upload Snapshot
                  </Button>
                )}

                {(uploadStatus === "creating" || uploadStatus === "uploading") && !uploadProgress && (
                  <div className="flex items-center gap-2 text-blue-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Preparing upload...</span>
                  </div>
                )}

                {uploadStatus === "creating" && (
                  <div className="flex items-center gap-2 text-blue-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Creating snapshot...</span>
                  </div>
                )}

                {uploadStatus === "uploading" && uploadProgress && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300 flex items-center gap-2">
                        {uploadProgress.step === "signing" ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            ✍️ Signing transaction...
                          </>
                        ) : (
                          "📤 Uploading..."
                        )}
                      </span>
                      <span className="text-slate-400">{uploadProgress.percentComplete}%</span>
                    </div>
                    <Progress value={uploadProgress.percentComplete} className="h-2" />
                    <div className="text-xs text-slate-500">
                      {formatBytes(uploadProgress.processedBytes)} / {formatBytes(uploadProgress.totalBytes)}
                    </div>
                  </div>
                )}

                {uploadStatus === "success" && uploadResult && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">🎉 Upload successful!</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="text-slate-400">Transaction ID:</div>
                        <div className="font-mono text-slate-300 break-all">{uploadResult.id}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Size:</div>
                        <div className="text-slate-300">{formatBytes(uploadResult.size)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Uploaded (UTC):</div>
                        <div className="text-slate-300">
                          {new Date(uploadResult.timestamp)
                            .toISOString()
                            .replace("T", " ")
                            .replace(/\.\d{3}Z$/, " UTC")}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(uploadResult.url, "_blank")}
                        className="flex-1"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View on Arweave
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setUploadStatus("idle")
                          setUploadResult(null)
                        }}
                        className="flex-1"
                      >
                        Upload Another
                      </Button>
                    </div>
                  </div>
                )}

                {uploadStatus === "error" && error && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 text-red-400">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">❌ {error}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setUploadStatus("idle")
                        setError(null)
                      }}
                      className="w-full"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Transaction History */}
          {connectionStatus === "connected" && (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-cyan-400" />
                    Transaction History
                  </div>
                  {transactionHistory && (
                    <Badge variant="outline" className="text-cyan-400 border-cyan-400">
                      {transactionHistory.totalCount} total
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingHistory && (
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading transaction history...</span>
                  </div>
                )}

                {!loadingHistory && transactionHistory && transactionHistory.transactions.length === 0 && (
                  <div className="text-sm text-slate-400 text-center py-4">No previous snapshots found</div>
                )}

                {!loadingHistory && transactionHistory && transactionHistory.transactions.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-slate-400 mb-3">Recent snapshots (last 5)</div>
                    {transactionHistory.transactions.map((tx) => (
                      <div key={tx.id} className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-slate-300 font-mono">
                            {tx.id.substring(0, 8)}...{tx.id.substring(-8)}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(`https://derad.network/${tx.id}`, "_blank")}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                          >
                            <LinkIcon className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <div className="text-slate-400">Aircraft</div>
                            <div className="text-white">{tx.aircraftCount?.toLocaleString() || "N/A"}</div>
                          </div>
                          <div>
                            <div className="text-slate-400">Size</div>
                            <div className="text-white">{formatBytes(tx.dataSize || 0)}</div>
                          </div>
                        </div>

                        <div className="text-xs">
                          <div className="text-slate-400">Uploaded</div>
                          <div className="text-slate-300">{formatTransactionTime(tx.timestamp)}</div>
                        </div>
                      </div>
                    ))}

                    {transactionHistory.hasNextPage && (
                      <div className="text-xs text-slate-400 text-center pt-2">+ more transactions available</div>
                    )}
                  </div>
                )}

                {!loadingHistory && !transactionHistory && (
                  <div className="text-sm text-slate-400 text-center py-4">Failed to load transaction history</div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Info */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="pt-6">
              <div className="text-xs text-slate-400 space-y-2">
                <div className="font-medium text-slate-300">About Arweave Snapshots</div>
                <div>
                  This feature allows you to take a snapshot of real-time air traffic data and permanently save it to
                  the Arweave network. Snapshots create an immutable record of aircraft positions, flight paths, and
                  metadata at a specific point in time, preserving this information forever on the decentralized web.
                </div>
                <div>
                  We use ArDrive Turbo for fast, reliable uploads to Arweave, ensuring your aviation data snapshots are
                  stored permanently and can be accessed by researchers, analysts, and aviation enthusiasts worldwide
                  for historical tracking and analysis.
                </div>
                <div className="pt-2 space-y-1">
                  <div>
                    <a
                      href="https://arweave.org?ref=derad"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Learn more about Arweave →
                    </a>
                  </div>
                  <div>
                    <a
                      href="https://docs.ardrive.io/docs/turbo/what-is-turbo.html?ref=derad"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Learn more about ArDrive Turbo →
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
