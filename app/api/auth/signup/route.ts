import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import nodemailer from "nodemailer"
import { renderEmailTemplate } from "@/lib/email-template"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, password, role } = body

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "First name, last name, email, and password are required" },
        { status: 400 }
      )
    }

    if (!role) {
      return NextResponse.json(
        { error: "Role is required" },
        { status: 400 }
      )
    }

    // Validate role selection - only allow specific roles at signup
    const allowedRoles = ["Customer Service", "Mechanic", "Accountant"]
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role selected. Only Customer Service, Mechanic, and Accountant roles can be assigned at signup." },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Find the role
    const userRole = await prisma.role.findUnique({
      where: { name: role },
    })

    if (!userRole) {
      return NextResponse.json(
        { error: `Role "${role}" not found. Please contact an administrator.` },
        { status: 400 }
      )
    }

    // Store plain password for email (before hashing)
    const plainPassword = password

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user with role assignment (inactive by default - requires admin activation)
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        status: "inactive", // New users are inactive until activated by administrator
        roles: {
          create: {
            roleId: userRole.id,
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

    // Send welcome email with credentials
    try {
      const smtpSettings = await prisma.smtpSettings.findFirst()

      if (smtpSettings && smtpSettings.passwordRef) {
        const transporter = nodemailer.createTransport({
          host: smtpSettings.host,
          port: smtpSettings.port,
          secure: smtpSettings.encryption === "ssl",
          auth: {
            user: smtpSettings.username,
            pass: smtpSettings.passwordRef,
          },
        })

        const baseUrl = process.env.NEXTAUTH_URL || request.headers.get("origin") || "http://localhost:3000"
        const loginUrl = `${baseUrl}/login`

        // Render email template
        const emailContent = await renderEmailTemplate("User Signup", {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          password: plainPassword, // Plain password for email
          loginUrl,
        })

        if (emailContent) {
          await transporter.sendMail({
            from: `"${smtpSettings.fromName}" <${smtpSettings.fromEmail}>`,
            to: user.email,
            subject: emailContent.subject,
            html: emailContent.html,
          })
        }
      }
    } catch (emailError) {
      // Don't fail the signup if email fails, just log it
      console.error("Failed to send welcome email:", emailError)
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        userId: user.id,
        role: user.roles[0]?.role.name,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    )
  }
}
