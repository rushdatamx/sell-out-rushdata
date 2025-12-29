import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

interface ConfirmRequest {
  newsletter_id: string
  subscription_id: number
  status: "success" | "failed"
  error?: string
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

    const body: ConfirmRequest = await request.json()

    if (!body.newsletter_id || !body.subscription_id || !body.status) {
      return NextResponse.json(
        { error: "Missing required fields: newsletter_id, subscription_id, status" },
        { status: 400 }
      )
    }

    // Crear cliente Supabase con service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Actualizar registro de envío
    const { error: updateError } = await supabase
      .from("newsletter_sends")
      .update({
        estado: body.status === "success" ? "enviado" : "fallido",
        enviado_at: body.status === "success" ? new Date().toISOString() : null,
        error_mensaje: body.error || null
      })
      .eq("newsletter_id", body.newsletter_id)
      .eq("subscription_id", body.subscription_id)

    if (updateError) {
      console.error("Error updating send record:", updateError)
      return NextResponse.json(
        { error: "Error updating send record", details: updateError.message },
        { status: 500 }
      )
    }

    // 2. Verificar si todos los envíos del newsletter están completos
    const { data: pendingSends, error: pendingError } = await supabase
      .from("newsletter_sends")
      .select("id")
      .eq("newsletter_id", body.newsletter_id)
      .eq("estado", "pendiente")

    if (pendingError) {
      console.error("Error checking pending sends:", pendingError)
    }

    // Si no hay envíos pendientes, marcar newsletter como completado
    if (!pendingSends || pendingSends.length === 0) {
      // Verificar si hubo errores
      const { count: failedCount } = await supabase
        .from("newsletter_sends")
        .select("*", { count: "exact", head: true })
        .eq("newsletter_id", body.newsletter_id)
        .eq("estado", "fallido")

      const finalStatus = failedCount && failedCount > 0 ? "enviado_con_errores" : "enviado"

      await supabase
        .from("newsletters")
        .update({
          estado: finalStatus,
          enviado_at: new Date().toISOString()
        })
        .eq("id", body.newsletter_id)
    }

    return NextResponse.json({
      success: true,
      message: `Send record updated: ${body.status}`,
      newsletter_id: body.newsletter_id,
      subscription_id: body.subscription_id
    })

  } catch (error) {
    console.error("Confirm send error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

/**
 * Endpoint para marcar todos los envíos de un newsletter como completados
 * Útil para cuando n8n termina de enviar todos los emails
 */
export async function PUT(request: Request) {
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

    const body = await request.json()

    if (!body.newsletter_id) {
      return NextResponse.json(
        { error: "Missing required field: newsletter_id" },
        { status: 400 }
      )
    }

    // Crear cliente Supabase con service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Marcar todos los pendientes como enviados
    const { error: updateError } = await supabase
      .from("newsletter_sends")
      .update({
        estado: "enviado",
        enviado_at: new Date().toISOString()
      })
      .eq("newsletter_id", body.newsletter_id)
      .eq("estado", "pendiente")

    if (updateError) {
      console.error("Error bulk updating sends:", updateError)
      return NextResponse.json(
        { error: "Error updating sends", details: updateError.message },
        { status: 500 }
      )
    }

    // Marcar newsletter como enviado
    await supabase
      .from("newsletters")
      .update({
        estado: "enviado",
        enviado_at: new Date().toISOString()
      })
      .eq("id", body.newsletter_id)

    return NextResponse.json({
      success: true,
      message: "All sends marked as complete",
      newsletter_id: body.newsletter_id
    })

  } catch (error) {
    console.error("Bulk confirm error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
