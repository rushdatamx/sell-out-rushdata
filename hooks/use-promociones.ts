"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import { addDays, subDays, differenceInDays } from "date-fns"
import type {
  PromocionConfig,
  PromocionFiltros,
  VentasPeriodo,
  PromocionResultado,
  CanibalizacionItem,
} from "@/lib/promociones/types"
import { calcularResultadoCompleto } from "@/lib/promociones/calculations"
import { DIAS_RETENCION_DEFAULT } from "@/lib/promociones/constants"

/**
 * Hook para obtener filtros disponibles para el wizard
 */
export function usePromocionFiltros(retailerId?: number | null) {
  return useQuery<PromocionFiltros>({
    queryKey: ["promocion-filtros", retailerId],
    queryFn: async () => {
      // Cast necesario porque las RPCs de promociones aún no están en los tipos generados
      const { data, error } = await (supabase.rpc as CallableFunction)(
        "get_promocion_filtros",
        { p_retailer_id: retailerId || null }
      )
      if (error) throw error
      return data as PromocionFiltros
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

/**
 * Hook para obtener ventas de un período específico
 */
export function usePromocionVentasPeriodo(
  productoIds: number[],
  fechaInicio: string | null,
  fechaFin: string | null,
  tiendaIds?: number[] | null,
  ciudades?: string[] | null,
  retailerId?: number | null,
  enabled: boolean = true
) {
  return useQuery<VentasPeriodo>({
    queryKey: [
      "promocion-ventas-periodo",
      productoIds,
      fechaInicio,
      fechaFin,
      tiendaIds,
      ciudades,
      retailerId,
    ],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as CallableFunction)(
        "get_promocion_ventas_periodo",
        {
          p_producto_ids: productoIds,
          p_fecha_inicio: fechaInicio,
          p_fecha_fin: fechaFin,
          p_tienda_ids: tiendaIds?.length ? tiendaIds : null,
          p_ciudades: ciudades?.length ? ciudades : null,
          p_retailer_id: retailerId || null,
        }
      )
      if (error) throw error
      return data as VentasPeriodo
    },
    enabled: enabled && productoIds.length > 0 && !!fechaInicio && !!fechaFin,
    staleTime: 60 * 1000, // 1 minuto
  })
}

/**
 * Hook para análisis de canibalización
 */
export function usePromocionCanibalizacion(
  productoIds: number[],
  categoria: string | null,
  fechaInicioPromo: string | null,
  fechaFinPromo: string | null,
  fechaInicioBaseline: string | null,
  fechaFinBaseline: string | null,
  retailerId?: number | null,
  enabled: boolean = true
) {
  return useQuery<CanibalizacionItem[]>({
    queryKey: [
      "promocion-canibalizacion",
      productoIds,
      categoria,
      fechaInicioPromo,
      fechaFinPromo,
      fechaInicioBaseline,
      fechaFinBaseline,
      retailerId,
    ],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as CallableFunction)(
        "get_promocion_canibalizacion",
        {
          p_producto_ids: productoIds,
          p_categoria: categoria,
          p_fecha_inicio_promo: fechaInicioPromo,
          p_fecha_fin_promo: fechaFinPromo,
          p_fecha_inicio_baseline: fechaInicioBaseline,
          p_fecha_fin_baseline: fechaFinBaseline,
          p_retailer_id: retailerId || null,
        }
      )
      if (error) throw error
      return (data as CanibalizacionItem[]) || []
    },
    enabled:
      enabled &&
      productoIds.length > 0 &&
      !!categoria &&
      !!fechaInicioPromo &&
      !!fechaFinPromo &&
      !!fechaInicioBaseline &&
      !!fechaFinBaseline,
    staleTime: 60 * 1000,
  })
}

/**
 * Hook principal que combina todas las queries y calcula el resultado
 */
