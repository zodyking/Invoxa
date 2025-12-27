import { getToken } from "next-auth/jwt"
import { NextRequest } from "next/server"

export async function getServerSessionWrapper(request?: NextRequest) {
  try {
    if (!request) {
      return null
    }

    const token = await getToken({
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token || !token.id) {
      return null
    }

    return {
      user: {
        id: token.id as string,
        email: token.email as string,
        name: token.name as string,
        image: token.picture as string | null,
        roles: (token.roles as string[]) || [],
      },
    }
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}

