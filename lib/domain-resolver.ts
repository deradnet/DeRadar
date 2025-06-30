/**
 * Smart Ar.io Gateway Domain Resolution Utility with Session-Level Caching
 */

interface DomainTestResult {
  domain: string
  responseTime: number
  available: boolean
}

interface SessionCache {
  gatewayDomain?: string
  resolvedGraphQLUrl?: string
  resolvedDataUrl?: string
  testResults?: {
    graphql: DomainTestResult
    data: DomainTestResult
  }
  decision?: "gateway" | "fallback"
  timestamp?: number
}

// Session-level cache - persists until page reload/close
let sessionCache: SessionCache = {}

/**
 * Extract gateway domain from current hostname - ONCE per session
 */
function extractGatewayDomainOnce(): string {
  // Return cached result if already extracted
  if (sessionCache.gatewayDomain) {
    console.log(`📋 Using cached gateway domain: ${sessionCache.gatewayDomain}`)
    return sessionCache.gatewayDomain
  }

  const currentHostname = typeof window !== "undefined" ? window.location.hostname : "localhost"
  console.log(`🔍 Extracting gateway domain from: ${currentHostname} (ONCE)`)

  const parts = currentHostname.split(".")

  let gatewayDomain: string
  if (parts.length <= 2) {
    gatewayDomain = currentHostname
    console.log(`✅ Root domain detected: ${gatewayDomain}`)
  } else {
    gatewayDomain = parts.slice(1).join(".")
    console.log(`✅ Gateway domain extracted: ${gatewayDomain}`)
  }

  // Cache the result for the entire session
  sessionCache.gatewayDomain = gatewayDomain
  sessionCache.timestamp = Date.now()

  return gatewayDomain
}


function isArIoDomain(domain: string): boolean {
  return domain.endsWith(".ar.io") || domain === "ar.io"
}

/**
 * Test domain availability - ONCE per session
 */
async function testDomainOnce(domain: string): Promise<{ graphql: DomainTestResult; data: DomainTestResult }> {
  // Return cached results if already tested
  if (sessionCache.testResults) {
    console.log(`📋 Using cached test results for: ${domain}`)
    return sessionCache.testResults
  }

  console.log(`🧪 Testing domain: ${domain} (ONCE)`)

 
  if (isArIoDomain(domain)) {
    console.log(`⏭️ Skipping: ${domain}`)
    const failedResult = { domain, responseTime: 0, available: false }
    const results = { graphql: failedResult, data: failedResult }
    sessionCache.testResults = results
    return results
  }

  // Test both endpoints in parallel
  const [graphqlResult, dataResult] = await Promise.all([testGraphQLEndpoint(domain), testDataEndpoint(domain)])

  const results = { graphql: graphqlResult, data: dataResult }

  // Cache the results for the entire session
  sessionCache.testResults = results

  console.log(`✅ Test completed and cached for session:`)
  console.log(`   GraphQL: ${graphqlResult.available ? "✅" : "❌"} (${graphqlResult.responseTime}ms)`)
  console.log(`   Data: ${dataResult.available ? "✅" : "❌"} (${dataResult.responseTime}ms)`)

  return results
}

/**
 * Test GraphQL endpoint
 */
async function testGraphQLEndpoint(domain: string, timeout = 5000): Promise<DomainTestResult> {
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(`https://${domain}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `query { transactions(first: 1) { edges { node { id } } } }`,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    return {
      domain,
      responseTime,
      available: response.ok,
    }
  } catch (error) {
    return {
      domain,
      responseTime: Date.now() - startTime,
      available: false,
    }
  }
}

/**
 * Test data endpoint
 */
async function testDataEndpoint(domain: string, timeout = 5000): Promise<DomainTestResult> {
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(`https://${domain}`, {
      method: "HEAD",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    return {
      domain,
      responseTime,
      available: response.ok || response.status < 500,
    }
  } catch (error) {
    return {
      domain,
      responseTime: Date.now() - startTime,
      available: false,
    }
  }
}

