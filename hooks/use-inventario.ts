"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

// Types
export interface TiendaOption {
  id: number
  nombre: string
  ciudad: string
}

export interface ProductoOption {
  id: number
  nombre: string
  upc: string
}

export interface InventarioFiltros {
  ciudades: string[]
  tiendas: TiendaOption[]
  productos: ProductoOption[]
  fecha_min: string
  fecha_max: string
}

export interface InventarioKpis {
  total_registros: number
  registros_oos: number
  pct_oos: number
  venta_perdida_estimada: number
  skus_criticos: number
  tiendas_afectadas: number
  fecha_inicio: string
  fecha_fin: string
}

export interface InventarioItem {
  producto_id: number
  producto_nombre: string
  upc: string
  tienda_id: number
  tienda_nombre: string
  ciudad: string
  inventario_actual: number
  dias_oos: number
  dias_totales: number
  venta_perdida: number
  estado: "ok" | "bajo" | "oos"
}

export interface InventarioTablaResponse {
  data: InventarioItem[]
  total: number
  fecha_inicio: string
  fecha_fin: string
}

export interface HeatmapData {
  productos: string[]
  tiendas: string[]
  datos: {
    producto: string
    tienda: string
    dias_oos: number
    dias_totales: number
  }[]
}

export interface EvolucionItem {
  fecha: string
  inventario: number
  tiendas_oos: number
}

export interface AlertaItem {
  producto: string
  tienda: string
  ciudad: string
  dias_oos: number
  venta_perdida: number
  severidad: "critico" | "alto" | "medio"
}

export interface VentaPerdidaItem {
  producto: string
  dias_oos: number
  tiendas_afectadas: number
  venta_perdida: number
}

// Hook para obtener filtros disponibles
export function useInventarioFiltros(retailerId?: number | null) {
  return useQuery<InventarioFiltros>({
    queryKey: ["inventario-filtros", retailerId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_inventario_filtros", {
        p_retailer_id: retailerId || null,
      })
      if (error) throw error
      return data as InventarioFiltros
    },
  })
}

// Hook para obtener KPIs
export function useInventarioKpis(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  ciudades?: string[] | null,
  tiendaIds?: number[] | null,
  productoIds?: number[] | null,
  retailerId?: number | null
) {
  return useQuery<InventarioKpis>({
    queryKey: ["inventario-kpis", fechaInicio, fechaFin, ciudades, tiendaIds, productoIds, retailerId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_inventario_kpis", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_ciudades: ciudades?.length ? ciudades : null,
        p_tienda_ids: tiendaIds?.length ? tiendaIds : null,
        p_producto_ids: productoIds?.length ? productoIds : null,
        p_retailer_id: retailerId || null,
      })
      if (error) throw error
      return data as InventarioKpis
    },
  })
}

// Hook para obtener tabla de inventario
export function useInventarioTabla(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  ciudades?: string[] | null,
  tiendaIds?: number[] | null,
  productoIds?: number[] | null,
  estado?: string | null,
  busqueda?: string | null,
  limit: number = 50,
  offset: number = 0,
  orderBy: string = "dias_oos",
  orderDir: string = "desc",
  retailerId?: number | null
) {
  return useQuery<InventarioTablaResponse>({
    queryKey: ["inventario-tabla", fechaInicio, fechaFin, ciudades, tiendaIds, productoIds, estado, busqueda, limit, offset, orderBy, orderDir, retailerId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_inventario_tabla", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_ciudades: ciudades?.length ? ciudades : null,
        p_tienda_ids: tiendaIds?.length ? tiendaIds : null,
        p_producto_ids: productoIds?.length ? productoIds : null,
        p_estado: estado || null,
        p_busqueda: busqueda || null,
        p_limit: limit,
        p_offset: offset,
        p_order_by: orderBy,
        p_order_dir: orderDir,
        p_retailer_id: retailerId || null,
      })
      if (error) throw error
      return data as InventarioTablaResponse
    },
  })
}

// Hook para heatmap de OOS
export function useInventarioHeatmap(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  ciudades?: string[] | null,
  productoIds?: number[] | null,
  retailerId?: number | null
) {
  return useQuery<HeatmapData>({
    queryKey: ["inventario-heatmap", fechaInicio, fechaFin, ciudades, productoIds, retailerId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_inventario_heatmap", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_ciudades: ciudades?.length ? ciudades : null,
        p_producto_ids: productoIds?.length ? productoIds : null,
        p_retailer_id: retailerId || null,
      })
      if (error) throw error
      return data as HeatmapData
    },
  })
}

// Hook para evolución de inventario
export function useInventarioEvolucion(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  productoId?: number | null,
  tiendaId?: number | null,
  retailerId?: number | null
) {
  return useQuery<EvolucionItem[]>({
    queryKey: ["inventario-evolucion", fechaInicio, fechaFin, productoId, tiendaId, retailerId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_inventario_evolucion", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_producto_id: productoId || null,
        p_tienda_id: tiendaId || null,
        p_retailer_id: retailerId || null,
      })
      if (error) throw error
      return (data || []) as EvolucionItem[]
    },
  })
}

// Hook para alertas de inventario
export function useInventarioAlertas(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  limit: number = 10,
  retailerId?: number | null
) {
  return useQuery<AlertaItem[]>({
    queryKey: ["inventario-alertas", fechaInicio, fechaFin, limit, retailerId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_inventario_alertas", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_limit: limit,
        p_retailer_id: retailerId || null,
      })
      if (error) throw error
      return (data || []) as AlertaItem[]
    },
  })
}

// Hook para top productos con venta perdida
export function useInventarioTopVentaPerdida(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  ciudades?: string[] | null,
  limit: number = 10,
  retailerId?: number | null
) {
  return useQuery<VentaPerdidaItem[]>({
    queryKey: ["inventario-top-venta-perdida", fechaInicio, fechaFin, ciudades, limit, retailerId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_inventario_top_venta_perdida", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_ciudades: ciudades?.length ? ciudades : null,
        p_limit: limit,
        p_retailer_id: retailerId || null,
      })
      if (error) throw error
      return (data || []) as VentaPerdidaItem[]
    },
  })
}
