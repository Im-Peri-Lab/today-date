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
  const fromEmail = process.env.RESEND_FROM_EMAIL

  if (!fromEmail) {
    console.error('[resend] RESEND_FROM_EMAIL is not set')
    return { success: false, error: 'RESEND_FROM_EMAIL not configured' }
  }

  const resend = getResend()
  const { error } = await resend.emails.send({
    from: fromEmail,
    to: options.to,
    subject: options.subject,
    html: options.html,
  })

  if (error) {
    console.error('[resend] send error:', JSON.stringify(error))
    return { success: false, error: error.message }
  }

  return { success: true }
}
