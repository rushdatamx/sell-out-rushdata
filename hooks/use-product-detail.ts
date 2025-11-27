"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

// ============================================================================
// TYPES
// ============================================================================

export interface ProductDetail {
  producto_id: number
  sku: string
  nombre: string
  descripcion: string | null
  categoria: string
  subcategoria: string | null
  linea_producto: string | null
  marca: string | null
  codigo_barras: string | null
  unidad_medida: string
  peso_kg: number | null
  piezas_por_caja: number | null
  costo_produccion: number | null
  precio_venta_sugerido: number | null
  margen_objetivo: number | null
  dias_produccion: number | null
  perecedero: boolean | null
  dias_vida_util: number | null
  ultima_venta: string | null
  lifetime_value: number
  total_clientes: number
  total_ordenes: number
  activo: boolean
}

export interface ProductSalesHistory {
  mes: string
  anio: number
  total_ventas: number
  total_unidades: number
  num_ordenes: number
  num_clientes: number
}

export interface TopClient {
  cliente_id: number
  nombre_cliente: string
  tipo_cliente: string
  total_ventas: number
  total_unidades: number
  num_ordenes: number
  ultima_compra: string
  porcentaje_ventas: number
}

export interface RecentOrder {
  numero_orden: string
  fecha: string
  cliente_nombre: string
  total_ventas: number
  unidades: number
  estado: string
}

// ============================================================================
// HOOKS
// ============================================================================

export function useProductDetail(tenantId: string, productoId: number | null) {
  return useQuery({
    queryKey: ["product-detail", tenantId, productoId],
    queryFn: async (): Promise<ProductDetail | null> => {
      if (!productoId) return null

      const { data, error } = await supabase.rpc("get_product_detail", {
        p_tenant_id: tenantId,
        p_producto_id: productoId,
      })

      if (error) {
        console.error("Error in useProductDetail:", error)
        throw error
      }

      return data?.[0] || null
    },
    enabled: !!productoId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useProductSalesHistory(
  tenantId: string,
  productoId: number | null,
  meses: number = 12
) {
  return useQuery({
    queryKey: ["product-sales-history", tenantId, productoId, meses],
    queryFn: async (): Promise<ProductSalesHistory[]> => {
      if (!productoId) return []

      const { data, error } = await supabase.rpc("get_product_sales_history", {
        p_tenant_id: tenantId,
        p_producto_id: productoId,
        p_meses: meses,
      })

      if (error) {
        console.error("Error in useProductSalesHistory:", error)
        throw error
      }

      return (data as ProductSalesHistory[]) || []
    },
    enabled: !!productoId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useProductTopClients(
  tenantId: string,
  productoId: number | null,
  limit: number = 10
) {
  return useQuery({
    queryKey: ["product-top-clients", tenantId, productoId, limit],
    queryFn: async (): Promise<TopClient[]> => {
      if (!productoId) return []

      const { data, error } = await supabase.rpc("get_product_top_clients", {
        p_tenant_id: tenantId,
        p_producto_id: productoId,
        p_limit: limit,
      })

      if (error) {
        console.error("Error in useProductTopClients:", error)
        throw error
      }

      return (data as TopClient[]) || []
    },
    enabled: !!productoId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useProductRecentOrders(
  tenantId: string,
  productoId: number | null,
  limit: number = 20
) {
  return useQuery({
    queryKey: ["product-recent-orders", tenantId, productoId, limit],
    queryFn: async (): Promise<RecentOrder[]> => {
      if (!productoId) return []

      const { data, error } = await supabase.rpc("get_product_recent_orders", {
        p_tenant_id: tenantId,
        p_producto_id: productoId,
        p_limit: limit,
      })

      if (error) {
        console.error("Error in useProductRecentOrders:", error)
        throw error
      }

      return (data as RecentOrder[]) || []
    },
    enabled: !!productoId,
    staleTime: 1000 * 60 * 5,
  })
}
