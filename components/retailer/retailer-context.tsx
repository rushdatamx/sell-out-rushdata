"use client"

import { createContext, useContext, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useRetailers, useRetailerByCode } from "@/hooks/use-retailers"
import { getRetailerConfig } from "@/lib/retailers/config"
import type { Retailer, RetailerConfig, RetailerContextType } from "@/lib/retailers/types"

const RetailerContext = createContext<RetailerContextType | undefined>(undefined)

interface RetailerProviderProps {
  children: React.ReactNode
}

/**
 * Provider para el contexto de retailer activo
 * Se usa en app/[retailer]/layout.tsx para proveer el retailer actual
 */
export function RetailerProvider({ children }: RetailerProviderProps) {
  const params = useParams()
  const router = useRouter()
  const retailerCode = params?.retailer as string | undefined

  // Obtener lista de todos los retailers del tenant
  const { data: retailers = [], isLoading: isLoadingRetailers } = useRetailers()

  // Obtener el retailer específico por código de la URL
  const { data: retailer, isLoading: isLoadingRetailer, error } = useRetailerByCode(retailerCode)

  // Obtener config del retailer
  const config = useMemo<RetailerConfig | null>(() => {
    if (!retailer) return null
    return getRetailerConfig(retailer.codigo)
  }, [retailer])

  // Validar que el retailer existe y pertenece al tenant
  // Si no existe, redirigir al hub
  useMemo(() => {
    if (!isLoadingRetailer && retailerCode && !retailer && retailers.length > 0) {
      // El retailer no existe o no pertenece al tenant
      router.replace("/hub")
    }
  }, [isLoadingRetailer, retailerCode, retailer, retailers.length, router])

  const value: RetailerContextType = {
    retailer: retailer || null,
    retailers,
    config,
    isLoading: isLoadingRetailers || isLoadingRetailer,
    error: error as Error | null,
  }

  return (
    <RetailerContext.Provider value={value}>
      {children}
    </RetailerContext.Provider>
  )
}

/**
 * Hook para acceder al contexto de retailer
 */
export function useActiveRetailer() {
  const context = useContext(RetailerContext)
  if (context === undefined) {
    throw new Error("useActiveRetailer must be used within a RetailerProvider")
  }
  return context
}

/**
 * Hook para verificar si un módulo está habilitado para el retailer actual
 */
export function useRetailerModule(modulo: keyof RetailerConfig["modulos"]) {
  const { config } = useActiveRetailer()
  return config?.modulos[modulo] ?? true
}
