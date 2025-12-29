// Tipos base para el sistema multi-retailer

export interface Retailer {
  id: number
  codigo: string
  nombre: string
  color_hex: string
  activo: boolean
  created_at?: string
}

export interface RetailerSummary extends Retailer {
  ventas_30d: number
  variacion_pct: number
  tiendas_activas: number
  skus_activos: number
  ultima_fecha: string | null
}

export interface RetailerConfig {
  // Identidad visual
  codigo: string
  nombre: string
  colorPrimario: string
  colorSecundario?: string
  iconName?: string // Nombre del icono de Lucide

  // Configuración de calendario/periodos
  calendario: {
    tipo: 'gregoriano' | 'fiscal_445' | 'fiscal_454' | 'custom'
    inicioSemana: 0 | 1 | 6 // 0=Dom, 1=Lun, 6=Sab
  }

  // Periodo default para filtros
  periodos: {
    default: 'ultimos_30_dias' | 'ultimos_7_dias' | 'mes_actual' | 'semana_fiscal' | 'ultimo_mes'
    granularidadMinima: 'diaria' | 'semanal' | 'mensual'
  }

  // Módulos habilitados para esta cadena
  modulos: {
    dashboard: boolean
    productos: boolean
    tiendas: boolean
    inventario: boolean
    reabastecimiento: boolean
    precios: boolean
    analisis: boolean
  }

  // Configuración del dashboard
  dashboard: {
    kpisVisibles: DashboardKPI[]
    chartsVisibles: DashboardChart[]
  }
}

export type DashboardKPI =
  | 'ventas'
  | 'unidades'
  | 'tiendas_activas'
  | 'skus_activos'
  | 'quiebres'
  | 'ticket_promedio'
  | 'variacion'

export type DashboardChart =
  | 'ventas_mensuales'
  | 'top_productos'
  | 'top_tiendas'
  | 'mix_categorias'
  | 'mix_plazas'
  | 'estacionalidad'
  | 'tendencia'

export interface RetailerContextType {
  retailer: Retailer | null
  retailers: Retailer[]
  config: RetailerConfig | null
  isLoading: boolean
  error: Error | null
}
