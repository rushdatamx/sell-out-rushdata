/**
 * Tipos TypeScript para el módulo de Análisis de Promociones
 * Solo análisis en tiempo real, sin persistencia en BD
 */

// Tipos de promoción soportados
export type TipoPromocion =
  | "descuento_porcentaje" // Ej: 20% off
  | "precio_especial" // Ej: $18 pesos
  | "multicompra_nx1" // Ej: 2x1, 3x2
  | "multicompra_nxprecio" // Ej: 2x$29
  | "bundle" // Combo de productos

// Parámetros específicos por tipo de promoción
export type PromocionParametros =
  | { tipo: "descuento_porcentaje"; porcentaje: number }
  | { tipo: "precio_especial"; precio: number }
  | { tipo: "multicompra_nx1"; compra: number; lleva: number }
  | { tipo: "multicompra_nxprecio"; cantidad: number; precio: number }
  | { tipo: "bundle"; precioBundle: number }

// Configuración de la promoción (input del usuario)
export interface PromocionConfig {
  // Productos seleccionados
  productoIds: number[]
  productoGrupo?: string // Nombre del grupo (opcional)
  analizarComoGrupo: boolean

  // Tipo y parámetros de la promoción
  tipo: TipoPromocion
  parametros: PromocionParametros

  // Períodos
  fechaInicioPromo: string // YYYY-MM-DD
  fechaFinPromo: string
  fechaInicioBaseline: string
  fechaFinBaseline: string
  diasPostPromo: number // Default: 14 días para retención

  // Filtros opcionales
  tiendaIds?: number[]
  ciudades?: string[]

  // Categoría para análisis de canibalización
  categoria?: string
}

// Datos de ventas de un período
export interface VentasPeriodo {
  totales: {
    venta_total: number
    unidades_total: number
    transacciones: number
    precio_promedio: number | null
    tiendas_con_venta: number
    dias_con_venta: number
  }
  por_producto: ProductoVentas[]
  serie_diaria: VentaDiaria[]
}

export interface ProductoVentas {
  producto_id: number
  producto_nombre: string
  upc: string
  categoria: string
  venta: number
  unidades: number
  precio_promedio: number | null
  tiendas: number
  dias_venta: number
}

export interface VentaDiaria {
  fecha: string
  venta: number
  unidades: number
  precio_promedio: number | null
}

// KPIs consolidados del análisis
export interface PromocionKpis {
  // Ventas
  ventaPromo: number
  ventaBaseline: number
  ventaDiferenciaAbs: number
  ventaDiferenciaPct: number // Uplift en %

  // Unidades
  unidadesPromo: number
  unidadesBaseline: number
  unidadesDiferenciaAbs: number
  unidadesDiferenciaPct: number

  // Precio
  precioPromedioPromo: number | null
  precioPromedioBaseline: number | null
  descuentoRealPct: number | null

  // ROI
  costoDescuento: number
  ingresoIncremental: number
  roi: number | null // (Ingreso incremental - Costo) / Costo * 100

  // Elasticidad
  elasticidadPrecio: number | null // % cambio demanda / % cambio precio

  // Tiendas
  tiendasConVentaPromo: number
  tiendasConVentaBaseline: number
  tiendasTotales: number
  coberturaPct: number

  // Días
  diasPromo: number
  diasBaseline: number
}

// Análisis por producto individual
export interface ProductoPromocionAnalisis {
  productoId: number
  productoNombre: string
  upc: string
  categoria: string

  ventaPromo: number
  ventaBaseline: number
  upliftPct: number

  unidadesPromo: number
  unidadesBaseline: number
  upliftUnidadesPct: number

  precioPromo: number | null
  precioBaseline: number | null

  elasticidad: number | null
  contribucionTotal: number // % del total de ventas promo
}

// Análisis de canibalización
export interface CanibalizacionItem {
  producto_id: number
  producto_nombre: string
  upc: string
  categoria: string
  venta_periodo_promo: number
  venta_baseline: number
  variacion_pct: number
}

export interface CanibalizacionAnalisis {
  productos: CanibalizacionItem[]
  totalCanibalizacion: number // Suma de pérdidas
  productosAfectados: number // Cantidad con variación negativa significativa
  impactoNeto: number // Uplift de promo - canibalización
}

// Retención post-promoción
export interface RetencionAnalisis {
  diasAnalisis: number
  ventaPromedioDurantePromo: number
  ventaPromedioPostPromo: number
  ventaPromedioBaseline: number

  indiceRetencion: number // PostPromo / DurantePromo
  indiceVsBaseline: number // PostPromo / Baseline

  ventasDiariasPostPromo: VentaDiaria[]
  interpretacion: "excelente" | "buena" | "regular" | "baja"
}

// Resultado completo del análisis
export interface PromocionResultado {
  config: PromocionConfig
  kpis: PromocionKpis
  porProducto: ProductoPromocionAnalisis[]
  canibalizacion: CanibalizacionAnalisis | null
  retencion: RetencionAnalisis | null

  // Insights automáticos
  insights: PromocionInsight[]
  evaluacionGeneral: "exitosa" | "neutral" | "negativa"
}

// Insight individual
export interface PromocionInsight {
  tipo: "positivo" | "negativo" | "neutral"
  titulo: string
  descripcion: string
  metrica?: string
  valor?: string
}

// Filtros disponibles para el wizard
export interface PromocionFiltros {
  productos: Array<{
    id: number
    nombre: string
    upc: string
    categoria: string
    marca: string
  }>
  categorias: string[]
  tiendas: Array<{
    id: number
    nombre: string
    ciudad: string
    codigo: string
  }>
  ciudades: string[]
  fecha_min: string
  fecha_max: string
}
