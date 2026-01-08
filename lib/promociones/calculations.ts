/**
 * Funciones de cálculo para métricas de promociones
 */

import { UMBRALES, INTERPRETACIONES } from "./constants"
import type {
  PromocionConfig,
  VentasPeriodo,
  PromocionKpis,
  ProductoPromocionAnalisis,
  CanibalizacionItem,
  CanibalizacionAnalisis,
  RetencionAnalisis,
  PromocionResultado,
  PromocionInsight,
  VentaDiaria,
} from "./types"

/**
 * Calcula el costo del descuento según el tipo de promoción
 */
export function calcularCostoDescuento(
  config: PromocionConfig,
  unidadesVendidas: number,
  precioBaseline: number | null
): number {
  if (!precioBaseline || precioBaseline <= 0) return 0

  const { parametros } = config

  switch (parametros.tipo) {
    case "descuento_porcentaje": {
      // Costo = unidades * precio_baseline * %descuento
      return unidadesVendidas * precioBaseline * (parametros.porcentaje / 100)
    }

    case "precio_especial": {
      // Costo = unidades * (precio_baseline - precio_promo)
      const descuento = precioBaseline - parametros.precio
      return descuento > 0 ? unidadesVendidas * descuento : 0
    }

    case "multicompra_nx1": {
      // Ej: 3x2 = cada 3 unidades, 1 gratis
      const { compra, lleva } = parametros
      const gratis = compra - lleva
      const sets = Math.floor(unidadesVendidas / compra)
      return sets * gratis * precioBaseline
    }

    case "multicompra_nxprecio": {
      // Ej: 2x$29 cuando precio regular es $20
      const { cantidad, precio } = parametros
      const setsVendidos = Math.floor(unidadesVendidas / cantidad)
      const precioRegular = cantidad * precioBaseline
      const descuentoPorSet = precioRegular - precio
      return descuentoPorSet > 0 ? setsVendidos * descuentoPorSet : 0
    }

    case "bundle": {
      // Para bundle asumimos que el descuento ya está en el precio
      // No calculamos costo adicional aquí
      return 0
    }

    default:
      return 0
  }
}

/**
 * Calcula el precio efectivo por unidad durante la promoción
 */
export function calcularPrecioEfectivo(
  config: PromocionConfig,
  precioBaseline: number | null
): number | null {
  if (!precioBaseline) return null

  const { parametros } = config

  switch (parametros.tipo) {
    case "descuento_porcentaje":
      return precioBaseline * (1 - parametros.porcentaje / 100)

    case "precio_especial":
      return parametros.precio

    case "multicompra_nx1": {
      // Ej: 3x2 = pagas 2 por 3 unidades
      const { compra, lleva } = parametros
      return (lleva * precioBaseline) / compra
    }

    case "multicompra_nxprecio": {
      // Ej: 2x$29
      const { cantidad, precio } = parametros
      return precio / cantidad
    }

    case "bundle":
      return parametros.precioBundle

    default:
      return precioBaseline
  }
}

/**
 * Calcula los KPIs principales del análisis
 */
export function calcularKpis(
  config: PromocionConfig,
  ventasPromo: VentasPeriodo,
  ventasBaseline: VentasPeriodo
): PromocionKpis {
  const { totales: promo } = ventasPromo
  const { totales: baseline } = ventasBaseline

  // Uplift de ventas
  const ventaDiferenciaAbs = promo.venta_total - baseline.venta_total
  const ventaDiferenciaPct =
    baseline.venta_total > 0
      ? (ventaDiferenciaAbs / baseline.venta_total) * 100
      : 0

  // Uplift de unidades
  const unidadesDiferenciaAbs = promo.unidades_total - baseline.unidades_total
  const unidadesDiferenciaPct =
    baseline.unidades_total > 0
      ? (unidadesDiferenciaAbs / baseline.unidades_total) * 100
      : 0

  // Descuento real
  const descuentoRealPct =
    promo.precio_promedio && baseline.precio_promedio
      ? ((baseline.precio_promedio - promo.precio_promedio) /
          baseline.precio_promedio) *
        100
      : null

  // ROI
  const costoDescuento = calcularCostoDescuento(
    config,
    promo.unidades_total,
    baseline.precio_promedio
  )
  const ingresoIncremental = ventaDiferenciaAbs
  const roi =
    costoDescuento > 0
      ? ((ingresoIncremental - costoDescuento) / costoDescuento) * 100
      : null

  // Elasticidad
  const cambioPrecioPct =
    promo.precio_promedio && baseline.precio_promedio
      ? ((promo.precio_promedio - baseline.precio_promedio) /
          baseline.precio_promedio) *
        100
      : null
  const elasticidadPrecio =
    cambioPrecioPct && cambioPrecioPct !== 0
      ? unidadesDiferenciaPct / cambioPrecioPct
      : null

  // Cobertura de tiendas
  const tiendasTotales = Math.max(
    promo.tiendas_con_venta,
    baseline.tiendas_con_venta
  )
  const coberturaPct =
    tiendasTotales > 0 ? (promo.tiendas_con_venta / tiendasTotales) * 100 : 0

  return {
    ventaPromo: promo.venta_total,
    ventaBaseline: baseline.venta_total,
    ventaDiferenciaAbs,
    ventaDiferenciaPct,

    unidadesPromo: promo.unidades_total,
    unidadesBaseline: baseline.unidades_total,
    unidadesDiferenciaAbs,
    unidadesDiferenciaPct,

    precioPromedioPromo: promo.precio_promedio,
    precioPromedioBaseline: baseline.precio_promedio,
    descuentoRealPct,

    costoDescuento,
    ingresoIncremental,
    roi,

    elasticidadPrecio,

    tiendasConVentaPromo: promo.tiendas_con_venta,
    tiendasConVentaBaseline: baseline.tiendas_con_venta,
    tiendasTotales,
    coberturaPct,

    diasPromo: promo.dias_con_venta,
    diasBaseline: baseline.dias_con_venta,
  }
}

