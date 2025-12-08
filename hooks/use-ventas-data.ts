"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

// ============================================================================
// TYPES
// ============================================================================

export interface VentasKPIs {
  total_ventas: number
  total_ventas_perdidas: number
  total_unidades_vendidas: number
  total_unidades_perdidas: number
  numero_ordenes: number
  ordenes_con_perdidas: number
  tasa_cumplimiento_promedio: number
  total_ventas_periodo_anterior: number
  total_ventas_perdidas_periodo_anterior: number
  total_unidades_vendidas_periodo_anterior: number
  ordenes_periodo_anterior: number
  cambio_ventas_pct: number
  cambio_perdidas_pct: number
  cambio_cumplimiento_pct: number
}

export interface VentaPerdidaAnalysis {
  id: number
  nombre: string
  categoria: string
  total_ventas_perdidas: number
  total_unidades_perdidas: number
  numero_ordenes_afectadas: number
  tasa_cumplimiento_promedio: number
  porcentaje_del_total: number
}

export interface VentaTransaccion {
  venta_id: number
  numero_orden: string
  fecha: string
  cliente_id: number
  cliente_nombre: string
  tipo_cliente: string
  producto_id: number
  producto_nombre: string
  sku: string
  categoria: string
  cantidad_solicitada: number
  cantidad_entregada: number
  cantidad_perdida: number
  tasa_cumplimiento: number
  precio_unitario: number
  monto_venta: number
  monto_perdida: number
  costo_total: number
  margen_bruto: number
  margen_porcentaje: number
  descuento_aplicado: number
  estado: string
}

export interface VentaRentabilidad {
  id: number
  nombre: string
  categoria: string
  total_ventas: number
  costo_total: number
  margen_bruto: number
  margen_porcentaje: number
  numero_ordenes: number
  margen_promedio_por_orden: number
  contribucion_margen_total: number
}

export interface VentaCumplimiento {
  id: number
  nombre: string
  categoria: string
  total_ordenes: number
  ordenes_completas: number
  ordenes_parciales: number
  unidades_solicitadas: number
  unidades_entregadas: number
  tasa_cumplimiento: number
  tasa_ordenes_perfectas: number
  ranking_cumplimiento: number
}

export interface VentaTemporal {
  periodo: string
  periodo_numero: number
  total_ventas: number
  total_ordenes: number
  venta_promedio: number
  tasa_cumplimiento: number
  unidades_vendidas: number
  porcentaje_del_total: number
}

export interface VentaDescuento {
  id: number
  nombre: string
  categoria: string
  total_ventas: number
  total_descuentos: number
  porcentaje_descuento_promedio: number
  numero_ordenes: number
  ordenes_con_descuento: number
  margen_con_descuento: number
  margen_sin_descuento: number
  impacto_margen: number
}

// ============================================================================
// HOOKS
// ============================================================================