export function usePromocionAnalisis(
  config: PromocionConfig | null,
  retailerId?: number | null
) {
  // Query para ventas durante promoción
  const {
    data: ventasPromo,
    isLoading: isLoadingPromo,
    error: errorPromo,
  } = usePromocionVentasPeriodo(
    config?.productoIds || [],
    config?.fechaInicioPromo || null,
    config?.fechaFinPromo || null,
    config?.tiendaIds,
    config?.ciudades,
    retailerId,
    !!config
  )

  // Query para ventas baseline
  const {
    data: ventasBaseline,
    isLoading: isLoadingBaseline,
    error: errorBaseline,
  } = usePromocionVentasPeriodo(
    config?.productoIds || [],
    config?.fechaInicioBaseline || null,
    config?.fechaFinBaseline || null,
    config?.tiendaIds,
    config?.ciudades,
    retailerId,
    !!config
  )

  // Calcular fechas para retención post-promo
  const fechaInicioPostPromo = config?.fechaFinPromo
    ? addDays(new Date(config.fechaFinPromo), 1).toISOString().split("T")[0]
    : null
  const fechaFinPostPromo = config?.fechaFinPromo
    ? addDays(
        new Date(config.fechaFinPromo),
        config.diasPostPromo || DIAS_RETENCION_DEFAULT
      )
        .toISOString()
        .split("T")[0]
    : null

  // Query para ventas post-promo (retención)
  const {
    data: ventasPostPromo,
    isLoading: isLoadingPostPromo,
    error: errorPostPromo,
  } = usePromocionVentasPeriodo(
    config?.productoIds || [],
    fechaInicioPostPromo,
    fechaFinPostPromo,
    config?.tiendaIds,
    config?.ciudades,
    retailerId,
    !!config && !!fechaInicioPostPromo
  )

  // Query para canibalización
  const {
    data: canibalizacionData,
    isLoading: isLoadingCanibalizacion,
    error: errorCanibalizacion,
  } = usePromocionCanibalizacion(
    config?.productoIds || [],
    config?.categoria || null,
    config?.fechaInicioPromo || null,
    config?.fechaFinPromo || null,
    config?.fechaInicioBaseline || null,
    config?.fechaFinBaseline || null,
    retailerId,
    !!config && !!config?.categoria
  )

  // Calcular resultado completo
  const resultado = useMemo<PromocionResultado | null>(() => {
    if (!ventasPromo || !ventasBaseline || !config) return null

    return calcularResultadoCompleto(
      config,
      ventasPromo,
      ventasBaseline,
      ventasPostPromo || null,
      canibalizacionData || null
    )
  }, [config, ventasPromo, ventasBaseline, ventasPostPromo, canibalizacionData])

  // Estado de carga y errores
  const isLoading =
    isLoadingPromo ||
    isLoadingBaseline ||
    isLoadingPostPromo ||
    isLoadingCanibalizacion
  const error = errorPromo || errorBaseline || errorPostPromo || errorCanibalizacion

  return {
    data: resultado,
    isLoading,
    error,
    // Datos intermedios para debugging o visualización
    ventasPromo,
    ventasBaseline,
    ventasPostPromo,
    canibalizacionData,
  }
}

/**
 * Utility: Calcula fechas de baseline automáticamente
 * Retorna el mismo período de días pero desplazado hacia atrás
 */
export function calcularFechasBaseline(
  fechaInicioPromo: Date,
  fechaFinPromo: Date
): { inicio: Date; fin: Date } {
  const diasPromo = differenceInDays(fechaFinPromo, fechaInicioPromo) + 1

  // Desplazar el mismo número de días antes del inicio de la promo
  const finBaseline = subDays(fechaInicioPromo, 1)
  const inicioBaseline = subDays(finBaseline, diasPromo - 1)

  return {
    inicio: inicioBaseline,
    fin: finBaseline,
  }
}

/**
 * Utility: Valida si una configuración de promoción está completa
 */
export function validarConfigPromocion(config: Partial<PromocionConfig>): {
  valido: boolean
  errores: string[]
} {
  const errores: string[] = []

  if (!config.productoIds || config.productoIds.length === 0) {
    errores.push("Debe seleccionar al menos un producto")
  }

  if (!config.tipo) {
    errores.push("Debe seleccionar un tipo de promoción")
  }

  if (!config.parametros) {
    errores.push("Debe configurar los parámetros de la promoción")
  } else {
    // Validar parámetros específicos
    switch (config.parametros.tipo) {
      case "descuento_porcentaje":
        if (
          config.parametros.porcentaje <= 0 ||
          config.parametros.porcentaje > 100
        ) {
          errores.push("El porcentaje de descuento debe estar entre 1 y 100")
        }
        break
      case "precio_especial":
        if (config.parametros.precio <= 0) {
          errores.push("El precio especial debe ser mayor a 0")
        }
        break
      case "multicompra_nx1":
        if (config.parametros.compra <= config.parametros.lleva) {
          errores.push("La cantidad a comprar debe ser mayor que la que lleva")
        }
        break
      case "multicompra_nxprecio":
        if (config.parametros.cantidad <= 0 || config.parametros.precio <= 0) {
          errores.push("La cantidad y precio deben ser mayores a 0")
        }
        break
      case "bundle":
        if (config.parametros.precioBundle <= 0) {
          errores.push("El precio del bundle debe ser mayor a 0")
        }
        break
    }
  }

  if (!config.fechaInicioPromo || !config.fechaFinPromo) {
    errores.push("Debe definir el período de la promoción")
  } else if (
    new Date(config.fechaInicioPromo) > new Date(config.fechaFinPromo)
  ) {
    errores.push("La fecha de inicio debe ser anterior a la fecha de fin")
  }

  if (!config.fechaInicioBaseline || !config.fechaFinBaseline) {
    errores.push("Debe definir el período de baseline")
  }

  return {
    valido: errores.length === 0,
    errores,
  }
}
