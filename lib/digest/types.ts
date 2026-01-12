// Tipos para el sistema de Digest

export interface DigestSubscription {
  id: string
  tenant_id: string
  user_id: string
  retailer_id: number
  email: string
  weekly_enabled: boolean
  weekly_day: number
  weekly_hour: number
  monthly_enabled: boolean
  monthly_day: number
  monthly_hour: number
  include_ai_insights: boolean
  include_inventory_alerts: boolean
  include_top_products: boolean
  include_top_stores: boolean
  include_trends: boolean
  status: 'active' | 'paused' | 'unsubscribed'
  created_at: string
  updated_at: string
  last_weekly_sent_at: string | null
  last_monthly_sent_at: string | null
}

export interface ActiveSubscription {
  subscription_id: string
  tenant_id: string
  user_id: string
  retailer_id: number
  retailer_codigo: string
  retailer_nombre: string
  email: string
  include_ai_insights: boolean
  include_inventory_alerts: boolean
}

export interface DigestRetailer {
  id: number
  codigo: string
  nombre: string
}

export interface DigestPeriodo {
  tipo: 'weekly' | 'monthly'
  fecha_inicio: string
  fecha_fin: string
  dias: number
}

export interface DigestKPIs {
  ventas_actuales: number
  ventas_anteriores: number
  variacion_pct: number
  unidades_actuales: number
  unidades_anteriores: number
  tiendas_activas: number
  productos_activos: number
  ticket_promedio: number
}

export interface DigestProducto {
  producto: string
  categoria: string | null
  ventas: number
  unidades: number
  tiendas: number
  participacion_pct: number
}

export interface DigestTienda {
  tienda: string
  ciudad: string | null
  estado: string | null
  ventas: number
  unidades: number
  productos_vendidos: number
}

export interface DigestProductoVariacion {
  producto: string
  ventas_actual: number
  ventas_anterior: number
  variacion_pct: number
}

export interface DigestAlertaInventario {
  producto: string
  tienda: string
  ciudad: string | null
  stock_actual: number
  venta_diaria_promedio: number
  nivel_alerta: 'critico' | 'bajo' | 'normal'
}

export interface DigestCiudad {
  ciudad: string
  tiendas: number
  ventas: number
  unidades: number
}

export interface DigestTendenciaMes {
  mes: string        // '2024-01'
  mes_nombre: string // 'Ene'
  ventas: number
}

export interface DigestData {
  retailer: DigestRetailer
  periodo: DigestPeriodo
  kpis: DigestKPIs
  top_productos: DigestProducto[]
  top_tiendas: DigestTienda[]
  productos_creciendo: DigestProductoVariacion[]
  productos_cayendo: DigestProductoVariacion[]
  alertas_inventario: DigestAlertaInventario[]
  resumen_ciudades: DigestCiudad[]
  tendencia_6_meses: DigestTendenciaMes[]
  error?: string
}

export interface DigestLog {
  id: string
  subscription_id: string | null
  tenant_id: string
  retailer_id: number
  user_id: string
  digest_type: 'weekly' | 'monthly'
  status: 'sent' | 'failed' | 'bounced' | 'opened' | 'clicked'
  sent_at: string
  opened_at: string | null
  subject: string | null
  metrics_snapshot: DigestData | null
  ai_insights: string | null
  error_message: string | null
  resend_message_id: string | null
  email_to: string | null
  tokens_used: number | null
}

export type DigestType = 'weekly' | 'monthly'
