import { ArconnectSigner, TurboFactory } from "@ardrive/turbo-sdk/web"
import { analytics } from "./analytics"
import { resolveUrl } from "./domain-resolver"
import { APP_CONFIG } from "@/config/app.config"

export interface SnapshotData {
  timestamp: string
  aircraft: any[]
  metadata: {
    totalAircraft: number
    captureTime: string
    version: string
    source: string
  }
}

export interface UploadProgress {
  totalBytes: number
  processedBytes: number
  step: "signing" | "uploading"
  percentComplete: number
}

export interface UploadResult {
  id: string
  url: string
  size: number
  timestamp: string
}

export interface UserTransaction {
  id: string
  timestamp: string
  tags: { name: string; value: string }[]
  dataSize?: number
  appName?: string
  aircraftCount?: number
}

export interface TransactionHistory {
  transactions: UserTransaction[]
  totalCount: number
  hasNextPage: boolean
}

export class ArweaveSnapshotService {
  private signer: ArconnectSigner | null = null
  private turbo: any = null
  private isConnected = false

  async connectWallet(): Promise<boolean> {
    try {
      // Check if wallet extension is available
      if (!window.arweaveWallet) {
        throw new Error("Wallet extension not found. Please install a compatible wallet extension.")
      }

      // Connect to wallet with all required permissions including SIGNATURE
      await window.arweaveWallet.connect(["ACCESS_ADDRESS", "SIGN_TRANSACTION", "ACCESS_PUBLIC_KEY", "SIGNATURE"])

      // Create signer and turbo client
      this.signer = new ArconnectSigner(window.arweaveWallet)
      this.turbo = TurboFactory.authenticated({ signer: this.signer })

      this.isConnected = true

      analytics.trackEvent("Arweave Wallet Connected", {
        wallet_type: "Wallet",
      })

      return true
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      analytics.trackError("Wallet connection failed", "Wallet")
      throw error
    }
  }

  async disconnectWallet(): Promise<void> {
    try {
      if (window.arweaveWallet) {
        await window.arweaveWallet.disconnect()
      }
      this.signer = null
      this.turbo = null
      this.isConnected = false

      analytics.trackEvent("Arweave Wallet Disconnected")
    } catch (error) {
      console.error("Failed to disconnect wallet:", error)
    }
  }

  async getWalletAddress(): Promise<string | null> {
    try {
      if (window?.arweaveWallet?.getActiveAddress) {
        return await window.arweaveWallet.getActiveAddress()
      }
      return null
    } catch (error) {
      console.error("Failed to get wallet address:", error)
      return null
    }
  }

  async createSnapshot(aircraftData: any[]): Promise<SnapshotData> {
    const timestamp = new Date().toISOString()

    const snapshot: SnapshotData = {
      timestamp,
      aircraft: aircraftData,
      metadata: {
        totalAircraft: aircraftData.length,
        captureTime: timestamp,
        version: "1.0.0",
        source: "ADS-B Tracker",
      },
    }

    analytics.trackEvent("Snapshot Created", {
      aircraft_count: aircraftData.length,
      snapshot_size: JSON.stringify(snapshot).length,
    })

    return snapshot
  }

  async uploadSnapshot(
    snapshot: SnapshotData,
    onProgress?: (progress: UploadProgress) => void,
    onError?: (error: string) => void,
  ): Promise<UploadResult> {
    if (!this.turbo) throw new Error("Wallet not connected")

    try {
      const jsonData = JSON.stringify(snapshot, null, 2)
      const dataSize = new Blob([jsonData]).size

      // Create a File object from the JSON data
      const file = new File([jsonData], `aircraft-snapshot-${Date.now()}.json`, {
        type: "application/json",
      })

      analytics.trackEvent("Snapshot Upload Started", {
        data_size: dataSize,
        aircraft_count: snapshot.aircraft.length,
      })

      const result = await this.turbo.uploadFile({
        file,
        dataItemOpts: {
          tags: [
            { name: "Content-Type", value: "application/json" },
            { name: "App-Name", value: "DeRadar" },
            { name: "App-Version", value: "1.0.0" },
            { name: "Data-Type", value: "user-aircraft-snapshot" },
            { name: "Timestamp", value: snapshot.timestamp },
            { name: "Aircraft-Count", value: snapshot.metadata.totalAircraft.toString() },
          ],
        },
        events: {
          onSigningSuccess: () => {
            onProgress?.({
              totalBytes: dataSize,
              processedBytes: 0,
              step: "signing",
              percentComplete: 25,
            })
          },
          onUploadSuccess: () => {
            onProgress?.({
              totalBytes: dataSize,
              processedBytes: dataSize,
              step: "uploading",
              percentComplete: 100,
            })
            analytics.trackEvent("Snapshot Upload Success", {
              data_size: dataSize,
              aircraft_count: snapshot.aircraft.length,
            })
          },
          onUploadError: (err) => {
            const errorMessage = err instanceof Error ? err.message : String(err)
            analytics.trackError("Snapshot upload failed", errorMessage)
            onError?.(errorMessage)
          },
        },
      })

      const uploadResult: UploadResult = {
        id: result.id,
        url: `https://derad.network/${result.id}`,
        size: dataSize,
        timestamp: snapshot.timestamp,
      }

      return uploadResult
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      analytics.trackError("Snapshot upload error", errorMessage)
      throw new Error(errorMessage)
    }
  }

