import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { render } from '@react-email/components'
import { WeeklyDigestEmail } from '@/components/emails/weekly-digest'
import { sendDigestEmail } from '@/lib/digest'
import type { DigestData } from '@/lib/digest/types'

// Configuración para ejecución manual - máximo 5 minutos
export const maxDuration = 300

// Mapeo de códigos de retailer a IDs
const RETAILER_IDS: Record<string, number> = {
  heb: 1,
  walmart: 2,
  soriana: 3,
  merco: 4,
  fahorro: 5,
  fda: 5,
}

// Nombres de retailers para el subject
const RETAILER_NAMES: Record<number, string> = {
  1: 'H-E-B',
  2: 'Walmart',
  3: 'Soriana',
  4: 'Merco',
  5: 'Farmacias del Ahorro',
}

/**
 * POST /api/digest/send
 *
 * Endpoint para enviar digest manualmente a emails específicos.
 *
 * Body:
 * - tenant_id: string (requerido) - UUID del tenant
 * - retailer: 'fda' | 'merco' | 'heb' | etc. (requerido)
 * - emails: string[] (requerido) - Lista de emails a los que enviar
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tenant_id, retailer, emails } = body

    if (!tenant_id) {
      return NextResponse.json(
        { error: 'Se requiere especificar el tenant_id' },
        { status: 400 }
      )
    }

    if (!retailer) {
      return NextResponse.json(
        { error: 'Se requiere especificar el retailer' },
        { status: 400 }
      )
    }

    const retailerId = RETAILER_IDS[retailer.toLowerCase()]
    if (!retailerId) {
      return NextResponse.json(
        { error: `Retailer no válido: ${retailer}. Opciones: ${Object.keys(RETAILER_IDS).join(', ')}` },
        { status: 400 }
      )
    }

    // Validar emails
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos un email en el array "emails"' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const results: Array<{
      email: string
      retailer: string
      status: 'sent' | 'failed'
      error?: string
    }> = []

    // 1. Obtener datos del digest una sola vez
    const digestType = retailerId === 1 ? 'weekly' : 'monthly'
    const { data: digestData, error: dataError } = await supabase.rpc(
      'get_digest_data_for_retailer',
      {
        p_tenant_id: tenant_id,
        p_retailer_id: retailerId,
        p_digest_type: digestType,
      }
    )

    if (dataError || !digestData || digestData.error) {
      console.error('[Manual Digest] Error obteniendo datos:', dataError || digestData?.error)
      return NextResponse.json(
        { error: dataError?.message || digestData?.error || 'Error obteniendo datos del digest' },
        { status: 500 }
      )
    }

    const data = digestData as DigestData
    const retailerName = RETAILER_NAMES[retailerId] || retailer.toUpperCase()

    // 2. Renderizar email una sola vez
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://retail.rushdata.com.mx'
    const emailHtml = await render(
      WeeklyDigestEmail({
        data,
        insights: '',
        unsubscribeUrl: `${baseUrl}/api/digest/unsubscribe?id=manual`,
        dashboardUrl: `${baseUrl}/${data.retailer.codigo}/dashboard`,
      })
    )

    // 3. Crear subject
    const fechaStr = new Date().toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const subject = `Resumen ${retailerId === 1 ? 'semanal' : 'mensual'} ${retailerName} - ${fechaStr}`

    console.log(`[Manual Digest] Enviando a ${emails.length} emails para ${retailerName}`)

    // 4. Enviar a cada email
    for (const email of emails) {
      try {
        console.log(`[Manual Digest] Enviando a ${email}`)

        const sendResult = await sendDigestEmail({
          to: email,
          subject,
          html: emailHtml,
        })

        // Registrar en logs
        await supabase.from('digest_logs').insert({
          subscription_id: null,
          tenant_id: tenant_id,
          retailer_id: retailerId,
          user_id: null,
          digest_type: digestType,
          status: sendResult.success ? 'sent' : 'failed',
          subject,
          metrics_snapshot: data,
          ai_insights: null,
          error_message: sendResult.error || null,
          resend_message_id: sendResult.messageId || null,
          email_to: email,
          tokens_used: 0,
        })

        results.push({
          email,
          retailer: retailerName,
          status: sendResult.success ? 'sent' : 'failed',
          error: sendResult.error,
        })
      } catch (err) {
        console.error(`[Manual Digest] Error enviando a ${email}:`, err)
        results.push({
          email,
          retailer: retailerName,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Error desconocido',
        })
      }
    }

    const sent = results.filter((r) => r.status === 'sent').length
    const failed = results.filter((r) => r.status === 'failed').length

    console.log(`[Manual Digest] Completado: ${sent} enviados, ${failed} fallidos`)

    return NextResponse.json({
      message: `Digest de ${retailerName} enviado`,
      sent,
      failed,
      results,
    })
  } catch (error) {
    console.error('[Manual Digest] Error fatal:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/digest/send?tenant_id=xxx&retailer=heb&emails=email1@x.com,email2@x.com
 *
 * Versión GET para poder ejecutar desde el navegador fácilmente
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenant_id = searchParams.get('tenant_id')
  const retailer = searchParams.get('retailer')
  const emailsParam = searchParams.get('emails') || searchParams.get('email')

  if (!tenant_id) {
    return NextResponse.json({
      error: 'Se requiere especificar el tenant_id',
      usage: '/api/digest/send?tenant_id=xxx&retailer=heb&emails=email1@x.com',
    }, { status: 400 })
  }

  if (!retailer) {
    return NextResponse.json({
      error: 'Se requiere especificar el retailer',
      usage: '/api/digest/send?tenant_id=xxx&retailer=heb&emails=email1@x.com',
      opciones: Object.keys(RETAILER_IDS),
    }, { status: 400 })
  }

  if (!emailsParam) {
    return NextResponse.json({
      error: 'Se requiere especificar al menos un email',
      usage: '/api/digest/send?tenant_id=xxx&retailer=heb&emails=email1@x.com',
    }, { status: 400 })
  }

  // Parsear emails (separados por coma)
  const emails = emailsParam.split(',').map((e) => e.trim()).filter((e) => e.length > 0)

  // Reusar la lógica del POST
  const fakeRequest = new Request(request.url, {
    method: 'POST',
    body: JSON.stringify({ tenant_id, retailer, emails }),
  })

  return POST(fakeRequest)
}
