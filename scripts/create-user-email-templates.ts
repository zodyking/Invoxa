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

const templates = [
  {
    name: "User Invitation",
    subject: "You've been invited to join {{ shopName }}",
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>User Invitation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h2 style="color: #2c3e50; margin-top: 0;">You've Been Invited!</h2>
    <p>Hello {{ firstName }},</p>
    <p>You have been invited to join <strong>{{ shopName }}</strong> as a <strong>{{ role }}</strong>.</p>
    <p>To get started, please click the link below to set up your account:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ invitationLink }}" style="background-color: #2c3e50; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Accept Invitation</a>
    </div>
    <p style="color: #666; font-size: 14px;">This invitation link will expire in 7 days.</p>
    <p>If you didn't expect this invitation, please ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; margin-bottom: 0;">This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
    `.trim(),
    variables: ["firstName", "lastName", "email", "role", "shopName", "invitationLink"],
    isActive: true,
  },
  {
    name: "User Welcome",
    subject: "Welcome to {{ shopName }}!",
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h2 style="color: #2c3e50; margin-top: 0;">Welcome to {{ shopName }}!</h2>
    <p>Hello {{ firstName }},</p>
    <p>Your account has been successfully created. You can now access the system with the following credentials:</p>
    <div style="background-color: #ffffff; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e0e0e0;">
      <p style="margin: 5px 0;"><strong>Email:</strong> {{ email }}</p>
      <p style="margin: 5px 0;"><strong>Role:</strong> {{ role }}</p>
    </div>
    <p>You can log in at: <a href="{{ loginUrl }}">{{ loginUrl }}</a></p>
    <p>If you have any questions, please contact your administrator.</p>
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; margin-bottom: 0;">This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
    `.trim(),
    variables: ["firstName", "lastName", "email", "role", "shopName", "loginUrl"],
    isActive: true,
  },
  {
    name: "User Account Activated",
    subject: "Your account has been activated - {{ shopName }}",
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Activated</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h2 style="color: #2c3e50; margin-top: 0;">Account Activated</h2>
    <p>Hello {{ firstName }},</p>
    <p>Your account for <strong>{{ shopName }}</strong> has been activated. You can now access the system.</p>
    <p>You can log in at: <a href="{{ loginUrl }}">{{ loginUrl }}</a></p>
    <p>If you have any questions, please contact your administrator.</p>
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; margin-bottom: 0;">This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
    `.trim(),
    variables: ["firstName", "lastName", "email", "role", "shopName", "loginUrl"],
    isActive: true,
  },
  {
    name: "User Account Deactivated",
    subject: "Your account has been deactivated - {{ shopName }}",
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Deactivated</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h2 style="color: #2c3e50; margin-top: 0;">Account Deactivated</h2>
    <p>Hello {{ firstName }},</p>
    <p>Your account for <strong>{{ shopName }}</strong> has been deactivated. You will no longer be able to access the system.</p>
    <p>If you believe this is an error, please contact your administrator.</p>
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; margin-bottom: 0;">This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
    `.trim(),
    variables: ["firstName", "lastName", "email", "role", "shopName", "reason"],
    isActive: true,
  },
  {
    name: "User Role Changed",
    subject: "Your role has been updated - {{ shopName }}",
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Role Changed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h2 style="color: #2c3e50; margin-top: 0;">Role Updated</h2>
    <p>Hello {{ firstName }},</p>
    <p>Your role for <strong>{{ shopName }}</strong> has been updated.</p>
    <div style="background-color: #ffffff; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e0e0e0;">
      <p style="margin: 5px 0;"><strong>Previous Role:</strong> {{ oldRole }}</p>
      <p style="margin: 5px 0;"><strong>New Role:</strong> {{ newRole }}</p>
    </div>
    <p>You may need to log out and log back in for the changes to take effect.</p>
    <p>If you have any questions, please contact your administrator.</p>
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; margin-bottom: 0;">This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
    `.trim(),
    variables: ["firstName", "lastName", "email", "oldRole", "newRole", "shopName"],
    isActive: true,
  },
  {
    name: "User Password Changed",
    subject: "Your password has been changed - {{ shopName }}",
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h2 style="color: #2c3e50; margin-top: 0;">Password Changed</h2>
    <p>Hello {{ firstName }},</p>
    <p>Your password for <strong>{{ shopName }}</strong> has been changed by an administrator.</p>
    <p style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
      <strong>Important:</strong> If you did not request this change, please contact your administrator immediately.
    </p>
    <p>You can log in with your new password at: <a href="{{ loginUrl }}">{{ loginUrl }}</a></p>
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; margin-bottom: 0;">This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
    `.trim(),
    variables: ["firstName", "lastName", "email", "shopName", "loginUrl"],
    isActive: true,
  },
]

async function main() {
  try {
    console.log("Creating user-related email templates...")

    for (const template of templates) {
      const existing = await prisma.emailTemplate.findUnique({
        where: { name: template.name },
      })

      if (existing) {
        console.log(`Template "${template.name}" already exists. Updating...`)
        await prisma.emailTemplate.update({
          where: { name: template.name },
          data: {
            subject: template.subject,
            bodyHtml: template.bodyHtml,
            variables: template.variables,
            isActive: template.isActive,
          },
        })
        console.log(`✅ Template "${template.name}" updated successfully!`)
      } else {
        await prisma.emailTemplate.create({
          data: template,
        })
        console.log(`✅ Template "${template.name}" created successfully!`)
      }
    }

    console.log("\n✅ All user email templates have been created/updated!")
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




