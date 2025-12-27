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

    const templates = await prisma.emailTemplate.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error("Email templates fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch email templates" },
      { status: 500 }
    )
  }
}

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
    const { name, subject, bodyHtml, variables, isActive } = body

    if (!name || !subject || !bodyHtml) {
      return NextResponse.json(
        { error: "Name, subject, and bodyHtml are required" },
        { status: 400 }
      )
    }

    // Check if template with same name exists
    const existing = await prisma.emailTemplate.findUnique({
      where: { name },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Template with this name already exists" },
        { status: 400 }
      )
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        subject,
        bodyHtml,
        variables: variables || [],
        isActive: isActive !== undefined ? isActive : true,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error: any) {
    console.error("Email template create error:", error)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Template with this name already exists" },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create email template" },
      { status: 500 }
    )
  }
}






