"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

// Types
export interface Tienda {
  id: number
  codigo_tienda: string
  nombre: string
  ciudad: string
  cluster: string
  ventas: number
  unidades: number
  skus_activos: number
  participacion: number
  variacion: number
  dias_quiebre: number
}

export interface ProductoOption {
  id: number
  nombre: string
  upc: string
}

export interface TiendasFiltros {
  ciudades: string[]
  clusters: string[]
  categorias: string[]
  productos: ProductoOption[]
  fecha_min: string
  fecha_max: string
}

export interface TiendasKpis {
  tiendas_activas: number
  venta_total: number
  unidades_totales: number
  venta_promedio_tienda: number
  tiendas_con_quiebre: number
  fecha_inicio: string
  fecha_fin: string
}

export interface TiendasTablaResponse {
  tiendas: Tienda[]
  total: number
  fecha_inicio: string
  fecha_fin: string
}

export interface CiudadVentas {
  ciudad: string
  num_tiendas: number
  ventas: number
  unidades: number
}

export interface TiendaRanking {
  nombre: string
  ciudad: string
  ventas: number
  ventas_anterior: number
  variacion: number
}

export interface CoberturaItem {
  nombre: string
  ciudad: string
  skus_activos: number
  cobertura_pct: number
}

export interface CoberturaResponse {
  total_skus: number
  distribucion: CoberturaItem[]
}

// Hook para obtener filtros disponibles
export function useTiendasFiltros() {
  return useQuery<TiendasFiltros>({
    queryKey: ["tiendas-filtros"],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_tiendas_filtros")
      if (error) throw error
      return data as TiendasFiltros
    },
  })
}

// Hook para obtener KPIs
export function useTiendasKpis(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  ciudades?: string[] | null,
  clusters?: string[] | null,
  categorias?: string[] | null,
  productoIds?: number[] | null
) {
  return useQuery<TiendasKpis>({
    queryKey: ["tiendas-kpis", fechaInicio, fechaFin, ciudades, clusters, categorias, productoIds],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_tiendas_kpis", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_ciudades: ciudades?.length ? ciudades : null,
        p_clusters: clusters?.length ? clusters : null,
        p_categorias: categorias?.length ? categorias : null,
        p_producto_ids: productoIds?.length ? productoIds : null,
      })
      if (error) throw error
      return data as TiendasKpis
    },
  })
}

// Hook para obtener tabla de tiendas
export function useTiendasTabla(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  ciudades?: string[] | null,
  clusters?: string[] | null,
  categorias?: string[] | null,
  productoIds?: number[] | null,
  busqueda?: string | null,
  limit: number = 50,
  offset: number = 0,
  orderBy: string = "ventas",
  orderDir: string = "desc"
) {
  return useQuery<TiendasTablaResponse>({
    queryKey: ["tiendas-tabla", fechaInicio, fechaFin, ciudades, clusters, categorias, productoIds, busqueda, limit, offset, orderBy, orderDir],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_tiendas_tabla", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_ciudades: ciudades?.length ? ciudades : null,
        p_clusters: clusters?.length ? clusters : null,
        p_categorias: categorias?.length ? categorias : null,
        p_producto_ids: productoIds?.length ? productoIds : null,
        p_busqueda: busqueda || null,
        p_limit: limit,
        p_offset: offset,
        p_order_by: orderBy,
        p_order_dir: orderDir,
      })
      if (error) throw error
      return data as TiendasTablaResponse
    },
  })
}

// Hook para ventas por ciudad
export function useTiendasPorCiudad(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  ciudades?: string[] | null,
  clusters?: string[] | null,
  categorias?: string[] | null,
  productoIds?: number[] | null
) {
  return useQuery<CiudadVentas[]>({
    queryKey: ["tiendas-por-ciudad", fechaInicio, fechaFin, ciudades, clusters, categorias, productoIds],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_tiendas_por_ciudad", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_ciudades: ciudades?.length ? ciudades : null,
        p_clusters: clusters?.length ? clusters : null,
        p_categorias: categorias?.length ? categorias : null,
        p_producto_ids: productoIds?.length ? productoIds : null,
      })
      if (error) throw error
      return data as CiudadVentas[]
    },
  })
}

// Hook para ranking de tiendas (top/bottom)
export function useTiendasRanking(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  ciudades?: string[] | null,
  clusters?: string[] | null,
  categorias?: string[] | null,
  productoIds?: number[] | null,
  tipo: "top" | "bottom" = "top",
  limit: number = 10
) {
  return useQuery<TiendaRanking[]>({
    queryKey: ["tiendas-ranking", fechaInicio, fechaFin, ciudades, clusters, categorias, productoIds, tipo, limit],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_tiendas_ranking", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_ciudades: ciudades?.length ? ciudades : null,
        p_clusters: clusters?.length ? clusters : null,
        p_categorias: categorias?.length ? categorias : null,
        p_producto_ids: productoIds?.length ? productoIds : null,
        p_tipo: tipo,
        p_limit: limit,
      })
      if (error) throw error
      return data as TiendaRanking[]
    },
  })
}

// Hook para cobertura de SKUs
export function useTiendasCobertura(
  fechaInicio?: string | null,
  fechaFin?: string | null,
  ciudades?: string[] | null,
  clusters?: string[] | null,
  categorias?: string[] | null
) {
  return useQuery<CoberturaResponse>({
    queryKey: ["tiendas-cobertura", fechaInicio, fechaFin, ciudades, clusters, categorias],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_tiendas_cobertura_skus", {
        p_fecha_inicio: fechaInicio || null,
        p_fecha_fin: fechaFin || null,
        p_ciudades: ciudades?.length ? ciudades : null,
        p_clusters: clusters?.length ? clusters : null,
        p_categorias: categorias?.length ? categorias : null,
      })
      if (error) throw error
      return data as CoberturaResponse
    },
  })
}
