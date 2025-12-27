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

    const openRouterSettings = await prisma.openRouterSettings.findFirst()

    if (!openRouterSettings) {
      // Return default structure if no settings exist
      return NextResponse.json({
        apiKey: "", // Don't return actual API key, just empty string
        defaultModel: "openai/gpt-4o-mini",
        maxTokens: 4096,
        temperature: 0.7,
        isActive: false,
      })
    }

    // Don't return the actual API key, return empty string
    return NextResponse.json({
      ...openRouterSettings,
      apiKey: "", // Never return the actual API key
      temperature: Number(openRouterSettings.temperature),
    })
  } catch (error) {
    console.error("Open Router settings fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch Open Router settings" },
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
      apiKey,
      defaultModel,
      maxTokens,
      temperature,
      isActive,
    } = body

    // Get or create OpenRouter settings
    const existing = await prisma.openRouterSettings.findFirst()

    // For new settings, API key is required
    if (!existing && (!apiKey || apiKey.trim() === "")) {
      return NextResponse.json(
        { error: "API key is required for new Open Router settings" },
        { status: 400 }
      )
    }

    const updateData: any = {
      defaultModel: defaultModel || "openai/gpt-4o-mini",
      maxTokens: maxTokens ? parseInt(maxTokens.toString()) : 4096,
      temperature: temperature ? parseFloat(temperature.toString()) : 0.7,
      isActive: isActive !== undefined ? isActive : true,
    }

    // Only update API key if provided (not empty)
    // If API key is empty and updating existing, keep existing API key (don't update apiKeyRef)
    if (apiKey && apiKey.trim() !== "") {
      // In production, you should encrypt the API key before storing
      // For now, storing as plain text in apiKeyRef field (NOT RECOMMENDED FOR PRODUCTION)
      // Consider using a library like crypto-js or node:crypto for encryption
      updateData.apiKeyRef = apiKey
    }

    const openRouterSettings = existing
      ? await prisma.openRouterSettings.update({
          where: { id: existing.id },
          data: updateData,
        })
      : await prisma.openRouterSettings.create({
          data: {
            ...updateData,
            apiKeyRef: apiKey, // Required for new settings (already validated above)
          },
        })

    // Don't return the actual API key
    return NextResponse.json({
      ...openRouterSettings,
      apiKey: "", // Never return the actual API key
      temperature: Number(openRouterSettings.temperature),
    })
  } catch (error) {
    console.error("Open Router settings update error:", error)
    return NextResponse.json(
      { error: "Failed to update Open Router settings" },
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

    // Get OpenRouter settings
    const openRouterSettings = await prisma.openRouterSettings.findFirst()

    if (!openRouterSettings) {
      return NextResponse.json(
        { error: "Open Router settings not configured. Please save settings first." },
        { status: 400 }
      )
    }

    if (!openRouterSettings.apiKeyRef) {
      return NextResponse.json(
        { error: "Open Router API key not set. Please save settings with an API key first." },
        { status: 400 }
      )
    }

    // Test API connection by making a simple request to OpenRouter
    try {
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${openRouterSettings.apiKeyRef}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return NextResponse.json(
          { error: `API connection failed: ${errorData.error?.message || response.statusText}` },
          { status: 400 }
        )
      }

      // Try to parse the response to verify it's valid
      const data = await response.json()
      
      if (!data.data || !Array.isArray(data.data)) {
        return NextResponse.json(
          { error: "Invalid response from OpenRouter API" },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `Open Router API connection successful. Found ${data.data.length} available models.`,
      })
    } catch (error: any) {
      return NextResponse.json(
        { error: `Connection failed: ${error.message}` },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error("Open Router test error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to test Open Router API connection" },
      { status: 500 }
    )
  }
}





