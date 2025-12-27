import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWrapper } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"
import { generateDemoData } from "@/lib/demo-data"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionWrapper(request)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get current user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Generate demo data with current user
    const demoData = generateDemoData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
    })

    return NextResponse.json(demoData)
  } catch (error) {
    console.error("Demo data fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch demo data" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSessionWrapper(request)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { demoData } = body

    // In the future, we could store custom demo data in the database
    // For now, we'll just validate and return the updated data
    // This allows for custom demo data to be set per user

    return NextResponse.json({
      message: "Demo data updated successfully",
      demoData,
    })
  } catch (error) {
    console.error("Demo data update error:", error)
    return NextResponse.json(
      { error: "Failed to update demo data" },
      { status: 500 }
    )
  }
}