/**
 * Calcula análisis por producto individual
 */
export function calcularPorProducto(
  ventasPromo: VentasPeriodo,
  ventasBaseline: VentasPeriodo
): ProductoPromocionAnalisis[] {
  const baselineMap = new Map(
    ventasBaseline.por_producto.map((p) => [p.producto_id, p])
  )

  const totalVentaPromo = ventasPromo.totales.venta_total

  return ventasPromo.por_producto.map((promo) => {
    const baseline = baselineMap.get(promo.producto_id)

    const ventaBaseline = baseline?.venta ?? 0
    const unidadesBaseline = baseline?.unidades ?? 0
    const precioBaseline = baseline?.precio_promedio ?? null

    const upliftPct =
      ventaBaseline > 0
        ? ((promo.venta - ventaBaseline) / ventaBaseline) * 100
        : promo.venta > 0
          ? 100
          : 0

    const upliftUnidadesPct =
      unidadesBaseline > 0
        ? ((promo.unidades - unidadesBaseline) / unidadesBaseline) * 100
        : promo.unidades > 0
          ? 100
          : 0

    // Elasticidad por producto
    const cambioPrecioPct =
      promo.precio_promedio && precioBaseline
        ? ((promo.precio_promedio - precioBaseline) / precioBaseline) * 100
        : null
    const elasticidad =
      cambioPrecioPct && cambioPrecioPct !== 0
        ? upliftUnidadesPct / cambioPrecioPct
        : null

    // Contribución al total
    const contribucionTotal =
      totalVentaPromo > 0 ? (promo.venta / totalVentaPromo) * 100 : 0

    return {
      productoId: promo.producto_id,
      productoNombre: promo.producto_nombre,
      upc: promo.upc,
      categoria: promo.categoria,

      ventaPromo: promo.venta,
      ventaBaseline,
      upliftPct,

      unidadesPromo: promo.unidades,
      unidadesBaseline,
      upliftUnidadesPct,

      precioPromo: promo.precio_promedio,
      precioBaseline,

      elasticidad,
      contribucionTotal,
    }
  })
}

/**
 * Procesa análisis de canibalización
 */
export function procesarCanibalizacion(
  canibalizacionData: CanibalizacionItem[],
  upliftPromo: number
): CanibalizacionAnalisis {
  const productosAfectados = canibalizacionData.filter(
    (p) => p.variacion_pct < UMBRALES.canibalizacion.bajo
  )

  const totalCanibalizacion = productosAfectados.reduce(
    (sum, p) => sum + (p.venta_baseline - p.venta_periodo_promo),
    0
  )

  return {
    productos: canibalizacionData,
    totalCanibalizacion: Math.max(0, totalCanibalizacion),
    productosAfectados: productosAfectados.length,
    impactoNeto: upliftPromo - totalCanibalizacion,
  }
}

/**
 * Calcula análisis de retención post-promoción
 */
