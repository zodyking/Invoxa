import { prisma } from "@/lib/prisma"

/**
 * Renders an email template by replacing variables with actual values
 * @param templateName - Name of the email template
 * @param variables - Object with variable names as keys and replacement values
 * @returns Object with subject and html body, or null if template not found
 */
export async function renderEmailTemplate(
  templateName: string,
  variables: Record<string, string>
): Promise<{ subject: string; html: string } | null> {
  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { name: templateName },
    })

    if (!template || !template.isActive) {
      return null
    }

    let subject = template.subject
    let html = template.bodyHtml

    // Replace variables in subject and body
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g")
      subject = subject.replace(regex, value || "")
      html = html.replace(regex, value || "")
    }

    return { subject, html }
  } catch (error: any) {
    return null
  }
}