async function makeDecisionOnce(): Promise<"gateway" | "fallback"> {
  // Return cached decision if already made
  if (sessionCache.decision) {
    console.log(`📋 Using cached decision: ${sessionCache.decision}`)
    return sessionCache.decision
  }

  console.log(`🎯 Making URL resolution decision (ONCE)`)

  const gatewayDomain = extractGatewayDomainOnce()

  // If ar.io domain, immediately decide fallback
  if (isArIoDomain(gatewayDomain)) {
    console.log(`⚡ Decision: fallback (ar.io domain)`)
    sessionCache.decision = "fallback"
    return "fallback"
  }

  // Test the domain once
  const testResults = await testDomainOnce(gatewayDomain)

  // Make decision based on test results
  const decision = testResults.graphql.available && testResults.data.available ? "gateway" : "fallback"

  console.log(
    `⚡ Decision: ${decision} (GraphQL: ${testResults.graphql.available}, Data: ${testResults.data.available})`,
  )

  // Cache the decision for the entire session
  sessionCache.decision = decision

  return decision
}


export async function resolveGraphQLUrl(url: string): Promise<string> {
  // If URL doesn't contain "gateway", return as-is
  if (!url.includes("gateway")) {
    console.log(`📋 Using specified GraphQL domain: ${url}`)
    return url
  }

  // Return cached URL if already resolved
  if (sessionCache.resolvedGraphQLUrl) {
    console.log(`📋 Using cached GraphQL URL: ${sessionCache.resolvedGraphQLUrl}`)
    return sessionCache.resolvedGraphQLUrl
  }

  console.log(`🎯 Resolving GraphQL URL (ONCE): ${url}`)

  const decision = await makeDecisionOnce()

  let resolvedUrl: string
  if (decision === "gateway") {
    const gatewayDomain = extractGatewayDomainOnce()
    resolvedUrl = url.replace(/gateway/g, gatewayDomain)
    console.log(`✅ Using gateway: ${resolvedUrl}`)
  } else {
    resolvedUrl = url.replace(/gateway/g, "derad.network")
    console.log(`🔄 Using fallback: ${resolvedUrl}`)
  }

  // Cache the resolved URL for the entire session
  sessionCache.resolvedGraphQLUrl = resolvedUrl

  return resolvedUrl
}

/**
 * Resolve Data URL - uses cached decision
 */
export async function resolveDataUrl(url: string): Promise<string> {
  // If URL doesn't contain "gateway", return as-is
  if (!url.includes("gateway")) {
    console.log(`📋 Using specified data domain: ${url}`)
    return url
  }

  // Return cached URL if already resolved
  if (sessionCache.resolvedDataUrl) {
    console.log(`📋 Using cached data URL: ${sessionCache.resolvedDataUrl}`)
    return sessionCache.resolvedDataUrl
  }

  console.log(`🎯 Resolving data URL (ONCE): ${url}`)

  const decision = await makeDecisionOnce()

  let resolvedUrl: string
  if (decision === "gateway") {
    const gatewayDomain = extractGatewayDomainOnce()
    resolvedUrl = url.replace(/gateway/g, gatewayDomain)
    console.log(`✅ Using gateway: ${resolvedUrl}`)
  } else {
    resolvedUrl = url.replace(/gateway/g, "derad.network")
    console.log(`🔄 Using fallback: ${resolvedUrl}`)
  }

  // Cache the resolved URL for the entire session
  sessionCache.resolvedDataUrl = resolvedUrl

  return resolvedUrl
}

/**
 * Legacy resolve URL function
 */
export async function resolveUrl(url: string): Promise<string> {
  return await resolveGraphQLUrl(url)
}

/**
 * Batch resolve multiple URLs
 */
export async function resolveUrls(urls: Record<string, string>): Promise<Record<string, string>> {
  const resolved: Record<string, string> = {}

  for (const [key, url] of Object.entries(urls)) {
    if (url.includes("gateway")) {
      if (key.toLowerCase().includes("graphql") || url.includes("/graphql")) {
        resolved[key] = await resolveGraphQLUrl(url)
      } else {
        resolved[key] = await resolveDataUrl(url)
      }
      console.log(`🎯 Resolved ${key}: ${url} → ${resolved[key]}`)
    } else {
      resolved[key] = url
      console.log(`📋 Using specified ${key}: ${url}`)
    }
  }

  return resolved
}

