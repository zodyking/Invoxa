import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow access to auth pages and API routes (must be first check)
  // API routes should always be accessible regardless of user status
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/verify-code") ||
    pathname.startsWith("/verify-login") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/activation-pending") ||
    pathname.startsWith("/suspended") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/branding") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|webp|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next()
  }

  // Check for authentication token
  let token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // If no token and trying to access protected route, redirect to login
  if (!token || !token.id) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Get and normalize current IP address
  const currentIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
                   request.headers.get("x-real-ip") ||
                   request.ip ||
                   null
  const normalizedCurrentIp = currentIp?.startsWith("::ffff:") 
    ? currentIp.substring(7) 
    : currentIp

  // Check user's current status from database (not cached in token)
  // This ensures we always have the latest status even if it was changed by an admin
  try {
    const user = await prisma.user.findUnique({
      where: { id: token.id as string },
    })

    const userStatus = user?.status || (token.userStatus as string) || "active"

    // Check IP address status for this user
    // Note: We use client-side IP tracking for the public IP
    // Server-side IP might be private/internal, so we check both
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
                     request.headers.get("x-real-ip") ||
                     request.ip ||
                     null

    if (ipAddress && user) {
      // Normalize IP address (handle IPv6-mapped IPv4)
      const normalizedIp = ipAddress.startsWith("::ffff:") 
        ? ipAddress.substring(7) 
        : ipAddress

      // Skip private IPs - we only check public IPs for ban/revoke status
      // Private IPs are tracked separately but don't need ban checking
      const isPrivate = normalizedIp.startsWith("192.168.") || 
                       normalizedIp.startsWith("10.") || 
                       normalizedIp.startsWith("172.16.") ||
                       normalizedIp === "127.0.0.1" ||
                       normalizedIp === "::1"
      
      if (isPrivate) {
        // For private IPs, skip ban checking - rely on client-side public IP tracking
        // Continue with other checks (user status, etc.)
      } else {

      // Get IP status from database
      const userIp = await prisma.userIPAddress.findUnique({
        where: {
          userId_ipAddress: {
            userId: user.id,
            ipAddress: normalizedIp,
          },
        },
      })

      // Check if IP is banned - sign out immediately
      if (userIp?.isBanned) {
        console.log("Access denied: Banned IP address", normalizedIp, "for user:", user.id)
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("error", "BannedIP")
        loginUrl.searchParams.set("message", "Your IP address has been banned")
        // Clear session cookie
        const response = NextResponse.redirect(loginUrl)
        response.cookies.delete("next-auth.session-token")
        response.cookies.delete("__Secure-next-auth.session-token")
        return response
      }

      // If IP was revoked or doesn't exist, allow access but they'll need to verify on next login
      // We don't sign them out immediately - they can continue using the app
      // But on their next login attempt, they'll need to verify again
      const tokenIp = token.ipAddress as string | undefined
      const tokenIpStatus = token.ipStatus as "approved" | "banned" | "not_verified" | undefined
      
      if (tokenIp === normalizedIp && tokenIpStatus === "approved" && !userIp?.isApproved) {
        // IP was revoked - log it but don't sign out
        // They'll need to verify on next login
        console.log("IP address revoked for user:", user.id, "IP:", normalizedIp, "- will require verification on next login")
        // Continue with request - don't block access
      }
      }
    }

    // If user is suspended, redirect to suspended page
    if (pathname !== "/suspended" && userStatus === "suspended") {
      return NextResponse.redirect(new URL("/suspended", request.url))
    }

    // If user is inactive, redirect to activation pending page
    if (pathname !== "/activation-pending" && userStatus === "inactive") {
      return NextResponse.redirect(new URL("/activation-pending", request.url))
    }

    // If user is active but on activation-pending or suspended page, redirect to dashboard
    if ((pathname === "/activation-pending" || pathname === "/suspended") && userStatus === "active") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  } catch (error) {
    // If database check fails, fall back to token status
    const tokenStatus = (token.userStatus as string) || "active"
    if (pathname !== "/suspended" && tokenStatus === "suspended") {
      return NextResponse.redirect(new URL("/suspended", request.url))
    }
    if (pathname !== "/activation-pending" && tokenStatus === "inactive") {
      return NextResponse.redirect(new URL("/activation-pending", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
