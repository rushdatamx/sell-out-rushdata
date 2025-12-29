"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import type { Retailer } from "@/lib/retailers/types"

/**
 * Hook para obtener la lista de retailers activos del tenant actual
 * Ahora consulta tenant_retailers con join a dim_retailers
 */
export function useRetailers() {
  return useQuery<Retailer[]>({
    queryKey: ["retailers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_retailers")
        .select(`
          retailer:dim_retailers!inner (
            id,
            codigo,
            nombre,
            color_hex,
            activo,
            created_at
          )
        `)
        .eq("activo", true)

      if (error) {
        console.error("Error fetching retailers:", error)
        throw new Error(error.message)
      }

      // Extraer retailers del resultado anidado
      const retailers = (data || [])
        .map((item: { retailer: Retailer }) => item.retailer)
        .filter((r: Retailer) => r.activo)

      // Ordenar por nombre
      retailers.sort((a: Retailer, b: Retailer) => a.nombre.localeCompare(b.nombre))

      return retailers
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - retailers cambian poco
  })
}

/**
 * Hook para obtener un retailer específico por código
 * Verifica que el tenant actual tenga acceso a ese retailer
 */
export function useRetailerByCode(codigo: string | undefined) {
  return useQuery<Retailer | null>({
    queryKey: ["retailer", codigo],
    queryFn: async () => {
      if (!codigo) return null

      const { data, error } = await supabase
        .from("tenant_retailers")
        .select(`
          retailer:dim_retailers!inner (
            id,
            codigo,
            nombre,
            color_hex,
            activo,
            created_at
          )
        `)
        .eq("activo", true)
        .eq("dim_retailers.codigo", codigo)
        .eq("dim_retailers.activo", true)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned - tenant no tiene acceso a este retailer
          return null
        }
        console.error("Error fetching retailer:", error)
        throw new Error(error.message)
      }

      return (data as { retailer: Retailer }).retailer
    },
    enabled: !!codigo,
    staleTime: 10 * 60 * 1000,
  })
}
