"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

// Types
export interface AnalisisKpisYoY {
  anio_actual: number
  anio_anterior: number
  venta_actual: number
  venta_anterior: number
  cambio_venta_pct: number
  unidades_actual: number
  unidades_anterior: number
  cambio_unidades_pct: number
  tiendas_actual: number
  productos_actual: number
  transacciones_actual: number
  transacciones_anterior: number
}

export interface VentaMensualYoY {
  mes: number
  mes_nombre: string
  venta_actual: number
  venta_anterior: number
  unidades_actual: number
  unidades_anterior: number
  cambio_pct: number
}

export interface ProductoYoY {
  producto: string
  venta_actual: number
  venta_anterior: number
  cambio_pct: number
}

export interface TiendaYoY {
  tienda: string
  ciudad: string
  venta_actual: number
  venta_anterior: number
  cambio_pct: number
}

export interface EstacionalidadSemanal {
  dia_num: number
  dia_nombre: string
  transacciones: number
  venta_total: number
  ticket_promedio: number
  unidades_total: number
}

export interface CiudadYoY {
  ciudad: string
  tiendas: number
  venta_actual: number
  venta_anterior: number
  cambio_pct: number
}

// Hook para KPIs YoY
export function useAnalisisKpisYoY(
  anio?: number | null,
  ciudades?: string[] | null,
  productoIds?: number[] | null
) {
  return useQuery<AnalisisKpisYoY>({
    queryKey: ["analisis-kpis-yoy", anio, ciudades, productoIds],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_analisis_kpis_yoy", {
        p_anio: anio || null,
        p_ciudades: ciudades?.length ? ciudades : null,
        p_producto_ids: productoIds?.length ? productoIds : null,
      })
      if (error) throw error
      return data as AnalisisKpisYoY
    },
  })
}

// Hook para ventas mensuales YoY
export function useAnalisisVentasMensualesYoY(
  anio?: number | null,
  ciudades?: string[] | null,
  productoIds?: number[] | null
) {
  return useQuery<VentaMensualYoY[]>({
    queryKey: ["analisis-ventas-mensuales-yoy", anio, ciudades, productoIds],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_analisis_ventas_mensuales_yoy", {
        p_anio: anio || null,
        p_ciudades: ciudades?.length ? ciudades : null,
        p_producto_ids: productoIds?.length ? productoIds : null,
      })
      if (error) throw error
      return (data || []) as VentaMensualYoY[]
    },
  })
}

// Hook para productos YoY
export function useAnalisisProductosYoY(
  anio?: number | null,
  ciudades?: string[] | null,
  tipo: "crecimiento" | "caida" = "crecimiento",
  limit: number = 10
) {
  return useQuery<ProductoYoY[]>({
    queryKey: ["analisis-productos-yoy", anio, ciudades, tipo, limit],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_analisis_productos_yoy", {
        p_anio: anio || null,
        p_ciudades: ciudades?.length ? ciudades : null,
        p_tipo: tipo,
        p_limit: limit,
      })
      if (error) throw error
      return (data || []) as ProductoYoY[]
    },
  })
}

// Hook para tiendas YoY
export function useAnalisisTiendasYoY(
  anio?: number | null,
  ciudades?: string[] | null,
  tipo: "crecimiento" | "caida" = "crecimiento",
  limit: number = 10
) {
  return useQuery<TiendaYoY[]>({
    queryKey: ["analisis-tiendas-yoy", anio, ciudades, tipo, limit],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_analisis_tiendas_yoy", {
        p_anio: anio || null,
        p_ciudades: ciudades?.length ? ciudades : null,
        p_tipo: tipo,
        p_limit: limit,
      })
      if (error) throw error
      return (data || []) as TiendaYoY[]
    },
  })
}

// Hook para estacionalidad semanal
export function useAnalisisEstacionalidadSemanal(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  ciudades?: string[] | null
) {
  return useQuery<EstacionalidadSemanal[]>({
    queryKey: ["analisis-estacionalidad-semanal", fechaInicio, fechaFin, ciudades],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_analisis_estacionalidad_semanal", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_ciudades: ciudades?.length ? ciudades : null,
      })
      if (error) throw error
      return (data || []) as EstacionalidadSemanal[]
    },
  })
}

// Hook para ciudades YoY
export function useAnalisisCiudadesYoY(
  anio?: number | null,
  productoIds?: number[] | null
) {
  return useQuery<CiudadYoY[]>({
    queryKey: ["analisis-ciudades-yoy", anio, productoIds],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_analisis_ciudades_yoy", {
        p_anio: anio || null,
        p_producto_ids: productoIds?.length ? productoIds : null,
      })
      if (error) throw error
      return (data || []) as CiudadYoY[]
    },
  })
}
