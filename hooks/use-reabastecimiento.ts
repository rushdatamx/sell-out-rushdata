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
  categoria: string
}

export interface ReabastecimientoFiltros {
  ciudades: string[]
  tiendas: TiendaOption[]
  productos: ProductoOption[]
  prioridades: string[]
  clasificaciones: string[]
}

export interface ReabastecimientoKpis {
  fill_rate: number
  cobertura: number
  dias_inventario_prom: number
  sugerido_total: number
  productos_urgentes: number
  productos_pronto: number
  productos_clase_a_oos: number
  venta_perdida_total: number
  fecha_inicio: string
  fecha_fin: string
}

export interface ReabastecimientoItem {
  producto_id: number
  producto_nombre: string
  tienda_id: number
  tienda_nombre: string
  ciudad: string
  clasificacion_abc: "A" | "B" | "C"
  inv_actual: number
  venta_diaria: number
  tendencia_pct: number
  dias_inventario: number
  sugerido_compra: number
  prioridad: "URGENTE" | "PRONTO" | "OK"
}

export interface ReabastecimientoTablaResponse {
  data: ReabastecimientoItem[]
  total: number
  fecha_inicio: string
  fecha_fin: string
}

export interface FillRateItem {
  producto: string
  dias_totales: number
  dias_con_stock: number
  dias_sin_stock: number
  fill_rate: number
}

export interface ABCItem {
  producto: string
  venta: number
  pct_venta: number
  pct_acumulado: number
  clasificacion: "A" | "B" | "C"
}

export interface TendenciaData {
  creciendo: TendenciaItem[]
  cayendo: TendenciaItem[]
}

export interface TendenciaItem {
  producto: string
  venta_actual: number
  venta_anterior: number
  tendencia_pct: number
}

export interface AlertaClaseAItem {
  producto: string
  tienda: string
  ciudad: string
  dias_oos: number
  venta_perdida_est: number
}

// Hook para obtener filtros disponibles
export function useReabastecimientoFiltros() {
  return useQuery<ReabastecimientoFiltros>({
    queryKey: ["reabastecimiento-filtros"],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_reabastecimiento_filtros")
      if (error) throw error
      return data as ReabastecimientoFiltros
    },
  })
}

// Hook para obtener KPIs
export function useReabastecimientoKpis(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  ciudades?: string[] | null,
  productoIds?: number[] | null
) {
  return useQuery<ReabastecimientoKpis>({
    queryKey: ["reabastecimiento-kpis", fechaInicio, fechaFin, ciudades, productoIds],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_reabastecimiento_kpis", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_ciudades: ciudades?.length ? ciudades : null,
        p_producto_ids: productoIds?.length ? productoIds : null,
      })
      if (error) throw error
      return data as ReabastecimientoKpis
    },
  })
}

// Hook para obtener tabla de sugerido de compra
export function useReabastecimientoTabla(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  ciudades?: string[] | null,
  productoIds?: number[] | null,
  prioridad?: string | null,
  clasificacion?: string | null,
  busqueda?: string | null,
  limit: number = 50,
  offset: number = 0,
  orderBy: string = "prioridad_orden",
  orderDir: string = "asc"
) {
  return useQuery<ReabastecimientoTablaResponse>({
    queryKey: ["reabastecimiento-tabla", fechaInicio, fechaFin, ciudades, productoIds, prioridad, clasificacion, busqueda, limit, offset, orderBy, orderDir],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_reabastecimiento_tabla", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_ciudades: ciudades?.length ? ciudades : null,
        p_producto_ids: productoIds?.length ? productoIds : null,
        p_prioridad: prioridad || null,
        p_clasificacion: clasificacion || null,
        p_busqueda: busqueda || null,
        p_limit: limit,
        p_offset: offset,
        p_order_by: orderBy,
        p_order_dir: orderDir,
      })
      if (error) throw error
      return data as ReabastecimientoTablaResponse
    },
  })
}

// Hook para Fill Rate por producto
export function useReabastecimientoFillRate(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  ciudades?: string[] | null,
  limit: number = 15
) {
  return useQuery<FillRateItem[]>({
    queryKey: ["reabastecimiento-fill-rate", fechaInicio, fechaFin, ciudades, limit],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_reabastecimiento_fill_rate", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_ciudades: ciudades?.length ? ciudades : null,
        p_limit: limit,
      })
      if (error) throw error
      return (data || []) as FillRateItem[]
    },
  })
}

// Hook para Clasificación ABC
export function useReabastecimientoABC(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  ciudades?: string[] | null
) {
  return useQuery<ABCItem[]>({
    queryKey: ["reabastecimiento-abc", fechaInicio, fechaFin, ciudades],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_reabastecimiento_abc", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_ciudades: ciudades?.length ? ciudades : null,
      })
      if (error) throw error
      return (data || []) as ABCItem[]
    },
  })
}

// Hook para Tendencia semanal
export function useReabastecimientoTendencia(
  ciudades?: string[] | null,
  limit: number = 10
) {
  return useQuery<TendenciaData>({
    queryKey: ["reabastecimiento-tendencia", ciudades, limit],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_reabastecimiento_tendencia", {
        p_ciudades: ciudades?.length ? ciudades : null,
        p_limit: limit,
      })
      if (error) throw error
      return data as TendenciaData
    },
  })
}

// Hook para Alertas de Clase A con OOS
export function useReabastecimientoAlertasClaseA(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  limit: number = 10
) {
  return useQuery<AlertaClaseAItem[]>({
    queryKey: ["reabastecimiento-alertas-clase-a", fechaInicio, fechaFin, limit],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_reabastecimiento_alertas_clase_a", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_limit: limit,
      })
      if (error) throw error
      return (data || []) as AlertaClaseAItem[]
    },
  })
}