  isWalletConnected(): boolean {
    return this.isConnected && this.signer !== null
  }

  async estimateUploadCost(dataSize: number): Promise<number> {
    if (!this.turbo) return 0

    try {
      const [uploadCost] = await this.turbo.getUploadCosts({ bytes: [dataSize] })
      return uploadCost.winc
    } catch (error) {
      console.error("Failed to estimate upload cost:", error)
      return 0
    }
  }

  async getUserTransactions(limit = 5): Promise<TransactionHistory> {
    try {
      const walletAddress = await this.getWalletAddress()
      if (!walletAddress) {
        throw new Error("No wallet address available")
      }

      // First query to get total count
      const countQuery = `
        query {
          transactions(
            owners: ["${walletAddress}"]
            tags: [{ name: "App-Name", values: ["DeRadar"] }]
          ) {
            pageInfo {
              hasNextPage
            }
          }
        }
      `

      // Main query to get recent transactions
      const transactionsQuery = `
        query {
          transactions(
            first: ${limit}
            owners: ["${walletAddress}"]
            tags: [{ name: "App-Name", values: ["DeRadar"] }]
            sort: HEIGHT_DESC
          ) {
            edges {
              node {
                id
                tags {
                  name
                  value
                }
                data {
                  size
                }
                block {
                  timestamp
                }
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      `

      // Use gateway resolution like historical data
      const graphqlUrl = await resolveUrl(APP_CONFIG.api.historical.graphqlUrl)

      // Get recent transactions
      const response = await fetch(graphqlUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: transactionsQuery }),
      })

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.status}`)
      }

      const result = await response.json()

      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(", ")}`)
      }

      // Process transactions
      const transactions: UserTransaction[] = result.data.transactions.edges.map((edge: any) => {
        const node = edge.node
        const tags = node.tags || []

        // Extract relevant tag values
        const timestampTag = tags.find((tag: any) => tag.name === "Timestamp")
        const aircraftCountTag = tags.find((tag: any) => tag.name === "Aircraft-Count")
        const appNameTag = tags.find((tag: any) => tag.name === "App-Name")

        return {
          id: node.id,
          timestamp:
            timestampTag?.value || (node.block?.timestamp ? new Date(node.block.timestamp * 1000).toISOString() : ""),
          tags: tags,
          dataSize: node.data?.size || 0,
          appName: appNameTag?.value || "",
          aircraftCount: aircraftCountTag ? Number.parseInt(aircraftCountTag.value, 10) : 0,
        }
      })

      // Get total count by fetching all transactions (we'll estimate based on pagination)
      let totalCount = transactions.length
      if (result.data.transactions.pageInfo.hasNextPage) {
        // For now, we'll estimate. In a real app, you might want to do a separate count query
        totalCount = Math.max(limit, transactions.length + 10) // Conservative estimate
      }

      return {
        transactions,
        totalCount,
        hasNextPage: result.data.transactions.pageInfo.hasNextPage,
      }
    } catch (error) {
      console.error("Failed to fetch user transactions:", error)
      return {
        transactions: [],
        totalCount: 0,
        hasNextPage: false,
      }
    }
  }
}

// Singleton instance
export const arweaveSnapshot = new ArweaveSnapshotService()
