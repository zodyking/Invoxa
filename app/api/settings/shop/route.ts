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

    const shopProfile = await prisma.shopProfile.findFirst()

    if (!shopProfile) {
      // Return default structure if no profile exists
      return NextResponse.json({
        shopName: "",
        streetAddress: "",
        city: "",
        state: "",
        zip: "",
        phone: "",
        fax: "",
        email: "",
        website: "",
        taxId: "",
      })
    }

    return NextResponse.json(shopProfile)
  } catch (error) {
    console.error("Shop profile fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch shop profile" },
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
    const {
      shopName,
      streetAddress,
      city,
      state,
      zip,
      phone,
      fax,
      email,
      website,
      taxId,
    } = body

    // Get or create shop profile
    const existing = await prisma.shopProfile.findFirst()

    const shopProfile = existing
      ? await prisma.shopProfile.update({
          where: { id: existing.id },
          data: {
            shopName,
            streetAddress,
            city,
            state,
            zip,
            phone,
            fax,
            email,
            website,
            taxId,
          },
        })
      : await prisma.shopProfile.create({
          data: {
            shopName,
            streetAddress,
            city,
            state,
            zip,
            phone,
            fax,
            email,
            website,
            taxId,
          },
        })

    return NextResponse.json(shopProfile)
  } catch (error) {
    console.error("Shop profile update error:", error)
    return NextResponse.json(
      { error: "Failed to update shop profile" },
      { status: 500 }
    )
  }
}







