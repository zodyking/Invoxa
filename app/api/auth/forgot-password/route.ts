import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import nodemailer from "nodemailer"
import { renderEmailTemplate } from "@/lib/email-template"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    // Return specific error if user not found
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check if user is active
    if (user.status !== "active") {
      return NextResponse.json(
        { error: "Account is not active. Please contact your administrator." },
        { status: 403 }
      )
    }

    // Get SMTP settings (same as test email route)
    const smtpSettings = await prisma.smtpSettings.findFirst()

    if (!smtpSettings) {
      return NextResponse.json(
        { error: "SMTP settings not configured. Please contact your administrator." },
        { status: 400 }
      )
    }

    if (!smtpSettings.passwordRef) {
      return NextResponse.json(
        { error: "SMTP password not set. Please contact your administrator." },
        { status: 400 }
      )
    }

    try {
      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString()

      // Store code in VerificationToken (expires in 15 minutes)
      const expires = new Date()
      expires.setMinutes(expires.getMinutes() + 15)

      // Delete any existing tokens for this email
      await prisma.verificationToken.deleteMany({
        where: {
          identifier: email.toLowerCase().trim(),
        },
      })

      // Create new token
      await prisma.verificationToken.create({
        data: {
          identifier: email.toLowerCase().trim(),
          token: code,
          expires,
        },
      })

      // Create transporter (same as test email route)
      const transporter = nodemailer.createTransport({
        host: smtpSettings.host,
        port: smtpSettings.port,
        secure: smtpSettings.encryption === "ssl", // true for 465, false for other ports
        auth: {
          user: smtpSettings.username,
          pass: smtpSettings.passwordRef,
        },
      })

      // Render email template from database
      const emailContent = await renderEmailTemplate("Password Verification", {
        code,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      })

      // Send email using template or fallback
      if (emailContent) {
        // Use template from database
        await transporter.sendMail({
          from: `"${smtpSettings.fromName}" <${smtpSettings.fromEmail}>`,
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
        })
      } else {
        // Fallback if template doesn't exist
        await transporter.sendMail({
          from: `"${smtpSettings.fromName}" <${smtpSettings.fromEmail}>`,
          to: user.email,
          subject: "Password Reset Verification Code",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Password Reset Verification</h2>
              <p>Hello ${user.firstName},</p>
              <p>You requested to reset your password. Use the following verification code:</p>
              <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
                <h1 style="font-size: 32px; letter-spacing: 5px; margin: 0; color: #333;">${code}</h1>
              </div>
              <p>This code will expire in 15 minutes.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
          `,
        })
      }
    } catch (error: any) {
      // Handle both database and email errors
      if (error.message?.includes("email") || error.message?.includes("SMTP") || error.message?.includes("sendMail")) {
        return NextResponse.json(
          { error: `Failed to send verification email: ${error.message}` },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { error: "Failed to process request. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Verification code has been sent to your email.",
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    )
  }
}

