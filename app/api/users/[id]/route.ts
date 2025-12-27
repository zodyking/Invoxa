import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWrapper } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"
import nodemailer from "nodemailer"
import { renderEmailTemplate } from "@/lib/email-template"
import bcrypt from "bcryptjs"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionWrapper(request)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch user" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionWrapper(request)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { firstName, lastName, email, status, roleIds, password, sendEmail, suspensionReason } = body

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Track changes
    const changes: {
      basicInfo: string[]
      password: string | null
      role: { old: string; new: string } | null
      status: { old: string; new: string } | null
    } = {
      basicInfo: [],
      password: null,
      role: null,
      status: null,
    }

    // Check if email is being changed and if it's already taken
    if (email && email.toLowerCase().trim() !== currentUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        )
      }
    }

    // Track basic info changes
    if (firstName !== undefined && firstName !== currentUser.firstName) {
      changes.basicInfo.push(`First name: "${currentUser.firstName}" → "${firstName}"`)
    }
    if (lastName !== undefined && lastName !== currentUser.lastName) {
      changes.basicInfo.push(`Last name: "${currentUser.lastName}" → "${lastName}"`)
    }
    if (email !== undefined && email.toLowerCase().trim() !== currentUser.email) {
      changes.basicInfo.push(`Email: "${currentUser.email}" → "${email.toLowerCase().trim()}"`)
    }

    // Track status change
    if (status !== undefined && status !== currentUser.status) {
      changes.status = {
        old: currentUser.status,
        new: status,
      }
      
      // Validate suspension reason when changing TO suspended
      if (status === "suspended" && !suspensionReason?.trim()) {
        return NextResponse.json(
          { error: "Suspension reason is required when suspending an account" },
          { status: 400 }
        )
      }
    }

    // Track role change
    if (roleIds && Array.isArray(roleIds)) {
      const currentRoleId = currentUser.roles[0]?.role?.id
      const newRoleId = roleIds[0]
      if (currentRoleId !== newRoleId) {
        const oldRole = currentUser.roles[0]?.role?.name || "No role"
        // Fetch new role name
        const newRole = await prisma.role.findUnique({
          where: { id: newRoleId },
        })
        if (newRole) {
          changes.role = {
            old: oldRole,
            new: newRole.name,
          }
        }
      }
    }

    // Track password change (only if password is provided and not empty)
    // IMPORTANT: Only track if password actually changed (not just if it's provided)
    if (password && typeof password === 'string' && password.trim().length > 0) {
      // Only send password change email if password is actually being changed
      // (not if it's just an empty string or whitespace)
      changes.password = password.trim() // Store plain password for email
      console.log("Password change detected for user:", id)
    } else {
      console.log("No password change - password field:", password ? "provided but empty/whitespace" : "not provided")
    }

    // Prepare update data
    const updateData: any = {}
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (email !== undefined) updateData.email = email.toLowerCase().trim()
    if (status !== undefined) {
      updateData.status = status
      // Handle suspension reason based on status change
      if (status === "suspended") {
        // Always set suspension reason when status is suspended
        if (suspensionReason?.trim()) {
          updateData.suspensionReason = suspensionReason.trim()
        } else if (currentUser.status !== "suspended") {
          // If changing TO suspended and no reason provided, this should have been caught by validation
          // But if somehow we get here, use a default
          updateData.suspensionReason = "No reason provided"
        }
        // If already suspended and no new reason provided, keep existing reason
      } else if (currentUser.status === "suspended" && status !== "suspended") {
        // Clear suspension reason when changing FROM suspended to another status
        updateData.suspensionReason = null
      }
    }
    if (password && typeof password === 'string' && password.trim().length > 0) {
      updateData.password = await bcrypt.hash(password.trim(), 10)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    // Update roles if provided
    let finalUser = updatedUser
    if (roleIds && Array.isArray(roleIds)) {
      // Delete existing roles
      await prisma.userRole.deleteMany({
        where: { userId: id },
      })

      // Create new roles
      await prisma.userRole.createMany({
        data: roleIds.map((roleId: string) => ({
          userId: id,
          roleId,
        })),
      })

      // Fetch updated user with new roles
      const fetchedUser = await prisma.user.findUnique({
        where: { id },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      })
      if (!fetchedUser) {
        return NextResponse.json(
          { error: "User not found after role update" },
          { status: 404 }
        )
      }
      finalUser = fetchedUser
    }

    // Send email notifications if requested and changes exist
    if (sendEmail !== false) {
      console.log("Sending user update emails. Changes:", {
        hasBasicInfo: changes.basicInfo.length > 0,
        hasPassword: !!changes.password,
        hasRole: !!changes.role,
        hasStatus: !!changes.status,
      })
      await sendUserUpdateEmails(currentUser, finalUser, changes)
    } else {
      console.log("Email notifications disabled (sendEmail = false)")
    }

    return NextResponse.json(finalUser)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionWrapper(request)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    // Prevent deleting yourself
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status: 500 }
    )
  }
}

