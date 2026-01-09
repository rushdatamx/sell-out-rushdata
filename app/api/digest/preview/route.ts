import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { render } from '@react-email/components'
import { WeeklyDigestEmail } from '@/components/emails/weekly-digest'
import { MonthlyDigestEmail } from '@/components/emails/monthly-digest'
import { generateDigestInsights } from '@/lib/digest'
import type { DigestData, DigestType } from '@/lib/digest/types'

/**
 * API para previsualizar emails de digest
 * GET /api/digest/preview?tenant_id=xxx&retailer_id=1&type=weekly
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenant_id')
  const retailerId = searchParams.get('retailer_id')
  const digestType = (searchParams.get('type') || 'weekly') as DigestType
  const withInsights = searchParams.get('insights') !== 'false'

  if (!tenantId || !retailerId) {
    return NextResponse.json(
      { error: 'tenant_id and retailer_id are required' },
      { status: 400 }
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    // Obtener datos del digest
    const { data: digestData, error: dataError } = await supabase.rpc(
      'get_digest_data_for_retailer',
      {
        p_tenant_id: tenantId,
        p_retailer_id: parseInt(retailerId),
        p_digest_type: digestType,
      }
    )

    if (dataError || !digestData || digestData.error) {
      return NextResponse.json(
        { error: dataError?.message || digestData?.error || 'No data available' },
        { status: 404 }
      )
    }

    const data = digestData as DigestData

    // Generar insights con IA (opcional)
    let insights = ''
    if (withInsights) {
      try {
        const result = await generateDigestInsights(data, digestType)
        insights = result.insights
      } catch (aiError) {
        console.error('[Preview] AI error:', aiError)
        insights = '(Error generando insights con IA)'
      }
    }

    // Renderizar email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const emailComponent =
      digestType === 'weekly'
        ? WeeklyDigestEmail({
            data,
            insights,
            unsubscribeUrl: `${baseUrl}/api/digest/unsubscribe?id=preview`,
            dashboardUrl: `${baseUrl}/${data.retailer.codigo}/dashboard`,
          })
        : MonthlyDigestEmail({
            data,
            insights,
            unsubscribeUrl: `${baseUrl}/api/digest/unsubscribe?id=preview`,
            dashboardUrl: `${baseUrl}/${data.retailer.codigo}/dashboard`,
          })

    const html = await render(emailComponent)

    // Retornar HTML directamente para preview en navegador
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('[Preview] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
