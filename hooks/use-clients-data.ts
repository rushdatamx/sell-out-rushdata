"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

// ============================================================================
// TYPES - Interfaces para los datos de clientes
// ============================================================================

export interface ClientKPIs {
  total_clientes_activos: number
  clientes_activos_anterior: number
  variacion_activos_pct: number

  clientes_nuevos_periodo: number
  clientes_nuevos_anterior: number
  variacion_nuevos_pct: number

  clientes_en_riesgo: number
  clientes_en_riesgo_anterior: number
  variacion_riesgo_pct: number

  revenue_promedio_cliente: number
  revenue_promedio_anterior: number
  variacion_revenue_pct: number
}

export interface Client {
  cliente_id: number
  clave_cliente: string
  nombre: string
  status: "activo" | "inactivo" | "en_riesgo"
  clasificacion: string

  total_ventas_periodo: number
  total_unidades_periodo: number
  num_ordenes: number
  ticket_promedio: number

  total_ventas_anterior: number
  variacion_ventas_pct: number
  variacion_unidades_pct: number

  ultima_compra: string | null
  dias_desde_ultima_compra: number | null

  tendencia: string
  nivel_riesgo: string

  lifetime_value: number

  tipo_cliente: string
  canal: string | null
  zona: string | null
}

export interface ClientsFilters {
  fechaInicio?: string
  fechaFin?: string
  productoIds?: number[]
  clienteIds?: number[]
  search?: string
}

// ============================================================================
// HOOKS - Llamadas a RPC Functions (Backend)
// ============================================================================

/**
 * Hook para KPIs de la página de clientes
 */
export function useClientsKPIs(
  tenantId: string,
  fechaInicio?: string,
  fechaFin?: string
) {
  return useQuery({
    queryKey: ["clients-kpis", tenantId, fechaInicio, fechaFin],
    queryFn: async (): Promise<ClientKPIs> => {
      const { data, error } = await supabase.rpc("get_clients_page_kpis", {
        p_tenant_id: tenantId,
        p_fecha_inicio: fechaInicio,
        p_fecha_fin: fechaFin,
      })

      if (error) {
        console.error("Error in useClientsKPIs:", error)
        throw error
      }

      return data[0] as ClientKPIs
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2,
  })
}

/**
 * Hook para lista de clientes con filtros
 */
export function useClientsList(tenantId: string, filters: ClientsFilters = {}) {
  return useQuery({
    queryKey: ["clients-list", tenantId, filters],
    queryFn: async (): Promise<Client[]> => {
      const { data, error } = await supabase.rpc("get_clients_page_list", {
        p_tenant_id: tenantId,
        p_fecha_inicio: filters.fechaInicio,
        p_fecha_fin: filters.fechaFin,
        p_producto_ids: filters.productoIds,
        p_cliente_ids: filters.clienteIds,
        p_search: filters.search,
      })

      if (error) {
        console.error("Error in useClientsList:", error)
        throw error
      }

      return (data as Client[]) || []
    },
    staleTime: 1000 * 60 * 3, // 3 minutos
    retry: 2,
  })
}

/**
 * Hook to get list of all clients for filter dropdown
 */
export function useClientesOptions(tenantId: string) {
  return useQuery({
    queryKey: ["clientes-options", tenantId],
    queryFn: async (): Promise<{ id: number; nombre: string }[]> => {
      const { data, error } = await supabase
        .from("dim_clientes")
        .select("id, nombre_comercial")
        .eq("tenant_id", tenantId)
        .eq("activo", true)
        .order("nombre_comercial")

      if (error) {
        console.error("Error in useClientesOptions:", error)
        throw error
      }

      return (data || []).map((c) => ({ id: c.id, nombre: c.nombre_comercial }))
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
  })
}

/**
 * Hook to get list of all products for filter dropdown
 */
export function useProductosOptions(tenantId: string) {
  return useQuery({
    queryKey: ["productos-options", tenantId],
    queryFn: async (): Promise<{ id: number; nombre: string }[]> => {
      const { data, error } = await supabase
        .from("dim_productos")
        .select("id, nombre")
        .eq("tenant_id", tenantId)
        .eq("activo", true)
        .order("nombre")

      if (error) {
        console.error("Error in useProductosOptions:", error)
        throw error
      }

      return (data || []).map((p) => ({ id: p.id, nombre: p.nombre }))
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
  })
}
