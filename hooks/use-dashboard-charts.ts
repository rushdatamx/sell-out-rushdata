"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

// Ventas mensuales con comparativo YoY
interface VentaMensual {
  anio: number
  mes: number
  mes_nombre: string
  ventas: number
  unidades: number
}

export function useVentasMensualesYoY() {
  return useQuery({
    queryKey: ["ventas-mensuales-yoy"],
    queryFn: async (): Promise<VentaMensual[]> => {
      const { data, error } = await (supabase.rpc as any)("get_ventas_mensuales_yoy")

      if (error) {
        console.error("Error fetching ventas mensuales:", error)
        throw new Error(error.message)
      }

      return (data || []).map((d: any) => ({
        ...d,
        ventas: Number(d.ventas),
        unidades: Number(d.unidades),
      }))
    },
    staleTime: 5 * 60 * 1000,
  })
}

// Top 10 Productos
interface TopProducto {
  id: number
  nombre: string
  upc: string
  categoria: string
  ventas: number
  unidades: number
  ranking: number
}

export function useTopProductos(dias: number = 30) {
  return useQuery({
    queryKey: ["top-productos", dias],
    queryFn: async (): Promise<TopProducto[]> => {
      const { data, error } = await (supabase.rpc as any)("get_top_productos", {
        dias_periodo: dias,
      })

      if (error) {
        console.error("Error fetching top productos:", error)
        throw new Error(error.message)
      }

      return (data || []).map((d: any) => ({
        ...d,
        ventas: Number(d.ventas),
        unidades: Number(d.unidades),
      }))
    },
    staleTime: 5 * 60 * 1000,
  })
}

// Top 10 Tiendas
interface TopTienda {
  id: number
  nombre: string
  codigo_tienda: string
  ciudad: string
  retailer: string
  ventas: number
  unidades: number
  ranking: number
}

export function useTopTiendas(dias: number = 30) {
  return useQuery({
    queryKey: ["top-tiendas", dias],
    queryFn: async (): Promise<TopTienda[]> => {
      const { data, error } = await (supabase.rpc as any)("get_top_tiendas", {
        dias_periodo: dias,
      })

      if (error) {
        console.error("Error fetching top tiendas:", error)
        throw new Error(error.message)
      }

      return (data || []).map((d: any) => ({
        ...d,
        ventas: Number(d.ventas),
        unidades: Number(d.unidades),
      }))
    },
    staleTime: 5 * 60 * 1000,
  })
}

// Mix por Categoría
interface MixCategoria {
  categoria: string
  ventas: number
  unidades: number
  porcentaje: number
}

export function useMixCategorias(dias: number = 30) {
  return useQuery({
    queryKey: ["mix-categorias", dias],
    queryFn: async (): Promise<MixCategoria[]> => {
      const { data, error } = await (supabase.rpc as any)("get_mix_categorias", {
        dias_periodo: dias,
      })

      if (error) {
        console.error("Error fetching mix categorias:", error)
        throw new Error(error.message)
      }

      return (data || []).map((d: any) => ({
        ...d,
        ventas: Number(d.ventas),
        unidades: Number(d.unidades),
        porcentaje: Number(d.porcentaje),
      }))
    },
    staleTime: 5 * 60 * 1000,
  })
}
