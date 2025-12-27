import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      )
    }

    // Find verification token
    const token = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email.toLowerCase().trim(),
          token: code,
        },
      },
    })

    if (!token) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (new Date() > token.expires) {
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: email.toLowerCase().trim(),
            token: code,
          },
        },
      })
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Return success (code is valid)
    return NextResponse.json({
      message: "Code verified successfully",
      email: user.email,
    })
  } catch (error) {
    console.error("Verify code error:", error)
    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 }
    )
  }
}




