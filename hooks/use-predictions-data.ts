"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

// ============================================================================
// TYPES
// ============================================================================

export interface PredictionsKPIs {
  pedidos_proximos_7d: number
  valor_proximos_7d: number
  pedidos_proximos_30d: number
  valor_proximos_30d: number
  clientes_atrasados: number
  valor_atrasados: number
  total_predicciones: number
  confianza_promedio: number
}

export interface PredictionAlert {
  id: number
  id_cliente: number
  cliente_nombre: string
  tipo_cliente: string
  id_producto: number
  producto_nombre: string
  categoria: string
  fecha_ultima_compra: string
  fecha_proxima_compra: string
  dias_restantes: number
  dias_atraso: number
  cantidad_estimada: number
  valor_estimado: number
  nivel_confianza: string
  estado_alerta: string
}

export interface PredictionByClient {
  id_cliente: number
  cliente_nombre: string
  tipo_cliente: string
  segmento_abc: string
  ultima_compra_general: string
  proxima_compra_mas_cercana: string
  dias_hasta_proxima: number
  productos_esperados: number
  productos_atrasados: number
  cantidad_total_estimada: number
  valor_total_estimado: number
  confianza_promedio: number
}

export interface PredictionClientDetail {
  id: number
  id_producto: number
  producto_nombre: string
  sku: string
  categoria: string
  fecha_ultima_compra: string
  cantidad_ultima_compra: number
  fecha_proxima_compra: string
  dias_restantes: number
  frecuencia_promedio_dias: number
  cantidad_promedio: number
  cantidad_estimada: number
  valor_estimado: number
  nivel_confianza: string
  estado_alerta: string
  numero_compras_historicas: number
}

export interface PredictionByProduct {
  id_producto: number
  producto_nombre: string
  sku: string
  categoria: string
  clientes_esperados_7d: number
  clientes_esperados_30d: number
  cantidad_esperada_7d: number
  cantidad_esperada_30d: number
  valor_esperado_7d: number
  valor_esperado_30d: number
  stock_disponible: number
  stock_suficiente_7d: boolean
  stock_suficiente_30d: boolean
  deficit_7d: number
  deficit_30d: number
}

export interface PredictionCalendarDay {
  fecha: string
  pedidos_esperados: number
  clientes_unicos: number
  productos_unicos: number
  cantidad_total_esperada: number
  valor_total_esperado: number
  pedidos_alta_confianza: number
  pedidos_media_confianza: number
  pedidos_baja_confianza: number
}

export interface PredictionCalendarDayDetail {
  id: number
  id_cliente: number
  cliente_nombre: string
  tipo_cliente: string
  id_producto: number
  producto_nombre: string
  sku: string
  categoria: string
  cantidad_estimada: number
  valor_estimado: number
  nivel_confianza: string
  frecuencia_promedio_dias: number
  numero_compras_historicas: number
}

// ============================================================================
// HOOKS
// ============================================================================

export function usePredictionsKPIs(tenantId: string) {
  return useQuery({
    queryKey: ["predictions-kpis", tenantId],
    queryFn: async (): Promise<PredictionsKPIs | null> => {
      const { data, error } = await supabase.rpc("get_predictions_kpis", {
        p_tenant_id: tenantId,
      })

      if (error) {
        console.error("Error in usePredictionsKPIs:", error)
        throw error
      }

      return (data as unknown as PredictionsKPIs[])?.[0] || null
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function usePredictionsAlerts(tenantId: string, limit: number = 20) {
  return useQuery({
    queryKey: ["predictions-alerts", tenantId, limit],
    queryFn: async (): Promise<PredictionAlert[]> => {
      const { data, error } = await supabase.rpc("get_predictions_alerts", {
        p_tenant_id: tenantId,
        p_limit: limit,
      })

      if (error) {
        console.error("Error in usePredictionsAlerts:", error)
        throw error
      }

      return (data as unknown as PredictionAlert[]) || []
    },
    staleTime: 1000 * 60 * 2,
  })
}

export function usePredictionsByClient(
  tenantId: string,
  filters: {
    estadoAlerta?: string
    search?: string
    limit?: number
    offset?: number
  } = {}
) {
  return useQuery({
    queryKey: ["predictions-by-client", tenantId, filters],
    queryFn: async (): Promise<PredictionByClient[]> => {
      const { data, error } = await supabase.rpc("get_predictions_by_client", {
        p_tenant_id: tenantId,
        p_estado_alerta: filters.estadoAlerta || undefined,
        p_search: filters.search || undefined,
        p_limit: filters.limit || 50,
        p_offset: filters.offset || 0,
      })

      if (error) {
        console.error("Error in usePredictionsByClient:", error)
        throw error
      }

      return (data as unknown as PredictionByClient[]) || []
    },
    staleTime: 1000 * 60 * 2,
  })
}

export function usePredictionsClientDetail(
  tenantId: string,
  clienteId: number | null
) {
  return useQuery({
    queryKey: ["predictions-client-detail", tenantId, clienteId],
    queryFn: async (): Promise<PredictionClientDetail[]> => {
      if (!clienteId) return []

      const { data, error } = await supabase.rpc("get_predictions_client_detail", {
        p_tenant_id: tenantId,
        p_cliente_id: clienteId,
      })

      if (error) {
        console.error("Error in usePredictionsClientDetail:", error)
        throw error
      }

      return (data as unknown as PredictionClientDetail[]) || []
    },
    enabled: !!clienteId,
    staleTime: 1000 * 60 * 2,
  })
}

export function usePredictionsByProduct(tenantId: string, diasHorizonte: number = 30) {
  return useQuery({
    queryKey: ["predictions-by-product", tenantId, diasHorizonte],
    queryFn: async (): Promise<PredictionByProduct[]> => {
      const { data, error } = await supabase.rpc("get_predictions_by_product", {
        p_tenant_id: tenantId,
        p_dias_horizonte: diasHorizonte,
      })

      if (error) {
        console.error("Error in usePredictionsByProduct:", error)
        throw error
      }

      return (data as unknown as PredictionByProduct[]) || []
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function usePredictionsCalendar(
  tenantId: string,
  fechaInicio?: string,
  fechaFin?: string
) {
  return useQuery({
    queryKey: ["predictions-calendar", tenantId, fechaInicio, fechaFin],
    queryFn: async (): Promise<PredictionCalendarDay[]> => {
      const { data, error } = await supabase.rpc("get_predictions_calendar", {
        p_tenant_id: tenantId,
        p_fecha_inicio: fechaInicio || undefined,
        p_fecha_fin: fechaFin || undefined,
      })

      if (error) {
        console.error("Error in usePredictionsCalendar:", error)
        throw error
      }

      return (data as unknown as PredictionCalendarDay[]) || []
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function usePredictionsCalendarDayDetail(
  tenantId: string,
  fecha: string | null
) {
  return useQuery({
    queryKey: ["predictions-calendar-day-detail", tenantId, fecha],
    queryFn: async (): Promise<PredictionCalendarDayDetail[]> => {
      if (!fecha) return []

      const { data, error } = await supabase.rpc("get_predictions_calendar_day_detail", {
        p_tenant_id: tenantId,
        p_fecha: fecha,
      })

      if (error) {
        console.error("Error in usePredictionsCalendarDayDetail:", error)
        throw error
      }

      return (data as unknown as PredictionCalendarDayDetail[]) || []
    },
    enabled: !!fecha,
    staleTime: 1000 * 60 * 2,
  })
}
