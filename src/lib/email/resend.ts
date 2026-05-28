import { Resend } from 'resend'

let resendClient: Resend | null = null

function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY!)
  }
  return resendClient
}

export async function sendEmail(options: {
  to: string
  subject: string
  html: string
}): Promise<{ success: boolean; error?: string }> {
  const resend = getResend()
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: options.to,
    subject: options.subject,
    html: options.html,
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}
