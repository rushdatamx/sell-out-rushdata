import type { RetailerConfig } from './types'

// Mapeo de logos por retailer (rutas en /public)
export const RETAILER_LOGOS: Record<string, string> = {
  heb: '/heblogo.png',
  merco: '/mercologo.png',
  fahorro: '/fdalogo.webp',
  // Agregar más logos según se necesiten
  // walmart: '/walmartlogo.png',
  // soriana: '/sorianalogo.png',
}

/**
 * Obtiene la URL del logo de un retailer
 * @returns URL del logo o null si no existe
 */
export function getRetailerLogo(codigo: string): string | null {
  return RETAILER_LOGOS[codigo.toLowerCase()] || null
}

// Configuración default para retailers sin config específica
export const DEFAULT_RETAILER_CONFIG: RetailerConfig = {
  codigo: 'default',
  nombre: 'Retailer',
  colorPrimario: '#6366f1',
  calendario: {
    tipo: 'gregoriano',
    inicioSemana: 1, // Lunes
  },
  periodos: {
    default: 'ultimos_30_dias',
    granularidadMinima: 'diaria',
  },
  modulos: {
    dashboard: true,
    productos: true,
    tiendas: true,
    inventario: true,
    reabastecimiento: true,
    precios: true,
    analisis: true,
  },
  dashboard: {
    kpisVisibles: ['ventas', 'unidades', 'tiendas_activas', 'skus_activos'],
    chartsVisibles: ['ventas_mensuales', 'top_productos', 'top_tiendas', 'mix_categorias'],
  },
}

// Configuraciones específicas por retailer
export const RETAILER_CONFIGS: Record<string, Partial<RetailerConfig>> = {
  heb: {
    codigo: 'heb',
    nombre: 'HEB',
    colorPrimario: '#E31837', // Rojo HEB
    colorSecundario: '#FFFFFF',
    iconName: 'Store',
    calendario: {
      tipo: 'fiscal_445', // HEB usa calendario fiscal 4-4-5
      inicioSemana: 0, // Domingo
    },
    periodos: {
      default: 'ultimos_30_dias',
      granularidadMinima: 'diaria',
    },
    modulos: {
      dashboard: true,
      productos: true,
      tiendas: true,
      inventario: true,
      reabastecimiento: true,
      precios: true,
      analisis: true,
    },
  },
  merco: {
    codigo: 'merco',
    nombre: 'Merco',
    colorPrimario: '#FF6B00', // Naranja Merco
    colorSecundario: '#FFFFFF',
    iconName: 'ShoppingCart',
    calendario: {
      tipo: 'gregoriano',
      inicioSemana: 1, // Lunes
    },
    periodos: {
      default: 'ultimo_mes',
      granularidadMinima: 'mensual', // Ventas mensuales, inventario diario
    },
    modulos: {
      dashboard: true,
      productos: true,
      tiendas: true,
      inventario: true,           // SÍ tiene inventario (diario)
      reabastecimiento: true,     // Habilitado con inventario
      precios: false,             // Sin monitoreo de precios
      analisis: true,
    },
    dashboard: {
      kpisVisibles: ['ventas', 'unidades', 'tiendas_activas', 'skus_activos'],
      chartsVisibles: ['ventas_mensuales', 'top_productos', 'top_tiendas', 'mix_categorias'],
    },
  },
  fahorro: {
    codigo: 'fahorro',
    nombre: 'Farmacias del Ahorro',
    colorPrimario: '#000000', // Negro per user request
    colorSecundario: '#FFFFFF',
    iconName: 'Pill',
    calendario: {
      tipo: 'gregoriano',
      inicioSemana: 1,
    },
    periodos: {
      default: 'ultimo_mes',
      granularidadMinima: 'mensual', // FDA solo da datos mensuales
    },
    modulos: {
      dashboard: true,
      productos: true,
      tiendas: true,
      inventario: false,        // SIN DATOS DE INVENTARIO
      reabastecimiento: false,  // DEPENDE DE INVENTARIO
      precios: false,           // SOLO COSTO FIJO
      analisis: true,
    },
    dashboard: {
      kpisVisibles: ['ventas', 'unidades', 'tiendas_activas', 'skus_activos'],
      chartsVisibles: ['ventas_mensuales', 'top_productos', 'top_tiendas', 'mix_plazas'],
    },
  },
  walmart: {
    codigo: 'walmart',
    nombre: 'Walmart',
    colorPrimario: '#0071CE', // Azul Walmart
    colorSecundario: '#FFC220', // Amarillo
    iconName: 'Building2',
    calendario: {
      tipo: 'gregoriano',
      inicioSemana: 0,
    },
    periodos: {
      default: 'ultimos_30_dias',
      granularidadMinima: 'diaria',
    },
  },
  soriana: {
    codigo: 'soriana',
    nombre: 'Soriana',
    colorPrimario: '#E4002B', // Rojo Soriana
    colorSecundario: '#FFFFFF',
    iconName: 'Store',
    calendario: {
      tipo: 'gregoriano',
      inicioSemana: 1,
    },
    periodos: {
      default: 'ultimos_30_dias',
      granularidadMinima: 'diaria',
    },
  },
}

/**
 * Obtiene la configuración completa de un retailer
 * Hace merge de la config específica con los defaults
 */
export function getRetailerConfig(codigo: string): RetailerConfig {
  const specificConfig = RETAILER_CONFIGS[codigo.toLowerCase()]

  if (!specificConfig) {
    return {
      ...DEFAULT_RETAILER_CONFIG,
      codigo,
      nombre: codigo.charAt(0).toUpperCase() + codigo.slice(1),
    }
  }

  return {
    ...DEFAULT_RETAILER_CONFIG,
    ...specificConfig,
    calendario: {
      ...DEFAULT_RETAILER_CONFIG.calendario,
      ...specificConfig.calendario,
    },
    periodos: {
      ...DEFAULT_RETAILER_CONFIG.periodos,
      ...specificConfig.periodos,
    },
    modulos: {
      ...DEFAULT_RETAILER_CONFIG.modulos,
      ...specificConfig.modulos,
    },
    dashboard: {
      ...DEFAULT_RETAILER_CONFIG.dashboard,
      ...specificConfig.dashboard,
    },
  }
}

/**
 * Obtiene el color primario de un retailer
 */
export function getRetailerColor(codigo: string): string {
  return RETAILER_CONFIGS[codigo.toLowerCase()]?.colorPrimario || DEFAULT_RETAILER_CONFIG.colorPrimario
}

/**
 * Normaliza el código de retailer para URLs
 */
export function normalizeRetailerCode(codigo: string): string {
  return codigo.toLowerCase().replace(/\s+/g, '-')
}
