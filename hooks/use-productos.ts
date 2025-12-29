"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

// Types
export interface Producto {
  id: number
  upc: string
  nombre: string
  categoria: string
  marca: string
  ventas: number
  unidades: number
  precio_promedio: number
  participacion: number
  variacion: number
  ventas_anterior: number
  unidades_anterior: number
  num_tiendas: number
}

export interface Tienda {
  id: number
  nombre: string
  ciudad: string
}

export interface ProductoOption {
  id: number
  nombre: string
  upc: string
}

export interface ProductosFiltros {
  categorias: string[]
  marcas: string[]
  tiendas: Tienda[]
  productos: ProductoOption[]
  fecha_min: string
  fecha_max: string
}

export interface ProductosKpis {
  skus_activos: number
  venta_total: number
  unidades_vendidas: number
  ticket_promedio: number
  fecha_inicio: string
  fecha_fin: string
}

export interface ProductosTablaResponse {
  productos: Producto[]
  total: number
  fecha_inicio: string
  fecha_fin: string
}

export interface ParetoItem {
  nombre: string
  ventas: number
  porcentaje: number
  acumulado: number
}

export interface ParetoResponse {
  data: ParetoItem[]
  total_productos: number
  productos_80: number
}

export interface VariacionItem {
  nombre: string
  ventas_actual: number
  ventas_anterior: number
  variacion: number
}

// Hook para obtener filtros disponibles
export function useProductosFiltros(retailerId?: number | null) {
  return useQuery<ProductosFiltros>({
    queryKey: ["productos-filtros", retailerId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_productos_filtros", {
        p_retailer_id: retailerId || null,
      })
      if (error) throw error
      return data as ProductosFiltros
    },
  })
}

// Hook para obtener KPIs con filtro por fechas y arrays
export function useProductosKpis(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  categorias?: string[] | null,
  tiendaIds?: number[] | null,
  productoIds?: number[] | null,
  retailerId?: number | null
) {
  return useQuery<ProductosKpis>({
    queryKey: ["productos-kpis-v3", fechaInicio, fechaFin, categorias, tiendaIds, productoIds, retailerId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_productos_kpis_v3", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_categorias: categorias?.length ? categorias : null,
        p_tienda_ids: tiendaIds?.length ? tiendaIds : null,
        p_producto_ids: productoIds?.length ? productoIds : null,
        p_retailer_id: retailerId || null,
      })
      if (error) throw error
      return data as ProductosKpis
    },
  })
}

// Hook para obtener tabla de productos con filtro por arrays
export function useProductosTabla(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  categorias?: string[] | null,
  tiendaIds?: number[] | null,
  productoIds?: number[] | null,
  busqueda?: string | null,
  limit: number = 50,
  offset: number = 0,
  orderBy: string = "ventas",
  orderDir: string = "desc",
  retailerId?: number | null
) {
  return useQuery<ProductosTablaResponse>({
    queryKey: ["productos-tabla-v3", fechaInicio, fechaFin, categorias, tiendaIds, productoIds, busqueda, limit, offset, orderBy, orderDir, retailerId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_productos_tabla_v3", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_categorias: categorias?.length ? categorias : null,
        p_tienda_ids: tiendaIds?.length ? tiendaIds : null,
        p_producto_ids: productoIds?.length ? productoIds : null,
        p_busqueda: busqueda || null,
        p_limit: limit,
        p_offset: offset,
        p_order_by: orderBy,
        p_order_dir: orderDir,
        p_retailer_id: retailerId || null,
      })
      if (error) throw error
      return data as ProductosTablaResponse
    },
  })
}

// Hook para Pareto con filtro por arrays
export function useProductosPareto(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  categorias?: string[] | null,
  tiendaIds?: number[] | null,
  productoIds?: number[] | null,
  retailerId?: number | null
) {
  return useQuery<ParetoResponse>({
    queryKey: ["productos-pareto-v3", fechaInicio, fechaFin, categorias, tiendaIds, productoIds, retailerId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_productos_pareto_v3", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_categorias: categorias?.length ? categorias : null,
        p_tienda_ids: tiendaIds?.length ? tiendaIds : null,
        p_producto_ids: productoIds?.length ? productoIds : null,
        p_retailer_id: retailerId || null,
      })
      if (error) throw error
      return data as ParetoResponse
    },
  })
}

// Hook para Top Crecimiento/Caída con filtro por arrays
export function useProductosVariacion(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  tipo: "crecimiento" | "caida" = "crecimiento",
  categorias?: string[] | null,
  tiendaIds?: number[] | null,
  productoIds?: number[] | null,
  retailerId?: number | null
) {
  return useQuery<VariacionItem[]>({
    queryKey: ["productos-variacion-v3", fechaInicio, fechaFin, tipo, categorias, tiendaIds, productoIds, retailerId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_productos_variacion_v3", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_categorias: categorias?.length ? categorias : null,
        p_tienda_ids: tiendaIds?.length ? tiendaIds : null,
        p_producto_ids: productoIds?.length ? productoIds : null,
        p_tipo: tipo,
        p_retailer_id: retailerId || null,
      })
      if (error) throw error
      return data as VariacionItem[]
    },
  })
}
