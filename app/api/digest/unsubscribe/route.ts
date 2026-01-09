import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API para cancelar suscripción a digest
 * GET /api/digest/unsubscribe?id=subscription_id
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const subscriptionId = searchParams.get('id')

  if (!subscriptionId || subscriptionId === 'preview') {
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error - RushData</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 500px; margin: 100px auto; padding: 20px; text-align: center; }
            h1 { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1>Link invalido</h1>
          <p>Este link de cancelacion no es valido o ha expirado.</p>
          <a href="/">Volver al inicio</a>
        </body>
      </html>
      `,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    // Actualizar estado de la suscripción
    const { data, error } = await supabase
      .from('digest_subscriptions')
      .update({
        status: 'unsubscribed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
      .select('email, retailer_id')
      .single()

    if (error) {
      console.error('[Unsubscribe] Error:', error)
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Error - RushData</title>
            <style>
              body { font-family: system-ui, sans-serif; max-width: 500px; margin: 100px auto; padding: 20px; text-align: center; }
              h1 { color: #dc2626; }
            </style>
          </head>
          <body>
            <h1>Error al cancelar</h1>
            <p>No pudimos procesar tu solicitud. Por favor contacta a soporte.</p>
            <a href="/">Volver al inicio</a>
          </body>
        </html>
        `,
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    // Obtener nombre del retailer
    const { data: retailer } = await supabase
      .from('dim_retailers')
      .select('nombre')
      .eq('id', data.retailer_id)
      .single()

    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Suscripcion cancelada - RushData</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 500px; margin: 100px auto; padding: 20px; text-align: center; }
            h1 { color: #059669; }
            .box { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
            a { color: #6366f1; }
            .resubscribe { margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 8px; }
          </style>
        </head>
        <body>
          <h1>Suscripcion cancelada</h1>
          <div class="box">
            <p>Has cancelado los reportes de <strong>${retailer?.nombre || 'este retailer'}</strong> enviados a <strong>${data.email}</strong>.</p>
          </div>
          <p>Ya no recibiras mas correos de este retailer.</p>

          <div class="resubscribe">
            <p><strong>¿Cambiaste de opinion?</strong></p>
            <p>Puedes volver a activar los reportes desde la configuracion de tu cuenta en RushData.</p>
            <a href="/hub">Ir a mi cuenta</a>
          </div>
        </body>
      </html>
      `,
      { headers: { 'Content-Type': 'text/html' } }
    )
  } catch (error) {
    console.error('[Unsubscribe] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
