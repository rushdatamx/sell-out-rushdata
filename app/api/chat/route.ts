import { createClient } from "@supabase/supabase-js"
import Anthropic from "@anthropic-ai/sdk"
import { cookies } from "next/headers"

export const runtime = "edge"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Función para obtener el tenant_id del usuario autenticado
async function getUserTenantId(supabase: any, authHeader: string | null): Promise<string | null> {
  if (!authHeader) return null

  try {
    // Extraer el token del header
    const token = authHeader.replace("Bearer ", "")

    // Verificar el usuario con el token
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) return null

    // Obtener el tenant_id del usuario
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .single()

    if (userError || !userData) return null

    return userData.tenant_id
  } catch (e) {
    console.error("Error getting tenant_id:", e)
    return null
  }
}

const SYSTEM_PROMPT = `Eres el asistente de IA de RushData, especializado en análisis de sell-out retail para fabricantes de consumo masivo.

Tu rol es ayudar a ejecutivos de ventas y trade marketing a:
- Entender el desempeño de sus productos en punto de venta
- Identificar oportunidades de crecimiento y expansión
- Detectar problemas de inventario, quiebres de stock y precios
- Preparar juntas con ejecutivos de retailers
- Tomar decisiones basadas en datos

REGLAS IMPORTANTES:
1. SIEMPRE responde en español
2. Sé conciso pero completo - los ejecutivos tienen poco tiempo
3. USA NÚMEROS ESPECÍFICOS de los datos proporcionados
4. Sugiere ACCIONES CONCRETAS y accionables
5. Si no tienes datos suficientes para responder, indícalo claramente
6. Formatea con markdown para mejor lectura (negritas, listas, tablas)
7. Cuando hables de dinero, usa formato $X,XXX.XX
8. Redondea porcentajes a 1 decimal

FORMATO DE RESPUESTAS:
- Para resúmenes ejecutivos: usa bullets con los puntos clave
- Para rankings: usa listas numeradas
- Para comparativas: usa tablas markdown
- Para alertas: destaca con **negritas** lo urgente

CONTEXTO DEL NEGOCIO:
- Los datos son de sell-out (ventas al consumidor final en punto de venta)
- El cliente es un fabricante que vende a través de retailers (HEB, Walmart, etc.)
- Las métricas clave son: ventas, unidades, inventario, cobertura, fill rate
- Un "quiebre" es cuando el inventario llega a 0 (OOS - Out of Stock)
- La "venta perdida" es la venta que se pierde por no tener producto disponible`

