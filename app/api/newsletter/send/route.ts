import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

interface NewsletterRow {
  id: string
  tenant_id: string
  contenido_html: string | null
  contenido_markdown: string
  periodo_inicio: string
  periodo_fin: string
  tenants: { nombre_empresa: string }[] | { nombre_empresa: string } | null
}

interface Subscriber {
  id: number
  email: string
  nombre: string | null
}

export async function POST(request: Request) {
  try {
    // Verificar API key
    const authHeader = request.headers.get("authorization")
    const apiKey = process.env.NEWSLETTER_API_KEY

    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Crear cliente Supabase con service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Obtener parámetros opcionales del body
    const body = await request.json().catch(() => ({}))
    const newsletterIdFilter = body.newsletter_id // Opcional: enviar solo un newsletter específico

    // 1. Obtener newsletters pendientes (estado = 'generado')
    let newslettersQuery = supabase
      .from("newsletters")
      .select(`
        id,
        tenant_id,
        contenido_html,
        contenido_markdown,
        periodo_inicio,
        periodo_fin,
        tenants(nombre_empresa)
      `)
      .eq("estado", "generado")
      .order("created_at", { ascending: true })

    if (newsletterIdFilter) {
      newslettersQuery = newslettersQuery.eq("id", newsletterIdFilter)
    }

    const { data: newsletters, error: newslettersError } = await newslettersQuery

    if (newslettersError) {
      console.error("Error fetching newsletters:", newslettersError)
      return NextResponse.json(
        { error: "Error fetching newsletters", details: newslettersError.message },
        { status: 500 }
      )
    }

    if (!newsletters || newsletters.length === 0) {
      return NextResponse.json({
        success: true,
        emails: [],
        total: 0,
        message: "No pending newsletters to send"
      })
    }

    const emailsToSend = []
    const processedNewsletters = []

    for (const newsletterRow of newsletters) {
      const newsletter = newsletterRow as NewsletterRow

      // 2. Obtener suscriptores del tenant
      const { data: suscriptores, error: subsError } = await supabase
        .from("newsletter_subscriptions")
        .select("id, email, nombre")
        .eq("tenant_id", newsletter.tenant_id)
        .eq("activo", true)
        .eq("frecuencia", "semanal")

      if (subsError) {
        console.error(`Error fetching subscribers for tenant ${newsletter.tenant_id}:`, subsError)
        continue
      }

      if (!suscriptores || suscriptores.length === 0) {
        // Marcar como enviado si no hay suscriptores
        await supabase
          .from("newsletters")
          .update({
            estado: "enviado",
            enviado_at: new Date().toISOString()
          })
          .eq("id", newsletter.id)
        continue
      }

      // Extraer nombre del tenant (puede ser array o objeto dependiendo de Supabase)
      const tenantsData = newsletter.tenants
      const tenantName = Array.isArray(tenantsData)
        ? tenantsData[0]?.nombre_empresa
        : tenantsData?.nombre_empresa || "Cliente"

      for (const sub of suscriptores as Subscriber[]) {
        // 3. Crear registro de envío pendiente
        const { error: sendError } = await supabase
          .from("newsletter_sends")
          .insert({
            newsletter_id: newsletter.id,
            subscription_id: sub.id,
            email: sub.email,
            estado: "pendiente"
          })

        if (sendError) {
          console.error(`Error creating send record for ${sub.email}:`, sendError)
          continue
        }

        // 4. Agregar a la lista de emails para n8n
        emailsToSend.push({
          newsletter_id: newsletter.id,
          subscription_id: sub.id,
          to: sub.email,
          to_name: sub.nombre || sub.email.split("@")[0],
          subject: `📊 Tu resumen semanal - ${tenantName}`,
          html: newsletter.contenido_html || newsletter.contenido_markdown,
          text: newsletter.contenido_markdown,
          periodo: `${newsletter.periodo_inicio} al ${newsletter.periodo_fin}`,
          tenant: tenantName
        })
      }

      // 5. Marcar newsletter como "en proceso" (se marcará como enviado cuando n8n confirme)
      await supabase
        .from("newsletters")
        .update({ estado: "enviando" })
        .eq("id", newsletter.id)

      processedNewsletters.push({
        newsletter_id: newsletter.id,
        tenant: tenantName,
        subscribers: suscriptores.length
      })
    }

    return NextResponse.json({
      success: true,
      emails: emailsToSend,
      total: emailsToSend.length,
      newsletters_processed: processedNewsletters.length,
      details: processedNewsletters
    })

  } catch (error) {
    console.error("Newsletter send error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
