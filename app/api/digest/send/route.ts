import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { render } from '@react-email/components'
import { WeeklyDigestEmail } from '@/components/emails/weekly-digest'
import { sendDigestEmail } from '@/lib/digest'
import type { ActiveSubscription, DigestData } from '@/lib/digest/types'

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

/**
 * POST /api/digest/send
 *
 * Endpoint para enviar digest manualmente.
 * Requiere autenticación de usuario logueado.
 *
 * Body:
 * - retailer: 'fda' | 'merco' | 'heb' | etc. (requerido)
 * - testEmail?: string (opcional - si se quiere probar con un email específico)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { retailer, testEmail } = body

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

    // 1. Obtener suscripciones activas para este retailer
    const { data: subscriptions, error: subError } = await supabase.rpc(
      'get_active_digest_subscriptions',
      { p_digest_type: 'weekly' }
    )

    if (subError) {
      console.error('[Manual Digest] Error fetching subscriptions:', subError)
      return NextResponse.json({ error: 'Error obteniendo suscripciones' }, { status: 500 })
    }

    // Filtrar por retailer
    let filteredSubs = (subscriptions as ActiveSubscription[]).filter(
      (sub) => sub.retailer_id === retailerId
    )

    // Si hay testEmail, filtrar solo ese
    if (testEmail) {
      filteredSubs = filteredSubs.filter((sub) => sub.email === testEmail)
      if (filteredSubs.length === 0) {
        return NextResponse.json({
          error: `No hay suscripción para ${testEmail} en ${retailer}`,
          hint: 'Verifica que el usuario esté suscrito al digest de este retailer'
        }, { status: 404 })
      }
    }

    if (filteredSubs.length === 0) {
      return NextResponse.json({
        message: `No hay suscripciones activas para ${retailer}`,
        sent: 0
      })
    }

    console.log(`[Manual Digest] Enviando a ${filteredSubs.length} suscriptores de ${retailer}`)

    // 2. Procesar cada suscripción
    for (const sub of filteredSubs) {
      try {
        console.log(`[Manual Digest] Procesando ${sub.email} para ${sub.retailer_nombre}`)

        // 2a. Obtener datos del digest (mensual para FDA/Merco)
        const digestType = retailerId === 1 ? 'weekly' : 'monthly' // HEB semanal, otros mensual
        const { data: digestData, error: dataError } = await supabase.rpc(
          'get_digest_data_for_retailer',
          {
            p_tenant_id: sub.tenant_id,
            p_retailer_id: sub.retailer_id,
            p_digest_type: digestType,
          }
        )

        if (dataError || !digestData || digestData.error) {
          console.error(`[Manual Digest] Error obteniendo datos para ${sub.email}:`, dataError || digestData?.error)
          results.push({
            email: sub.email,
            retailer: sub.retailer_nombre,
            status: 'failed',
            error: dataError?.message || digestData?.error || 'Sin datos',
          })
          continue
        }

        const data = digestData as DigestData

        // 2b. Renderizar email
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://retail.rushdata.com.mx'
        const emailHtml = await render(
          WeeklyDigestEmail({
            data,
            insights: '',
            unsubscribeUrl: `${baseUrl}/api/digest/unsubscribe?id=${sub.subscription_id}`,
            dashboardUrl: `${baseUrl}/${sub.retailer_codigo}/dashboard`,
          })
        )

        // 2c. Enviar email
        const fechaStr = new Date().toLocaleDateString('es-MX', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
        const subject = `Resumen ${retailerId === 1 ? 'semanal' : 'mensual'} ${sub.retailer_nombre} - ${fechaStr}`

        const sendResult = await sendDigestEmail({
          to: sub.email,
          subject,
          html: emailHtml,
        })

        // 2d. Registrar en logs
        await supabase.from('digest_logs').insert({
          subscription_id: sub.subscription_id,
          tenant_id: sub.tenant_id,
          retailer_id: sub.retailer_id,
          user_id: sub.user_id,
          digest_type: digestType,
          status: sendResult.success ? 'sent' : 'failed',
          subject,
          metrics_snapshot: data,
          ai_insights: null,
          error_message: sendResult.error || null,
          resend_message_id: sendResult.messageId || null,
          email_to: sub.email,
          tokens_used: 0,
        })

        // 2e. Actualizar timestamp
        if (sendResult.success) {
          await supabase.rpc('update_digest_sent_timestamp', {
            p_subscription_id: sub.subscription_id,
            p_digest_type: digestType,
          })
        }

        results.push({
          email: sub.email,
          retailer: sub.retailer_nombre,
          status: sendResult.success ? 'sent' : 'failed',
          error: sendResult.error,
        })
      } catch (err) {
        console.error(`[Manual Digest] Error procesando ${sub.email}:`, err)
        results.push({
          email: sub.email,
          retailer: sub.retailer_nombre,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Error desconocido',
        })
      }
    }

    const sent = results.filter((r) => r.status === 'sent').length
    const failed = results.filter((r) => r.status === 'failed').length

    console.log(`[Manual Digest] Completado: ${sent} enviados, ${failed} fallidos`)

    return NextResponse.json({
      message: `Digest de ${retailer.toUpperCase()} enviado`,
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
 * GET /api/digest/send?retailer=fda
 *
 * Versión GET para poder ejecutar desde el navegador fácilmente
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const retailer = searchParams.get('retailer')
  const testEmail = searchParams.get('email')

  if (!retailer) {
    return NextResponse.json({
      error: 'Se requiere especificar el retailer',
      usage: '/api/digest/send?retailer=fda',
      opciones: Object.keys(RETAILER_IDS),
    }, { status: 400 })
  }

  // Reusar la lógica del POST
  const fakeRequest = new Request(request.url, {
    method: 'POST',
    body: JSON.stringify({ retailer, testEmail }),
  })

  return POST(fakeRequest)
}
