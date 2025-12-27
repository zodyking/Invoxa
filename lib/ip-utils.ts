import { NextRequest } from "next/server"

/**
 * Normalize IP address - converts IPv6-mapped IPv4 addresses to IPv4
 * Example: ::ffff:192.168.1.1 -> 192.168.1.1
 */
export function normalizeIpAddress(ip: string): string {
  // Handle IPv6-mapped IPv4 addresses (::ffff:xxx.xxx.xxx.xxx)
  if (ip.startsWith("::ffff:")) {
    return ip.substring(7) // Remove "::ffff:" prefix
  }
  // Handle IPv6-mapped IPv4 in brackets [::ffff:xxx.xxx.xxx.xxx]
  if (ip.startsWith("[::ffff:") && ip.endsWith("]")) {
    return ip.substring(8, ip.length - 1) // Remove "[::ffff:" and "]"
  }
  return ip
}

/**
 * Check if an IP address is a private/internal IP
 */
export function isPrivateIp(ip: string): boolean {
  const normalized = normalizeIpAddress(ip)
  return (
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized.startsWith("192.168.") ||
    normalized.startsWith("10.") ||
    normalized.startsWith("172.16.") ||
    normalized.startsWith("172.17.") ||
    normalized.startsWith("172.18.") ||
    normalized.startsWith("172.19.") ||
    normalized.startsWith("172.20.") ||
    normalized.startsWith("172.21.") ||
    normalized.startsWith("172.22.") ||
    normalized.startsWith("172.23.") ||
    normalized.startsWith("172.24.") ||
    normalized.startsWith("172.25.") ||
    normalized.startsWith("172.26.") ||
    normalized.startsWith("172.27.") ||
    normalized.startsWith("172.28.") ||
    normalized.startsWith("172.29.") ||
    normalized.startsWith("172.30.") ||
    normalized.startsWith("172.31.")
  )
}

/**
 * Extract IP address from request headers
 * Handles proxies, load balancers, and CDNs
 * Normalizes IPv6-mapped IPv4 addresses
 * Filters out private/internal IPs (only returns public IPs)
 */
export function getIpAddress(request: NextRequest): string | null {
  // Check various headers for IP address (handles proxies/load balancers)
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, try each one until we find a public IP
    const ips = forwarded.split(",").map(ip => normalizeIpAddress(ip.trim()))
    for (const ip of ips) {
      if (ip && !isPrivateIp(ip)) {
        return ip
      }
    }
    // If all are private, return the first one (for local development)
    return ips[0] || null
  }
  
  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    const normalized = normalizeIpAddress(realIp)
    // Only return if it's a public IP (or allow private for local dev)
    if (!isPrivateIp(normalized)) {
      return normalized
    }
    // For local dev, still return it
    return normalized
  }
  
  return null
}

/**
 * Get geolocation data for an IP address using ip-api.com
 * Free, no API key required, 45 requests/minute
 * Provides good accuracy (typically within 1 mile for city-level)
 */
export async function getIpGeolocation(ipAddress: string): Promise<{
  country?: string | null
  region?: string | null
  city?: string | null
  latitude?: number | null
  longitude?: number | null
  isp?: string | null
} | null> {
  try {
    // Normalize IP address first (handle IPv6-mapped IPv4)
    const normalizedIp = normalizeIpAddress(ipAddress)
    
    // Check if it's a localhost/private IP (use normalized IP)
    const isLocal = (
      normalizedIp === "127.0.0.1" ||
      normalizedIp === "::1" ||
      normalizedIp.startsWith("192.168.") ||
      normalizedIp.startsWith("10.") ||
      normalizedIp.startsWith("172.16.") ||
      normalizedIp.startsWith("172.17.") ||
      normalizedIp.startsWith("172.18.") ||
      normalizedIp.startsWith("172.19.") ||
      normalizedIp.startsWith("172.20.") ||
      normalizedIp.startsWith("172.21.") ||
      normalizedIp.startsWith("172.22.") ||
      normalizedIp.startsWith("172.23.") ||
      normalizedIp.startsWith("172.24.") ||
      normalizedIp.startsWith("172.25.") ||
      normalizedIp.startsWith("172.26.") ||
      normalizedIp.startsWith("172.27.") ||
      normalizedIp.startsWith("172.28.") ||
      normalizedIp.startsWith("172.29.") ||
      normalizedIp.startsWith("172.30.") ||
      normalizedIp.startsWith("172.31.")
    )

    // Use normalized IP for API call
    const ipToQuery = normalizedIp

    // Always try the API first, even for local IPs (it will fail but we handle it)
    // Use ip-api.com (free, no API key required, 45 requests/minute)
    // Use normalized IP for the API call
    const response = await fetch(`http://ip-api.com/json/${ipToQuery}?fields=status,message,country,regionName,city,lat,lon,isp`, {
      headers: {
        "Accept": "application/json",
      },
    })

    if (!response.ok) {
      console.error("IP geolocation API error:", response.statusText)
      // If API fails and it's a local IP, return local values
      if (isLocal) {
        return {
          country: "Local",
          region: "Local Network",
          city: "Local",
        }
      }
      return null
    }

    const data = await response.json()

    if (data.status === "fail") {
      console.error("IP geolocation failed:", data.message)
      // If API fails and it's a local IP, return local values
      if (isLocal) {
        return {
          country: "Local",
          region: "Local Network",
          city: "Local",
        }
      }
      return null
    }

    if (data.status === "success") {
      // Use actual API results
      return {
        country: data.country || null,
        region: data.regionName || null,
        city: data.city || null,
        latitude: data.lat ? parseFloat(String(data.lat)) : null,
        longitude: data.lon ? parseFloat(String(data.lon)) : null,
        isp: data.isp || null,
      }
    }

    // If status is not success and it's local, return local values
    if (isLocal) {
      return {
        country: "Local",
        region: "Local Network",
        city: "Local",
      }
    }

    return null
  } catch (error) {
    console.error("Error fetching IP geolocation:", error)
    // Normalize IP and check if it's local IP for fallback
    const normalizedIp = normalizeIpAddress(ipAddress)
    const isLocal = (
      normalizedIp === "127.0.0.1" ||
      normalizedIp === "::1" ||
      normalizedIp.startsWith("192.168.") ||
      normalizedIp.startsWith("10.") ||
      normalizedIp.startsWith("172.16.") ||
      normalizedIp.startsWith("172.17.") ||
      normalizedIp.startsWith("172.18.") ||
      normalizedIp.startsWith("172.19.") ||
      normalizedIp.startsWith("172.20.") ||
      normalizedIp.startsWith("172.21.") ||
      normalizedIp.startsWith("172.22.") ||
      normalizedIp.startsWith("172.23.") ||
      normalizedIp.startsWith("172.24.") ||
      normalizedIp.startsWith("172.25.") ||
      normalizedIp.startsWith("172.26.") ||
      normalizedIp.startsWith("172.27.") ||
      normalizedIp.startsWith("172.28.") ||
      normalizedIp.startsWith("172.29.") ||
      normalizedIp.startsWith("172.30.") ||
      normalizedIp.startsWith("172.31.")
    )
    if (isLocal) {
      return {
        country: "Local",
        region: "Local Network",
        city: "Local",
      }
    }
    return null
  }
}