async function sendUserUpdateEmails(
  oldUser: any,
  newUser: any,
  changes: {
    basicInfo: string[]
    password: string | null
    role: { old: string; new: string } | null
    status: { old: string; new: string } | null
  }
) {
  try {
    const smtpSettings = await prisma.smtpSettings.findFirst()
    if (!smtpSettings || !smtpSettings.passwordRef) {
      return // SMTP not configured, skip email
    }

    const shopProfile = await prisma.shopProfile.findFirst()
    const shopName = shopProfile?.shopName || "Invoxa"
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const loginUrl = `${baseUrl}/login`

    const transporter = nodemailer.createTransport({
      host: smtpSettings.host,
      port: smtpSettings.port,
      secure: smtpSettings.encryption === "ssl",
      auth: {
        user: smtpSettings.username,
        pass: smtpSettings.passwordRef,
      },
    })

    // 1. Send status change email (if status changed)
    if (changes.status) {
      if (changes.status.new === "active" && changes.status.old !== "active") {
        const emailContent = await renderEmailTemplate("User Account Activated", {
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.roles[0]?.role?.name || "User",
          shopName,
          loginUrl,
        })

        if (emailContent) {
          await transporter.sendMail({
            from: `"${smtpSettings.fromName}" <${smtpSettings.fromEmail}>`,
            to: newUser.email,
            subject: emailContent.subject,
            html: emailContent.html,
          })
        }
      } else if (changes.status.new !== "active" && changes.status.old === "active") {
        if (changes.status.new === "suspended") {
          // Send suspension email with reason
          const suspensionReason = newUser.suspensionReason || "No reason provided"
          const emailContent = await renderEmailTemplate("User Account Suspended", {
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            role: newUser.roles[0]?.role?.name || "User",
            shopName,
            reason: suspensionReason,
          })

          if (emailContent) {
            await transporter.sendMail({
              from: `"${smtpSettings.fromName}" <${smtpSettings.fromEmail}>`,
              to: newUser.email,
              subject: emailContent.subject,
              html: emailContent.html,
            })
          }
        } else {
          // Send deactivation email
          const emailContent = await renderEmailTemplate("User Account Deactivated", {
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            role: newUser.roles[0]?.role?.name || "User",
            shopName,
            reason: "",
          })

          if (emailContent) {
            await transporter.sendMail({
              from: `"${smtpSettings.fromName}" <${smtpSettings.fromEmail}>`,
              to: newUser.email,
              subject: emailContent.subject,
              html: emailContent.html,
            })
          }
        }
      }
    }

    // 2. Send role change email (if role changed)
    if (changes.role) {
      const emailContent = await renderEmailTemplate("User Role Changed", {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        oldRole: changes.role.old,
        newRole: changes.role.new,
        shopName,
        loginUrl,
      })

      if (emailContent) {
        await transporter.sendMail({
          from: `"${smtpSettings.fromName}" <${smtpSettings.fromEmail}>`,
          to: newUser.email,
          subject: emailContent.subject,
          html: emailContent.html,
        })
      }
    }

    // 3. Send password change email (if password changed) - includes new password
    if (changes.password) {
      const emailContent = await renderEmailTemplate("User Password Changed", {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        shopName,
        loginUrl,
        newPassword: changes.password, // Include plain password in email
      })

      if (emailContent) {
        await transporter.sendMail({
          from: `"${smtpSettings.fromName}" <${smtpSettings.fromEmail}>`,
          to: newUser.email,
          subject: emailContent.subject,
          html: emailContent.html,
        })
      }
    }

    // 4. Send basic info change email (if any basic info changed) - single email with list of changes
    if (changes.basicInfo.length > 0) {
      // Build changes list HTML - properly formatted list items
      const changesListHtml = changes.basicInfo
        .map((change) => `<li style="margin: 8px 0; padding-left: 5px;">${change}</li>`)
        .join("\n        ")

      const emailContent = await renderEmailTemplate("User Information Changed", {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        shopName,
        loginUrl,
        changesList: changesListHtml,
      })

      if (emailContent) {
        await transporter.sendMail({
          from: `"${smtpSettings.fromName}" <${smtpSettings.fromEmail}>`,
          to: newUser.email,
          subject: emailContent.subject,
          html: emailContent.html,
        })
      }
    }
  } catch (error) {
    // Don't fail the request if email sending fails
    // Silently fail - email sending errors shouldn't break the update
  }
}

