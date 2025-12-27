import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import type { Adapter } from "next-auth/adapters"
import { getIpAddress } from "@/lib/ip-utils"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("Auth: Missing credentials")
            return null
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              roles: {
                include: {
                  role: {
                    include: {
                      permissions: {
                        include: {
                          permission: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          })

          if (!user) {
            console.log("Auth: User not found for email:", credentials.email)
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.log("Auth: Invalid password for user:", user.email)
            return null
          }

          // Check user status - only prevent login if suspended
          // Inactive users can authenticate but will be redirected to activation page
          if (user.status === "suspended") {
            console.log("Auth: User is suspended:", user.email)
            return null
          }

          // Note: IP verification is handled in /api/auth/login route
          // This authorize function only validates credentials
          // The login route will check IP status and require verification if needed
          
          console.log("Auth: User authenticated successfully:", user.email, "Status:", user.status)
          
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            image: user.image,
            roles: user.roles.map((ur) => ur.role.name),
            status: user.status, // Include status in user object
          }
        } catch (error) {
          console.error("Authorization error:", error)
          // Log more details about the error
          if (error instanceof Error) {
            console.error("Error message:", error.message)
            console.error("Error stack:", error.stack)
          }
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signUp: "/signup",
    error: "/login",
  },
  events: {},
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.roles = (user as any).roles || []
        token.userStatus = (user as any).status || "active" // Store user status in token
        // IP address and status will be updated by proxy middleware on each request
        // to ensure real-time IP status checking
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.roles = (token.roles as string[]) || []
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

