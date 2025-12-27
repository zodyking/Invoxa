import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWrapper } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionWrapper(request)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const roles = await prisma.role.findMany({
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(roles)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch roles" },
      { status: 500 }
    )
  }
}




