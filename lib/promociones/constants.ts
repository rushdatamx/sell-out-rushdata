/**
 * Constantes para el módulo de Análisis de Promociones
 */

import {
  Percent,
  DollarSign,
  Package,
  ShoppingCart,
  Gift,
} from "lucide-react"
import type { TipoPromocion } from "./types"

// Catálogo de tipos de promoción
export const TIPOS_PROMOCION = [
  {
    value: "descuento_porcentaje" as TipoPromocion,
    label: "Descuento %",
    descripcion: "Porcentaje de descuento sobre precio regular",
    icono: Percent,
    ejemplo: "20% de descuento",
    color: "#22C55E", // green
  },
  {
    value: "precio_especial" as TipoPromocion,
    label: "Precio Especial",
    descripcion: "Precio fijo durante la promoción",
    icono: DollarSign,
    ejemplo: "$18.00 pesos",
    color: "#3B82F6", // blue
  },
  {
    value: "multicompra_nx1" as TipoPromocion,
    label: "Multicompra NxM",
    descripcion: "Compra N unidades, paga M (ej: 3x2)",
    icono: Package,
    ejemplo: "3x2, 2x1",
    color: "#A855F7", // purple
  },
  {
    value: "multicompra_nxprecio" as TipoPromocion,
    label: "Multicompra Nx$X",
    descripcion: "N unidades por precio fijo",
    icono: ShoppingCart,
    ejemplo: "2 x $29",
    color: "#F59E0B", // amber
  },
  {
    value: "bundle" as TipoPromocion,
    label: "Bundle/Combo",
    descripcion: "Varios productos juntos a precio especial",
    icono: Gift,
    ejemplo: "Combo familiar $99",
    color: "#EC4899", // pink
  },
] as const

// Obtener config de un tipo de promoción
export function getTipoPromocionConfig(tipo: TipoPromocion) {
  return TIPOS_PROMOCION.find((t) => t.value === tipo)
}

// Valores por defecto
export const DIAS_BASELINE_MINIMO = 7
export const DIAS_BASELINE_RECOMENDADO = 30
export const DIAS_RETENCION_DEFAULT = 14

// Umbrales para interpretación de métricas
export const UMBRALES = {
  // Uplift
  uplift: {
    excelente: 30, // > 30%
    bueno: 10, // > 10%
    neutral: 0, // > 0%
    // < 0% = negativo
  },

  // ROI
  roi: {
    excelente: 100, // > 100%
    bueno: 50, // > 50%
    aceptable: 0, // > 0%
    // < 0% = pérdida
  },

  // Elasticidad (en valor absoluto)
  elasticidad: {
    muyElastico: 2, // |e| > 2
    elastico: 1, // |e| > 1
    // |e| < 1 = inelástico
  },

  // Canibalización
  canibalizacion: {
    alto: -15, // < -15%
    medio: -10, // < -10%
    bajo: -5, // < -5%
    // > -5% = sin impacto significativo
  },

  // Retención
  retencion: {
    excelente: 0.7, // > 70%
    buena: 0.5, // > 50%
    regular: 0.3, // > 30%
    // < 30% = baja
  },
}

// Colores para charts y UI
export const COLORES_PROMOCION = {
  promo: "#0066FF", // Azul principal
  baseline: "#94A3B8", // Gris
  postPromo: "#06B6D4", // Cyan
  positivo: "#22C55E", // Verde
  negativo: "#EF4444", // Rojo
  neutral: "#F59E0B", // Ámbar
}

// Textos de interpretación
export const INTERPRETACIONES = {
  uplift: {
    excelente: "Incremento excepcional de ventas",
    bueno: "Buen incremento de ventas",
    neutral: "Incremento moderado",
    negativo: "Las ventas disminuyeron durante la promoción",
  },

  roi: {
    excelente: "Promoción muy rentable",
    bueno: "Promoción rentable",
    aceptable: "Promoción sin pérdida",
    negativo: "Promoción generó pérdida",
  },

  elasticidad: {
    muyElastico: "Demanda muy sensible al precio",
    elastico: "Demanda sensible al precio",
    inelastico: "Demanda poco sensible al precio",
  },

  canibalizacion: {
    alto: "Alto riesgo de canibalización",
    medio: "Canibalización moderada detectada",
    bajo: "Canibalización mínima",
    ninguno: "Sin canibalización significativa",
  },

  retencion: {
    excelente: "Excelente retención post-promoción",
    buena: "Buena retención de clientes",
    regular: "Retención moderada",
    baja: "Baja retención, efecto solo durante promoción",
  },

  general: {
    exitosa:
      "La promoción fue exitosa con buen ROI y uplift significativo",
    neutral:
      "Resultados mixtos, la promoción tuvo impacto limitado",
    negativa:
      "La promoción no generó los resultados esperados",
  },
}

// Pasos del wizard
export const WIZARD_STEPS = [
  {
    id: 1,
    titulo: "Productos",
    descripcion: "Selecciona los productos de la promoción",
  },
  {
    id: 2,
    titulo: "Tipo de Promoción",
    descripcion: "Define el tipo y parámetros",
  },
  {
    id: 3,
    titulo: "Períodos",
    descripcion: "Configura fechas de análisis",
  },
  {
    id: 4,
    titulo: "Analizar",
    descripcion: "Revisa y ejecuta el análisis",
  },
] as const
