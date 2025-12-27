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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
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

    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      image: user.image,
      status: user.status,
      suspensionReason: user.suspensionReason || null,
      themePreference: user.themePreference || "light",
      roles: user.roles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
        permissions: ur.role.permissions.map((rp) => ({
          key: rp.permission.key,
          name: rp.permission.name,
          description: rp.permission.description,
        })),
      })),
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
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
    const { firstName, lastName, email, themePreference } = body

    // Check if this is a theme-only update (only themePreference is provided)
    const hasThemePreference = themePreference !== undefined
    const hasOtherFields = firstName !== undefined || lastName !== undefined || email !== undefined
    const isThemeOnlyUpdate = hasThemePreference && !hasOtherFields

    if (!isThemeOnlyUpdate) {
      // For full profile updates, require all fields
      if (!firstName || !lastName || !email) {
        return NextResponse.json(
          { error: "First name, last name, and email are required" },
          { status: 400 }
        )
      }

      // Check if email is already taken by another user
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: "Email is already taken" },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}

    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (email !== undefined) updateData.email = email
    if (themePreference !== undefined) updateData.themePreference = themePreference

    // Ensure we have at least one field to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      image: user.image,
      status: user.status,
      themePreference: user.themePreference || "light",
      roles: user.roles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
        permissions: ur.role.permissions.map((rp) => ({
          key: rp.permission.key,
          name: rp.permission.name,
          description: rp.permission.description,
        })),
      })),
    })
  } catch (error: any) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    )
  }
}

