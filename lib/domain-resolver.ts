/**
 * Smart Ar.io Gateway Domain Resolution Utility with Fallback
 * Auto-detects gateway domain from current hostname with fallback to derad.network
 */

interface DomainTestResult {
  domain: string
  responseTime: number
  available: boolean
}

/**
 * Extract gateway domain from current hostname
 * Rules:
 * - example.com → example.com
 * - map.example.com → example.com
 * - Gateway domain is everything after the first subdomain
 */
export function extractGatewayDomain(hostname?: string): string {
  // Use current hostname if not provided
  const currentHostname = hostname || (typeof window !== "undefined" ? window.location.hostname : "localhost")

  console.log(`🔍 Extracting gateway domain from: ${currentHostname}`)

  // Split hostname into parts
  const parts = currentHostname.split(".")

  // If only domain (no subdomains), return as-is
  if (parts.length <= 2) {
    console.log(`✅ Root domain detected: ${currentHostname}`)
    return currentHostname
  }

  // Remove first subdomain, keep the rest as gateway domain
  const gatewayDomain = parts.slice(1).join(".")
  console.log(`✅ Gateway domain extracted: ${gatewayDomain}`)

  return gatewayDomain
}

/**
 * Test domain availability and response time for GraphQL endpoint
 */
async function testGraphQLEndpoint(domain: string, timeout = 5000): Promise<DomainTestResult> {
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    // Test with GraphQL endpoint
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
 * Test domain availability for data endpoint
 */
async function testDataEndpoint(domain: string, timeout = 5000): Promise<DomainTestResult> {
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    // Test with a simple HEAD request to check if domain responds
    const response = await fetch(`https://${domain}`, {
      method: "HEAD",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    return {
      domain,
      responseTime,
      available: response.ok || response.status < 500, // Accept redirects and client errors, but not server errors
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
 * Resolve GraphQL URL with smart gateway substitution and fallback
 * - If URL contains "gateway" → replace with auto-detected gateway domain
 * - Test if GraphQL endpoint is available
 * - If not available, fallback to derad.network
 * - If URL contains specific domain → use that domain as-is
 */
export async function resolveGraphQLUrl(url: string): Promise<string> {
  // If URL doesn't contain "gateway", return as-is
  if (!url.includes("gateway")) {
    console.log(`📋 Using specified GraphQL domain: ${url}`)
    return url
  }

  // Auto-detect gateway domain from current hostname
  const gatewayDomain = extractGatewayDomain()
  const resolvedUrl = url.replace(/gateway/g, gatewayDomain)

  console.log(`🎯 Testing GraphQL URL: ${resolvedUrl}`)

  // Test if the resolved gateway has GraphQL endpoint
  const testResult = await testGraphQLEndpoint(gatewayDomain, 5000)

  if (testResult.available) {
    console.log(`✅ GraphQL endpoint available on ${gatewayDomain} (${testResult.responseTime}ms)`)
    return resolvedUrl
  } else {
    console.log(`❌ GraphQL endpoint not available on ${gatewayDomain}, falling back to derad.network`)
    const fallbackUrl = url.replace(/gateway/g, "derad.network")
    console.log(`🔄 Fallback GraphQL URL: ${fallbackUrl}`)
    return fallbackUrl
  }
}

/**
 * Resolve Data URL with smart gateway substitution and fallback
 * - If URL contains "gateway" → replace with auto-detected gateway domain
 * - Test if data endpoint is available
 * - If not available, fallback to derad.network
 * - If URL contains specific domain → use that domain as-is
 */
export async function resolveDataUrl(url: string): Promise<string> {
  // If URL doesn't contain "gateway", return as-is
  if (!url.includes("gateway")) {
    console.log(`📋 Using specified data domain: ${url}`)
    return url
  }

  // Auto-detect gateway domain from current hostname
  const gatewayDomain = extractGatewayDomain()
  const resolvedUrl = url.replace(/gateway/g, gatewayDomain)

  console.log(`🎯 Testing data URL: ${resolvedUrl}`)

  // Test if the resolved gateway has data endpoint
  const testResult = await testDataEndpoint(gatewayDomain, 5000)

  if (testResult.available) {
    console.log(`✅ Data endpoint available on ${gatewayDomain} (${testResult.responseTime}ms)`)
    return resolvedUrl
  } else {
    console.log(`❌ Data endpoint not available on ${gatewayDomain}, falling back to derad.network`)
    const fallbackUrl = url.replace(/gateway/g, "derad.network")
    console.log(`🔄 Fallback data URL: ${fallbackUrl}`)
    return fallbackUrl
  }
}

/**
 * Legacy resolve URL function - now uses GraphQL resolver by default
 * @deprecated Use resolveGraphQLUrl or resolveDataUrl instead
 */
export async function resolveUrl(url: string): Promise<string> {
  return await resolveGraphQLUrl(url)
}

/**
 * Batch resolve multiple URLs with smart fallback
 */
export async function resolveUrls(urls: Record<string, string>): Promise<Record<string, string>> {
  const resolved: Record<string, string> = {}

  for (const [key, url] of Object.entries(urls)) {
    if (url.includes("gateway")) {
      // Determine if this is a GraphQL or data URL based on the key or URL content
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
 * Get current gateway domain info
 */
export function getGatewayInfo(): {
  currentHostname: string
  gatewayDomain: string
  isSubdomain: boolean
  subdomainLevel: number
} {
  const currentHostname = typeof window !== "undefined" ? window.location.hostname : "localhost"
  const gatewayDomain = extractGatewayDomain(currentHostname)
  const parts = currentHostname.split(".")

  return {
    currentHostname,
    gatewayDomain,
    isSubdomain: parts.length > 2,
    subdomainLevel: Math.max(0, parts.length - 2),
  }
}

/**
 * Test gateway availability for both GraphQL and data endpoints
 */
export async function testGatewayAvailability(domain?: string): Promise<{
  domain: string
  graphql: DomainTestResult
  data: DomainTestResult
  overall: boolean
}> {
  const gatewayDomain = domain || extractGatewayDomain()
  console.log(`🧪 Testing gateway availability: ${gatewayDomain}`)

  const [graphqlResult, dataResult] = await Promise.all([
    testGraphQLEndpoint(gatewayDomain),
    testDataEndpoint(gatewayDomain),
  ])

  return {
    domain: gatewayDomain,
    graphql: graphqlResult,
    data: dataResult,
    overall: graphqlResult.available && dataResult.available,
  }
}

/**
 * Get gateway status with detailed info and fallback recommendations
 */
export async function getGatewayStatus(): Promise<{
  info: ReturnType<typeof getGatewayInfo>
  availability: Awaited<ReturnType<typeof testGatewayAvailability>>
  resolvedUrls: {
    graphql: string
    data: string
  }
  recommendations: string[]
}> {
  const info = getGatewayInfo()
  const availability = await testGatewayAvailability()

  const resolvedUrls = {
    graphql: await resolveGraphQLUrl("https://gateway/graphql"),
    data: await resolveDataUrl("https://gateway"),
  }

  const recommendations: string[] = []

  if (!availability.graphql.available) {
    recommendations.push("GraphQL endpoint not available - using derad.network fallback")
  }

  if (!availability.data.available) {
    recommendations.push("Data endpoint not available - using derad.network fallback")
  }

  if (availability.overall) {
    recommendations.push("All endpoints available - using detected gateway")
  }

  return {
    info,
    availability,
    resolvedUrls,
    recommendations,
  }
}

/**
 * Validate gateway domain format
 */
export function validateGatewayDomain(domain: string): {
  isValid: boolean
  issues: string[]
} {
  const issues: string[] = []

  // Check basic format
  if (!domain || domain.trim() === "") {
    issues.push("Domain is empty")
  }

  // Check for valid domain format
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?)*$/
  if (!domainRegex.test(domain)) {
    issues.push("Invalid domain format")
  }

  // Check for localhost or IP (might be development)
  if (domain === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
    issues.push("Using localhost or IP address (development mode?)")
  }

  return {
    isValid: issues.length === 0,
    issues,
  }
}

/**
 * Debug gateway resolution with fallback testing
 */
export async function debugGatewayResolution(): Promise<void> {
  if (typeof window === "undefined") {
    console.log("🚫 Not running in browser environment")
    return
  }

  const info = getGatewayInfo()

  console.group("🔍 Gateway Resolution Debug")
  console.log("Current hostname:", info.currentHostname)
  console.log("Gateway domain:", info.gatewayDomain)
  console.log("Is subdomain:", info.isSubdomain)
  console.log("Subdomain level:", info.subdomainLevel)

  // Test URL resolution with fallback
  const testUrls = [
    { url: "https://gateway/graphql", type: "GraphQL" },
    { url: "https://gateway", type: "Data" },
    { url: "https://specific-domain.com/api", type: "Specific" },
  ]

  console.log("\n📋 URL Resolution Test with Fallback:")
  for (const { url, type } of testUrls) {
    if (type === "GraphQL") {
      const resolved = await resolveGraphQLUrl(url)
      console.log(`${url} → ${resolved}`)
    } else if (type === "Data") {
      const resolved = await resolveDataUrl(url)
      console.log(`${url} → ${resolved}`)
    } else {
      console.log(`${url} → ${url} (unchanged)`)
    }
  }

  // Test gateway availability
  console.log("\n🧪 Gateway Availability Test:")
  const availability = await testGatewayAvailability()
  console.log("GraphQL available:", availability.graphql.available, `(${availability.graphql.responseTime}ms)`)
  console.log("Data available:", availability.data.available, `(${availability.data.responseTime}ms)`)
  console.log("Overall status:", availability.overall ? "✅ Available" : "❌ Fallback required")

  console.groupEnd()
}

// Legacy exports for backward compatibility
export const resolveGatewayDomain = extractGatewayDomain
export const findBestGateway = extractGatewayDomain
export const resolveArIOGateway = extractGatewayDomain
export const smartResolveArIOGateway = extractGatewayDomain

// Legacy testDomain function
export const testDomain = testGraphQLEndpoint
