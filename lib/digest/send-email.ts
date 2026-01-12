// Envío de emails con Resend

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendDigestEmail(params: SendEmailParams): Promise<SendEmailResult> {
  try {
    // Dominio verificado en Resend: newsletter.rushdata.com.mx
    const fromEmail = 'RushData <digest@newsletter.rushdata.com.mx>'

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    })

    if (error) {
      console.error('[Digest] Error sending email:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      messageId: data?.id,
    }
  } catch (err) {
    console.error('[Digest] Exception sending email:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
