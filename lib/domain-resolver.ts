/**
 * Smart Ar.io Gateway Domain Resolution Utility
 * Auto-detects gateway domain from current hostname or uses specified domain
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
 * Test domain availability and response time
 */
async function testDomain(domain: string, timeout = 5000): Promise<DomainTestResult> {
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
 * Resolve URL with smart gateway substitution
 * - If URL contains "gateway" → replace with auto-detected gateway domain
 * - If URL contains specific domain → use that domain as-is
 */
export async function resolveUrl(url: string): Promise<string> {
  // If URL doesn't contain "gateway", return as-is
  if (!url.includes("gateway")) {
    console.log(`📋 Using specified domain: ${url}`)
    return url
  }

  // Auto-detect gateway domain from current hostname
  const gatewayDomain = extractGatewayDomain()
  const resolvedUrl = url.replace(/gateway/g, gatewayDomain)

  console.log(`🎯 Resolved gateway URL: ${url} → ${resolvedUrl}`)
  return resolvedUrl
}

/**
 * Batch resolve multiple URLs
 */
export async function resolveUrls(urls: Record<string, string>): Promise<Record<string, string>> {
  const gatewayDomain = extractGatewayDomain()
  const resolved: Record<string, string> = {}

  for (const [key, url] of Object.entries(urls)) {
    if (url.includes("gateway")) {
      resolved[key] = url.replace(/gateway/g, gatewayDomain)
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
 * Test gateway availability
 */
export async function testGatewayAvailability(domain?: string): Promise<DomainTestResult> {
  const gatewayDomain = domain || extractGatewayDomain()
  console.log(`🧪 Testing gateway availability: ${gatewayDomain}`)

  return await testDomain(gatewayDomain, 5000)
}

/**
 * Get gateway status with detailed info
 */
export async function getGatewayStatus(): Promise<{
  info: ReturnType<typeof getGatewayInfo>
  availability: DomainTestResult
  resolvedUrls: {
    graphql: string
    data: string
  }
}> {
  const info = getGatewayInfo()
  const availability = await testGatewayAvailability()

  const resolvedUrls = {
    graphql: await resolveUrl("https://gateway/graphql"),
    data: await resolveUrl("https://gateway"),
  }

  return {
    info,
    availability,
    resolvedUrls,
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
 * Debug gateway resolution
 */
export function debugGatewayResolution(): void {
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

  // Test URL resolution
  const testUrls = ["https://gateway/graphql", "https://gateway/data", "https://specific-domain.com/api"]

  console.log("\n📋 URL Resolution Test:")
  testUrls.forEach(async (url) => {
    const resolved = await resolveUrl(url)
    console.log(`${url} → ${resolved}`)
  })

  console.groupEnd()
}

/**
 * Examples of how the gateway resolution works:
 *
 * Current hostname: map.example.com
 * Gateway domain: example.com
 *
 * Current hostname: map.gs.fh.s.example.com
 * Gateway domain: gs.fh.s.example.com
 *
 * Current hostname: app.data.api.mysite.com
 * Gateway domain: data.api.mysite.com
 *
 * URL: "https://gateway/graphql" → "https://example.com/graphql"
 * URL: "https://specific.com/api" → "https://specific.com/api" (unchanged)
 */

// Legacy exports for backward compatibility
export const resolveGatewayDomain = extractGatewayDomain
export const findBestGateway = extractGatewayDomain
export const resolveArIOGateway = extractGatewayDomain
export const smartResolveArIOGateway = extractGatewayDomain
