import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { render } from '@react-email/components'
import { MonthlyDigestEmail } from '@/components/emails/monthly-digest'
import { generateDigestInsights, sendDigestEmail } from '@/lib/digest'
import type { ActiveSubscription, DigestData } from '@/lib/digest/types'

// Configuración para Vercel Cron - ejecutar máximo 5 minutos
export const maxDuration = 300

// Clave secreta para proteger el endpoint
const CRON_SECRET = process.env.CRON_SECRET || 'development-secret'

export async function GET(request: Request) {
  // Verificar autenticación del cron job
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
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

  try {
    // 1. Obtener suscripciones activas para digest mensual
    const { data: subscriptions, error: subError } = await supabase.rpc(
      'get_active_digest_subscriptions',
      { p_digest_type: 'monthly' }
    )

    if (subError) {
      console.error('[Monthly Digest] Error fetching subscriptions:', subError)
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[Monthly Digest] No active subscriptions found')
      return NextResponse.json({ message: 'No active subscriptions', sent: 0 })
    }

    console.log(`[Monthly Digest] Processing ${subscriptions.length} subscriptions`)

    // 2. Procesar cada suscripción
    for (const sub of subscriptions as ActiveSubscription[]) {
      try {
        console.log(`[Monthly Digest] Processing ${sub.email} for ${sub.retailer_nombre}`)

        // 2a. Obtener datos del digest (30 días)
        const { data: digestData, error: dataError } = await supabase.rpc(
          'get_digest_data_for_retailer',
          {
            p_tenant_id: sub.tenant_id,
            p_retailer_id: sub.retailer_id,
            p_digest_type: 'monthly',
          }
        )

        if (dataError || !digestData || digestData.error) {
          console.error(`[Monthly Digest] Error getting data for ${sub.email}:`, dataError || digestData?.error)
          results.push({
            email: sub.email,
            retailer: sub.retailer_nombre,
            status: 'failed',
            error: dataError?.message || digestData?.error || 'No data',
          })
          continue
        }

        const data = digestData as DigestData

        // 2b. Generar insights con IA (si está habilitado)
        let insights = ''
        let tokensUsed = 0
        if (sub.include_ai_insights) {
          try {
            const result = await generateDigestInsights(data, 'monthly')
            insights = result.insights
            tokensUsed = result.tokensUsed
          } catch (aiError) {
            console.error(`[Monthly Digest] AI error for ${sub.email}:`, aiError)
          }
        }

        // 2c. Renderizar email
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://retail.rushdata.com.mx'
        const emailHtml = await render(
          MonthlyDigestEmail({
            data,
            insights,
            unsubscribeUrl: `${baseUrl}/api/digest/unsubscribe?id=${sub.subscription_id}`,
            dashboardUrl: `${baseUrl}/${sub.retailer_codigo}/dashboard`,
          })
        )

        // 2d. Enviar email
        const monthName = new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
        const subject = `Resumen mensual de ${sub.retailer_nombre} - ${monthName}`
        const sendResult = await sendDigestEmail({
          to: sub.email,
          subject,
          html: emailHtml,
        })

        // 2e. Registrar en logs
        await supabase.from('digest_logs').insert({
          subscription_id: sub.subscription_id,
          tenant_id: sub.tenant_id,
          retailer_id: sub.retailer_id,
          user_id: sub.user_id,
          digest_type: 'monthly',
          status: sendResult.success ? 'sent' : 'failed',
          subject,
          metrics_snapshot: data,
          ai_insights: insights || null,
          error_message: sendResult.error || null,
          resend_message_id: sendResult.messageId || null,
          email_to: sub.email,
          tokens_used: tokensUsed,
        })

        // 2f. Actualizar timestamp de último envío
        if (sendResult.success) {
          await supabase.rpc('update_digest_sent_timestamp', {
            p_subscription_id: sub.subscription_id,
            p_digest_type: 'monthly',
          })
        }

        results.push({
          email: sub.email,
          retailer: sub.retailer_nombre,
          status: sendResult.success ? 'sent' : 'failed',
          error: sendResult.error,
        })
      } catch (err) {
        console.error(`[Monthly Digest] Error processing ${sub.email}:`, err)
        results.push({
          email: sub.email,
          retailer: sub.retailer_nombre,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    const sent = results.filter((r) => r.status === 'sent').length
    const failed = results.filter((r) => r.status === 'failed').length

    console.log(`[Monthly Digest] Completed: ${sent} sent, ${failed} failed`)

    return NextResponse.json({
      message: 'Monthly digest completed',
      sent,
      failed,
      results,
    })
  } catch (error) {
    console.error('[Monthly Digest] Fatal error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
