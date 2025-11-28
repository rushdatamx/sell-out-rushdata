"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

// ============================================================================
// TYPES - Interfaces para los datos de productos
// ============================================================================

export interface ProductKPIs {
  total_productos_activos: number
  productos_activos_anterior: number
  variacion_activos_pct: number

  productos_nuevos_periodo: number
  productos_nuevos_anterior: number
  variacion_nuevos_pct: number

  productos_en_riesgo: number
  productos_en_riesgo_anterior: number
  variacion_riesgo_pct: number

  revenue_promedio_producto: number
  revenue_promedio_anterior: number
  variacion_revenue_pct: number
}

export interface Product {
  producto_id: number
  sku: string
  nombre: string
  status: "activo" | "inactivo" | "en_riesgo"
  clasificacion: string
  categoria: string

  total_ventas_periodo: number
  total_unidades_periodo: number
  num_clientes: number
  num_ordenes: number
  ticket_promedio: number

  total_ventas_anterior: number
  variacion_ventas_pct: number
  variacion_unidades_pct: number

  ultima_venta: string | null
  dias_desde_ultima_venta: number | null

  tendencia: string
  lifetime_value: number

  precio_venta_sugerido: number
  costo_produccion: number
}

export interface ProductsFilters {
  fechaInicio?: string
  fechaFin?: string
  clienteIds?: number[]
  categoria?: string
  search?: string
}

// ============================================================================
// HOOKS - Llamadas a RPC Functions (Backend)
// ============================================================================

/**
 * Hook para KPIs de la página de productos
 */
export function useProductsKPIs(
  tenantId: string,
  fechaInicio?: string,
  fechaFin?: string
) {
  return useQuery({
    queryKey: ["products-kpis", tenantId, fechaInicio, fechaFin],
    queryFn: async (): Promise<ProductKPIs> => {
      const { data, error } = await supabase.rpc("get_products_page_kpis", {
        p_tenant_id: tenantId,
        p_fecha_inicio: fechaInicio,
        p_fecha_fin: fechaFin,
      })

      if (error) {
        console.error("Error in useProductsKPIs:", error)
        throw error
      }

      return data[0] as ProductKPIs
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 2,
  })
}

/**
 * Hook para lista de productos con filtros
 */
export function useProductsList(tenantId: string, filters: ProductsFilters = {}) {
  return useQuery({
    queryKey: ["products-list", tenantId, filters],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase.rpc("get_products_page_list", {
        p_tenant_id: tenantId,
        p_fecha_inicio: filters.fechaInicio,
        p_fecha_fin: filters.fechaFin,
        p_cliente_ids: filters.clienteIds,
        p_categoria: filters.categoria,
        p_search: filters.search,
      })

      if (error) {
        console.error("Error in useProductsList:", error)
        throw error
      }

      return (data as Product[]) || []
    },
    staleTime: 1000 * 60 * 3, // 3 minutos
    retry: 2,
  })
}

/**
 * Hook to get list of categories for filter dropdown
 */
export function useCategoriasOptions(tenantId: string) {
  return useQuery({
    queryKey: ["categorias-options", tenantId],
    queryFn: async (): Promise<{ id: string; nombre: string }[]> => {
      const { data, error } = await supabase
        .from("dim_productos")
        .select("categoria")
        .eq("tenant_id", tenantId)
        .eq("activo", true)
        .not("categoria", "is", null)
        .order("categoria")

      if (error) {
        console.error("Error in useCategoriasOptions:", error)
        throw error
      }

      // Get unique categories, filter out nulls
      const uniqueCategories = [...new Set(data.map((p) => p.categoria).filter((cat): cat is string => cat !== null))]
      return uniqueCategories.map((cat) => ({ id: cat, nombre: cat }))
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
  })
}
