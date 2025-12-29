"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { RetailerSummary } from "@/lib/retailers/types"

/**
 * Hook para obtener el resumen de métricas de todos los retailers del tenant
 * Se usa en el Hub para mostrar las cards con KPIs
 */
export function useRetailersSummary() {
  return useQuery<RetailerSummary[]>({
    queryKey: ["retailers-summary"],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_retailers_summary")

      if (error) {
        console.error("Error fetching retailers summary:", error)
        throw new Error(error.message)
      }

      // Mapear los campos del RPC a nuestra interfaz
      return (data || []).map((row: any) => ({
        id: row.retailer_id,
        codigo: row.codigo,
        nombre: row.nombre,
        color_hex: row.color_hex,
        activo: true,
        ventas_30d: Number(row.ventas_30d) || 0,
        variacion_pct: Number(row.variacion_pct) || 0,
        tiendas_activas: Number(row.tiendas_activas) || 0,
        skus_activos: Number(row.skus_activos) || 0,
        ultima_fecha: row.ultima_fecha,
      })) as RetailerSummary[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}