export function useVentasKPIs(
  tenantId: string,
  fechaInicio?: string,
  fechaFin?: string
) {
  return useQuery({
    queryKey: ["ventas-kpis", tenantId, fechaInicio, fechaFin],
    queryFn: async (): Promise<VentasKPIs | null> => {
      const { data, error } = await supabase.rpc("get_ventas_page_kpis", {
        p_tenant_id: tenantId,
        p_fecha_inicio: fechaInicio,
        p_fecha_fin: fechaFin,
      })

      if (error) {
        console.error("Error in useVentasKPIs:", error)
        throw error
      }

      return data?.[0] || null
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useVentasPerdidasAnalysis(
  tenantId: string,
  fechaInicio?: string,
  fechaFin?: string,
  dimension: "producto" | "cliente" | "categoria" = "producto",
  limit: number = 20
) {
  return useQuery({
    queryKey: ["ventas-perdidas-analysis", tenantId, fechaInicio, fechaFin, dimension, limit],
    queryFn: async (): Promise<VentaPerdidaAnalysis[]> => {
      const { data, error } = await supabase.rpc("get_ventas_perdidas_analysis", {
        p_tenant_id: tenantId,
        p_fecha_inicio: fechaInicio,
        p_fecha_fin: fechaFin,
        p_dimension: dimension,
        p_limit: limit,
      })

      if (error) {
        console.error("Error in useVentasPerdidasAnalysis:", error)
        throw error
      }

      return (data as VentaPerdidaAnalysis[]) || []
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useVentasList(
  tenantId: string,
  filters: {
    fechaInicio?: string
    fechaFin?: string
    clienteId?: number
    productoId?: number
    categoria?: string
    estado?: string
    soloConPerdidas?: boolean
    minFillRate?: number
    maxFillRate?: number
    search?: string
    limit?: number
    offset?: number
  }
) {
  return useQuery({
    queryKey: ["ventas-list", tenantId, filters],
    queryFn: async (): Promise<VentaTransaccion[]> => {
      const { data, error } = await supabase.rpc("get_ventas_list", {
        p_tenant_id: tenantId,
        p_fecha_inicio: filters.fechaInicio,
        p_fecha_fin: filters.fechaFin,
        p_cliente_id: filters.clienteId,
        p_producto_id: filters.productoId,
        p_categoria: filters.categoria,
        p_estado: filters.estado,
        p_solo_con_perdidas: filters.soloConPerdidas || false,
        p_min_fill_rate: filters.minFillRate,
        p_max_fill_rate: filters.maxFillRate,
        p_search: filters.search,
        p_limit: filters.limit || 100,
        p_offset: filters.offset || 0,
      })

      if (error) {
        console.error("Error in useVentasList:", error)
        throw error
      }

      return (data as VentaTransaccion[]) || []
    },
    staleTime: 1000 * 60 * 2,
  })
}

export function useVentasRentabilidad(
  tenantId: string,
  fechaInicio?: string,
  fechaFin?: string,
  dimension: "producto" | "cliente" | "distribucion" = "producto",
  limit: number = 20
) {
  return useQuery({
    queryKey: ["ventas-rentabilidad", tenantId, fechaInicio, fechaFin, dimension, limit],
    queryFn: async (): Promise<VentaRentabilidad[]> => {
      const { data, error } = await supabase.rpc("get_ventas_rentabilidad", {
        p_tenant_id: tenantId,
        p_fecha_inicio: fechaInicio,
        p_fecha_fin: fechaFin,
        p_dimension: dimension,
        p_limit: limit,
      })

      if (error) {
        console.error("Error in useVentasRentabilidad:", error)
        throw error
      }

      return (data as VentaRentabilidad[]) || []
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useVentasCumplimiento(
  tenantId: string,
  fechaInicio?: string,
  fechaFin?: string,
  dimension: "producto" | "cliente" | "categoria" | "resumen" = "producto",
  limit: number = 20
) {
  return useQuery({
    queryKey: ["ventas-cumplimiento", tenantId, fechaInicio, fechaFin, dimension, limit],
    queryFn: async (): Promise<VentaCumplimiento[]> => {
      const { data, error } = await supabase.rpc("get_ventas_cumplimiento", {
        p_tenant_id: tenantId,
        p_fecha_inicio: fechaInicio,
        p_fecha_fin: fechaFin,
        p_dimension: dimension,
        p_limit: limit,
      })

      if (error) {
        console.error("Error in useVentasCumplimiento:", error)
        throw error
      }

      return (data as VentaCumplimiento[]) || []
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useVentasTemporal(
  tenantId: string,
  fechaInicio?: string,
  fechaFin?: string,
  agrupacion: "dia_semana" | "dia_mes" | "semana_mes" | "mensual" = "dia_semana"
) {
  return useQuery({
    queryKey: ["ventas-temporal", tenantId, fechaInicio, fechaFin, agrupacion],
    queryFn: async (): Promise<VentaTemporal[]> => {
      const { data, error } = await supabase.rpc("get_ventas_temporal", {
        p_tenant_id: tenantId,
        p_fecha_inicio: fechaInicio,
        p_fecha_fin: fechaFin,
        p_agrupacion: agrupacion,
      })

      if (error) {
        console.error("Error in useVentasTemporal:", error)
        throw error
      }

      return (data as VentaTemporal[]) || []
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useVentasDescuentos(
  tenantId: string,
  fechaInicio?: string,
  fechaFin?: string,
  dimension: "cliente" | "producto" | "rangos" | "impacto" = "cliente",
  limit: number = 20
) {
  return useQuery({
    queryKey: ["ventas-descuentos", tenantId, fechaInicio, fechaFin, dimension, limit],
    queryFn: async (): Promise<VentaDescuento[]> => {
      const { data, error } = await supabase.rpc("get_ventas_descuentos", {
        p_tenant_id: tenantId,
        p_fecha_inicio: fechaInicio,
        p_fecha_fin: fechaFin,
        p_dimension: dimension,
        p_limit: limit,
      })

      if (error) {
        console.error("Error in useVentasDescuentos:", error)
        throw error
      }

      return (data as VentaDescuento[]) || []
    },
    staleTime: 1000 * 60 * 5,
  })
}
