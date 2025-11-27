"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

// ============================================================================
// TYPES
// ============================================================================

export interface ClientDetail {
  cliente_id: number
  clave_cliente: string
  nombre: string
  razon_social: string | null
  rfc: string | null
  tipo_cliente: string
  segmento_abc: string
  canal: string | null
  zona: string | null
  region: string | null
  estado: string | null
  ciudad: string | null
  contacto_principal: any
  dias_credito: number | null
  limite_credito: number | null
  descuento_comercial: number | null
  frecuencia_compra_dias: number | null
  ticket_promedio: number | null
  ultima_compra: string | null
  patron_compra: string | null
  tendencia: string | null
  nivel_riesgo: string | null
  lifetime_value: number
  total_ordenes: number
  activo: boolean
}

export interface SalesHistory {
  mes: string
  anio: number
  total_ventas: number
  total_unidades: number
  num_ordenes: number
}

export interface TopProduct {
  producto_id: number
  nombre_producto: string
  categoria: string
  total_ventas: number
  total_unidades: number
  num_ordenes: number
  ultima_compra: string
  porcentaje_ventas: number
}

export interface RecentOrder {
  numero_orden: string
  fecha: string
  total_ventas: number
  total_unidades: number
  num_productos: number
  estado: string
}

// ============================================================================
// HOOKS
// ============================================================================

export function useClientDetail(tenantId: string, clienteId: number | null) {
  return useQuery({
    queryKey: ["client-detail", tenantId, clienteId],
    queryFn: async (): Promise<ClientDetail | null> => {
      if (!clienteId) return null

      const { data, error } = await supabase.rpc("get_client_detail", {
        p_tenant_id: tenantId,
        p_cliente_id: clienteId,
      })

      if (error) {
        console.error("Error in useClientDetail:", error)
        throw error
      }

      return data?.[0] || null
    },
    enabled: !!clienteId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useClientSalesHistory(
  tenantId: string,
  clienteId: number | null,
  meses: number = 12
) {
  return useQuery({
    queryKey: ["client-sales-history", tenantId, clienteId, meses],
    queryFn: async (): Promise<SalesHistory[]> => {
      if (!clienteId) return []

      const { data, error } = await supabase.rpc("get_client_sales_history", {
        p_tenant_id: tenantId,
        p_cliente_id: clienteId,
        p_meses: meses,
      })

      if (error) {
        console.error("Error in useClientSalesHistory:", error)
        throw error
      }

      return (data as SalesHistory[]) || []
    },
    enabled: !!clienteId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useClientTopProducts(
  tenantId: string,
  clienteId: number | null,
  limit: number = 10
) {
  return useQuery({
    queryKey: ["client-top-products", tenantId, clienteId, limit],
    queryFn: async (): Promise<TopProduct[]> => {
      if (!clienteId) return []

      const { data, error } = await supabase.rpc("get_client_top_products", {
        p_tenant_id: tenantId,
        p_cliente_id: clienteId,
        p_limit: limit,
      })

      if (error) {
        console.error("Error in useClientTopProducts:", error)
        throw error
      }

      return (data as TopProduct[]) || []
    },
    enabled: !!clienteId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useClientRecentOrders(
  tenantId: string,
  clienteId: number | null,
  limit: number = 20
) {
  return useQuery({
    queryKey: ["client-recent-orders", tenantId, clienteId, limit],
    queryFn: async (): Promise<RecentOrder[]> => {
      if (!clienteId) return []

      const { data, error } = await supabase.rpc("get_client_recent_orders", {
        p_tenant_id: tenantId,
        p_cliente_id: clienteId,
        p_limit: limit,
      })

      if (error) {
        console.error("Error in useClientRecentOrders:", error)
        throw error
      }

      return (data as RecentOrder[]) || []
    },
    enabled: !!clienteId,
    staleTime: 1000 * 60 * 5,
  })
}
