"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

interface DashboardMetrics {
  ventasTotales: number
  unidadesVendidas: number
  quiebresStock: number
  skusActivos: number
  ventasPorDia: { fecha: string; value: number }[]
  cambioVentas: number
  cambioUnidades: number
  cambioQuiebres: number
  cambioSkus: number
  ultimaFecha: string
  fechaInicio: string
}

export function useDashboardMetrics(dias: number = 30) {
  return useQuery({
    queryKey: ["dashboard-metrics", dias],
    queryFn: async (): Promise<DashboardMetrics> => {
      const { data, error } = await (supabase.rpc as any)("get_dashboard_metrics", {
        dias_periodo: dias,
      })

      if (error) {
        console.error("Error fetching dashboard metrics:", error)
        throw new Error(error.message)
      }

      if (data?.error) {
        throw new Error(data.error)
      }

      // Ordenar ventas por día de más antigua a más reciente para el sparkline
      const ventasPorDia = (data.ventasPorDia || [])
        .sort((a: { fecha: string }, b: { fecha: string }) =>
          a.fecha.localeCompare(b.fecha)
        )
        .map((d: { fecha: string; value: string }) => ({
          fecha: d.fecha,
          value: Number(d.value),
        }))

      return {
        ventasTotales: Number(data.ventasTotales) || 0,
        unidadesVendidas: Number(data.unidadesVendidas) || 0,
        quiebresStock: Number(data.quiebresStock) || 0,
        skusActivos: Number(data.skusActivos) || 0,
        ventasPorDia,
        cambioVentas: Number(data.cambioVentas) || 0,
        cambioUnidades: Number(data.cambioUnidades) || 0,
        cambioQuiebres: 0,
        cambioSkus: 0,
        ultimaFecha: data.ultimaFecha,
        fechaInicio: data.fechaInicio,
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}