export function calcularRetencion(
  ventasPromo: VentasPeriodo,
  ventasBaseline: VentasPeriodo,
  ventasPostPromo: VentasPeriodo | null,
  diasAnalisis: number
): RetencionAnalisis | null {
  if (!ventasPostPromo) return null

  const ventaPromedioDurantePromo =
    ventasPromo.totales.dias_con_venta > 0
      ? ventasPromo.totales.venta_total / ventasPromo.totales.dias_con_venta
      : 0

  const ventaPromedioPostPromo =
    ventasPostPromo.totales.dias_con_venta > 0
      ? ventasPostPromo.totales.venta_total /
        ventasPostPromo.totales.dias_con_venta
      : 0

  const ventaPromedioBaseline =
    ventasBaseline.totales.dias_con_venta > 0
      ? ventasBaseline.totales.venta_total /
        ventasBaseline.totales.dias_con_venta
      : 0

  const indiceRetencion =
    ventaPromedioDurantePromo > 0
      ? ventaPromedioPostPromo / ventaPromedioDurantePromo
      : 0

  const indiceVsBaseline =
    ventaPromedioBaseline > 0
      ? ventaPromedioPostPromo / ventaPromedioBaseline
      : 0

  // Interpretación
  let interpretacion: RetencionAnalisis["interpretacion"]
  if (indiceRetencion >= UMBRALES.retencion.excelente) {
    interpretacion = "excelente"
  } else if (indiceRetencion >= UMBRALES.retencion.buena) {
    interpretacion = "buena"
  } else if (indiceRetencion >= UMBRALES.retencion.regular) {
    interpretacion = "regular"
  } else {
    interpretacion = "baja"
  }

  return {
    diasAnalisis,
    ventaPromedioDurantePromo,
    ventaPromedioPostPromo,
    ventaPromedioBaseline,
    indiceRetencion,
    indiceVsBaseline,
    ventasDiariasPostPromo: ventasPostPromo.serie_diaria,
    interpretacion,
  }
}

/**
 * Genera insights automáticos basados en los resultados
 */
export function generarInsights(
  kpis: PromocionKpis,
  canibalizacion: CanibalizacionAnalisis | null,
  retencion: RetencionAnalisis | null
): PromocionInsight[] {
  const insights: PromocionInsight[] = []

  // Insight de Uplift
  if (kpis.ventaDiferenciaPct >= UMBRALES.uplift.excelente) {
    insights.push({
      tipo: "positivo",
      titulo: "Uplift excepcional",
      descripcion: INTERPRETACIONES.uplift.excelente,
      metrica: "Uplift",
      valor: `+${kpis.ventaDiferenciaPct.toFixed(1)}%`,
    })
  } else if (kpis.ventaDiferenciaPct >= UMBRALES.uplift.bueno) {
    insights.push({
      tipo: "positivo",
      titulo: "Buen incremento de ventas",
      descripcion: INTERPRETACIONES.uplift.bueno,
      metrica: "Uplift",
      valor: `+${kpis.ventaDiferenciaPct.toFixed(1)}%`,
    })
  } else if (kpis.ventaDiferenciaPct < 0) {
    insights.push({
      tipo: "negativo",
      titulo: "Ventas por debajo del baseline",
      descripcion: INTERPRETACIONES.uplift.negativo,
      metrica: "Uplift",
      valor: `${kpis.ventaDiferenciaPct.toFixed(1)}%`,
    })
  }

  // Insight de ROI
  if (kpis.roi !== null) {
    if (kpis.roi >= UMBRALES.roi.excelente) {
      insights.push({
        tipo: "positivo",
        titulo: "ROI muy positivo",
        descripcion: INTERPRETACIONES.roi.excelente,
        metrica: "ROI",
        valor: `+${kpis.roi.toFixed(0)}%`,
      })
    } else if (kpis.roi >= UMBRALES.roi.bueno) {
      insights.push({
        tipo: "positivo",
        titulo: "Promoción rentable",
        descripcion: INTERPRETACIONES.roi.bueno,
        metrica: "ROI",
        valor: `+${kpis.roi.toFixed(0)}%`,
      })
    } else if (kpis.roi < 0) {
      insights.push({
        tipo: "negativo",
        titulo: "ROI negativo",
        descripcion: INTERPRETACIONES.roi.negativo,
        metrica: "ROI",
        valor: `${kpis.roi.toFixed(0)}%`,
      })
    }
  }

  // Insight de Elasticidad
  if (kpis.elasticidadPrecio !== null) {
    const absElasticidad = Math.abs(kpis.elasticidadPrecio)
    if (absElasticidad >= UMBRALES.elasticidad.muyElastico) {
      insights.push({
        tipo: "neutral",
        titulo: "Alta sensibilidad al precio",
        descripcion: INTERPRETACIONES.elasticidad.muyElastico,
        metrica: "Elasticidad",
        valor: kpis.elasticidadPrecio.toFixed(2),
      })
    } else if (absElasticidad >= UMBRALES.elasticidad.elastico) {
      insights.push({
        tipo: "neutral",
        titulo: "Demanda elástica",
        descripcion: INTERPRETACIONES.elasticidad.elastico,
        metrica: "Elasticidad",
        valor: kpis.elasticidadPrecio.toFixed(2),
      })
    }
  }

  // Insight de Canibalización
  if (canibalizacion) {
    if (canibalizacion.productosAfectados > 0) {
      const impactoPct =
        kpis.ventaBaseline > 0
          ? (canibalizacion.totalCanibalizacion / kpis.ventaBaseline) * 100
          : 0

      if (impactoPct > Math.abs(UMBRALES.canibalizacion.alto)) {
        insights.push({
          tipo: "negativo",
          titulo: "Canibalización detectada",
          descripcion: `${canibalizacion.productosAfectados} productos de la categoría mostraron caída`,
          metrica: "Canibalización",
          valor: `-${impactoPct.toFixed(1)}%`,
        })
      } else if (impactoPct > Math.abs(UMBRALES.canibalizacion.bajo)) {
        insights.push({
          tipo: "neutral",
          titulo: "Canibalización menor",
          descripcion: INTERPRETACIONES.canibalizacion.bajo,
          metrica: "Canibalización",
          valor: `-${impactoPct.toFixed(1)}%`,
        })
      }
    } else {
      insights.push({
        tipo: "positivo",
        titulo: "Sin canibalización",
        descripcion: INTERPRETACIONES.canibalizacion.ninguno,
      })
    }
  }

  // Insight de Retención
  if (retencion) {
    insights.push({
      tipo:
        retencion.interpretacion === "excelente" ||
        retencion.interpretacion === "buena"
          ? "positivo"
          : retencion.interpretacion === "regular"
            ? "neutral"
            : "negativo",
      titulo: `Retención ${retencion.interpretacion}`,
      descripcion: INTERPRETACIONES.retencion[retencion.interpretacion],
      metrica: "Retención",
      valor: `${(retencion.indiceRetencion * 100).toFixed(0)}%`,
    })
  }

  return insights
}

