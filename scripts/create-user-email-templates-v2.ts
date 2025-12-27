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
    subject: "You've been invited to join",
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
    <h2 style="color: #2c3e50; margin-top: 0;">You've Been Invited</h2>
    <p>Hello {{ firstName }},</p>
    <p>You have been invited to join as a <strong>{{ role }}</strong>.</p>
    <p>To get started, please click the link below to set up your account:</p>
    <p style="text-align: center; margin: 25px 0;">
      <a href="{{ invitationLink }}" style="background-color: #2c3e50; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Accept Invitation</a>
    </p>
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
    name: "User Information Changed",
    subject: "Your account information has been updated",
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Information Updated</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h2 style="color: #2c3e50; margin-top: 0;">Account Information Updated</h2>
    <p>Hello {{ firstName }},</p>
    <p>Your account information has been updated by an administrator.</p>
    <p><strong>Changes Made:</strong></p>
    <ul style="margin: 15px 0; padding-left: 20px;">
      {{ changesList }}
    </ul>
    <p>If you did not request these changes, please contact your administrator immediately.</p>
    <p>You can log in at: <a href="{{ loginUrl }}" style="color: #2c3e50;">{{ loginUrl }}</a></p>
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; margin-bottom: 0;">This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
    `.trim(),
    variables: ["firstName", "lastName", "email", "shopName", "loginUrl", "changesList"],
    isActive: true,
  },
  {
    name: "User Password Changed",
    subject: "Your password has been changed",
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
    <p>Your password has been changed by an administrator.</p>
    <div style="background-color: #ffffff; padding: 25px; text-align: center; margin: 25px 0; border-radius: 8px; border: 2px solid #e0e0e0;">
      <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your new password is:</p>
      <p style="font-size: 24px; letter-spacing: 2px; margin: 0; color: #2c3e50; font-weight: bold; font-family: monospace;">{{ newPassword }}</p>
    </div>
    <p style="color: #666; font-size: 14px;"><strong>Important:</strong> Please change this password after logging in for security purposes.</p>
    <p>If you did not request this password change, please contact your administrator immediately and change your password.</p>
    <p>You can log in at: <a href="{{ loginUrl }}" style="color: #2c3e50;">{{ loginUrl }}</a></p>
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; margin-bottom: 0;">This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
    `.trim(),
    variables: ["firstName", "lastName", "email", "shopName", "loginUrl", "newPassword"],
    isActive: true,
  },
  {
    name: "User Role Changed",
    subject: "Your role has been updated",
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
    <p>Your role has been updated.</p>
    <p><strong>Previous Role:</strong> {{ oldRole }}</p>
    <p><strong>New Role:</strong> {{ newRole }}</p>
    <p style="color: #666; font-size: 14px;"><strong>Note:</strong> You may need to log out and log back in for the changes to take full effect.</p>
    <p>If you have any questions about your new role or permissions, please contact your administrator.</p>
    <p>You can log in at: <a href="{{ loginUrl }}" style="color: #2c3e50;">{{ loginUrl }}</a></p>
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; margin-bottom: 0;">This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
    `.trim(),
    variables: ["firstName", "lastName", "email", "oldRole", "newRole", "shopName", "loginUrl"],
    isActive: true,
  },
  {
    name: "User Account Activated",
    subject: "Your account has been activated",
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
    <p>Your account has been activated. You can now access the system.</p>
    <p>You can log in at: <a href="{{ loginUrl }}" style="color: #2c3e50;">{{ loginUrl }}</a></p>
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
    subject: "Your account has been deactivated",
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
    <p>Your account has been deactivated. You will no longer be able to access the system.</p>
    <p>If you believe this is an error, please contact your administrator immediately.</p>
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
    name: "User Account Suspended",
    subject: "Your account has been suspended",
    bodyHtml: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Suspended</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h2 style="color: #2c3e50; margin-top: 0;">Account Suspended</h2>
    <p>Hello {{ firstName }},</p>
    <p>Your account has been suspended. You will no longer be able to access the system.</p>
    <div style="background-color: #ffffff; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px solid #e0e0e0;">
      <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;"><strong>Reason for suspension:</strong></p>
      <p style="margin: 0; color: #2c3e50;">{{ reason }}</p>
    </div>
    <p>If you believe this is an error, please contact your administrator immediately.</p>
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; margin-bottom: 0;">This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
    `.trim(),
    variables: ["firstName", "lastName", "email", "role", "shopName", "reason"],
    isActive: true,
  },
]

async function main() {
  try {
    console.log("Creating new user email templates...")

    for (const template of templates) {
      const existing = await prisma.emailTemplate.findUnique({
        where: { name: template.name },
      })

      if (existing) {
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
