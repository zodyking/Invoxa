import { authOptions } from "@/lib/auth"
import NextAuth from "next-auth"
import { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"
import { getIpAddress, getIpGeolocation } from "@/lib/ip-utils"

const { handlers } = NextAuth(authOptions)

// Wrap POST handler to track IP addresses on successful login and store in JWT
export async function POST(request: NextRequest) {
  const response = await handlers.POST(request)
  
  // If login was successful, track IP address and update JWT token
  if (response.status === 200) {
    setImmediate(async () => {
      try {
        // Extract IP address from request (only public IPs)
        const ipAddress = getIpAddress(request)
        if (!ipAddress) {
          return
        }

        // Skip private IPs - we only want to track public IPs
        // Private IPs are tracked separately via client-side tracking
        if (ipAddress.startsWith("192.168.") || 
            ipAddress.startsWith("10.") || 
            ipAddress.startsWith("172.16.") ||
            ipAddress === "127.0.0.1" ||
            ipAddress === "::1") {
          console.log("Skipping private IP from server-side tracking:", ipAddress)
          return
        }

        // Get session token to find user ID
        const token = await getToken({
          req: request,
          secret: process.env.NEXTAUTH_SECRET,
        })

        if (!token?.id) {
          return
        }

        // Check IP status for this user
        const existingIp = await prisma.userIPAddress.findUnique({
          where: {
            userId_ipAddress: {
              userId: token.id as string,
              ipAddress,
            },
          },
        })

        // Determine IP status
        let ipStatus: "approved" | "banned" | "not_verified" = "not_verified"
        if (existingIp?.isBanned) {
          ipStatus = "banned"
        } else if (existingIp?.isApproved) {
          ipStatus = "approved"
        }

        // Get geolocation data
        const geoData = await getIpGeolocation(ipAddress)

        // Upsert IP address record
        await prisma.userIPAddress.upsert({
          where: {
            userId_ipAddress: {
              userId: token.id as string,
              ipAddress,
            },
          },
          create: {
            userId: token.id as string,
            ipAddress,
            country: geoData?.country || null,
            region: geoData?.region || null,
            city: geoData?.city || null,
            latitude: geoData?.latitude ? geoData.latitude : null,
            longitude: geoData?.longitude ? geoData.longitude : null,
            isp: geoData?.isp || null,
            lastSeenAt: new Date(),
          },
          update: {
            lastSeenAt: new Date(),
            // Update geolocation if it was missing
            ...(geoData && {
              country: geoData.country || undefined,
              region: geoData.region || undefined,
              city: geoData.city || undefined,
              latitude: geoData.latitude || undefined,
              longitude: geoData.longitude || undefined,
              isp: geoData.isp || undefined,
            }),
          },
        })

        console.log("IP address tracked:", ipAddress, "for user:", token.id, "Status:", ipStatus)
      } catch (error) {
        // Ignore errors in background IP tracking
        console.error("Error tracking IP address:", error)
      }
    })
  }
  
  return response
}

export const { GET } = handlers
