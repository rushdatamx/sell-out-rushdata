import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { render } from '@react-email/components'
import { WeeklyDigestEmail } from '@/components/emails/weekly-digest'
import { sendDigestEmail } from '@/lib/digest'
import type { ActiveSubscription, DigestData } from '@/lib/digest/types'

// Configuración para Vercel Cron - ejecutar máximo 5 minutos
export const maxDuration = 300

// Clave secreta para proteger el endpoint (configurar en env)
const CRON_SECRET = process.env.CRON_SECRET || 'development-secret'

// Mapeo de códigos de retailer a IDs
const RETAILER_IDS: Record<string, number> = {
  heb: 1,
  walmart: 2,
  soriana: 3,
  merco: 4,
  fahorro: 5,
  fda: 5,
}

export async function GET(request: Request) {
  // Verificar autenticación del cron job
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    // En desarrollo, permitir sin auth
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // Obtener retailer del query param (para filtrar por retailer específico)
  const { searchParams } = new URL(request.url)
  const retailerParam = searchParams.get('retailer')?.toLowerCase()
  const filterRetailerId = retailerParam ? RETAILER_IDS[retailerParam] : null

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
    // 1. Obtener suscripciones activas para digest semanal
    const { data: subscriptions, error: subError } = await supabase.rpc(
      'get_active_digest_subscriptions',
      { p_digest_type: 'weekly' }
    )

    if (subError) {
      console.error('[Weekly Digest] Error fetching subscriptions:', subError)
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[Weekly Digest] No active subscriptions found')
      return NextResponse.json({ message: 'No active subscriptions', sent: 0 })
    }

    // Filtrar por retailer si se especificó
    let filteredSubs = subscriptions as ActiveSubscription[]
    if (filterRetailerId) {
      filteredSubs = filteredSubs.filter((sub) => sub.retailer_id === filterRetailerId)
      console.log(`[Weekly Digest] Filtered to retailer_id=${filterRetailerId}: ${filteredSubs.length} subscriptions`)
    }

    if (filteredSubs.length === 0) {
      return NextResponse.json({
        message: `No subscriptions for retailer: ${retailerParam}`,
        sent: 0
      })
    }

    console.log(`[Weekly Digest] Processing ${filteredSubs.length} subscriptions`)

    // 2. Procesar cada suscripción
    for (const sub of filteredSubs) {
      try {
        console.log(`[Weekly Digest] Processing ${sub.email} for ${sub.retailer_nombre}`)

        // 2a. Obtener datos del digest
        const { data: digestData, error: dataError } = await supabase.rpc(
          'get_digest_data_for_retailer',
          {
            p_tenant_id: sub.tenant_id,
            p_retailer_id: sub.retailer_id,
            p_digest_type: 'weekly',
          }
        )

        if (dataError || !digestData || digestData.error) {
          console.error(`[Weekly Digest] Error getting data for ${sub.email}:`, dataError || digestData?.error)
          results.push({
            email: sub.email,
            retailer: sub.retailer_nombre,
            status: 'failed',
            error: dataError?.message || digestData?.error || 'No data',
          })
          continue
        }

        const data = digestData as DigestData

        // 2b. Renderizar email (sin insights de IA)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://retail.rushdata.com.mx'
        const emailHtml = await render(
          WeeklyDigestEmail({
            data,
            insights: '', // Sin insights de IA
            unsubscribeUrl: `${baseUrl}/api/digest/unsubscribe?id=${sub.subscription_id}`,
            dashboardUrl: `${baseUrl}/${sub.retailer_codigo}/dashboard`,
          })
        )

        // 2c. Enviar email
        const subject = `Resumen semanal ${sub.retailer_nombre} - ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`
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
          digest_type: 'weekly',
          status: sendResult.success ? 'sent' : 'failed',
          subject,
          metrics_snapshot: data,
          ai_insights: null,
          error_message: sendResult.error || null,
          resend_message_id: sendResult.messageId || null,
          email_to: sub.email,
          tokens_used: 0,
        })

        // 2e. Actualizar timestamp de último envío
        if (sendResult.success) {
          await supabase.rpc('update_digest_sent_timestamp', {
            p_subscription_id: sub.subscription_id,
            p_digest_type: 'weekly',
          })
        }

        results.push({
          email: sub.email,
          retailer: sub.retailer_nombre,
          status: sendResult.success ? 'sent' : 'failed',
          error: sendResult.error,
        })
      } catch (err) {
        console.error(`[Weekly Digest] Error processing ${sub.email}:`, err)
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

    console.log(`[Weekly Digest] Completed: ${sent} sent, ${failed} failed`)

    return NextResponse.json({
      message: 'Weekly digest completed',
      sent,
      failed,
      results,
    })
  } catch (error) {
    console.error('[Weekly Digest] Fatal error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
