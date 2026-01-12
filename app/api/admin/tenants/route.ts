import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/admin/tenants
 *
 * Obtiene lista de tenants con sus retailers que tienen datos.
 * Usa service_role key para bypass de RLS.
 */
export async function GET() {
  // Usar service_role si disponible, sino anon key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Missing Supabase configuration' },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Query SQL directa para obtener tenants con retailers en una sola consulta
    const { data, error } = await supabase.rpc('get_admin_tenants_with_retailers')

    if (error) {
      // Si la función no existe, usar fallback con queries separadas
      console.log('[Admin Tenants] RPC no existe, usando fallback:', error.message)
      return await getFallbackTenants(supabase)
    }

    return NextResponse.json({ tenants: data || [] })
  } catch (error) {
    console.error('[Admin Tenants] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}

// Fallback usando queries directas
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getFallbackTenants(supabase: any) {
  // 1. Obtener tenants activos
  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('id, nombre_empresa, contacto_email')
    .eq('estado', 'activo')
    .order('nombre_empresa')

  if (tenantsError) {
    console.error('[Admin Tenants] Error tenants:', tenantsError)
    return NextResponse.json({ error: tenantsError.message }, { status: 500 })
  }

  if (!tenants || tenants.length === 0) {
    return NextResponse.json({ tenants: [] })
  }

  // 2. Obtener todos los retailers
  const { data: allRetailers } = await supabase
    .from('dim_retailers')
    .select('id, codigo, nombre')
    .eq('activo', true)
    .order('nombre')

  const retailersMap = new Map(
    (allRetailers || []).map((r: { id: number; codigo: string; nombre: string }) => [r.id, r])
  )

  // 3. Para cada tenant, obtener retailers únicos de fact_ventas
  const tenantsWithRetailers = await Promise.all(
    tenants.map(async (tenant: { id: string; nombre_empresa: string; contacto_email: string }) => {
      // Query con DISTINCT para obtener retailer_ids únicos
      const { data: ventasData, error: ventasError } = await supabase
        .from('fact_ventas')
        .select('retailer_id')
        .eq('tenant_id', tenant.id)
        .limit(5000)

      if (ventasError) {
        console.error(`[Admin Tenants] Error ventas para ${tenant.nombre_empresa}:`, ventasError)
      }

      const uniqueRetailerIds = [...new Set((ventasData || []).map((v: { retailer_id: number }) => v.retailer_id))]
      const retailers = uniqueRetailerIds
        .map((id) => retailersMap.get(id))
        .filter((r): r is { id: number; codigo: string; nombre: string } => r !== undefined)

      return {
        id: tenant.id,
        nombre: tenant.nombre_empresa,
        email: tenant.contacto_email,
        retailers,
      }
    })
  )

  // Filtrar solo tenants que tienen retailers con datos
  const tenantsConDatos = tenantsWithRetailers.filter((t) => t.retailers.length > 0)

  return NextResponse.json({ tenants: tenantsConDatos })
}
