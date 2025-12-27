import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code, newPassword, confirmPassword } = body

    if (!email || !code || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Verify code again
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

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    })

    // Delete used token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email.toLowerCase().trim(),
          token: code,
        },
      },
    })

    return NextResponse.json({
      message: "Password reset successfully",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    )
  }
}




