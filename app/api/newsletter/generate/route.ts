import { createClient } from "@supabase/supabase-js"
import Anthropic from "@anthropic-ai/sdk"
import { markdownToHtml } from "@/lib/newsletter/markdown-to-html"
import { NextResponse } from "next/server"

// Newsletter system prompt para generar contenido estilo Spotify Wrapped
const NEWSLETTER_SYSTEM_PROMPT = `Eres el editor de newsletters de RushData. Tu tarea es crear un resumen ejecutivo semanal de sell-out estilo "Spotify Wrapped" que sea:

ESTILO:
- Conciso (máx 400 palabras)
- Celebratorio cuando hay logros
- Directo cuando hay problemas
- Con emojis estratégicos (usa estos: 🏆 🚀 ⚠️ 📈 📉 ⭐ 💡 🏪 📦 💰)
- Tono profesional pero amigable
- En español mexicano

ESTRUCTURA OBLIGATORIA:
1. **Titular impactante** - Una línea con el insight principal de la semana
2. **Tu semana en números** - 3-4 KPIs clave (venta, unidades, tiendas, variación)
3. **Producto estrella** - El #1 en ventas y por qué destaca
4. **Alerta importante** - Si hay productos en riesgo de inventario, mencionarlos
5. **Top 3 tiendas** - Mencionar brevemente las mejores
6. **Recomendación de la semana** - Una acción concreta y accionable

FORMATO:
- Usa markdown
- Números siempre formateados con comas ($X,XXX)
- Porcentajes con 1 decimal y signo (+/-)
- NO uses tablas complejas, solo listas
- Si la variación es negativa, sé constructivo pero honesto
- Si hay alertas de inventario SIN_STOCK o CRITICO, ponlas con énfasis

RESPONDE SOLO EN ESPAÑOL.`

export const runtime = "nodejs"
export const maxDuration = 60

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

    // Crear cliente Anthropic
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!
    })

    // Obtener parámetros opcionales del body
    const body = await request.json().catch(() => ({}))
    const tenantIdFilter = body.tenant_id // Opcional: generar solo para un tenant
    const dias = body.dias || 7

    // 1. Obtener tenants activos
    let tenantsQuery = supabase
      .from("tenants")
      .select("id, nombre_empresa")
      .eq("estado", "activo")

    if (tenantIdFilter) {
      tenantsQuery = tenantsQuery.eq("id", tenantIdFilter)
    }

    const { data: tenants, error: tenantsError } = await tenantsQuery

    if (tenantsError) {
      console.error("Error fetching tenants:", tenantsError)
      return NextResponse.json(
        { error: "Error fetching tenants", details: tenantsError.message },
        { status: 500 }
      )
    }

    if (!tenants || tenants.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        message: "No active tenants found"
      })
    }

    const results = []
    const errors = []

    for (const tenant of tenants) {
      try {
        // 2. Verificar que el tenant tenga suscriptores activos
        const { count: subscriberCount } = await supabase
          .from("newsletter_subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenant.id)
          .eq("activo", true)
          .eq("frecuencia", "semanal")

        if (!subscriberCount || subscriberCount === 0) {
          results.push({
            tenant_id: tenant.id,
            tenant: tenant.nombre_empresa,
            status: "skipped",
            reason: "No active subscribers"
          })
          continue
        }

        // 3. Obtener métricas
        const { data: metricas, error: metricasError } = await supabase.rpc(
          "get_newsletter_metrics",
          {
            p_tenant_id: tenant.id,
            p_dias: dias
          }
        )

        if (metricasError) {
          throw new Error(`Metrics error: ${metricasError.message}`)
        }

        // Verificar que haya datos de venta
        if (!metricas || metricas.resumen_global?.venta_total === 0) {
          results.push({
            tenant_id: tenant.id,
            tenant: tenant.nombre_empresa,
            status: "skipped",
            reason: "No sales data for period"
          })
          continue
        }

        // 4. Generar contenido con IA
        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: NEWSLETTER_SYSTEM_PROMPT,
          messages: [{
            role: "user",
            content: `Genera el newsletter semanal para ${tenant.nombre_empresa}.

Aquí están las métricas de la semana del ${metricas.periodo.inicio} al ${metricas.periodo.fin}:

${JSON.stringify(metricas, null, 2)}`
          }]
        })

        const contenidoMarkdown = message.content[0].type === "text"
          ? message.content[0].text
          : ""

        if (!contenidoMarkdown) {
          throw new Error("Empty response from AI")
        }

        // 5. Convertir a HTML
        const contenidoHtml = markdownToHtml(contenidoMarkdown)

        // 6. Guardar newsletter
        const { data: newsletter, error: insertError } = await supabase
          .from("newsletters")
          .insert({
            tenant_id: tenant.id,
            periodo_inicio: metricas.periodo.inicio,
            periodo_fin: metricas.periodo.fin,
            tipo: "semanal",
            contenido_markdown: contenidoMarkdown,
            contenido_html: contenidoHtml,
            metricas_json: metricas,
            generado_con: "claude-sonnet-4",
            estado: "generado"
          })
          .select("id")
          .single()

        if (insertError) {
          throw new Error(`Insert error: ${insertError.message}`)
        }

        results.push({
          tenant_id: tenant.id,
          tenant: tenant.nombre_empresa,
          newsletter_id: newsletter.id,
          status: "generated",
          periodo: `${metricas.periodo.inicio} al ${metricas.periodo.fin}`,
          venta_total: metricas.resumen_global.venta_total,
          variacion_pct: metricas.resumen_global.variacion_pct
        })

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        console.error(`Error generating newsletter for ${tenant.nombre_empresa}:`, error)
        errors.push({
          tenant_id: tenant.id,
          tenant: tenant.nombre_empresa,
          error: errorMessage
        })
      }
    }

    return NextResponse.json({
      success: true,
      generated: results.filter(r => r.status === "generated").length,
      skipped: results.filter(r => r.status === "skipped").length,
      errors: errors.length,
      results,
      ...(errors.length > 0 && { error_details: errors })
    })

  } catch (error) {
    console.error("Newsletter generation error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
