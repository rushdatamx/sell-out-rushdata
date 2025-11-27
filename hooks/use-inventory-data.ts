"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

// ============================================================================
// TYPES
// ============================================================================

export interface InventoryKPIs {
  valor_inventario_total: number
  productos_total: number
  productos_criticos: number
  productos_bajos: number
  productos_optimos: number
  productos_exceso: number
  productos_sin_stock: number
  dias_cobertura_promedio: number
  rotacion_promedio: number
  ventas_perdidas_total: number
  valor_ventas_perdidas_total: number
  ordenes_produccion_pendientes: number
  fecha_ultimo_calculo: string
}

export interface InventoryAlert {
  id_producto: number
  nombre: string
  categoria: string
  tipo_alerta: string
  prioridad: string
  mensaje: string
  stock_disponible: number
  stock_minimo: number
  dias_cobertura: number
  valor_ventas_perdidas: number
  cantidad_a_producir: number
}

export interface InventoryProduct {
  id_producto: number
  nombre: string
  sku: string
  categoria: string
  stock_disponible: number
  stock_en_produccion: number
  stock_reservado: number
  stock_total: number
  stock_minimo: number
  stock_maximo: number
  punto_reorden: number
  demanda_diaria: number
  dias_cobertura: number
  dias_para_stockout: number
  estado_stock: string
  tendencia_demanda: string
  prioridad: string
  rotacion: number
  valor_inventario: number
  ventas_perdidas_30d: number
  valor_ventas_perdidas_30d: number
  cantidad_a_producir: number
  ordenes_pendientes: number
  costo_unitario: number
  fecha_produccion_sugerida: string
}

export interface InventoryTrend {
  periodo: string
  periodo_label: string
  valor_inventario_total: number
  unidades_totales: number
  productos_sin_stock: number
  productos_criticos: number
  productos_bajos: number
  productos_optimos: number
  dias_cobertura_promedio: number
  ventas_perdidas_acumuladas: number
  valor_ventas_perdidas_acumuladas: number
}

export interface InventoryCategory {
  categoria: string
  productos_total: number
  productos_sin_stock: number
  productos_criticos: number
  productos_bajos: number
  productos_optimos: number
  productos_exceso: number
  valor_inventario: number
  porcentaje_valor: number
  unidades_totales: number
  dias_cobertura_promedio: number
  ventas_perdidas_30d: number
  valor_ventas_perdidas_30d: number
  rotacion_promedio: number
  salud_categoria: string
}

export interface ProductionRecommendation {
  id_producto: number
  producto_nombre: string
  sku: string
  categoria: string
  stock_actual: number
  stock_minimo: number
  punto_reorden: number
  dias_cobertura: number
  demanda_diaria_promedio: number
  cantidad_recomendada_producir: number
  prioridad: string
  prioridad_orden: number
  razon_recomendacion: string
  ventas_perdidas_30d: number
  valor_ventas_perdidas_30d: number
  ordenes_produccion_pendientes: number
  dias_produccion: number | null
  costo_produccion_estimado: number
}

// ============================================================================
// HOOKS
// ============================================================================

export function useInventoryKPIs(tenantId: string) {
  return useQuery({
    queryKey: ["inventory-kpis", tenantId],
    queryFn: async (): Promise<InventoryKPIs | null> => {
      const { data, error } = await supabase.rpc("get_inventory_kpis", {
        p_tenant_id: tenantId,
      })

      if (error) {
        console.error("Error in useInventoryKPIs:", error)
        throw error
      }

      return data?.[0] || null
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useInventoryAlerts(
  tenantId: string,
  limit: number = 10
) {
  return useQuery({
    queryKey: ["inventory-alerts", tenantId, limit],
    queryFn: async (): Promise<InventoryAlert[]> => {
      const { data, error } = await supabase.rpc("get_inventory_alerts", {
        p_tenant_id: tenantId,
        p_limit: limit,
      })

      if (error) {
        console.error("Error in useInventoryAlerts:", error)
        throw error
      }

      return (data as unknown as InventoryAlert[]) || []
    },
    staleTime: 1000 * 60 * 2,
  })
}

export function useInventoryList(
  tenantId: string,
  filters: {
    categoria?: string
    estadoStock?: string
    search?: string
    orderBy?: string
    orderDir?: string
    limit?: number
    offset?: number
  } = {}
) {
  return useQuery({
    queryKey: ["inventory-list", tenantId, filters],
    queryFn: async (): Promise<InventoryProduct[]> => {
      const { data, error } = await supabase.rpc("get_inventory_list", {
        p_tenant_id: tenantId,
        p_categoria: filters.categoria || undefined,
        p_estado_stock: filters.estadoStock || undefined,
        p_search: filters.search || undefined,
        p_order_by: filters.orderBy || "prioridad",
        p_order_dir: filters.orderDir || "asc",
        p_limit: filters.limit || 50,
        p_offset: filters.offset || 0,
      })

      if (error) {
        console.error("Error in useInventoryList:", error)
        throw error
      }

      return (data as unknown as InventoryProduct[]) || []
    },
    staleTime: 1000 * 60 * 2,
  })
}

export function useInventoryTrends(
  tenantId: string,
  options: {
    fechaInicio?: string
    fechaFin?: string
    productoId?: number
    categoria?: string
    agrupacion?: "diario" | "semanal" | "mensual"
  } = {}
) {
  return useQuery({
    queryKey: ["inventory-trends", tenantId, options],
    queryFn: async (): Promise<InventoryTrend[]> => {
      const { data, error } = await supabase.rpc("get_inventory_trends", {
        p_tenant_id: tenantId,
        p_fecha_inicio: options.fechaInicio || undefined,
        p_fecha_fin: options.fechaFin || undefined,
        p_producto_id: options.productoId || undefined,
        p_categoria: options.categoria || undefined,
        p_agrupacion: options.agrupacion || "diario",
      })

      if (error) {
        console.error("Error in useInventoryTrends:", error)
        throw error
      }

      return (data as InventoryTrend[]) || []
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useInventoryByCategory(tenantId: string) {
  return useQuery({
    queryKey: ["inventory-by-category", tenantId],
    queryFn: async (): Promise<InventoryCategory[]> => {
      const { data, error } = await supabase.rpc("get_inventory_by_category", {
        p_tenant_id: tenantId,
      })

      if (error) {
        console.error("Error in useInventoryByCategory:", error)
        throw error
      }

      return (data as InventoryCategory[]) || []
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useProductionRecommendations(
  tenantId: string,
  limit: number = 20
) {
  return useQuery({
    queryKey: ["production-recommendations", tenantId, limit],
    queryFn: async (): Promise<ProductionRecommendation[]> => {
      const { data, error } = await supabase.rpc("get_inventory_production_recommendations", {
        p_tenant_id: tenantId,
        p_limit: limit,
      })

      if (error) {
        console.error("Error in useProductionRecommendations:", error)
        throw error
      }

      return (data as ProductionRecommendation[]) || []
    },
    staleTime: 1000 * 60 * 5,
  })
}
