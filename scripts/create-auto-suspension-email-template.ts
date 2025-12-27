import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import "dotenv/config"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  try {
    console.log("Creating Auto Suspension email template...")

    const template = {
      name: "User Account Auto Suspended",
      subject: "Your account has been automatically suspended",
      bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Auto Suspended</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h2 style="color: #2c3e50; margin-top: 0;">Account Automatically Suspended</h2>
    <p>Hello {{ firstName }},</p>
    <p>Your account has been automatically suspended due to a security policy violation.</p>
    <div style="background-color: #ffffff; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px solid #e0e0e0;">
      <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;"><strong>Reason for suspension:</strong></p>
      <p style="margin: 0; color: #2c3e50;">{{ reason }}</p>
    </div>
    <p style="color: #666; font-size: 14px;">This suspension was automatically applied by our security system. For security reasons, users are only allowed to be signed in from one location at a time.</p>
    <p>If you believe this is an error or if you need assistance, please contact your administrator immediately.</p>
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; margin-bottom: 0;">This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
      `.trim(),
      variables: ["firstName", "lastName", "email", "role", "shopName", "reason"],
      isActive: true,
    }

    const existing = await prisma.emailTemplate.findUnique({
      where: { name: "User Account Auto Suspended" },
    })

    if (existing) {
      await prisma.emailTemplate.update({
        where: { name: "User Account Auto Suspended" },
        data: {
          subject: template.subject,
          bodyHtml: template.bodyHtml,
          variables: template.variables,
          isActive: template.isActive,
        },
      })
      console.log("✅ Template 'User Account Auto Suspended' updated successfully!")
    } else {
      await prisma.emailTemplate.create({
        data: template,
      })
      console.log("✅ Template 'User Account Auto Suspended' created successfully!")
    }

    console.log("\n✅ Auto Suspension email template setup complete!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Error:")
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()