/**
 * Get current session info
 */
export function getGatewayInfo(): {
  currentHostname: string
  gatewayDomain: string | undefined
  isSubdomain: boolean
  subdomainLevel: number
  isArIo: boolean
  decision: "gateway" | "fallback" | "pending"
  resolvedUrls: {
    graphql?: string
    data?: string
  }
  sessionAge: number
  cached: boolean
} {
  const currentHostname = typeof window !== "undefined" ? window.location.hostname : "localhost"
  const parts = currentHostname.split(".")
  const gatewayDomain = sessionCache.gatewayDomain

  return {
    currentHostname,
    gatewayDomain,
    isSubdomain: parts.length > 2,
    subdomainLevel: Math.max(0, parts.length - 2),
    isArIo: gatewayDomain ? isArIoDomain(gatewayDomain) : false,
    decision: sessionCache.decision || "pending",
    resolvedUrls: {
      graphql: sessionCache.resolvedGraphQLUrl,
      data: sessionCache.resolvedDataUrl,
    },
    sessionAge: sessionCache.timestamp ? Date.now() - sessionCache.timestamp : 0,
    cached: !!sessionCache.gatewayDomain,
  }
}

/**
 * Get session cache status
 */
export function getSessionStatus(): {
  extracted: boolean
  tested: boolean
  decided: boolean
  resolved: {
    graphql: boolean
    data: boolean
  }
  cache: SessionCache
} {
  return {
    extracted: !!sessionCache.gatewayDomain,
    tested: !!sessionCache.testResults,
    decided: !!sessionCache.decision,
    resolved: {
      graphql: !!sessionCache.resolvedGraphQLUrl,
      data: !!sessionCache.resolvedDataUrl,
    },
    cache: { ...sessionCache },
  }
}

/**
 * Clear session cache (for testing only)
 */
export function clearSessionCache(): void {
  sessionCache = {}
  console.log("🧹 Cleared session cache")
}

/**
 * Debug session-based resolution
 */
export async function debugGatewayResolution(): Promise<void> {
  if (typeof window === "undefined") {
    console.log("🚫 Not running in browser environment")
    return
  }

  const info = getGatewayInfo()
  const status = getSessionStatus()

  console.group("🔍 Session-Based Gateway Resolution Debug")
  console.log("Current hostname:", info.currentHostname)
  console.log("Session age:", `${Math.round(info.sessionAge / 1000)}s`)
  console.log("Cache status:", {
    extracted: status.extracted,
    tested: status.tested,
    decided: status.decided,
    resolved: status.resolved,
  })

  if (info.gatewayDomain) {
    console.log("Gateway domain:", info.gatewayDomain)
    console.log("Is ar.io:", info.isArIo)
    console.log("Decision:", info.decision)
  }

  if (info.resolvedUrls.graphql || info.resolvedUrls.data) {
    console.log("Resolved URLs:", info.resolvedUrls)
  }

  // Test resolution (will use cache if available)
  console.log("\n📋 URL Resolution Test:")
  const graphqlUrl = await resolveGraphQLUrl("https://gateway/graphql")
  const dataUrl = await resolveDataUrl("https://gateway")
  console.log(`GraphQL: https://gateway/graphql → ${graphqlUrl}`)
  console.log(`Data: https://gateway → ${dataUrl}`)

  console.log("\n📊 Final Session Cache:", status.cache)
  console.groupEnd()
}

// Legacy exports for backward compatibility
export const extractGatewayDomain = extractGatewayDomainOnce
export const resolveGatewayDomain = extractGatewayDomainOnce
export const findBestGateway = extractGatewayDomainOnce
export const resolveArIOGateway = extractGatewayDomainOnce
export const smartResolveArIOGateway = extractGatewayDomainOnce
export const testDomain = testGraphQLEndpoint
