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
    console.log("Setting up User Signup email template...")

    // Delete any existing "user-signup" template (case-insensitive search)
    const existingTemplates = await prisma.emailTemplate.findMany({
      where: {
        OR: [
          { name: "user-signup" },
          { name: "User Signup" },
          { name: "User Sign Up" },
        ],
      },
    })

    for (const template of existingTemplates) {
      await prisma.emailTemplate.delete({
        where: { id: template.id },
      })
      console.log(`✅ Deleted existing template "${template.name}"`)
    }

    // Check if "User Signup" template already exists
    const existing = await prisma.emailTemplate.findUnique({
      where: { name: "User Signup" },
    })

    const template = {
      name: "User Signup",
      subject: "Welcome! Your account has been created",
      bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Created</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h2 style="color: #2c3e50; margin-top: 0;">Welcome!</h2>
    <p>Hello {{ firstName }},</p>
    <p>Your account has been successfully created. Here are your login credentials:</p>
    <div style="background-color: #ffffff; padding: 25px; margin: 25px 0; border-radius: 8px; border: 2px solid #e0e0e0;">
      <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;"><strong>Email:</strong></p>
      <p style="margin: 0 0 20px 0; font-size: 16px; color: #2c3e50; font-weight: bold;">{{ email }}</p>
      <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;"><strong>Password:</strong></p>
      <p style="margin: 0; font-size: 16px; color: #2c3e50; font-weight: bold; font-family: monospace; letter-spacing: 1px;">{{ password }}</p>
    </div>
    <p style="color: #666; font-size: 14px; background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;"><strong>Important:</strong> Your account is currently inactive. An administrator must activate your account before you can access the system. You will see an activation pending page when you try to log in.</p>
    <p>You can log in at: <a href="{{ loginUrl }}" style="color: #2c3e50;">{{ loginUrl }}</a></p>
    <p>If you have any questions, please contact your administrator.</p>
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; margin-bottom: 0;">This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
      `.trim(),
      variables: ["firstName", "lastName", "email", "password", "loginUrl"],
      isActive: true,
    }

    if (existing) {
      await prisma.emailTemplate.update({
        where: { name: "User Signup" },
        data: {
          subject: template.subject,
          bodyHtml: template.bodyHtml,
          variables: template.variables,
          isActive: template.isActive,
        },
      })
      console.log("✅ Template 'User Signup' updated successfully!")
    } else {
      await prisma.emailTemplate.create({
        data: template,
      })
      console.log("✅ Template 'User Signup' created successfully!")
    }

    console.log("\n✅ User Signup email template setup complete!")
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

