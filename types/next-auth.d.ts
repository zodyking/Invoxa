import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string | null
      roles: string[]
    }
  }

  interface User {
    id: string
    email: string
    name: string
    image?: string | null
    roles: string[]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    roles: string[]
    userStatus?: string
    sessionCreated?: number
    activeLoginId?: string
    ipAddress?: string
    ipStatus?: "approved" | "banned" | "not_verified"
  }
}