export async function POST(request: Request) {
  try {
    const { message, conversationId, history = [], tenantId } = await request.json()

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Obtener contexto de datos desde Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Obtener tenant_id: primero del body, luego del header de auth
    let effectiveTenantId = tenantId
    console.log("[IA Chat] tenantId from body:", tenantId)

    if (!effectiveTenantId) {
      const authHeader = request.headers.get("authorization")
      effectiveTenantId = await getUserTenantId(supabase, authHeader)
      console.log("[IA Chat] tenantId from auth:", effectiveTenantId)
    }

    // Usar la función específica para API que acepta tenant_id
    let contextData = null
    let contextError = null

    console.log("[IA Chat] Using effectiveTenantId:", effectiveTenantId)

    if (effectiveTenantId) {
      console.log("[IA Chat] Calling get_ia_context_for_tenant...")
      const result = await supabase.rpc("get_ia_context_for_tenant", { p_tenant_id: effectiveTenantId })
      contextData = result.data
      contextError = result.error
      console.log("[IA Chat] Context result:", contextData ? "Has data" : "No data", contextError ? `Error: ${contextError.message}` : "No error")
    } else {
      // Fallback: intentar con la función original (solo funcionará si hay usuario autenticado)
      console.log("[IA Chat] No tenantId, falling back to get_ia_context...")
      const result = await supabase.rpc("get_ia_context")
      contextData = result.data
      contextError = result.error
    }

    if (contextError) {
      console.error("[IA Chat] Error getting context:", contextError)
    }

    // Construir el contexto para Claude
    const dataContext = contextData ? `
DATOS ACTUALES DEL NEGOCIO (últimos 30 días):

**Período:** ${contextData.periodo?.fecha_inicio} al ${contextData.periodo?.fecha_fin}

**KPIs Principales:**
- Ventas totales: $${contextData.kpis?.ventas_totales?.toLocaleString() || 0}
- Ventas período anterior: $${contextData.kpis?.ventas_periodo_anterior?.toLocaleString() || 0}
- Crecimiento: ${contextData.kpis?.ventas_periodo_anterior > 0 ? (((contextData.kpis?.ventas_totales - contextData.kpis?.ventas_periodo_anterior) / contextData.kpis?.ventas_periodo_anterior) * 100).toFixed(1) : 0}%
- Unidades vendidas: ${contextData.kpis?.unidades_totales?.toLocaleString() || 0}
- Tiendas activas: ${contextData.kpis?.tiendas_activas || 0}
- Productos activos: ${contextData.kpis?.productos_activos || 0}

**Top 10 Productos por Venta:**
${contextData.top_productos?.map((p: any, i: number) => `${i + 1}. ${p.producto}: $${p.ventas?.toLocaleString()} (${p.unidades} uds, ${p.tiendas} tiendas)`).join("\n") || "No hay datos"}

**Top 10 Tiendas por Venta:**
${contextData.top_tiendas?.map((t: any, i: number) => `${i + 1}. ${t.tienda} (${t.ciudad}): $${t.ventas?.toLocaleString()}`).join("\n") || "No hay datos"}

**Ventas por Ciudad:**
${contextData.ventas_por_ciudad?.map((c: any) => `- ${c.ciudad}: $${c.ventas?.toLocaleString()} (${c.tiendas} tiendas)`).join("\n") || "No hay datos"}

**Productos con Mayor Crecimiento:**
${contextData.productos_creciendo?.map((p: any) => `- ${p.producto}: +${p.crecimiento_pct}% ($${p.ventas_actual?.toLocaleString()} vs $${p.ventas_anterior?.toLocaleString()})`).join("\n") || "No hay datos"}

**Productos Cayendo:**
${contextData.productos_cayendo?.map((p: any) => `- ${p.producto}: ${p.crecimiento_pct}% ($${p.ventas_actual?.toLocaleString()} vs $${p.ventas_anterior?.toLocaleString()})`).join("\n") || "Ninguno"}

**Alertas de Inventario (Quiebres de Stock):**
${contextData.alertas_inventario?.slice(0, 10).map((a: any) => `- ${a.producto} en ${a.tienda} (${a.ciudad}): inventario ${a.inventario_actual}`).join("\n") || "Sin alertas"}

**Estacionalidad Semanal:**
${contextData.estacionalidad_semanal?.map((e: any) => `- ${e.dia}: $${e.ventas?.toLocaleString()} (${e.unidades} uds)`).join("\n") || "No hay datos"}
` : "No se pudo cargar el contexto de datos."

    // Construir mensajes para Claude
    const messages: Anthropic.MessageParam[] = [
      ...history.map((h: any) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      {
        role: "user",
        content: `${dataContext}\n\n---\n\nPREGUNTA DEL USUARIO:\n${message}`,
      },
    ]

    // Llamar a Claude con streaming
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages,
    })

    // Crear un stream de respuesta
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta") {
              const delta = event.delta
              if ("text" in delta) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta.text })}\n\n`))
              }
            }
          }

          // Enviar evento de finalización
          const finalMessage = await stream.finalMessage()
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                usage: {
                  input_tokens: finalMessage.usage.input_tokens,
                  output_tokens: finalMessage.usage.output_tokens
                }
              })}\n\n`
            )
          )
          controller.close()
        } catch (error) {
          console.error("Stream error:", error)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Error en el stream" })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response(
      JSON.stringify({ error: "Error procesando la solicitud" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
