import nodemailer from "nodemailer"
import { prisma } from "@/lib/prisma"

export async function getEmailTransporter() {
  const smtpSettings = await prisma.smtpSettings.findFirst({
    where: { isActive: true },
  })

  if (!smtpSettings || !smtpSettings.passwordRef) {
    throw new Error("SMTP settings not configured or inactive")
  }

  return nodemailer.createTransport({
    host: smtpSettings.host,
    port: smtpSettings.port,
    secure: smtpSettings.encryption === "ssl", // true for 465, false for other ports
    auth: {
      user: smtpSettings.username,
      pass: smtpSettings.passwordRef, // In production, decrypt this
    },
  })
}

export async function sendEmail(options: {
  to: string | string[]
  subject: string
  html: string
  text?: string
}) {
  const smtpSettings = await prisma.smtpSettings.findFirst({
    where: { isActive: true },
  })

  if (!smtpSettings) {
    throw new Error("SMTP settings not configured")
  }

  const transporter = await getEmailTransporter()

  const toArray = Array.isArray(options.to) ? options.to : [options.to]

  return transporter.sendMail({
    from: `"${smtpSettings.fromName}" <${smtpSettings.fromEmail}>`,
    to: toArray.join(", "),
    subject: options.subject,
    html: options.html,
    text: options.text,
  })
}