/**
 * Determina la evaluación general de la promoción
 */
export function evaluarPromocion(
  kpis: PromocionKpis,
  insights: PromocionInsight[]
): PromocionResultado["evaluacionGeneral"] {
  const positivos = insights.filter((i) => i.tipo === "positivo").length
  const negativos = insights.filter((i) => i.tipo === "negativo").length

  // Criterios principales
  const tieneUpliftPositivo = kpis.ventaDiferenciaPct > 0
  const tieneRoiPositivo = kpis.roi !== null && kpis.roi > 0

  if (tieneUpliftPositivo && tieneRoiPositivo && positivos > negativos) {
    return "exitosa"
  } else if (negativos > positivos || kpis.ventaDiferenciaPct < -10) {
    return "negativa"
  }

  return "neutral"
}

/**
 * Función principal que calcula el resultado completo
 */
export function calcularResultadoCompleto(
  config: PromocionConfig,
  ventasPromo: VentasPeriodo,
  ventasBaseline: VentasPeriodo,
  ventasPostPromo: VentasPeriodo | null,
  canibalizacionData: CanibalizacionItem[] | null
): PromocionResultado {
  // KPIs principales
  const kpis = calcularKpis(config, ventasPromo, ventasBaseline)

  // Análisis por producto
  const porProducto = calcularPorProducto(ventasPromo, ventasBaseline)

  // Canibalización
  const canibalizacion = canibalizacionData
    ? procesarCanibalizacion(canibalizacionData, kpis.ventaDiferenciaAbs)
    : null

  // Retención
  const retencion = calcularRetencion(
    ventasPromo,
    ventasBaseline,
    ventasPostPromo,
    config.diasPostPromo
  )

  // Insights
  const insights = generarInsights(kpis, canibalizacion, retencion)

  // Evaluación general
  const evaluacionGeneral = evaluarPromocion(kpis, insights)

  return {
    config,
    kpis,
    porProducto,
    canibalizacion,
    retencion,
    insights,
    evaluacionGeneral,
  }
}

/**
 * Combina series diarias de promo y baseline para gráfica comparativa
 */
export function combinarSeriesDiarias(
  seriePromo: VentaDiaria[],
  serieBaseline: VentaDiaria[]
): Array<{
  dia: number
  fechaPromo: string
  fechaBaseline: string
  ventaPromo: number
  ventaBaseline: number
  unidadesPromo: number
  unidadesBaseline: number
}> {
  const maxDias = Math.max(seriePromo.length, serieBaseline.length)
  const resultado = []

  for (let i = 0; i < maxDias; i++) {
    const promo = seriePromo[i]
    const baseline = serieBaseline[i]

    resultado.push({
      dia: i + 1,
      fechaPromo: promo?.fecha ?? "",
      fechaBaseline: baseline?.fecha ?? "",
      ventaPromo: promo?.venta ?? 0,
      ventaBaseline: baseline?.venta ?? 0,
      unidadesPromo: promo?.unidades ?? 0,
      unidadesBaseline: baseline?.unidades ?? 0,
    })
  }

  return resultado
}
