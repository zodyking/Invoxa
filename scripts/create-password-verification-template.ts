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
    console.log("Creating Password Verification email template...")

    // Check if template already exists
    const existing = await prisma.emailTemplate.findUnique({
      where: { name: "Password Verification" },
    })

    if (existing) {
      console.log("Template already exists. Updating...")
      await prisma.emailTemplate.update({
        where: { name: "Password Verification" },
        data: {
          subject: "Password Reset Verification Code",
          bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Verification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h2 style="color: #2c3e50; margin-top: 0;">Password Reset Verification</h2>
    <p>Hello {{ firstName }},</p>
    <p>You requested to reset your password for your Invoxa account. Use the following verification code to complete the process:</p>
    <div style="background-color: #ffffff; padding: 25px; text-align: center; margin: 25px 0; border-radius: 8px; border: 2px solid #e0e0e0;">
      <h1 style="font-size: 36px; letter-spacing: 8px; margin: 0; color: #2c3e50; font-weight: bold;">{{ code }}</h1>
    </div>
    <p style="color: #666; font-size: 14px;">This code will expire in 15 minutes.</p>
    <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; margin-bottom: 0;">This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
          `.trim(),
          variables: ["code", "firstName", "lastName", "email"],
          isActive: true,
        },
      })
      console.log("✅ Template updated successfully!")
    } else {
      await prisma.emailTemplate.create({
        data: {
          name: "Password Verification",
          subject: "Password Reset Verification Code",
          bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Verification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h2 style="color: #2c3e50; margin-top: 0;">Password Reset Verification</h2>
    <p>Hello {{ firstName }},</p>
    <p>You requested to reset your password for your Invoxa account. Use the following verification code to complete the process:</p>
    <div style="background-color: #ffffff; padding: 25px; text-align: center; margin: 25px 0; border-radius: 8px; border: 2px solid #e0e0e0;">
      <h1 style="font-size: 36px; letter-spacing: 8px; margin: 0; color: #2c3e50; font-weight: bold;">{{ code }}</h1>
    </div>
    <p style="color: #666; font-size: 14px;">This code will expire in 15 minutes.</p>
    <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; margin-bottom: 0;">This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
          `.trim(),
          variables: ["code", "firstName", "lastName", "email"],
          isActive: true,
        },
      })
      console.log("✅ Template created successfully!")
    }

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




