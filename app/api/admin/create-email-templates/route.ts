import { NextRequest, NextResponse } from "next/server"
import { getServerSessionWrapper } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/admin/create-email-templates
 * Create the "New Location Login" email template
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSessionWrapper(request)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Delete existing template if it exists
    await prisma.emailTemplate.deleteMany({
      where: { name: "New Location Login" },
    })

    // Create new template
    await prisma.emailTemplate.create({
      data: {
        name: "New Location Login",
        subject: "Login Verification Code",
        bodyHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 4px; overflow: hidden;">
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #000000;">Login Verification Code</h1>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #000000;">
                Hello {{firstName}} {{lastName}},
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #000000;">
                We detected a login attempt from a new location or IP address. For your security, please enter the verification code below to complete your login.
              </p>
              
              <div style="background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 4px; padding: 20px; margin: 30px 0; text-align: center;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Verification Code</p>
                <p style="margin: 0; font-size: 32px; font-weight: 600; color: #000000; letter-spacing: 8px; font-family: 'Courier New', monospace;">{{verificationCode}}</p>
              </div>
              
              <p style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6; color: #666666;">
                <strong>Location:</strong> {{city}}, {{region}}, {{country}}
              </p>
              
              <p style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6; color: #666666;">
                <strong>IP Address:</strong> {{ipAddress}}
              </p>
              
              <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #666666;">
                This code will expire in 10 minutes. If you did not attempt to log in, please secure your account immediately.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        variables: [
          "firstName",
          "lastName",
          "email",
          "verificationCode",
          "city",
          "region",
          "country",
          "ipAddress",
        ],
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Email template created successfully",
    })
  } catch (error: any) {
    console.error("Error creating email template:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create email template" },
      { status: 500 }
    )
  }
}



