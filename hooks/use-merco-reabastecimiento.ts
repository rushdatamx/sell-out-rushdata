"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

// Types específicos para MERCO (datos mensuales)
export interface MercoReabastecimientoKpis {
  productos_activos: number
  productos_venta_cero: number
  cobertura_promedio: number
  alertas_clase_a: number
}

export interface MercoReabastecimientoItem {
  producto_id: number
  producto_nombre: string
  upc: string
  unidades_30d: number
  venta_30d: number
  venta_promedio_dia: number
  inventario: number
  fecha_inventario: string | null
  dias_cobertura: number
  contribucion: number
  clasificacion: "A" | "B" | "C"
  sugerido_15d: number
  estado: "CRITICO" | "BAJO" | "OK" | "SIN_STOCK" | "VENTA_CERO"
}

export interface MercoReabastecimientoTablaResponse {
  productos: MercoReabastecimientoItem[]
  total: number
}

export interface MercoAlertaClaseA {
  producto_id: number
  producto_nombre: string
  upc: string
  unidades_30d: number
  venta_30d: number
  inventario: number
  dias_cobertura: number
  sugerido_15d: number
  estado: "CRITICO" | "BAJO" | "SIN_STOCK"
}

export interface MercoVentaCeroItem {
  producto_id: number
  producto_nombre: string
  upc: string
  inventario: number
  fecha_inventario: string | null
  ultima_venta: string | null
}

export interface MercoABCResumen {
  clase_a: {
    productos: number
    venta: number
    porcentaje: number
  }
  clase_b: {
    productos: number
    venta: number
    porcentaje: number
  }
  clase_c: {
    productos: number
    venta: number
    porcentaje: number
  }
}

// Hook para obtener KPIs de reabastecimiento MERCO
export function useMercoReabastecimientoKpis(retailerId?: number | null) {
  return useQuery<MercoReabastecimientoKpis>({
    queryKey: ["merco-reabastecimiento-kpis", retailerId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_merco_reabastecimiento_kpis", {
        p_retailer_id: retailerId || 4,
      })
      if (error) throw error
      return data as MercoReabastecimientoKpis
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para obtener tabla de reabastecimiento MERCO
export function useMercoReabastecimientoTabla(
  retailerId?: number | null,
  clasificacion?: string | null,
  limit: number = 50,
  offset: number = 0
) {
  return useQuery<MercoReabastecimientoTablaResponse>({
    queryKey: ["merco-reabastecimiento-tabla", retailerId, clasificacion, limit, offset],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_merco_reabastecimiento_tabla", {
        p_retailer_id: retailerId || 4,
        p_clasificacion: clasificacion || null,
        p_limit: limit,
        p_offset: offset,
      })
      if (error) throw error
      return data as MercoReabastecimientoTablaResponse
    },
    staleTime: 5 * 60 * 1000,
  })
}

// Hook para obtener alertas Clase A de MERCO
export function useMercoReabastecimientoAlertasClaseA(
  retailerId?: number | null,
  limit: number = 10
) {
  return useQuery<MercoAlertaClaseA[]>({
    queryKey: ["merco-reabastecimiento-alertas-clase-a", retailerId, limit],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_merco_reabastecimiento_alertas_clase_a", {
        p_retailer_id: retailerId || 4,
        p_limit: limit,
      })
      if (error) throw error
      return (data || []) as MercoAlertaClaseA[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

// Hook para obtener productos con venta cero de MERCO
export function useMercoReabastecimientoVentaCero(
  retailerId?: number | null,
  limit: number = 20
) {
  return useQuery<MercoVentaCeroItem[]>({
    queryKey: ["merco-reabastecimiento-venta-cero", retailerId, limit],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_merco_reabastecimiento_venta_cero", {
        p_retailer_id: retailerId || 4,
        p_limit: limit,
      })
      if (error) throw error
      return (data || []) as MercoVentaCeroItem[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

// Hook para obtener clasificación ABC de MERCO
export function useMercoReabastecimientoABC(retailerId?: number | null) {
  return useQuery<MercoABCResumen>({
    queryKey: ["merco-reabastecimiento-abc", retailerId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_merco_reabastecimiento_abc", {
        p_retailer_id: retailerId || 4,
      })
      if (error) throw error
      return data as MercoABCResumen
    },
    staleTime: 5 * 60 * 1000,
  })
}
