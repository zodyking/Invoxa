import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWrapper } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"
import nodemailer from "nodemailer"
import { renderEmailTemplate } from "@/lib/email-template"
import bcrypt from "bcryptjs"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSessionWrapper(request)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email, firstName, lastName, roleId } = body

    if (!email || !firstName || !lastName || !roleId) {
      return NextResponse.json(
        { error: "Email, first name, last name, and role are required" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Get role
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    })

    if (!role) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      )
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(12).toString("base64").slice(0, 12)
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    // Create user with inactive status (they need to accept invitation)
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        status: "inactive", // Will be activated when they accept invitation
        roles: {
          create: {
            roleId: role.id,
          },
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    // Store invitation token
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: invitationToken,
        expires: expiresAt,
      },
    })

    // Get SMTP settings
    const smtpSettings = await prisma.smtpSettings.findFirst()

    if (!smtpSettings || !smtpSettings.passwordRef) {
      return NextResponse.json(
        { error: "SMTP settings not configured. Please configure SMTP settings first." },
        { status: 400 }
      )
    }

    // Get shop profile for email
    const shopProfile = await prisma.shopProfile.findFirst()
    const shopName = shopProfile?.shopName || "Invoxa"

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpSettings.host,
      port: smtpSettings.port,
      secure: smtpSettings.encryption === "ssl",
      auth: {
        user: smtpSettings.username,
        pass: smtpSettings.passwordRef,
      },
    })

    // Build invitation link
    const baseUrl = process.env.NEXTAUTH_URL || request.headers.get("origin") || "http://localhost:3000"
    const invitationLink = `${baseUrl}/accept-invitation?token=${invitationToken}&email=${encodeURIComponent(user.email)}`

    // Render email template
    const emailContent = await renderEmailTemplate("User Invitation", {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: role.name,
      shopName,
      invitationLink,
    })

    // Send invitation email
    if (emailContent) {
      await transporter.sendMail({
        from: `"${smtpSettings.fromName}" <${smtpSettings.fromEmail}>`,
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
      })
    } else {
      // Fallback email
      await transporter.sendMail({
        from: `"${smtpSettings.fromName}" <${smtpSettings.fromEmail}>`,
        to: user.email,
        subject: `You've been invited to join ${shopName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>You've Been Invited!</h2>
            <p>Hello ${user.firstName},</p>
            <p>You have been invited to join <strong>${shopName}</strong> as a <strong>${role.name}</strong>.</p>
            <p>To get started, please click the link below to set up your account:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationLink}" style="background-color: #2c3e50; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a>
            </div>
            <p style="color: #666; font-size: 14px;">This invitation link will expire in 7 days.</p>
          </div>
        `,
      })
    }

    return NextResponse.json({
      message: "User invitation sent successfully",
      userId: user.id,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to send user invitation" },
      { status: 500 }
    )
  }
}




