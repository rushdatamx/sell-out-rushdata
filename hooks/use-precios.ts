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

export interface PreciosFiltros {
  ciudades: string[]
  tiendas: TiendaOption[]
  productos: ProductoOption[]
  fecha_min: string
  fecha_max: string
}

export interface PreciosKpis {
  precio_promedio: number
  desviacion_promedio: number
  productos_analizados: number
  tiendas_analizadas: number
  total_transacciones: number
  productos_alta_dispersion: number
  dispersion_promedio_pct: number
  combinaciones_anomalas: number
  fecha_inicio: string
  fecha_fin: string
}

export interface PrecioPorProducto {
  producto_id: number
  producto: string
  tiendas: number
  transacciones: number
  precio_promedio: number
  precio_min: number
  precio_max: number
  rango: number
  desviacion: number
  coef_variacion: number
}

export interface PrecioDetalle {
  producto_id: number
  producto: string
  tienda_id: number
  tienda: string
  ciudad: string
  transacciones: number
  precio_promedio: number
  precio_min: number
  precio_max: number
  rango: number
  desviacion: number
  coef_variacion: number
}

export interface PrecioDetalleResponse {
  data: PrecioDetalle[]
  total: number
  fecha_inicio: string
  fecha_fin: string
}

export interface PrecioDispersion {
  producto: string
  precio_promedio: number
  precio_min: number
  precio_max: number
  q1: number
  mediana: number
  q3: number
  coef_variacion: number
}

export interface PrecioEvolucion {
  fecha: string
  precio_promedio: number
  precio_min: number
  precio_max: number
  transacciones: number
}

export interface PrecioAlerta {
  producto: string
  tienda: string
  ciudad: string
  precio_tienda: number
  precio_promedio: number
  diferencia_pct: number
  tipo_alerta: "PRECIO_ALTO" | "PRECIO_BAJO"
}

export interface PrecioPorCiudad {
  ciudad: string
  productos: number
  tiendas: number
  transacciones: number
  precio_promedio: number
  precio_min: number
  precio_max: number
  coef_variacion: number
}

// Hook para obtener filtros
export function usePreciosFiltros() {
  return useQuery<PreciosFiltros>({
    queryKey: ["precios-filtros"],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_precios_filtros")
      if (error) throw error
      return data as PreciosFiltros
    },
  })
}

// Hook para KPIs
export function usePreciosKpis(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  ciudades?: string[] | null,
  productoIds?: number[] | null
) {
  return useQuery<PreciosKpis>({
    queryKey: ["precios-kpis", fechaInicio, fechaFin, ciudades, productoIds],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_precios_kpis", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_ciudades: ciudades?.length ? ciudades : null,
        p_producto_ids: productoIds?.length ? productoIds : null,
      })
      if (error) throw error
      return data as PreciosKpis
    },
  })
}

// Hook para precios por producto
export function usePreciosPorProducto(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  ciudades?: string[] | null,
  productoIds?: number[] | null
) {
  return useQuery<PrecioPorProducto[]>({
    queryKey: ["precios-por-producto", fechaInicio, fechaFin, ciudades, productoIds],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_precios_por_producto", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_ciudades: ciudades?.length ? ciudades : null,
        p_producto_ids: productoIds?.length ? productoIds : null,
      })
      if (error) throw error
      return (data || []) as PrecioPorProducto[]
    },
  })
}

// Hook para detalle de precios
export function usePreciosDetalle(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  ciudades?: string[] | null,
  productoIds?: number[] | null,
  tiendaIds?: number[] | null,
  busqueda?: string | null,
  limit: number = 50,
  offset: number = 0,
  orderBy: string = "coef_variacion",
  orderDir: string = "desc"
) {
  return useQuery<PrecioDetalleResponse>({
    queryKey: ["precios-detalle", fechaInicio, fechaFin, ciudades, productoIds, tiendaIds, busqueda, limit, offset, orderBy, orderDir],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_precios_detalle", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_ciudades: ciudades?.length ? ciudades : null,
        p_producto_ids: productoIds?.length ? productoIds : null,
        p_tienda_ids: tiendaIds?.length ? tiendaIds : null,
        p_busqueda: busqueda || null,
        p_limit: limit,
        p_offset: offset,
        p_order_by: orderBy,
        p_order_dir: orderDir,
      })
      if (error) throw error
      return data as PrecioDetalleResponse
    },
  })
}

// Hook para dispersión de precios
export function usePreciosDispersion(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  ciudades?: string[] | null
) {
  return useQuery<PrecioDispersion[]>({
    queryKey: ["precios-dispersion", fechaInicio, fechaFin, ciudades],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_precios_dispersion", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_ciudades: ciudades?.length ? ciudades : null,
      })
      if (error) throw error
      return (data || []) as PrecioDispersion[]
    },
  })
}

// Hook para evolución de precios
export function usePreciosEvolucion(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  productoId?: number | null,
  ciudades?: string[] | null
) {
  return useQuery<PrecioEvolucion[]>({
    queryKey: ["precios-evolucion", fechaInicio, fechaFin, productoId, ciudades],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_precios_evolucion", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_producto_id: productoId || null,
        p_ciudades: ciudades?.length ? ciudades : null,
      })
      if (error) throw error
      return (data || []) as PrecioEvolucion[]
    },
  })
}

// Hook para alertas de precios
export function usePreciosAlertas(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  limit: number = 10
) {
  return useQuery<PrecioAlerta[]>({
    queryKey: ["precios-alertas", fechaInicio, fechaFin, limit],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_precios_alertas", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_limit: limit,
      })
      if (error) throw error
      return (data || []) as PrecioAlerta[]
    },
  })
}

// Hook para precios por ciudad
export function usePreciosPorCiudad(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  productoIds?: number[] | null
) {
  return useQuery<PrecioPorCiudad[]>({
    queryKey: ["precios-por-ciudad", fechaInicio, fechaFin, productoIds],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_precios_por_ciudad", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_producto_ids: productoIds?.length ? productoIds : null,
      })
      if (error) throw error
      return (data || []) as PrecioPorCiudad[]
    },
  })
}
