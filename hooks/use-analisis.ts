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
  productoIds?: number[] | null,
  retailerId?: number | null
) {
  return useQuery<AnalisisKpisYoY>({
    queryKey: ["analisis-kpis-yoy", anio, ciudades, productoIds, retailerId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_analisis_kpis_yoy", {
        p_anio: anio || null,
        p_ciudades: ciudades?.length ? ciudades : null,
        p_producto_ids: productoIds?.length ? productoIds : null,
        p_retailer_id: retailerId || null,
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
  productoIds?: number[] | null,
  retailerId?: number | null
) {
  return useQuery<VentaMensualYoY[]>({
    queryKey: ["analisis-ventas-mensuales-yoy", anio, ciudades, productoIds, retailerId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_analisis_ventas_mensuales_yoy", {
        p_anio: anio || null,
        p_ciudades: ciudades?.length ? ciudades : null,
        p_producto_ids: productoIds?.length ? productoIds : null,
        p_retailer_id: retailerId || null,
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
  limit: number = 10,
  retailerId?: number | null
) {
  return useQuery<ProductoYoY[]>({
    queryKey: ["analisis-productos-yoy", anio, ciudades, tipo, limit, retailerId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_analisis_productos_yoy", {
        p_anio: anio || null,
        p_ciudades: ciudades?.length ? ciudades : null,
        p_tipo: tipo,
        p_limit: limit,
        p_retailer_id: retailerId || null,
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
  limit: number = 10,
  retailerId?: number | null
) {
  return useQuery<TiendaYoY[]>({
    queryKey: ["analisis-tiendas-yoy", anio, ciudades, tipo, limit, retailerId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_analisis_tiendas_yoy", {
        p_anio: anio || null,
        p_ciudades: ciudades?.length ? ciudades : null,
        p_tipo: tipo,
        p_limit: limit,
        p_retailer_id: retailerId || null,
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
  ciudades?: string[] | null,
  retailerId?: number | null
) {
  return useQuery<EstacionalidadSemanal[]>({
    queryKey: ["analisis-estacionalidad-semanal", fechaInicio, fechaFin, ciudades, retailerId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_analisis_estacionalidad_semanal", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_ciudades: ciudades?.length ? ciudades : null,
        p_retailer_id: retailerId || null,
      })
      if (error) throw error
      return (data || []) as EstacionalidadSemanal[]
    },
  })
}

// Hook para ciudades YoY
export function useAnalisisCiudadesYoY(
  anio?: number | null,
  productoIds?: number[] | null,
  retailerId?: number | null
) {
  return useQuery<CiudadYoY[]>({
    queryKey: ["analisis-ciudades-yoy", anio, productoIds, retailerId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_analisis_ciudades_yoy", {
        p_anio: anio || null,
        p_producto_ids: productoIds?.length ? productoIds : null,
        p_retailer_id: retailerId || null,
      })
      if (error) throw error
      return (data || []) as CiudadYoY[]
    },
  })
}

// Hook para obtener ciudades disponibles para el filtro
export function useAnalisisCiudadesDisponibles(retailerId?: number | null) {
  return useQuery<string[]>({
    queryKey: ["analisis-ciudades-disponibles", retailerId],
    queryFn: async () => {
      // Obtener ciudades distintas de dim_tiendas que tengan ventas
      const { data, error } = await supabase
        .from("dim_tiendas")
        .select("ciudad")
        .eq("activo", true)
        .not("ciudad", "is", null)
        .order("ciudad")

      if (error) throw error

      // Si hay retailerId, filtrar por ese retailer
      let query = supabase
        .from("dim_tiendas")
        .select("ciudad")
        .eq("activo", true)
        .not("ciudad", "is", null)

      if (retailerId) {
        query = query.eq("retailer_id", retailerId)
      }

      const result = await query.order("ciudad")
      if (result.error) throw result.error

      // Eliminar duplicados
      const ciudades = [...new Set(result.data?.map((t: { ciudad: string }) => t.ciudad) || [])]
      return ciudades
    },
  })
}
