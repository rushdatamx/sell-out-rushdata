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
    // En desarrollo usa el dominio de prueba de Resend
    // En producción, verificar dominio rushdata.mx en Resend
    const fromEmail = process.env.NODE_ENV === 'production'
      ? 'RushData <digest@rushdata.mx>'
      : 'RushData <onboarding@resend.dev>'

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
